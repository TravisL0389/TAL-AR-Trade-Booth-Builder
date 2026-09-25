import { Suspense, lazy, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Canvas from "./Canvas";
import Inspector from "./Inspector";
import Sidebar from "./Sidebar";
import { ITEM_LIBRARY, ITEM_LIBRARY_BY_TYPE, getFootprint } from "./Item";
import {
  DEFAULT_SPACE,
  SPACE_TEMPLATES,
  SPACE_TYPE_IDS,
  SPACE_TYPES,
  getSpaceTypeLabel,
  getTemplatesForSpaceType,
} from "./ProjectCatalog";
import "./styles.css";

const BabylonRenderStackProbe = lazy(() => import("./RenderStackProbe"));
const R3FRenderStackProbe = lazy(() => import("./R3FRenderStackProbe"));
const ARPanel = lazy(() => import("./ARPanel"));

const STORAGE_KEY = "boothbuilder/project-v4-reference-exact";
const HASH_LAYOUT_KEY = "layout";
const HASH_MODE_KEY = "mode";

const DEFAULT_BRAND = {
  name: "TechWave",
  primaryColor: "#071f3e",
  secondaryColor: "#1fb8ff",
  logoDataUrl: "",
};

const NON_OCCUPYING_TYPES = new Set(["Rug"]);

const STUDIO_MODES = [
  { id: "design", label: "Design", icon: "⌘", view: null },
  { id: "walkthrough", label: "Walkthrough", icon: "◇", view: "iso" },
  { id: "plan", label: "Floor Plan", icon: "▣", view: "plan" },
  { id: "estimate", label: "Estimate", icon: "$", view: null },
];


function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function decodeBase64(value) {
  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sanitizeBooth(booth) {
  return {
    name: typeof booth?.name === "string" && booth.name.trim() ? booth.name.trim() : DEFAULT_SPACE.name,
    width: clamp(Number(booth?.width) || DEFAULT_SPACE.width, 6, 100),
    depth: clamp(Number(booth?.depth) || DEFAULT_SPACE.depth, 6, 100),
    spaceType: SPACE_TYPE_IDS.has(booth?.spaceType) ? booth.spaceType : DEFAULT_SPACE.spaceType,
    note: typeof booth?.note === "string" ? booth.note.slice(0, 280) : DEFAULT_SPACE.note,
  };
}

function sanitizeBrand(brand) {
  const isHexColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  const logoDataUrl = typeof brand?.logoDataUrl === "string" && /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,/i.test(brand.logoDataUrl)
    ? brand.logoDataUrl.slice(0, 2_800_000)
    : "";

  return {
    name: typeof brand?.name === "string" && brand.name.trim() ? brand.name.trim().slice(0, 44) : DEFAULT_BRAND.name,
    primaryColor: isHexColor(brand?.primaryColor) ? brand.primaryColor : DEFAULT_BRAND.primaryColor,
    secondaryColor: isHexColor(brand?.secondaryColor) ? brand.secondaryColor : DEFAULT_BRAND.secondaryColor,
    logoDataUrl,
  };
}

function sanitizeItem(rawItem, fallbackId) {
  const config = ITEM_LIBRARY_BY_TYPE[rawItem?.type];

  if (!config) {
    return null;
  }

  return {
    id: Number.isFinite(rawItem?.id) ? rawItem.id : fallbackId,
    type: config.type,
    label: typeof rawItem?.label === "string" && rawItem.label.trim() ? rawItem.label.trim() : config.name,
    x: Number.isFinite(rawItem?.x) ? rawItem.x : 0,
    y: Number.isFinite(rawItem?.y) ? rawItem.y : 0,
    rotation: Number.isFinite(rawItem?.rotation) ? ((rawItem.rotation % 360) + 360) % 360 : 0,
  };
}

function sanitizeProject(rawProject) {
  const booth = sanitizeBooth(rawProject?.booth);
  const items = Array.isArray(rawProject?.items)
    ? rawProject.items
        .map((item, index) => sanitizeItem(item, index + 1))
        .filter(Boolean)
    : [];

  return {
    version: 5,
    booth,
    brand: sanitizeBrand(rawProject?.brand),
    items: clampItemsToBooth(items, booth),
  };
}

function createDefaultProject() {
  return inflateTemplate(SPACE_TEMPLATES.find((template) => template.id === "techwave-20x30") ?? SPACE_TEMPLATES[0]);
}

function getNextId(items) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
}

function clampItemToBooth(item, booth) {
  const footprint = getFootprint(item);

  return {
    ...item,
    x: clamp(Math.round(item.x), 0, Math.max(0, booth.width - footprint.width)),
    y: clamp(Math.round(item.y), 0, Math.max(0, booth.depth - footprint.depth)),
  };
}

function clampItemsToBooth(items, booth) {
  return items.map((item) => clampItemToBooth(item, booth));
}

function inflateTemplate(template) {
  const booth = sanitizeBooth(template);
  const items = template.items.map((item, index) => sanitizeItem({ ...item, id: index + 1 }, index + 1));

  return sanitizeProject({
    booth,
    items,
  });
}

function serializeProject(booth, items, brand = DEFAULT_BRAND) {
  return {
    version: 5,
    booth,
    brand,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      label: item.label,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
    })),
  };
}

function readProjectFromHash() {
  if (!window.location.hash) {
    return null;
  }

  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const encodedLayout = hashParams.get(HASH_LAYOUT_KEY);

  if (!encodedLayout) {
    return null;
  }

  try {
    const project = sanitizeProject(JSON.parse(decodeBase64(encodedLayout)));
    return {
      project,
      openAr: hashParams.get(HASH_MODE_KEY) === "ar",
    };
  } catch {
    return null;
  }
}

function readProjectFromStorage() {
  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const project = sanitizeProject(JSON.parse(savedValue));
    return project.items.length > 0 ? project : null;
  } catch {
    return null;
  }
}

function buildShareUrl(project) {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams();
  hashParams.set(HASH_LAYOUT_KEY, encodeBase64(JSON.stringify(project)));
  hashParams.set(HASH_MODE_KEY, "ar");
  url.hash = hashParams.toString();
  return url.toString();
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function nudgeItem(item, direction, booth) {
  const deltaMap = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  const delta = deltaMap[direction];

  if (!delta) {
    return item;
  }

  return clampItemToBooth(
    {
      ...item,
      x: item.x + delta.x,
      y: item.y + delta.y,
    },
    booth
  );
}

export default function App() {
  const appRef = useRef(null);
  const nextIdRef = useRef(1);
  const hasHydratedRef = useRef(false);
  const shareTimerRef = useRef(null);
  const [booth, setBooth] = useState(DEFAULT_SPACE);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isArPanelOpen, setIsArPanelOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("design");
  const [activeView, setActiveView] = useState("iso");
  const [snapSize, setSnapSize] = useState(1);
  const [angleSnap, setAngleSnap] = useState(15);
  const [sceneZoom, setSceneZoom] = useState(70);
  const [shareStatus, setShareStatus] = useState("Share");
  const [uploadStatus, setUploadStatus] = useState("Upload");
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const renderStackDiagnosticsEnabled = useMemo(
    () => new URLSearchParams(window.location.search).get("renderStack") === "1",
    []
  );
  const [arSupport, setArSupport] = useState({
    checked: false,
    supported: false,
    cameraSupported: false,
    secureContext: false,
    reason: "Checking device support...",
  });

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  );

  const availableTemplates = useMemo(() => getTemplatesForSpaceType(booth.spaceType), [booth.spaceType]);
  const activeTemplateId = useMemo(
    () =>
      availableTemplates.find(
        (template) => template.name === booth.name && template.width === booth.width && template.depth === booth.depth
      )?.id ?? "custom",
    [availableTemplates, booth.depth, booth.name, booth.width]
  );

  const availableLibrary = useMemo(
    () => ITEM_LIBRARY.filter((item) => item.spaces.includes(booth.spaceType)),
    [booth.spaceType]
  );

  const metrics = useMemo(() => {
    const itemArea = items.reduce((total, item) => {
      const config = ITEM_LIBRARY_BY_TYPE[item.type];
      return NON_OCCUPYING_TYPES.has(item.type) ? total : total + config.width * config.depth;
    }, 0);
    const boothArea = booth.width * booth.depth;
    const seatedCount = items.filter((item) => ["Chair", "Stool", "OfficeChair", "DiningChair", "Sofa"].includes(item.type)).length;
    const totalWeightLbs = items.reduce((total, item) => {
      const config = ITEM_LIBRARY_BY_TYPE[item.type];
      return total + (config.weightLbs ?? 0);
    }, 0);
    const countByType = ITEM_LIBRARY.reduce((accumulator, config) => {
      accumulator[config.type] = items.filter((item) => item.type === config.type).length;
      return accumulator;
    }, {});

    return {
      boothArea,
      itemArea,
      occupancy: boothArea ? Math.min(100, Math.round((itemArea / boothArea) * 100)) : 0,
      seatedCount,
      totalWeightLbs,
      countByType,
    };
  }, [booth.depth, booth.width, items]);

  const shareUrl = useMemo(
    () => buildShareUrl(serializeProject(booth, items, { ...brand, logoDataUrl: "" })),
    [booth, brand, items]
  );

  useEffect(() => {
    const hashProject = readProjectFromHash();
    const initialProject = hashProject?.project ?? readProjectFromStorage() ?? createDefaultProject();

    startTransition(() => {
      setBooth(initialProject.booth);
      setBrand(initialProject.brand ?? DEFAULT_BRAND);
      setItems(initialProject.items);
      setSelectedId(initialProject.items.find((item) => item.type === "Counter")?.id ?? initialProject.items[0]?.id ?? null);
      setIsArPanelOpen(Boolean(hashProject?.openAr));
      nextIdRef.current = getNextId(initialProject.items);
      hasHydratedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    const persistedProject = serializeProject(booth, items, brand);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedProject));
    } catch {
      // Storage can be unavailable in private or quota-limited browser sessions.
    }
  }, [booth, brand, items]);

  const updateBrand = useCallback((updates) => {
    setBrand((currentBrand) => sanitizeBrand({ ...currentBrand, ...updates }));
  }, []);

  const uploadLogo = useCallback((file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadStatus("Image only");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus("Max 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateBrand({ logoDataUrl: typeof reader.result === "string" ? reader.result : "" });
      setUploadStatus("Uploaded");
    };
    reader.onerror = () => setUploadStatus("Upload failed");
    reader.readAsDataURL(file);
  }, [updateBrand]);

  useEffect(() => {
    let isCancelled = false;

    async function checkArSupport() {
      const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);
      const secureContext = window.isSecureContext;

      if (!navigator.xr?.isSessionSupported) {
        if (!isCancelled) {
          setArSupport({
            checked: true,
            supported: false,
            cameraSupported,
            secureContext,
            reason: secureContext
              ? "WebXR AR is not available on this device. Camera preview fallback is ready."
              : "This browser is not in a secure context. Use HTTPS or localhost for AR + camera access.",
          });
        }
        return;
      }

      try {
        const supported = secureContext && (await navigator.xr.isSessionSupported("immersive-ar"));

        if (!isCancelled) {
          setArSupport({
            checked: true,
            supported,
            cameraSupported,
            secureContext,
            reason: supported
              ? "Immersive AR is available. Use the live launcher on a compatible mobile device."
              : secureContext
                ? "Live WebXR AR is unavailable here, but you can still use the camera preview and share handoff."
                : "Use HTTPS or localhost to enable live AR and device camera access.",
          });
        }
      } catch {
        if (!isCancelled) {
          setArSupport({
            checked: true,
            supported: false,
            cameraSupported,
            secureContext,
            reason: "AR support check failed. Camera preview fallback is still available.",
          });
        }
      }
    }

    checkArSupport();

    return () => {
      isCancelled = true;
    };
  }, []);

  const addItem = useCallback(
    (type) => {
      const config = ITEM_LIBRARY_BY_TYPE[type];

      if (!config) {
        return;
      }

      setItems((previousItems) => {
        const offset = previousItems.length % 6;
        const newItem = clampItemToBooth(
          {
            id: nextIdRef.current,
            type: config.type,
            label: config.name,
            x: Math.round(booth.width / 2 - config.width / 2) + (offset % 3) * 2,
            y: Math.round(booth.depth / 2 - config.depth / 2) + Math.floor(offset / 3) * 2,
            rotation: 0,
          },
          booth
        );

        nextIdRef.current += 1;
        setSelectedId(newItem.id);
        return [...previousItems, newItem];
      });
    },
    [booth]
  );

  const updateBooth = useCallback(
    (field, value) => {
      const nextBooth = sanitizeBooth({ ...booth, [field]: value });
      setBooth(nextBooth);
      setItems((previousItems) => clampItemsToBooth(previousItems, nextBooth));
    },
    [booth]
  );

  const updateSelectedItem = useCallback(
    (updates) => {
      if (!selectedId) {
        return;
      }

      setItems((previousItems) =>
        previousItems.map((item) =>
          item.id === selectedId ? clampItemToBooth({ ...item, ...updates }, booth) : item
        )
      );
    },
    [booth, selectedId]
  );

  const moveItem = useCallback(
    (id, x, y) => {
      setItems((previousItems) =>
        previousItems.map((item) =>
          item.id === id ? clampItemToBooth({ ...item, x, y }, booth) : item
        )
      );
    },
    [booth]
  );

  const rotateItem = useCallback(
    (id, delta) => {
      setItems((previousItems) =>
        previousItems.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const rotatedItem = {
            ...item,
            rotation: ((item.rotation + delta) % 360 + 360) % 360,
          };

          return clampItemToBooth(rotatedItem, booth);
        })
      );
    },
    [booth]
  );

  useEffect(() => {
    if (!selectedId) {
      return undefined;
    }

    function handleKeyDown(event) {
      const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);

      if (isTyping) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        setItems((previousItems) => previousItems.filter((item) => item.id !== selectedId));
        setSelectedId(null);
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        rotateItem(selectedId, 90);
        return;
      }

      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        setItems((previousItems) =>
          previousItems.map((item) =>
            item.id === selectedId ? nudgeItem(item, event.key, booth) : item
          )
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [booth, rotateItem, selectedId]);

  const duplicateSelectedItem = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    const duplicatedItem = clampItemToBooth(
      {
        ...selectedItem,
        id: nextIdRef.current,
        x: selectedItem.x + 1,
        y: selectedItem.y + 1,
        label: `${selectedItem.label} Copy`,
      },
      booth
    );

    nextIdRef.current += 1;

    setItems((previousItems) => [...previousItems, duplicatedItem]);
    setSelectedId(duplicatedItem.id);
  }, [booth, selectedItem]);

  const deleteSelectedItem = useCallback(() => {
    if (!selectedId) {
      return;
    }

    setItems((previousItems) => previousItems.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const clearAllItems = useCallback(() => {
    setItems([]);
    setSelectedId(null);
  }, []);

  const applyTemplate = useCallback((templateId) => {
    const template = SPACE_TEMPLATES.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    const nextProject = inflateTemplate(template);

    startTransition(() => {
      setBooth(nextProject.booth);
      setItems(nextProject.items);
      setSelectedId(nextProject.items.find((item) => item.type === "Counter")?.id ?? nextProject.items[0]?.id ?? null);
      nextIdRef.current = getNextId(nextProject.items);
      setActiveMode("design");
    });
  }, []);

  const changeSpaceType = useCallback((spaceType) => {
    updateBooth("spaceType", spaceType);
    setActiveMode("design");
  }, [updateBooth]);

  const changeMode = useCallback((mode) => {
    const modeConfig = STUDIO_MODES.find((entry) => entry.id === mode);
    if (!modeConfig) {
      return;
    }

    setActiveMode(mode);
    if (modeConfig.view) {
      setActiveView(modeConfig.view);
    }
  }, []);

  const shareProject = useCallback(async () => {
    const copied = await copyToClipboard(shareUrl);
    setShareStatus(copied ? "Copied" : "Copy failed");
    window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(() => setShareStatus("Share"), 1800);
  }, [shareUrl]);

  useEffect(() => () => window.clearTimeout(shareTimerRef.current), []);

  const exportQuote = useCallback(() => {
    const spaceTypeLabel = getSpaceTypeLabel(booth.spaceType);
    const lines = [
      "Spatial Studio 2026 - Project Plan Summary",
      `Project: ${booth.name}`,
      `Space type: ${spaceTypeLabel}`,
      `Client / style: ${brand.name}`,
      `Footprint: ${booth.width}' x ${booth.depth}' (${metrics.boothArea} sq ft)`,
      `Floor area used: ${metrics.occupancy}%`,
      `Estimated load: ${metrics.totalWeightLbs} lbs`,
      "",
      "Components:",
      ...items.map((item) => {
        const config = ITEM_LIBRARY_BY_TYPE[item.type];
        const footprint = getFootprint(item);
        return `- ${item.label}: ${config.name}, ${footprint.width}' x ${footprint.depth}', ${config.weightLbs} lbs est.`;
      }),
      "",
      `Client review link: ${shareUrl}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${booth.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-spatial-plan.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [booth, brand.name, items, metrics, shareUrl]);

  const toggleFullscreen = useCallback(() => {
    const element = appRef.current;

    if (!element) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    element.requestFullscreen?.().catch(() => {});
  }, []);

  const headerStatus = arSupport.supported
    ? "WebXR AR ready"
    : arSupport.cameraSupported
      ? "Camera preview ready"
      : "Desktop planning mode";
  const savedStatus = "Autosave active";

  return (
    <div className={`studio-shell ${activeMode !== "design" ? "has-mode-panel" : ""}`} ref={appRef}>
      <header className="studio-topbar">
        <div className="studio-brand">
          <div className="studio-logo" aria-hidden="true"><span /></div>
          <strong>Spatial Studio</strong>
          <span>2026</span>
        </div>

        <nav className="studio-mode-tabs" aria-label="Studio mode">
          {STUDIO_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={activeMode === mode.id ? "is-active" : ""}
              onClick={() => changeMode(mode.id)}
            >
              <span aria-hidden="true">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </nav>

        <div className="studio-actions">
          <button type="button" className="outline-action" onClick={() => setIsArPanelOpen(true)}>
            AR Preview
          </button>
          <button type="button" className="outline-action" onClick={shareProject}>
            {shareStatus}
          </button>
          <details className="top-popover">
            <summary className="icon-action" aria-label="Project status">⌁</summary>
            <div className="top-popover__panel">
              <strong>Project status</strong>
              <span>{savedStatus}</span>
              <span>{headerStatus}</span>
              <span>{items.length} placed objects</span>
            </div>
          </details>
          <details className="top-popover top-popover--profile">
            <summary className="profile-action" aria-label="Workspace profile">DM⌄</summary>
            <div className="top-popover__panel">
              <strong>Local workspace</strong>
              <span>Projects autosave in this browser.</span>
              <button type="button" onClick={exportQuote}>Export backup</button>
            </div>
          </details>
        </div>
      </header>

      <section className="studio-projectbar" aria-label="Project settings">
        <label className="project-field">
          <span>Project</span>
          <input value={booth.name} onChange={(event) => updateBooth("name", event.target.value)} aria-label="Project name" />
        </label>
        <label>
          <span>Space Type</span>
          <select value={booth.spaceType} onChange={(event) => changeSpaceType(event.target.value)} aria-label="Space type">
            {SPACE_TYPES.map((spaceType) => <option key={spaceType.id} value={spaceType.id}>{spaceType.label}</option>)}
          </select>
        </label>
        <label>
          <span>Starting Layout</span>
          <select value={activeTemplateId} onChange={(event) => event.target.value !== "custom" && applyTemplate(event.target.value)} aria-label="Starting layout">
            <option value="custom">Custom {booth.width}' × {booth.depth}'</option>
            {availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
        </label>

        <details className="project-popover">
          <summary>Size <b>{booth.width}' × {booth.depth}'</b></summary>
          <div className="project-popover__panel dimension-editor">
            <label><span>Width (ft)</span><input type="number" min="6" max="100" value={booth.width} onChange={(event) => updateBooth("width", event.target.value)} /></label>
            <label><span>Depth (ft)</span><input type="number" min="6" max="100" value={booth.depth} onChange={(event) => updateBooth("depth", event.target.value)} /></label>
            <p>Layouts support footprints up to 100 × 100 feet.</p>
          </div>
        </details>

        <details className="project-popover">
          <summary>Style <b>{brand.logoDataUrl ? "Branded" : "Palette"}</b></summary>
          <div className="project-popover__panel brand-controls" aria-label="Client style and brand controls">
            <label className="brand-name-field"><span>Client / style name</span><input value={brand.name} onChange={(event) => updateBrand({ name: event.target.value })} /></label>
            <label><span>Primary</span><input type="color" value={brand.primaryColor} onChange={(event) => updateBrand({ primaryColor: event.target.value })} aria-label="Primary brand color" /></label>
            <label><span>Accent</span><input type="color" value={brand.secondaryColor} onChange={(event) => updateBrand({ secondaryColor: event.target.value })} aria-label="Accent brand color" /></label>
            <label className="logo-upload">
              <span>Logo or artwork</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => uploadLogo(event.target.files?.[0])} aria-label="Upload logo or artwork" />
              <b>{uploadStatus}</b>
            </label>
          </div>
        </details>

        <div className="autosave-status"><span aria-hidden="true">●</span> {savedStatus}</div>
        <div className="project-tool-actions" aria-label="Selected object quick tools">
          <button type="button" className="ghost-icon clear-layout-action" onClick={clearAllItems} disabled={items.length === 0} aria-label="Clear all objects" title="Clear all objects">⌫</button>
          <button type="button" className="ghost-icon" onClick={() => selectedId && rotateItem(selectedId, -angleSnap)} disabled={!selectedId} aria-label="Rotate selected object left">↶</button>
          <button type="button" className="ghost-icon" onClick={() => selectedId && rotateItem(selectedId, angleSnap)} disabled={!selectedId} aria-label="Rotate selected object right">↷</button>
        </div>
      </section>

      {activeMode !== "design" ? (
        <section className="studio-mode-panel" aria-live="polite">
          {activeMode === "walkthrough" ? <><div><strong>Interactive walkthrough</strong><span>Drag to orbit, scroll to zoom, and select any object to reposition it.</span></div><button type="button" onClick={() => setActiveView("iso")}>Reset camera</button><button type="button" onClick={() => setIsArPanelOpen(true)}>Open in AR</button></> : null}
          {activeMode === "plan" ? <><div><strong>Floor plan view</strong><span>Use the top-down view and optional one-foot grid to check real-world spacing.</span></div><button type="button" onClick={() => setShowGrid((current) => !current)}>Grid {showGrid ? "on" : "off"}</button><button type="button" onClick={() => setActiveMode("design")}>Return to design</button></> : null}
          {activeMode === "estimate" ? <><div><strong>Project estimate</strong><span>{metrics.boothArea} sq ft · {items.length} objects · {metrics.totalWeightLbs.toLocaleString()} lbs estimated load</span></div><button type="button" onClick={exportQuote}>Export plan summary</button><button type="button" onClick={shareProject}>Share with client</button></> : null}
        </section>
      ) : null}

      <main className={`studio-workspace ${isLibraryCollapsed ? "is-library-collapsed" : ""}`}>
        <Sidebar
          library={availableLibrary}
          spaceTypeLabel={getSpaceTypeLabel(booth.spaceType)}
          collapsed={isLibraryCollapsed}
          onToggleCollapsed={() => setIsLibraryCollapsed((current) => !current)}
          onAddItem={addItem}
        />

        <Canvas
          booth={booth}
          items={items}
          metrics={metrics}
          selectedId={selectedId}
          activeView={activeView}
          snapSize={snapSize}
          zoom={sceneZoom}
          brand={brand}
          showGrid={showGrid}
          spaceTypeLabel={getSpaceTypeLabel(booth.spaceType)}
          onMoveItem={moveItem}
          onSelectItem={setSelectedId}
        />

        <Inspector
          booth={booth}
          metrics={metrics}
          selectedItem={selectedItem}
          spaceTypeLabel={getSpaceTypeLabel(booth.spaceType)}
          onClearSelected={() => setSelectedId(null)}
          onAddItem={addItem}
          onUpdateSelectedItem={updateSelectedItem}
          onRotateSelectedLeft={() => selectedId && rotateItem(selectedId, -angleSnap)}
          onRotateSelectedRight={() => selectedId && rotateItem(selectedId, angleSnap)}
          onDuplicateSelected={duplicateSelectedItem}
          onDeleteSelected={deleteSelectedItem}
          onOpenAr={() => setIsArPanelOpen(true)}
          onCopyShare={shareProject}
        />
      </main>

      <footer className="studio-bottombar">
        <button type="button" onClick={() => setSnapSize((current) => (current === 1 ? 0.5 : 1))}><span>Move Snap</span>{snapSize} ft</button>
        <button type="button" onClick={() => setAngleSnap((current) => (current === 15 ? 45 : 15))}><span>Rotate Snap</span>{angleSnap}°</button>
        <button type="button" className={showGrid ? "is-active" : ""} onClick={() => setShowGrid((current) => !current)}><span>Floor Grid</span>{showGrid ? "On" : "Off"}</button>
        <div className="view-tool-group" aria-label="Camera views">
          {[
            ["plan", "Top", "▦"],
            ["iso", "ISO", "◇"],
            ["front", "Front", "▱"],
            ["side", "Side", "⇥"],
          ].map(([tool, label, icon]) => (
            <button key={tool} type="button" className={activeView === tool ? "is-active" : ""} onClick={() => setActiveView(tool)} aria-label={`${label} camera view`} title={`${label} view`}><span>{label}</span>{icon}</button>
          ))}
        </div>
        <label className="zoom-control"><span>Zoom</span><input type="range" min="55" max="100" value={sceneZoom} onChange={(event) => setSceneZoom(Number(event.target.value))} aria-label="Canvas zoom" /><span>{sceneZoom}%</span></label>
        <button type="button" className="fullscreen-action" onClick={toggleFullscreen} aria-label="Toggle fullscreen">⤢</button>
        <button type="button" className="export-action" onClick={exportQuote}>Export Plan ›</button>
      </footer>

      {isArPanelOpen ? (
        <Suspense
          fallback={(
            <div className="modal-backdrop">
              <div className="ar-loading-panel" role="status">Preparing AR preview...</div>
            </div>
          )}
        >
          <ARPanel
            open
            booth={booth}
            items={items}
            brand={brand}
            shareUrl={shareUrl}
            arSupport={arSupport}
            onClose={() => setIsArPanelOpen(false)}
          />
        </Suspense>
      ) : null}
      {renderStackDiagnosticsEnabled ? (
        <Suspense fallback={null}>
          <BabylonRenderStackProbe booth={booth} items={items} brand={brand} />
          <R3FRenderStackProbe brand={brand} />
        </Suspense>
      ) : null}
    </div>
  );
}
