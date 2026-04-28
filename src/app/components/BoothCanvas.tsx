import { useEffect, useRef, useState } from "react";
import { Monitor, PanelTop, Presentation, ScanSearch, SquareTerminal, Ticket } from "lucide-react";
import {
  CELL_SIZE,
  LIBRARY_ITEM_BY_TYPE,
  type BoothDefinition,
  type BoothItem,
  type BoothItemType,
  getFootprint,
} from "../lib/boothBuilder";

interface BoothCanvasProps {
  booth: BoothDefinition;
  items: BoothItem[];
  selectedId: number | null;
  showGrid: boolean;
  onMoveItem: (id: number, x: number, y: number) => void;
  onSelectItem: (id: number | null) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ItemGlyph({ type }: { type: BoothItemType }) {
  switch (type) {
    case "chair":
      return <Ticket className="h-5 w-5" />;
    case "table":
      return <Presentation className="h-5 w-5" />;
    case "counter":
      return <PanelTop className="h-5 w-5" />;
    case "screen":
      return <Monitor className="h-5 w-5" />;
    case "banner":
      return <ScanSearch className="h-5 w-5" />;
    case "kiosk":
      return <SquareTerminal className="h-5 w-5" />;
    default:
      return null;
  }
}

export function BoothCanvas({
  booth,
  items,
  selectedId,
  showGrid,
  onMoveItem,
  onSelectItem,
}: BoothCanvasProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    id: number;
    offsetX: number;
    offsetY: number;
    width: number;
    depth: number;
  } | null>(null);

  useEffect(() => {
    if (!dragState) {
      return undefined;
    }

    function onPointerMove(event: PointerEvent) {
      const rect = boardRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const x = Math.round((event.clientX - rect.left - dragState.offsetX) / CELL_SIZE);
      const y = Math.round((event.clientY - rect.top - dragState.offsetY) / CELL_SIZE);

      onMoveItem(
        dragState.id,
        clamp(x, 0, booth.width - dragState.width),
        clamp(y, 0, booth.depth - dragState.depth),
      );
    }

    function onPointerUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [booth.depth, booth.width, dragState, onMoveItem]);

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Spatial Canvas</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Place, rotate, and refine in real scale</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-medium text-white/55">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">Drag to move</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">R to rotate</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            {booth.width}ft x {booth.depth}ft
          </span>
        </div>
      </div>

      <div className="overflow-auto rounded-[28px] border border-white/8 bg-black/20 p-4">
        <div
          ref={boardRef}
          className="relative mx-auto overflow-hidden rounded-[26px] border border-white/10"
          style={{
            width: booth.width * CELL_SIZE,
            height: booth.depth * CELL_SIZE,
            background:
              booth.ambience === "day"
                ? "linear-gradient(180deg, rgba(148, 163, 184, 0.22), rgba(15, 23, 42, 0.95))"
                : "linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(5, 5, 11, 0.95))",
            backgroundImage: showGrid
              ? `linear-gradient(rgba(167,139,250,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.10) 1px, transparent 1px)`
              : "none",
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              onSelectItem(null);
            }
          }}
        >
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/45">
            0,0
          </div>
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/45">
            {booth.ambience === "day" ? "Day Scene" : "Night Scene"}
          </div>

          {items.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-white/50">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.03]">
                <SquareTerminal className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-white/75">Start placing booth components</p>
                <p className="mt-1 text-sm text-white/45">
                  The finished Boothbuilder interaction model is now active inside this canvas.
                </p>
              </div>
            </div>
          ) : null}

          {items.map((item) => {
            const config = LIBRARY_ITEM_BY_TYPE[item.type];
            const footprint = getFootprint(item);
            const isSelected = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className="absolute flex select-none flex-col items-center justify-center gap-2 rounded-[22px] border text-center transition duration-200"
                style={{
                  left: item.x * CELL_SIZE,
                  top: item.y * CELL_SIZE,
                  width: footprint.width * CELL_SIZE,
                  height: footprint.depth * CELL_SIZE,
                  borderColor: config.accent,
                  background: `linear-gradient(180deg, rgba(255,255,255,0.04), transparent), ${config.background}`,
                  color: config.text,
                  boxShadow: isSelected
                    ? `0 0 0 2px rgba(255,255,255,0.12), 0 20px 40px ${config.shadow}`
                    : `0 18px 35px ${config.shadow}`,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectItem(item.id);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSelectItem(item.id);
                  const rect = event.currentTarget.getBoundingClientRect();
                  setDragState({
                    id: item.id,
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                    width: footprint.width,
                    depth: footprint.depth,
                  });
                }}
              >
                <span className="absolute right-2 top-2 rounded-full bg-black/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/70">
                  {item.rotation}deg
                </span>
                <ItemGlyph type={item.type} />
                <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
