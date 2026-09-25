import { ITEM_LIBRARY_BY_TYPE, ItemGlyph, getFootprint } from "./Item";

export default function Inspector({
  booth,
  metrics,
  selectedItem,
  spaceTypeLabel,
  onClearSelected,
  onAddItem,
  onUpdateSelectedItem,
  onRotateSelectedLeft,
  onRotateSelectedRight,
  onDuplicateSelected,
  onDeleteSelected,
  onOpenAr,
  onCopyShare,
}) {
  const selectedConfig = selectedItem ? ITEM_LIBRARY_BY_TYPE[selectedItem.type] : null;
  const footprint = selectedItem ? getFootprint(selectedItem) : null;
  const selectedArea = footprint ? footprint.width * footprint.depth : 0;
  const heightInches = selectedConfig ? Math.round(selectedConfig.heightMeters * 39.3701) : 0;
  const heightLabel = `${Math.floor(heightInches / 12)}' ${heightInches % 12}"`;

  return (
    <aside className="inspector-dock">
      <section className="inspector-section selected-preview">
        <header className="inspector-title-row">
          <h2>Selected: {selectedItem ? selectedItem.label : "Nothing selected"}</h2>
          <button type="button" onClick={onClearSelected} aria-label="Clear selected item" disabled={!selectedItem}>×</button>
        </header>

        <div className="preview-window">
          {selectedConfig ? (
            <ItemGlyph type={selectedConfig.type} color={selectedConfig.border} size={126} />
          ) : (
            <span>Select a component on the canvas</span>
          )}
        </div>

        {selectedItem && selectedConfig ? (
          <>
            <div className="mini-actions">
              <button type="button" onClick={onDuplicateSelected} aria-label="Duplicate selected item">⧉</button>
              <button type="button" onClick={onDeleteSelected} aria-label="Delete selected item">⌫</button>
            </div>

            <label className="inspector-field">
              <span>Name</span>
              <input
                value={selectedItem.label}
                onChange={(event) => onUpdateSelectedItem({ label: event.target.value })}
              />
            </label>

            <div className="size-row">
              <label>
                <span>W</span>
                <input type="text" readOnly value={`${footprint?.width ?? 0}' 0"`} />
              </label>
              <label>
                <span>D</span>
                <input type="text" readOnly value={`${footprint?.depth ?? 0}' 0"`} />
              </label>
              <label>
                <span>H</span>
                <input type="text" readOnly value={heightLabel} />
              </label>
            </div>

            <label className="inspector-field">
              <span>Rotation</span>
              <div className="rotation-control">
                <button type="button" onClick={onRotateSelectedLeft} aria-label="Rotate selected object left">−</button>
                <input readOnly value={`${selectedItem.rotation}°`} />
                <button type="button" onClick={onRotateSelectedRight} aria-label="Rotate selected object right">+</button>
              </div>
            </label>
          </>
        ) : null}
      </section>

      <section className="inspector-section">
        <h3>Area & Metrics</h3>
        <dl className="metric-list">
          <div>
            <dt>Area used</dt>
            <dd>{selectedArea.toFixed(1)} sq ft</dd>
          </div>
          <div>
            <dt>Recommended clearance</dt>
            <dd className="good">3' Clear</dd>
          </div>
          <div>
            <dt>Floor area used</dt>
            <dd>{metrics.occupancy}%</dd>
          </div>
          <div>
            <dt>Weight (est.)</dt>
            <dd>{selectedConfig?.weightLbs ?? 0} lbs</dd>
          </div>
          <div>
            <dt>Placed objects</dt>
            <dd>{metrics.countByType[selectedItem?.type] ?? 0} of this type</dd>
          </div>
          <div>
            <dt>{spaceTypeLabel} footprint</dt>
            <dd>{booth.width}' × {booth.depth}'</dd>
          </div>
        </dl>
      </section>

      <section className="inspector-section">
        <h3>Actions</h3>
        <div className="stack-actions">
          <button type="button" onClick={onDuplicateSelected} disabled={!selectedItem}>Duplicate</button>
          <button type="button" onClick={() => selectedItem && onAddItem(selectedItem.type)} disabled={!selectedItem}>Add Another</button>
          <button type="button" className="danger-line" onClick={onDeleteSelected} disabled={!selectedItem}>Delete</button>
        </div>
      </section>

      <section className="inspector-section mobile-handoff">
        <h3>AR & Mobile Handoff</h3>
        <p>Review this complete {spaceTypeLabel.toLowerCase()} layout in AR or send it to a mobile device.</p>
        <div className="handoff-actions">
          <button type="button" onClick={onOpenAr}>AR Preview</button>
          <button type="button" onClick={onCopyShare}>Send to Mobile</button>
        </div>
      </section>
    </aside>
  );
}
