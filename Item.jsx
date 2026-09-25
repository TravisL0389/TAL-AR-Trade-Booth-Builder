const ALL_SPACES = ["trade-show", "office", "bedroom", "bathroom", "living", "kitchen", "dining", "home"];

const CATEGORY_STYLES = {
  Seating: ["#36d7ff", "#baf2ff", "rgba(54, 215, 255, 0.1)", "rgba(54, 215, 255, 0.22)"],
  Tables: ["#f8bf4c", "#ffe7a9", "rgba(248, 191, 76, 0.1)", "rgba(248, 191, 76, 0.22)"],
  Surfaces: ["#7df0b5", "#d9ffe9", "rgba(125, 240, 181, 0.1)", "rgba(125, 240, 181, 0.22)"],
  Storage: ["#a8b9ff", "#e5eaff", "rgba(168, 185, 255, 0.1)", "rgba(168, 185, 255, 0.2)"],
  Media: ["#4aa8ff", "#d7ecff", "rgba(74, 168, 255, 0.1)", "rgba(74, 168, 255, 0.22)"],
  Fixtures: ["#72e6d1", "#d9fff8", "rgba(114, 230, 209, 0.1)", "rgba(114, 230, 209, 0.2)"],
  Architecture: ["#ff9f6e", "#ffe3d4", "rgba(255, 159, 110, 0.1)", "rgba(255, 159, 110, 0.2)"],
  Decor: ["#76f08e", "#d8ffdf", "rgba(118, 240, 142, 0.1)", "rgba(118, 240, 142, 0.18)"],
};

function defineItem({ spaces = ALL_SPACES, ...item }) {
  const [border, text, bg, shadow] = CATEGORY_STYLES[item.category];
  return { ...item, spaces, border, text, bg, shadow };
}

export const ITEM_LIBRARY = [
  defineItem({ type: "Chair", name: "Lounge Chair", width: 2.5, depth: 2.5, heightMeters: 1, category: "Seating", weightLbs: 38, description: "Comfortable accent seating for booths, offices, bedrooms, and living spaces." }),
  defineItem({ type: "Stool", name: "Bar Stool", width: 1.33, depth: 1.33, heightMeters: 1.1, category: "Seating", weightLbs: 24, spaces: ["trade-show", "kitchen", "home"], description: "Compact counter-height seating for demos, islands, and hospitality zones." }),
  defineItem({ type: "OfficeChair", name: "Task Chair", width: 2.25, depth: 2.25, heightMeters: 1.15, category: "Seating", weightLbs: 35, spaces: ["office", "home"], description: "Ergonomic rolling chair with a clear working footprint." }),
  defineItem({ type: "DiningChair", name: "Dining Chair", width: 1.75, depth: 2, heightMeters: 0.95, category: "Seating", weightLbs: 22, spaces: ["dining", "kitchen", "home"], description: "Upright dining chair sized for realistic pullback and circulation." }),
  defineItem({ type: "Sofa", name: "Three Seat Sofa", width: 7, depth: 3, heightMeters: 0.95, category: "Seating", weightLbs: 185, spaces: ["office", "bedroom", "living", "home"], description: "Full-size sofa for lounge, reception, and residential conversation zones." }),
  defineItem({ type: "Table", name: "Demo Table", width: 3, depth: 2, heightMeters: 1.05, category: "Tables", weightLbs: 86, spaces: ["trade-show", "office"], description: "Shared demo surface for prototypes, presentations, or quick consults." }),
  defineItem({ type: "RoundTable", name: "Round Table", width: 3, depth: 3, heightMeters: 0.95, category: "Tables", weightLbs: 74, spaces: ["trade-show", "office", "living"], description: "Circular conversation table for meetings or hospitality areas." }),
  defineItem({ type: "Desk", name: "Work Desk", width: 6, depth: 3, heightMeters: 0.78, category: "Tables", weightLbs: 140, spaces: ["office", "bedroom", "home"], description: "Professional work surface with integrated storage and monitor." }),
  defineItem({ type: "CoffeeTable", name: "Coffee Table", width: 4, depth: 2, heightMeters: 0.45, category: "Tables", weightLbs: 58, spaces: ["office", "bedroom", "living", "home"], description: "Low-profile table for lounge and residential seating groups." }),
  defineItem({ type: "DiningTable", name: "Dining Table", width: 7, depth: 3.5, heightMeters: 0.78, category: "Tables", weightLbs: 165, spaces: ["office", "dining", "kitchen", "home"], description: "Six-to-eight-seat table with a true chair and circulation footprint." }),
  defineItem({ type: "Nightstand", name: "Nightstand", width: 2, depth: 2, heightMeters: 0.65, category: "Tables", weightLbs: 46, spaces: ["bedroom", "home"], description: "Compact bedside surface with drawer storage." }),
  defineItem({ type: "Counter", name: "Reception Counter", width: 6, depth: 2, heightMeters: 1.07, category: "Surfaces", weightLbs: 120, spaces: ["trade-show", "office"], description: "Branded check-in, lead capture, or reception surface." }),
  defineItem({ type: "KitchenIsland", name: "Kitchen Island", width: 7, depth: 3, heightMeters: 0.95, category: "Surfaces", weightLbs: 420, spaces: ["kitchen", "home"], description: "Full-depth preparation island with a finished worktop and storage base." }),
  defineItem({ type: "Vanity", name: "Bathroom Vanity", width: 6, depth: 2, heightMeters: 0.9, category: "Surfaces", weightLbs: 210, spaces: ["bathroom", "home"], description: "Double vanity with countertop, basins, storage, and mirror." }),
  defineItem({ type: "Bookcase", name: "Bookcase", width: 4, depth: 1.25, heightMeters: 2.1, category: "Storage", weightLbs: 125, spaces: ["office", "bedroom", "living", "home"], description: "Tall open shelving for books, samples, and display objects." }),
  defineItem({ type: "Dresser", name: "Low Dresser", width: 6, depth: 2, heightMeters: 0.9, category: "Storage", weightLbs: 170, spaces: ["bedroom", "home"], description: "Wide drawer storage with a usable top surface." }),
  defineItem({ type: "Wardrobe", name: "Wardrobe", width: 5, depth: 2, heightMeters: 2.15, category: "Storage", weightLbs: 260, spaces: ["bedroom", "home"], description: "Full-height enclosed clothing storage." }),
  defineItem({ type: "Cabinet", name: "Tall Cabinet", width: 3, depth: 2, heightMeters: 2.05, category: "Storage", weightLbs: 190, spaces: ["office", "bedroom", "bathroom", "kitchen", "dining", "home"], description: "Flexible enclosed storage for office, bath, kitchen, or residential use." }),
  defineItem({ type: "Sideboard", name: "Sideboard", width: 6, depth: 1.75, heightMeters: 0.85, category: "Storage", weightLbs: 145, spaces: ["office", "living", "dining", "home"], description: "Low serving or media storage with a finished top." }),
  defineItem({ type: "Screen", name: "Display Wall 10FT", width: 10, depth: 1, heightMeters: 2.4, category: "Media", weightLbs: 210, spaces: ["trade-show", "office", "living", "home"], description: "Large branded display for presentations, media, and event storytelling." }),
  defineItem({ type: "Kiosk", name: "Kiosk Podium", width: 2, depth: 2, heightMeters: 1.35, category: "Media", weightLbs: 95, spaces: ["trade-show", "office"], description: "Interactive touchscreen podium for check-in, demos, or wayfinding." }),
  defineItem({ type: "Toilet", name: "Toilet", width: 2.5, depth: 3.5, heightMeters: 0.82, category: "Fixtures", weightLbs: 105, spaces: ["bathroom", "home"], description: "Standard floor-mounted toilet footprint." }),
  defineItem({ type: "Shower", name: "Glass Shower", width: 4, depth: 4, heightMeters: 2.15, category: "Fixtures", weightLbs: 360, spaces: ["bathroom", "home"], description: "Walk-in glass shower enclosure with floor and fixture wall." }),
  defineItem({ type: "Bathtub", name: "Soaking Tub", width: 6, depth: 3, heightMeters: 0.65, category: "Fixtures", weightLbs: 320, spaces: ["bathroom", "home"], description: "Freestanding soaking tub with a complete clearance footprint." }),
  defineItem({ type: "Refrigerator", name: "Refrigerator", width: 3, depth: 3, heightMeters: 2.05, category: "Fixtures", weightLbs: 285, spaces: ["kitchen", "home"], description: "Full-height refrigerator with realistic cabinet depth." }),
  defineItem({ type: "Range", name: "Range", width: 3, depth: 2.5, heightMeters: 0.95, category: "Fixtures", weightLbs: 205, spaces: ["kitchen", "home"], description: "Cooking range with oven, burners, and control panel." }),
  defineItem({ type: "Sink", name: "Sink Base", width: 4, depth: 2, heightMeters: 0.95, category: "Fixtures", weightLbs: 180, spaces: ["kitchen", "home"], description: "Sink base cabinet with basin and faucet." }),
  defineItem({ type: "Bed", name: "Queen Bed", width: 6.5, depth: 7, heightMeters: 1.1, category: "Fixtures", weightLbs: 240, spaces: ["bedroom", "home"], description: "Queen bed with frame, mattress, headboard, and pillows." }),
  defineItem({ type: "Wall", name: "Partition Wall", width: 8, depth: 0.5, heightMeters: 2.5, category: "Architecture", weightLbs: 280, spaces: ["office", "bedroom", "bathroom", "living", "kitchen", "dining", "home"], description: "Movable planning partition for zoning rooms and circulation." }),
  defineItem({ type: "Door", name: "Door Opening", width: 3, depth: 0.5, heightMeters: 2.1, category: "Architecture", weightLbs: 85, spaces: ["office", "bedroom", "bathroom", "living", "kitchen", "dining", "home"], description: "Standard door and frame for testing access and movement." }),
  defineItem({ type: "Banner", name: "LED Banner 6FT", width: 6, depth: 1, heightMeters: 2.1, category: "Decor", weightLbs: 28, spaces: ["trade-show", "office"], description: "Vertical branded marker for aisles, sponsor callouts, or wayfinding." }),
  defineItem({ type: "Plant", name: "Floor Planter", width: 1, depth: 1, heightMeters: 1.25, category: "Decor", weightLbs: 42, description: "Soft spatial marker for corners, hospitality, and residential rooms." }),
  defineItem({ type: "Rug", name: "Area Rug", width: 8, depth: 10, heightMeters: 0.02, category: "Decor", weightLbs: 38, spaces: ["office", "bedroom", "living", "dining", "home"], description: "Full-size soft flooring zone for testing furniture grouping and scale." }),
];

export const ITEM_LIBRARY_BY_TYPE = Object.fromEntries(ITEM_LIBRARY.map((entry) => [entry.type, entry]));

export function getFootprint(item) {
  const config = ITEM_LIBRARY_BY_TYPE[item.type];
  const isSwapped = Math.abs(item.rotation % 180) === 90;
  return {
    width: isSwapped ? config.depth : config.width,
    depth: isSwapped ? config.width : config.depth,
  };
}

export function ItemGlyph({ type, color = "currentColor", size = 24, rotation = 0 }) {
  const sharedProps = {
    "aria-hidden": "true",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { transform: `rotate(${rotation}deg)` },
  };

  if (["Chair", "OfficeChair", "DiningChair", "Stool"].includes(type)) {
    return <svg {...sharedProps}><rect x="5" y="3" width="14" height="8" rx="2" /><path d="M4 14h16M7 14v7M17 14v7M12 11v3" /></svg>;
  }
  if (["Table", "RoundTable", "Desk", "CoffeeTable", "DiningTable", "Nightstand", "KitchenIsland"].includes(type)) {
    return <svg {...sharedProps}><rect x="3" y="6" width="18" height="5" rx="1.5" /><path d="M7 11 6 21M17 11l1 10M5 16h14" /></svg>;
  }
  if (["Bookcase", "Dresser", "Wardrobe", "Cabinet", "Sideboard", "Refrigerator"].includes(type)) {
    return <svg {...sharedProps}><rect x="4" y="2.5" width="16" height="19" rx="1.5" /><path d="M4 8h16M4 14h16M12 2.5v19" /><circle cx="10" cy="11" r=".5" /></svg>;
  }
  if (["Screen", "Kiosk"].includes(type)) {
    return <svg {...sharedProps}><rect x="2.5" y="3" width="19" height="12.5" rx="2" /><path d="M9 21h6M12 15.5V21" /></svg>;
  }

  switch (type) {
    case "Sofa":
      return <svg {...sharedProps}><path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><rect x="2.5" y="10" width="19" height="8" rx="2" /><path d="M6 18v3M18 18v3M12 10v8" /></svg>;
    case "Counter":
    case "Vanity":
      return <svg {...sharedProps}><path d="M3.5 8.5c4.2 2.8 12.8 2.8 17 0M5 8.5v7.2c4 2.8 10 2.8 14 0V8.5M5 15.7 7 19h10l2-3.3" /></svg>;
    case "Bed":
      return <svg {...sharedProps}><path d="M3 21V8h18v13M3 17h18M6 8V4h5a3 3 0 0 1 3 3v1" /><path d="M14 8V5h4a3 3 0 0 1 3 3" /></svg>;
    case "Toilet":
      return <svg {...sharedProps}><rect x="7" y="2.5" width="10" height="6" rx="1" /><path d="M6 9h12v4a6 6 0 0 1-12 0zM9 19h6l1 2H8z" /></svg>;
    case "Shower":
      return <svg {...sharedProps}><path d="M4 21V3h16v18M4 17h16M12 3v18" /><path d="M7 7h2M8 7v3" /></svg>;
    case "Bathtub":
      return <svg {...sharedProps}><path d="M3 10h18v4a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zM6 10V6a2 2 0 0 1 2-2h2M7 20l-1 2M17 20l1 2" /></svg>;
    case "Range":
      return <svg {...sharedProps}><rect x="4" y="3" width="16" height="18" rx="1" /><circle cx="8" cy="7" r="2" /><circle cx="16" cy="7" r="2" /><rect x="7" y="12" width="10" height="6" rx="1" /></svg>;
    case "Sink":
      return <svg {...sharedProps}><rect x="3" y="7" width="18" height="12" rx="1" /><path d="M7 7c0 5 10 5 10 0M12 7V3h4v2" /></svg>;
    case "Wall":
      return <svg {...sharedProps}><path d="M3 4h18v16H3zM3 9h18M8 4v5M15 9v6M3 15h18M10 15v5" /></svg>;
    case "Door":
      return <svg {...sharedProps}><path d="M5 21V3h14v18M8 21V6h8v15" /><circle cx="14" cy="14" r=".7" /></svg>;
    case "Banner":
      return <svg {...sharedProps}><path d="M8 21h8M12 21V4M12 4h7v9h-7M14.5 7h2.5M14.5 10h2" /></svg>;
    case "Plant":
      return <svg {...sharedProps}><path d="M7 21h10M8.5 13.5h7l-1 7h-5zM12 13.5V5M12 9c-4-1-5-4-3-6 2 1 3 3 3 6ZM12 10c4-1 5-4 3-6-2 1-3 3-3 6Z" /></svg>;
    case "Rug":
      return <svg {...sharedProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 8H1M3 12H1M3 16H1M21 8h2M21 12h2M21 16h2M7 9l5-2 5 2-5 6z" /></svg>;
    default:
      return <svg {...sharedProps}><rect x="4" y="4" width="16" height="16" rx="2" /></svg>;
  }
}
