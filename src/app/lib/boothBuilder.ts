export type BoothItemType =
  | "chair"
  | "table"
  | "counter"
  | "screen"
  | "banner"
  | "kiosk";

export type BuilderCategory = "seating" | "surfaces" | "media" | "branding";
export type BoothAmbience = "day" | "night";

export interface BoothDefinition {
  name: string;
  width: number;
  depth: number;
  note: string;
  ambience: BoothAmbience;
  templateId: string;
}

export interface BoothItem {
  id: number;
  type: BoothItemType;
  label: string;
  x: number;
  y: number;
  rotation: number;
}

export interface BoothProject {
  version: number;
  booth: BoothDefinition;
  items: BoothItem[];
}

export interface BoothTemplate {
  id: string;
  name: string;
  category: string;
  accent: string;
  description: string;
  badges: string[];
  booth: BoothDefinition;
  items: Omit<BoothItem, "id">[];
}

export interface LibraryItemDefinition {
  type: BoothItemType;
  name: string;
  category: BuilderCategory;
  accent: string;
  background: string;
  text: string;
  shadow: string;
  width: number;
  depth: number;
  heightMeters: number;
  description: string;
}

export interface ARPreviewPayload {
  booth: BoothDefinition;
  items: BoothItem[];
  shareUrl?: string;
  sourceLabel?: string;
}

export const CELL_SIZE = 34;
export const STORAGE_PREFIX = "ar-trade-show-builder/project";
export const HASH_LAYOUT_KEY = "layout";
export const HASH_MODE_KEY = "mode";

export const LIBRARY_ITEMS: LibraryItemDefinition[] = [
  {
    type: "chair",
    name: "Lounge Chair",
    category: "seating",
    accent: "#a78bfa",
    background: "rgba(167, 139, 250, 0.16)",
    text: "#ede9fe",
    shadow: "rgba(167, 139, 250, 0.28)",
    width: 2,
    depth: 2,
    heightMeters: 1,
    description: "Soft seating for longer conversations and hospitality moments.",
  },
  {
    type: "table",
    name: "Meeting Table",
    category: "surfaces",
    accent: "#f59e0b",
    background: "rgba(245, 158, 11, 0.16)",
    text: "#fef3c7",
    shadow: "rgba(245, 158, 11, 0.25)",
    width: 3,
    depth: 2,
    heightMeters: 1.05,
    description: "Shared surface for demos, samples, and collaborative walkthroughs.",
  },
  {
    type: "counter",
    name: "Info Counter",
    category: "surfaces",
    accent: "#34d399",
    background: "rgba(52, 211, 153, 0.16)",
    text: "#d1fae5",
    shadow: "rgba(52, 211, 153, 0.24)",
    width: 4,
    depth: 2,
    heightMeters: 1.15,
    description: "Primary reception moment for check-in, demos, or lead capture.",
  },
  {
    type: "screen",
    name: "LED Screen",
    category: "media",
    accent: "#60a5fa",
    background: "rgba(96, 165, 250, 0.16)",
    text: "#dbeafe",
    shadow: "rgba(96, 165, 250, 0.24)",
    width: 6,
    depth: 1,
    heightMeters: 2.4,
    description: "Hero storytelling wall for motion graphics, launches, and presentations.",
  },
  {
    type: "banner",
    name: "Brand Banner",
    category: "branding",
    accent: "#f472b6",
    background: "rgba(244, 114, 182, 0.16)",
    text: "#fce7f3",
    shadow: "rgba(244, 114, 182, 0.26)",
    width: 2,
    depth: 1,
    heightMeters: 2.6,
    description: "Vertical visual anchor for long-range brand visibility on the floor.",
  },
  {
    type: "kiosk",
    name: "Touch Kiosk",
    category: "media",
    accent: "#22d3ee",
    background: "rgba(34, 211, 238, 0.14)",
    text: "#cffafe",
    shadow: "rgba(34, 211, 238, 0.22)",
    width: 2,
    depth: 2,
    heightMeters: 1.7,
    description: "Self-guided demo station that keeps engagement moving during peak traffic.",
  },
];

export const LIBRARY_ITEM_BY_TYPE = Object.fromEntries(
  LIBRARY_ITEMS.map((item) => [item.type, item]),
) as Record<BoothItemType, LibraryItemDefinition>;

export const BUILDER_TEMPLATES: BoothTemplate[] = [
  {
    id: "default",
    name: "Launch Platform",
    category: "Balanced",
    accent: "#8b5cf6",
    description: "A flexible 20 x 20 footprint that balances storytelling, hospitality, and demos.",
    badges: ["AR Ready", "Balanced Flow"],
    booth: {
      name: "Launch Platform",
      width: 20,
      depth: 20,
      note: "Balanced 20 x 20 layout for presentations, demos, and lounge traffic.",
      ambience: "night",
      templateId: "default",
    },
    items: [
      { type: "screen", label: "Hero Wall", x: 7, y: 1, rotation: 0 },
      { type: "counter", label: "Welcome Desk", x: 2, y: 3, rotation: 0 },
      { type: "counter", label: "Check-In", x: 14, y: 3, rotation: 0 },
      { type: "table", label: "Demo Table", x: 4, y: 10, rotation: 0 },
      { type: "kiosk", label: "Self-Guided Demo", x: 14, y: 10, rotation: 0 },
      { type: "chair", label: "Lounge A", x: 4, y: 15, rotation: 0 },
      { type: "chair", label: "Lounge B", x: 7, y: 15, rotation: 0 },
      { type: "banner", label: "Wayfinding Banner", x: 17, y: 15, rotation: 90 },
    ],
  },
  {
    id: "tech",
    name: "Tech Nexus",
    category: "Technology",
    accent: "#60a5fa",
    description: "High-visibility digital layout built around media walls and self-serve demos.",
    badges: ["LED Focus", "High Throughput"],
    booth: {
      name: "Tech Nexus",
      width: 24,
      depth: 20,
      note: "Media-forward booth with strong digital touchpoints and clear visitor lanes.",
      ambience: "night",
      templateId: "tech",
    },
    items: [
      { type: "screen", label: "Main LED Wall", x: 9, y: 1, rotation: 0 },
      { type: "screen", label: "Side Display", x: 1, y: 5, rotation: 90 },
      { type: "screen", label: "Side Display", x: 21, y: 5, rotation: 90 },
      { type: "kiosk", label: "Touch Demo A", x: 5, y: 10, rotation: 0 },
      { type: "kiosk", label: "Touch Demo B", x: 15, y: 10, rotation: 0 },
      { type: "counter", label: "Launch Counter", x: 10, y: 15, rotation: 0 },
      { type: "banner", label: "Product Banner", x: 2, y: 16, rotation: 90 },
    ],
  },
  {
    id: "luxury",
    name: "Luxe Pavilion",
    category: "Premium",
    accent: "#f59e0b",
    description: "Warm hospitality layout with elevated materials, lounge spacing, and concierge flow.",
    badges: ["Hospitality", "VIP Ready"],
    booth: {
      name: "Luxe Pavilion",
      width: 20,
      depth: 20,
      note: "Concierge-style booth with a premium meeting zone and soft lounge circulation.",
      ambience: "night",
      templateId: "luxury",
    },
    items: [
      { type: "counter", label: "Concierge", x: 8, y: 2, rotation: 0 },
      { type: "banner", label: "Statement Banner", x: 2, y: 3, rotation: 90 },
      { type: "screen", label: "Brand Story Wall", x: 7, y: 6, rotation: 0 },
      { type: "table", label: "Meeting Table", x: 8, y: 12, rotation: 0 },
      { type: "chair", label: "VIP Lounge A", x: 5, y: 16, rotation: 0 },
      { type: "chair", label: "VIP Lounge B", x: 8, y: 16, rotation: 0 },
      { type: "chair", label: "VIP Lounge C", x: 11, y: 16, rotation: 0 },
      { type: "chair", label: "VIP Lounge D", x: 14, y: 16, rotation: 0 },
    ],
  },
  {
    id: "minimal",
    name: "Zenith Minimal",
    category: "Modern",
    accent: "#22d3ee",
    description: "Open-space concept with clear hierarchy and low clutter for product-first narratives.",
    badges: ["Open Layout", "Clean Focus"],
    booth: {
      name: "Zenith Minimal",
      width: 18,
      depth: 18,
      note: "Clean gallery-like layout with restrained staging and strong focal hierarchy.",
      ambience: "day",
      templateId: "minimal",
    },
    items: [
      { type: "screen", label: "Primary Wall", x: 6, y: 1, rotation: 0 },
      { type: "table", label: "Center Table", x: 7, y: 8, rotation: 0 },
      { type: "kiosk", label: "Interactive Pod", x: 2, y: 11, rotation: 0 },
      { type: "chair", label: "Visitor Seat", x: 12, y: 12, rotation: 0 },
      { type: "banner", label: "Editorial Banner", x: 15, y: 5, rotation: 90 },
    ],
  },
  {
    id: "showcase",
    name: "Immersive Retail",
    category: "Retail",
    accent: "#ec4899",
    description: "High-engagement merchandising layout with tactile demo islands and guided flow.",
    badges: ["Sampling", "High Engagement"],
    booth: {
      name: "Immersive Retail",
      width: 24,
      depth: 18,
      note: "Retail-forward layout for physical interaction, sampling, and product discovery.",
      ambience: "night",
      templateId: "showcase",
    },
    items: [
      { type: "screen", label: "Campaign Wall", x: 9, y: 1, rotation: 0 },
      { type: "counter", label: "Sample Bar", x: 4, y: 7, rotation: 0 },
      { type: "counter", label: "Checkout Demo", x: 14, y: 7, rotation: 0 },
      { type: "table", label: "Feature Table", x: 10, y: 12, rotation: 0 },
      { type: "kiosk", label: "Quiz Kiosk", x: 2, y: 12, rotation: 0 },
      { type: "banner", label: "Promo Banner", x: 20, y: 12, rotation: 90 },
    ],
  },
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getFootprint(item: Pick<BoothItem, "type" | "rotation">) {
  const config = LIBRARY_ITEM_BY_TYPE[item.type];
  const rotated = Math.abs(item.rotation % 180) === 90;

  return {
    width: rotated ? config.depth : config.width,
    depth: rotated ? config.width : config.depth,
  };
}

export function clampItemToBooth(item: BoothItem, booth: BoothDefinition) {
  const footprint = getFootprint(item);

  return {
    ...item,
    x: clamp(Math.round(item.x), 0, Math.max(0, booth.width - footprint.width)),
    y: clamp(Math.round(item.y), 0, Math.max(0, booth.depth - footprint.depth)),
    rotation: normalizeRotation(item.rotation),
  };
}

export function clampItemsToBooth(items: BoothItem[], booth: BoothDefinition) {
  return items.map((item) => clampItemToBooth(item, booth));
}

export function normalizeRotation(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

export function getTemplateById(templateId?: string) {
  return BUILDER_TEMPLATES.find((template) => template.id === templateId) ?? BUILDER_TEMPLATES[0];
}

export function createProjectFromTemplate(templateId?: string): BoothProject {
  const template = getTemplateById(templateId);
  return sanitizeProject({
    version: 2,
    booth: template.booth,
    items: template.items.map((item, index) => ({ ...item, id: index + 1 })),
  });
}

export function sanitizeBooth(rawBooth?: Partial<BoothDefinition>): BoothDefinition {
  const template = getTemplateById(rawBooth?.templateId);

  return {
    name: rawBooth?.name?.trim() || template.booth.name,
    width: clamp(Number(rawBooth?.width) || template.booth.width, 10, 40),
    depth: clamp(Number(rawBooth?.depth) || template.booth.depth, 10, 40),
    note: typeof rawBooth?.note === "string" ? rawBooth.note.slice(0, 280) : template.booth.note,
    ambience: rawBooth?.ambience === "day" ? "day" : "night",
    templateId: rawBooth?.templateId || template.id,
  };
}

export function sanitizeItem(rawItem: Partial<BoothItem>, fallbackId: number): BoothItem | null {
  if (!rawItem.type || !(rawItem.type in LIBRARY_ITEM_BY_TYPE)) {
    return null;
  }

  const config = LIBRARY_ITEM_BY_TYPE[rawItem.type as BoothItemType];

  return {
    id: Number.isFinite(rawItem.id) ? Number(rawItem.id) : fallbackId,
    type: rawItem.type as BoothItemType,
    label: typeof rawItem.label === "string" && rawItem.label.trim() ? rawItem.label.trim() : config.name,
    x: Number.isFinite(rawItem.x) ? Number(rawItem.x) : 0,
    y: Number.isFinite(rawItem.y) ? Number(rawItem.y) : 0,
    rotation: normalizeRotation(Number(rawItem.rotation) || 0),
  };
}

export function sanitizeProject(rawProject?: Partial<BoothProject>): BoothProject {
  const booth = sanitizeBooth(rawProject?.booth);
  const items = Array.isArray(rawProject?.items)
    ? rawProject.items
        .map((item, index) => sanitizeItem(item, index + 1))
        .filter((item): item is BoothItem => Boolean(item))
    : [];

  return {
    version: 2,
    booth,
    items: clampItemsToBooth(items, booth),
  };
}

export function serializeProject(booth: BoothDefinition, items: BoothItem[]): BoothProject {
  return {
    version: 2,
    booth,
    items: items.map((item) => ({ ...item })),
  };
}

export function getStorageKey(templateId: string) {
  return `${STORAGE_PREFIX}:${templateId}`;
}

export function getNextId(items: BoothItem[]) {
  return items.reduce((currentMax, item) => Math.max(currentMax, item.id), 0) + 1;
}

export function encodeProject(project: BoothProject) {
  const encoded = new TextEncoder().encode(JSON.stringify(project));
  let binary = "";

  encoded.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window.btoa(binary);
}

export function decodeProject(serialized: string): BoothProject {
  const binary = window.atob(serialized);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return sanitizeProject(JSON.parse(new TextDecoder().decode(bytes)));
}

export function readProjectFromHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const encoded = params.get(HASH_LAYOUT_KEY);

  if (!encoded) {
    return null;
  }

  try {
    return {
      project: decodeProject(encoded),
      openAR: params.get(HASH_MODE_KEY) === "ar",
    };
  } catch (error) {
    console.warn("Could not parse booth project from URL hash", error);
    return null;
  }
}

export function buildShareUrl(baseUrl: string, project: BoothProject) {
  const url = new URL(baseUrl);
  const params = new URLSearchParams();
  params.set(HASH_LAYOUT_KEY, encodeProject(project));
  params.set(HASH_MODE_KEY, "ar");
  url.hash = params.toString();
  return url.toString();
}

export function deriveMetrics(booth: BoothDefinition, items: BoothItem[]) {
  const boothArea = booth.width * booth.depth;
  const footprintArea = items.reduce((total, item) => {
    const config = LIBRARY_ITEM_BY_TYPE[item.type];
    return total + config.width * config.depth;
  }, 0);

  return {
    boothArea,
    footprintArea,
    occupancy: boothArea ? Math.round((footprintArea / boothArea) * 100) : 0,
    seats: items.filter((item) => item.type === "chair").length,
    touchpoints: items.filter((item) => item.type === "screen" || item.type === "kiosk").length,
    signage: items.filter((item) => item.type === "banner").length,
  };
}
