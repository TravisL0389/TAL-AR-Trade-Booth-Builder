import { Suspense, lazy } from "react";

const ThreeBoothScene = lazy(() => import("./ThreeBoothScene"));

export default function Canvas({
  booth,
  items,
  metrics,
  selectedId,
  activeView,
  snapSize,
  zoom,
  brand,
  showGrid,
  spaceTypeLabel,
  onMoveItem,
  onSelectItem,
}) {
  const boothArea = booth.width * booth.depth;
  const widthMarks = Array.from({ length: Math.floor(booth.depth / 5) + 1 }, (_, index) => index * 5).filter(
    (mark) => mark <= booth.depth
  );
  const depthMarks = Array.from({ length: Math.floor(booth.width / 5) + 1 }, (_, index) => index * 5).filter(
    (mark) => mark <= booth.width
  );

  return (
    <section className={`canvas-shell canvas-shell--${activeView}`}>
      <div className="canvas-ruler canvas-ruler--top" aria-hidden="true">
        {widthMarks.map((mark) => <span key={mark} style={{ left: `${(mark / booth.depth) * 100}%` }}>{mark}'</span>)}
      </div>
      <div className="canvas-ruler canvas-ruler--left" aria-hidden="true">
        {depthMarks.map((mark) => <span key={mark} style={{ top: `${(mark / booth.width) * 100}%` }}>{mark}'</span>)}
      </div>

      <div className="canvas-scroll">
        <div className="canvas-floating-meta">
          <div>
            <strong>{booth.width}' x {booth.depth}'</strong>
            <span>{spaceTypeLabel} · Grid {showGrid ? "1 ft" : "off"}</span>
          </div>
          <div>
            <strong>{items.length}</strong>
            <span>3D Objects</span>
          </div>
        </div>

        <div className="occupancy-card">
          <span>Floor Area Used</span>
          <strong>{metrics.occupancy}%</strong>
          <em>{items.length} objects</em>
        </div>

        <div className="dimension-callout dimension-callout--right">{booth.depth}'</div>
        <div className="dimension-callout dimension-callout--bottom">{booth.width}'</div>

        <Suspense fallback={<div className="three-scene-loading" role="status">Loading interactive 3D space...</div>}>
          <ThreeBoothScene
            booth={booth}
            items={items}
            brand={brand}
            selectedId={selectedId}
            activeView={activeView}
            snapSize={snapSize}
            zoom={zoom}
            showGrid={showGrid}
            onMoveItem={onMoveItem}
            onSelectItem={onSelectItem}
          />
        </Suspense>

        <div className="three-scene-caption">
          <strong>{brand.name}</strong>
          <span>{boothArea} sq ft immersive 3D {spaceTypeLabel.toLowerCase()} preview</span>
        </div>
      </div>
    </section>
  );
}
