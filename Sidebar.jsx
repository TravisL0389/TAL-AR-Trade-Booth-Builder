import { useMemo, useState } from "react";
import { ItemGlyph } from "./Item";

const CATEGORY_ICONS = {
  All: "⌘",
  Seating: "▱",
  Tables: "□",
  Surfaces: "▭",
  Storage: "▥",
  Media: "▻",
  Fixtures: "◉",
  Architecture: "⌂",
  Decor: "♧",
};

function formatFeet(value) {
  const feet = Math.floor(value);
  const inches = Math.round((value - feet) * 12);
  return inches > 0 ? `${feet}'${inches}"` : `${feet}'`;
}

export default function Sidebar({ library, spaceTypeLabel, collapsed, onToggleCollapsed, onAddItem }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const categories = useMemo(() => ["All", ...new Set(library.map((item) => item.category))], [library]);
  const effectiveFilter = categories.includes(activeFilter) ? activeFilter : "All";
  const filteredLibrary = useMemo(
    () =>
      library.filter((item) => {
        const matchesFilter = effectiveFilter === "All" || item.category === effectiveFilter;
        const matchesQuery = `${item.name} ${item.category} ${item.description}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [effectiveFilter, library, query]
  );

  return (
    <aside className={`component-dock ${collapsed ? "is-collapsed" : ""}`}>
      <header className="dock-header">
        <div>
          <h2>3D Component Library</h2>
          <span>{spaceTypeLabel} assets</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Open component library" : "Hide component library"}
          title={collapsed ? "Open component library" : "Hide component library"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </header>

      {collapsed ? null : (
        <div className="component-dock__content">
          <div className="component-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${spaceTypeLabel.toLowerCase()} assets...`} aria-label="Search 3D components" />
            <button type="button" onClick={() => setQuery("")} aria-label="Clear component search" disabled={!query}>×</button>
          </div>

          <nav className="component-filters" aria-label="Component categories">
            {categories.map((category) => (
              <button key={category} type="button" className={effectiveFilter === category ? "is-active" : ""} onClick={() => setActiveFilter(category)}>
                <span aria-hidden="true">{CATEGORY_ICONS[category] ?? "·"}</span>
                {category}
              </button>
            ))}
          </nav>

          <section className="component-grid" aria-label={`${spaceTypeLabel} 3D objects`}>
            {filteredLibrary.map((item) => (
              <button
                key={item.type}
                type="button"
                className="component-card"
                style={{ "--item-border": item.border, "--item-bg": item.bg, "--item-shadow": item.shadow }}
                onClick={() => onAddItem(item.type)}
                title={`Add ${item.name} to the center of the space`}
              >
                <span className="component-card__visual"><ItemGlyph type={item.type} color={item.border} size={58} /></span>
                <strong>{item.name}</strong>
                <small>{formatFeet(item.width)} W × {formatFeet(item.depth)} D</small>
                <span className="component-card__add" aria-hidden="true">+ Add</span>
              </button>
            ))}

            {filteredLibrary.length === 0 ? <div className="empty-library">No assets match this search and category.</div> : null}
          </section>

          <button type="button" className="drop-zone" onClick={() => filteredLibrary[0] && onAddItem(filteredLibrary[0].type)} disabled={filteredLibrary.length === 0}>
            <span aria-hidden="true">+</span>
            <strong>Quick add {filteredLibrary[0]?.name ?? "component"}</strong>
            <small>Every object remains draggable, rotatable, and AR-ready.</small>
          </button>
        </div>
      )}
    </aside>
  );
}
