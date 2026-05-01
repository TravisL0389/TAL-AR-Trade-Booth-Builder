import { useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { ARPreview } from "./ARPreview";
import type { ARPreviewPayload } from "../lib/boothBuilder";
import { AppShell } from "./AppShell";

export interface ShellConfig {
  currentTemplateId?: string;
  currentTemplateName?: string;
  contextMeta?: ReactNode;
  toolbarContent?: ReactNode;
  drawerContent?: ReactNode;
  quickActions?: ReactNode;
  arPayload?: ARPreviewPayload;
}

export interface RootOutletContext {
  openAR: (payload?: ARPreviewPayload) => void;
  setShellConfig: (config: ShellConfig | null) => void;
}

export function Root() {
  const [showAR, setShowAR] = useState(false);
  const [payload, setPayload] = useState<ARPreviewPayload | undefined>(undefined);
  const [shellConfig, setShellConfig] = useState<ShellConfig | null>(null);
  const location = useLocation();
  const match = location.pathname.match(/\/builder\/(.+)/);
  const templateId = match ? match[1] : "default";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppShell
        shellConfig={shellConfig}
        openAR={(nextPayload?: ARPreviewPayload) => {
          setPayload(nextPayload);
          setShowAR(true);
        }}
        setShellConfig={setShellConfig}
      />

      <ARPreview
        isOpen={showAR}
        onClose={() => setShowAR(false)}
        templateId={templateId}
        project={payload}
      />
    </div>
  );
}
