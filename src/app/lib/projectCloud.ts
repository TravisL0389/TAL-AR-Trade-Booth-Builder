import { createClient } from "@supabase/supabase-js";
import type { BoothProject } from "./boothBuilder";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const OWNER_KEY_STORAGE = "ar-trade-show-builder/owner-key";

export const hasProjectCloudConfig = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = hasProjectCloudConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          "x-booth-builder-client": "project-library",
        },
      },
    })
  : null;

export interface CloudBoothProject {
  id: string;
  ownerKey: string;
  templateId: string;
  projectName: string;
  shareUrl: string | null;
  project: BoothProject;
  updatedAt: string;
  createdAt: string;
}

function assertCloud() {
  if (!supabase) {
    throw new Error("Supabase cloud storage is not configured yet.");
  }
}

export function getProjectOwnerKey() {
  if (typeof window === "undefined") {
    return "server-preview";
  }

  const existing = window.localStorage.getItem(OWNER_KEY_STORAGE);
  if (existing) {
    return existing;
  }

  const nextKey = window.crypto?.randomUUID?.() || `owner-${Date.now()}`;
  window.localStorage.setItem(OWNER_KEY_STORAGE, nextKey);
  return nextKey;
}

export async function listCloudProjects() {
  assertCloud();
  const ownerKey = getProjectOwnerKey();

  const { data, error } = await supabase!
    .from("booth_projects")
    .select("id, owner_key, template_id, project_name, share_url, project, updated_at, created_at")
    .eq("owner_key", ownerKey)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) {
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    ownerKey: row.owner_key,
    templateId: row.template_id,
    projectName: row.project_name,
    shareUrl: row.share_url,
    project: row.project as BoothProject,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  })) as CloudBoothProject[];
}

export async function saveCloudProject({
  templateId,
  projectName,
  shareUrl,
  project,
}: {
  templateId: string;
  projectName: string;
  shareUrl: string;
  project: BoothProject;
}) {
  assertCloud();
  const ownerKey = getProjectOwnerKey();

  const { data, error } = await supabase!
    .from("booth_projects")
    .insert({
      owner_key: ownerKey,
      template_id: templateId,
      project_name: projectName,
      share_url: shareUrl,
      project,
    })
    .select("id, owner_key, template_id, project_name, share_url, project, updated_at, created_at")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    ownerKey: data.owner_key,
    templateId: data.template_id,
    projectName: data.project_name,
    shareUrl: data.share_url,
    project: data.project as BoothProject,
    updatedAt: data.updated_at,
    createdAt: data.created_at,
  } as CloudBoothProject;
}

export async function deleteCloudProject(projectId: string) {
  assertCloud();
  const ownerKey = getProjectOwnerKey();

  const { error } = await supabase!
    .from("booth_projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_key", ownerKey);

  if (error) {
    throw error;
  }
}
