import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  ChevronUp,
  Boxes,
  Copy,
  Eye,
  Grid3X3,
  MonitorPlay,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router";
import { BoothCanvas } from "./BoothCanvas";
import type { RootOutletContext } from "./Root";
import { SmartAssistant } from "./SmartAssistant";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { useIsMobile } from "./ui/use-mobile";
import { cn } from "./ui/utils";
import {
  BUILDER_TEMPLATES,
  LIBRARY_ITEMS,
  LIBRARY_ITEM_BY_TYPE,
  buildShareUrl,
  clampItemToBooth,
  clampItemsToBooth,
  createProjectFromTemplate,
  deriveMetrics,
  getFootprint,
  getNextId,
  getStorageKey,
  readProjectFromHash,
  sanitizeBooth,
  sanitizeProject,
  serializeProject,
  type BoothDefinition,
  type BoothItem,
  type BuilderCategory,
  type LibraryItemDefinition,
} from "../lib/boothBuilder";
import {
  deleteCloudProject,
  hasProjectCloudConfig,
  listCloudProjects,
  saveCloudProject,
  type CloudBoothProject,
} from "../lib/projectCloud";

type MenuCategory = "all" | BuilderCategory;

const CATEGORY_META: Record<
  MenuCategory,
  { label: string; icon: LucideIcon; accent: string }
> = {
  all: { label: "All", icon: Boxes, accent: "#a78bfa" },
  seating: { label: "Seating", icon: Plus, accent: "#c084fc" },
  surfaces: { label: "Surfaces", icon: Grid3X3, accent: "#f59e0b" },
  media: { label: "Media", icon: MonitorPlay, accent: "#60a5fa" },
  branding: { label: "Branding", icon: Sparkles, accent: "#f472b6" },
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (error) {
    return false;
  }
}

function CategoryChip({
  active,
  category,
  onClick,
}: {
  active: boolean;
  category: MenuCategory;
  onClick: () => void;
}) {
  const meta = CATEGORY_META[category];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
        active
          ? "bg-violet-500/20 text-violet-200"
          : "bg-white/[0.05] text-white/55 hover:text-white",
      )}
    >
      {meta.label}
    </button>
  );
}

function ComponentCard({
  item,
  onAdd,
}: {
  item: LibraryItemDefinition;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20"
      style={{ boxShadow: `0 18px 40px ${item.shadow}` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl border"
          style={{
            borderColor: item.accent,
            background: item.background,
            color: item.text,
          }}
        >
          <Plus className="h-5 w-5" />
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
          {item.width} x {item.depth} ft
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-white">{item.name}</p>
        <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
      </div>
    </button>
  );
}

function TemplateCard({
  activeTemplateId,
  templateId,
  title,
  category,
  description,
  accent,
  onSelect,
}: {
  activeTemplateId: string;
  templateId: string;
  title: string;
  category: string;
  description: string;
  accent: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5",
        activeTemplateId === templateId
          ? "border-violet-400/35 bg-violet-500/14"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{category}</p>
        </div>
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 16px ${accent}` }}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
    </button>
  );
}

function LibraryMenuContent({
  activeCategory,
  activeTemplateId,
  visibleLibraryItems,
  onApplyTemplate,
  onOpenCommand,
  onSetCategory,
  onAddItem,
}: {
  activeCategory: MenuCategory;
  activeTemplateId: string;
  visibleLibraryItems: LibraryItemDefinition[];
  onApplyTemplate: (templateId: string) => void;
  onOpenCommand: () => void;
  onSetCategory: (category: MenuCategory) => void;
  onAddItem: (type: BoothItem["type"]) => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Command Toolbar</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Add components fast</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Search, filter, and deploy booth pieces from one pop-out navigation menu.
        </p>
        <button
          type="button"
          onClick={onOpenCommand}
          className="mt-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/16 text-violet-200">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Quick add command</p>
              <p className="text-xs text-white/45">Search items and scene presets</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
            Cmd/Ctrl + K
          </div>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-2">
          {Object.keys(CATEGORY_META).map((category) => (
            <CategoryChip
              key={category}
              active={activeCategory === category}
              category={category as MenuCategory}
              onClick={() => onSetCategory(category as MenuCategory)}
            />
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {visibleLibraryItems.map((item) => (
            <ComponentCard key={item.type} item={item} onAdd={() => onAddItem(item.type)} />
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Presets</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Switch a full concept</h3>
            </div>
            <Boxes className="h-5 w-5 text-violet-300" />
          </div>
          <div className="mt-4 grid gap-3">
            {BUILDER_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                activeTemplateId={activeTemplateId}
                templateId={template.id}
                title={template.name}
                category={template.category}
                description={template.description}
                accent={template.accent}
                onSelect={() => onApplyTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopCommandRail({
  menuOpen,
  activeCategory,
  activeTemplateId,
  visibleLibraryItems,
  onToggle,
  onOpenCommand,
  onSetCategory,
  onAddItem,
  onApplyTemplate,
}: {
  menuOpen: boolean;
  activeCategory: MenuCategory;
  activeTemplateId: string;
  visibleLibraryItems: LibraryItemDefinition[];
  onToggle: () => void;
  onOpenCommand: () => void;
  onSetCategory: (category: MenuCategory) => void;
  onAddItem: (type: BoothItem["type"]) => void;
  onApplyTemplate: (templateId: string) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden xl:block">
      <div
        className="pointer-events-auto h-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-[width] duration-300"
        style={{ width: menuOpen ? 320 : 72 }}
      >
        <div className="flex h-full">
          <div className="flex w-[72px] shrink-0 flex-col items-center justify-between border-r border-white/10 py-3">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onToggle}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                {menuOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={onOpenCommand}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-violet-200 transition hover:bg-white/[0.08]"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = activeCategory === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSetCategory(key as MenuCategory);
                    }}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl border text-white/60 transition hover:text-white",
                      active ? "border-white/15 bg-white/[0.08]" : "border-transparent bg-transparent",
                    )}
                    style={active ? { color: meta.accent, boxShadow: `0 0 18px ${meta.accent}22` } : undefined}
                    title={meta.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {menuOpen ? (
            <LibraryMenuContent
              activeCategory={activeCategory}
              activeTemplateId={activeTemplateId}
              visibleLibraryItems={visibleLibraryItems}
              onApplyTemplate={onApplyTemplate}
              onOpenCommand={onOpenCommand}
              onSetCategory={onSetCategory}
              onAddItem={onAddItem}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InspectorPanel({
  booth,
  copyLabel,
  cloudProjects,
  cloudStatus,
  cloudBusy,
  selectedConfig,
  selectedFootprint,
  selectedId,
  selectedItem,
  shareUrl,
  saveCloudSnapshot,
  loadCloudSnapshot,
  removeCloudSnapshot,
  duplicateSelected,
  rotateSelected,
  setBooth,
  setCopyLabel,
  setItems,
  setSelectedId,
  showIntro = true,
  updateSelectedItem,
}: {
  booth: BoothDefinition;
  copyLabel: string;
  cloudProjects: CloudBoothProject[];
  cloudStatus: string;
  cloudBusy: boolean;
  selectedConfig: LibraryItemDefinition | null;
  selectedFootprint: { width: number; depth: number } | null;
  selectedId: number | null;
  selectedItem: BoothItem | null;
  shareUrl: string;
  saveCloudSnapshot: () => void;
  loadCloudSnapshot: (project: CloudBoothProject) => void;
  removeCloudSnapshot: (projectId: string) => void;
  duplicateSelected: () => void;
  rotateSelected: (delta: number) => void;
  setBooth: Dispatch<SetStateAction<BoothDefinition>>;
  setCopyLabel: Dispatch<SetStateAction<string>>;
  setItems: Dispatch<SetStateAction<BoothItem[]>>;
  setSelectedId: Dispatch<SetStateAction<number | null>>;
  showIntro?: boolean;
  updateSelectedItem: (updates: Partial<BoothItem>) => void;
}) {
  return (
    <>
      {showIntro ? (
        <>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Inspector</p>
          <h2 className="mt-2 text-2xl font-semibold">Deployment controls</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Finalize the booth definition, push a mobile handoff link, and tune the selected component before launch.
          </p>
        </>
      ) : null}

      <div className={cn("space-y-4", showIntro ? "mt-5" : "mt-0")}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/65">Project name</span>
          <input
            value={booth.name}
            onChange={(event) =>
              setBooth((current) => sanitizeBooth({ ...current, name: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/65">Width</span>
            <input
              type="number"
              min={10}
              max={40}
              value={booth.width}
              onChange={(event) =>
                setBooth((current) => sanitizeBooth({ ...current, width: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-white/65">Depth</span>
            <input
              type="number"
              min={10}
              max={40}
              value={booth.depth}
              onChange={(event) =>
                setBooth((current) => sanitizeBooth({ ...current, depth: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/65">Ops note</span>
          <textarea
            rows={4}
            value={booth.note}
            onChange={(event) =>
              setBooth((current) => sanitizeBooth({ ...current, note: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
          />
        </label>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Mobile AR link</p>
              <p className="mt-1 text-sm text-white/65">Open this exact layout on another device.</p>
            </div>
            <MonitorPlay className="h-5 w-5 text-violet-300" />
          </div>
          <textarea
            rows={4}
            value={shareUrl}
            readOnly
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/70"
          />
          <button
            type="button"
            onClick={async () => {
              const copied = await copyText(shareUrl);
              setCopyLabel(copied ? "Copied" : "Clipboard unavailable");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
          >
            <Copy className="h-4 w-4" />
            {copyLabel}
          </button>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Cloud project library</p>
              <p className="mt-1 text-sm text-white/65">
                {hasProjectCloudConfig
                  ? "Save booth snapshots to Supabase and reload them into the builder."
                  : "Add Supabase keys to enable cloud project saves."}
              </p>
            </div>
            <Save className="h-5 w-5 text-violet-300" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!hasProjectCloudConfig || cloudBusy}
              onClick={saveCloudSnapshot}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {cloudBusy ? "Saving..." : "Save cloud snapshot"}
            </button>
            <p className="text-xs leading-6 text-white/45">{cloudStatus}</p>
          </div>
          {cloudProjects.length ? (
            <div className="mt-4 space-y-3">
              {cloudProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{project.projectName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                        {project.templateId} · {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadCloudSnapshot(project)}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCloudSnapshot(project.id)}
                        className="rounded-full border border-rose-400/15 bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200 transition hover:bg-rose-500/16"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasProjectCloudConfig ? (
            <p className="mt-4 text-sm leading-6 text-white/55">
              No cloud snapshots yet. Save the current booth to create the first library entry.
            </p>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Selection</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {selectedItem ? selectedItem.label : "Nothing selected"}
              </p>
            </div>
            <Activity className="h-5 w-5 text-violet-300" />
          </div>

          {selectedItem && selectedConfig && selectedFootprint && selectedId ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-white/55">{selectedConfig.description}</p>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/65">Label</span>
                <input
                  value={selectedItem.label}
                  onChange={(event) => updateSelectedItem({ label: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-white/65">X</span>
                  <input
                    type="number"
                    value={selectedItem.x}
                    onChange={(event) => updateSelectedItem({ x: Number(event.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-white/65">Y</span>
                  <input
                    type="number"
                    value={selectedItem.y}
                    onChange={(event) => updateSelectedItem({ y: Number(event.target.value) })}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/40"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Footprint</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {selectedFootprint.width} x {selectedFootprint.depth} ft
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Rotation</p>
                  <p className="mt-2 text-sm font-semibold text-white">{selectedItem.rotation}deg</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Category</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-white">
                    {selectedConfig.category}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => rotateSelected(-90)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
                >
                  Rotate -90deg
                </button>
                <button
                  type="button"
                  onClick={() => rotateSelected(90)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
                >
                  Rotate +90deg
                </button>
                <button
                  type="button"
                  onClick={duplicateSelected}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.08]"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItems((current) => current.filter((item) => item.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/15 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/16"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/55">
              Select a placed component to tune its label, footprint orientation, and exact position before deployment.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export function Builder() {
  const { templateId = "default" } = useParams();
  const navigate = useNavigate();
  const { openAR } = useOutletContext<RootOutletContext>();
  const isMobile = useIsMobile();
  const hasHydratedRef = useRef(false);
  const shouldAutoOpenArRef = useRef(false);

  const [booth, setBooth] = useState<BoothDefinition>(createProjectFromTemplate(templateId).booth);
  const [items, setItems] = useState<BoothItem[]>(createProjectFromTemplate(templateId).items);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("all");
  const [copyLabel, setCopyLabel] = useState("Copy share link");
  const [commandOpen, setCommandOpen] = useState(false);
  const [componentMenuOpen, setComponentMenuOpen] = useState(true);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [cloudProjects, setCloudProjects] = useState<CloudBoothProject[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(
    hasProjectCloudConfig
      ? "Cloud saves ready."
      : "Supabase cloud save is not configured."
  );

  const metrics = useMemo(() => deriveMetrics(booth, items), [booth, items]);
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );
  const selectedConfig = selectedItem ? LIBRARY_ITEM_BY_TYPE[selectedItem.type] : null;
  const selectedFootprint = selectedItem ? getFootprint(selectedItem) : null;
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const baseUrl = `${window.location.origin}/builder/${booth.templateId || templateId}`;
    return buildShareUrl(baseUrl, serializeProject(booth, items));
  }, [booth, items, templateId]);
  const refreshCloudProjects = useCallback(async () => {
    if (!hasProjectCloudConfig) {
      setCloudProjects([]);
      return;
    }

    setCloudBusy(true);
    try {
      const projects = await listCloudProjects();
      setCloudProjects(projects);
      setCloudStatus(
        projects.length
          ? `${projects.length} cloud project${projects.length === 1 ? "" : "s"} available.`
          : "Cloud connected. Save the first booth snapshot."
      );
    } catch (error) {
      setCloudStatus(
        error instanceof Error ? error.message : "Cloud project library is unavailable."
      );
    } finally {
      setCloudBusy(false);
    }
  }, []);

  const saveCloudSnapshot = useCallback(async () => {
    if (!hasProjectCloudConfig) {
      setCloudStatus("Add Supabase keys to enable cloud saves.");
      return;
    }

    setCloudBusy(true);
    try {
      const saved = await saveCloudProject({
        templateId: booth.templateId,
        projectName: booth.name || "Untitled Booth",
        shareUrl,
        project: serializeProject(booth, items),
      });
      setCloudStatus(`Saved ${saved.projectName} to the cloud library.`);
      await refreshCloudProjects();
    } catch (error) {
      setCloudStatus(
        error instanceof Error ? error.message : "Failed to save this booth to the cloud."
      );
      setCloudBusy(false);
    }
  }, [booth, items, shareUrl, refreshCloudProjects]);

  const loadCloudSnapshot = useCallback((project: CloudBoothProject) => {
    const sanitized = sanitizeProject(project.project);
    setBooth(sanitized.booth);
    setItems(sanitized.items);
    setSelectedId(null);
    setCloudStatus(`Loaded ${project.projectName}.`);
  }, []);

  const removeCloudSnapshot = useCallback(
    async (projectId: string) => {
      if (!hasProjectCloudConfig) {
        return;
      }

      setCloudBusy(true);
      try {
        await deleteCloudProject(projectId);
        setCloudStatus("Cloud snapshot removed.");
        await refreshCloudProjects();
      } catch (error) {
        setCloudStatus(
          error instanceof Error ? error.message : "Failed to delete the cloud snapshot."
        );
        setCloudBusy(false);
      }
    },
    [refreshCloudProjects]
  );
  const visibleLibraryItems = useMemo(
    () =>
      activeCategory === "all"
        ? LIBRARY_ITEMS
        : LIBRARY_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  useEffect(() => {
    const hashProject = readProjectFromHash();
    const storageKey = getStorageKey(templateId);
    const savedProject =
      !hashProject && typeof window !== "undefined" && window.localStorage.getItem(storageKey)
        ? JSON.parse(window.localStorage.getItem(storageKey) ?? "null")
        : null;
    const nextProject =
      hashProject?.project ??
      (savedProject ? sanitizeProject(savedProject) : createProjectFromTemplate(templateId));

    startTransition(() => {
      setBooth(nextProject.booth);
      setItems(nextProject.items);
      setSelectedId(nextProject.items[0]?.id ?? null);
      hasHydratedRef.current = true;
      shouldAutoOpenArRef.current = Boolean(hashProject?.openAR);
    });
  }, [templateId]);

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      getStorageKey(templateId),
      JSON.stringify(serializeProject(booth, items)),
    );
  }, [booth, items, templateId]);

  useEffect(() => {
    if (!shouldAutoOpenArRef.current || !hasHydratedRef.current) {
      return;
    }

    shouldAutoOpenArRef.current = false;
    openAR({
      booth,
      items,
      shareUrl,
      sourceLabel: booth.name,
    });
  }, [booth, items, openAR, shareUrl]);

  useEffect(() => {
    void refreshCloudProjects();
  }, [refreshCloudProjects]);

  useEffect(() => {
    setItems((current) => clampItemsToBooth(current, booth));
  }, [booth.width, booth.depth]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      const isTyping =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if (isTyping) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        if (!isMobile) {
          setComponentMenuOpen(true);
        }
      }
    }

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMobileInspectorOpen(false);
    }
  }, [isMobile]);

  const addItem = useCallback(
    (type: BoothItem["type"]) => {
      const config = LIBRARY_ITEM_BY_TYPE[type];

      setItems((current) => {
        const nextId = getNextId(current);
        const offset = current.length % 6;
        const nextItem = clampItemToBooth(
          {
            id: nextId,
            type,
            label: config.name,
            x: Math.round(booth.width / 2 - config.width / 2) + (offset % 3) * 2,
            y: Math.round(booth.depth / 2 - config.depth / 2) + Math.floor(offset / 3) * 2,
            rotation: 0,
          },
          booth,
        );

        setSelectedId(nextItem.id);
        return [...current, nextItem];
      });
    },
    [booth],
  );

  const moveItem = useCallback(
    (id: number, x: number, y: number) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? clampItemToBooth({ ...item, x, y }, booth) : item)),
      );
    },
    [booth],
  );

  const rotateSelected = useCallback(
    (delta: number) => {
      if (!selectedId) {
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === selectedId
            ? clampItemToBooth({ ...item, rotation: item.rotation + delta }, booth)
            : item,
        ),
      );
    },
    [booth, selectedId],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isTyping =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if (isTyping || !selectedId) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        rotateSelected(90);
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        setItems((current) => current.filter((item) => item.id !== selectedId));
        setSelectedId(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rotateSelected, selectedId]);

  const updateSelectedItem = useCallback(
    (updates: Partial<BoothItem>) => {
      if (!selectedId) {
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === selectedId ? clampItemToBooth({ ...item, ...updates }, booth) : item,
        ),
      );
    },
    [booth, selectedId],
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    const duplicate = clampItemToBooth(
      {
        ...selectedItem,
        id: getNextId(items),
        x: selectedItem.x + 1,
        y: selectedItem.y + 1,
        label: `${selectedItem.label} Copy`,
      },
      booth,
    );

    setItems((current) => [...current, duplicate]);
    setSelectedId(duplicate.id);
  }, [booth, items, selectedItem]);

  const applyTemplate = useCallback(
    (nextTemplateId: string) => {
      const nextProject = createProjectFromTemplate(nextTemplateId);

      startTransition(() => {
        setBooth(nextProject.booth);
        setItems(nextProject.items);
        setSelectedId(nextProject.items[0]?.id ?? null);
        navigate(`/builder/${nextTemplateId}`);
      });
    },
    [navigate],
  );

  const handleOpenCategory = useCallback(
    (category: BuilderCategory) => {
      setActiveCategory(category);
      if (!isMobile) {
        setComponentMenuOpen(true);
      }
    },
    [isMobile],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12),transparent_22%),linear-gradient(180deg,#04050b_0%,#090910_100%)] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[var(--content-max-width)] flex-col gap-4 px-[var(--page-gutter)] py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Active project</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="min-w-0 text-base font-semibold">{booth.name}</span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    {booth.templateId}
                  </span>
                </div>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 md:block">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Deployment status</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-300">
                  <Save className="h-4 w-4" />
                  Autosave active
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => (isMobile ? setComponentMenuOpen(true) : setComponentMenuOpen((current) => !current))}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                {componentMenuOpen && !isMobile ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
                Components
              </button>
              <button
                type="button"
                onClick={() => {
                  setCommandOpen(true);
                  if (!isMobile) {
                    setComponentMenuOpen(true);
                  }
                }}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Search className="h-4 w-4" />
                Quick Add
                <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white/45">
                  Cmd/Ctrl K
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowGrid((current) => !current)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
                  showGrid
                    ? "border-violet-400/30 bg-violet-500/14 text-violet-200"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white",
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                Grid
              </button>
              <button
                type="button"
                onClick={() =>
                  setBooth((current) =>
                    sanitizeBooth({
                      ...current,
                      ambience: current.ambience === "day" ? "night" : "day",
                    }),
                  )
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                {booth.ambience === "day" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {booth.ambience === "day" ? "Day Scene" : "Night Scene"}
              </button>
              <Link
                to="/ai"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Sparkles className="h-4 w-4" />
                AI Studio
              </Link>
              <button
                type="button"
                onClick={() =>
                  openAR({
                    booth,
                    items,
                    shareUrl,
                    sourceLabel: booth.name,
                  })
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition hover:brightness-110"
              >
                <Eye className="h-4 w-4" />
                Enter AR
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Footprint</p>
              <p className="mt-2 text-xl font-semibold">
                {booth.width} x {booth.depth}
                <span className="ml-1 text-sm font-medium text-white/45">ft</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Placed Items</p>
              <p className="mt-2 text-xl font-semibold">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Occupancy</p>
              <p className="mt-2 text-xl font-semibold">{metrics.occupancy}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Touchpoints</p>
              <p className="mt-2 text-xl font-semibold">{metrics.touchpoints}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[var(--content-max-width)] gap-4 px-[var(--page-gutter)] py-4 pb-24 xl:grid-cols-[minmax(0,1fr),minmax(18rem,20rem)] xl:pb-4">
        <div
          className={cn(
            "relative min-w-0 transition-[padding] duration-300",
            "xl:pl-[5.5rem]",
            componentMenuOpen && "xl:pl-[21rem]",
          )}
        >
          <DesktopCommandRail
            menuOpen={componentMenuOpen}
            activeCategory={activeCategory}
            activeTemplateId={booth.templateId}
            visibleLibraryItems={visibleLibraryItems}
            onToggle={() => setComponentMenuOpen((current) => !current)}
            onOpenCommand={() => setCommandOpen(true)}
            onSetCategory={(category) => {
              setActiveCategory(category);
              setComponentMenuOpen(true);
            }}
            onAddItem={addItem}
            onApplyTemplate={applyTemplate}
          />

          <BoothCanvas
            booth={booth}
            items={items}
            selectedId={selectedId}
            showGrid={showGrid}
            onMoveItem={moveItem}
            onSelectItem={setSelectedId}
          />

          <button
            type="button"
            onClick={() => setMobileInspectorOpen(true)}
            className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition hover:bg-black/75 xl:hidden"
          >
            <ChevronUp className="h-4 w-4 text-violet-200" />
            Pull Tools
          </button>
        </div>

        <aside className="hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl xl:block">
          <InspectorPanel
            booth={booth}
            copyLabel={copyLabel}
            cloudProjects={cloudProjects}
            cloudStatus={cloudStatus}
            cloudBusy={cloudBusy}
            selectedConfig={selectedConfig}
            selectedFootprint={selectedFootprint}
            selectedId={selectedId}
            selectedItem={selectedItem}
            shareUrl={shareUrl}
            saveCloudSnapshot={saveCloudSnapshot}
            loadCloudSnapshot={loadCloudSnapshot}
            removeCloudSnapshot={removeCloudSnapshot}
            duplicateSelected={duplicateSelected}
            rotateSelected={rotateSelected}
            setBooth={setBooth}
            setCopyLabel={setCopyLabel}
            setItems={setItems}
            setSelectedId={setSelectedId}
            updateSelectedItem={updateSelectedItem}
          />
        </aside>
      </div>

      <Drawer open={isMobile && mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
        <DrawerContent className="border-white/10 bg-[linear-gradient(180deg,rgba(11,11,18,0.98),rgba(5,5,10,0.99))] text-white">
          <DrawerHeader className="border-b border-white/10 px-4 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DrawerTitle className="text-white">Footprint and tools</DrawerTitle>
                <DrawerDescription className="mt-1 text-white/55">
                  Pull this panel open when you need sizing, notes, selection edits, or AR handoff controls.
                </DrawerDescription>
              </div>
              <button
                type="button"
                onClick={() => setMobileInspectorOpen(false)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Hide
              </button>
            </div>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-4 pb-6 pt-4">
            <InspectorPanel
              booth={booth}
              copyLabel={copyLabel}
              cloudProjects={cloudProjects}
              cloudStatus={cloudStatus}
              cloudBusy={cloudBusy}
              selectedConfig={selectedConfig}
              selectedFootprint={selectedFootprint}
              selectedId={selectedId}
              selectedItem={selectedItem}
              shareUrl={shareUrl}
              saveCloudSnapshot={saveCloudSnapshot}
              loadCloudSnapshot={loadCloudSnapshot}
              removeCloudSnapshot={removeCloudSnapshot}
              duplicateSelected={duplicateSelected}
              rotateSelected={rotateSelected}
              setBooth={setBooth}
              setCopyLabel={setCopyLabel}
              setItems={setItems}
              setSelectedId={setSelectedId}
              showIntro={false}
              updateSelectedItem={updateSelectedItem}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Sheet open={isMobile && componentMenuOpen} onOpenChange={setComponentMenuOpen}>
        <SheetContent
          side="left"
          className="border-white/10 bg-[linear-gradient(180deg,rgba(11,11,18,0.97),rgba(5,5,10,0.98))] p-0 text-white sm:max-w-md"
        >
          <SheetHeader className="border-b border-white/10">
            <SheetTitle className="text-white">Components menu</SheetTitle>
            <SheetDescription className="text-white/55">
              Search or browse every addable booth component and preset.
            </SheetDescription>
          </SheetHeader>
          <LibraryMenuContent
            activeCategory={activeCategory}
            activeTemplateId={booth.templateId}
            visibleLibraryItems={visibleLibraryItems}
            onApplyTemplate={(nextTemplateId) => {
              applyTemplate(nextTemplateId);
              setComponentMenuOpen(false);
            }}
            onOpenCommand={() => setCommandOpen(true)}
            onSetCategory={setActiveCategory}
            onAddItem={(type) => {
              addItem(type);
              setComponentMenuOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Add Booth Components"
        description="Search components and presets for the builder."
      >
        <CommandInput placeholder="Search components, presets, and categories..." />
        <CommandList>
          <CommandEmpty>No matching component or preset.</CommandEmpty>
          <CommandGroup heading="Components">
            {LIBRARY_ITEMS.map((item) => (
              <CommandItem
                key={item.type}
                value={`${item.name} ${item.category} ${item.description}`}
                onSelect={() => {
                  addItem(item.type);
                  setCommandOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: item.accent,
                    background: item.background,
                    color: item.text,
                  }}
                >
                  <Plus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{item.name}</p>
                  <p className="truncate text-xs text-white/45">{item.description}</p>
                </div>
                <CommandShortcut>{item.width}x{item.depth}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Scene Presets">
            {BUILDER_TEMPLATES.map((template) => (
              <CommandItem
                key={template.id}
                value={`${template.name} ${template.category} ${template.description}`}
                onSelect={() => {
                  applyTemplate(template.id);
                  setCommandOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-3"
              >
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: template.accent, boxShadow: `0 0 14px ${template.accent}` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{template.name}</p>
                  <p className="truncate text-xs text-white/45">{template.description}</p>
                </div>
                <CommandShortcut>{template.category}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <SmartAssistant
        items={items}
        onOpenCategory={handleOpenCategory}
        onOpenAR={() =>
          openAR({
            booth,
            items,
            shareUrl,
            sourceLabel: booth.name,
          })
        }
      />
    </div>
  );
}
