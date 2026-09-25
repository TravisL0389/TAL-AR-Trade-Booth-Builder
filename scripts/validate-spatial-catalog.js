#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { SPACE_TEMPLATES, SPACE_TYPES } from "../ProjectCatalog.js";

const root = process.cwd();
const itemSource = fs.readFileSync(path.join(root, "Item.jsx"), "utf8");
const sceneSource = fs.readFileSync(path.join(root, "ThreeBoothScene.jsx"), "utf8");
const itemPattern = /defineItem\(\{\s*type:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*width:\s*([\d.]+),\s*depth:\s*([\d.]+)/g;
const itemCatalog = new Map();
let itemMatch;

while ((itemMatch = itemPattern.exec(itemSource))) {
  const [, type, name, width, depth] = itemMatch;
  if (itemCatalog.has(type)) {
    throw new Error(`Duplicate 3D asset type: ${type}`);
  }
  itemCatalog.set(type, { name, width: Number(width), depth: Number(depth) });
}

if (itemCatalog.size < 30) {
  throw new Error(`Expected a complete spatial asset catalog; found only ${itemCatalog.size} assets.`);
}

const spaceTypeIds = new Set(SPACE_TYPES.map((spaceType) => spaceType.id));
const templateIds = new Set();

for (const template of SPACE_TEMPLATES) {
  if (templateIds.has(template.id)) {
    throw new Error(`Duplicate template id: ${template.id}`);
  }
  templateIds.add(template.id);

  if (!spaceTypeIds.has(template.spaceType)) {
    throw new Error(`Template ${template.id} uses unknown space type ${template.spaceType}.`);
  }
  if (template.width < 6 || template.depth < 6 || template.width > 100 || template.depth > 100) {
    throw new Error(`Template ${template.id} has unsupported dimensions.`);
  }

  for (const item of template.items) {
    const config = itemCatalog.get(item.type);
    if (!config) {
      throw new Error(`Template ${template.id} references unknown asset ${item.type}.`);
    }

    const swapsFootprint = Math.abs((item.rotation ?? 0) % 180) === 90;
    const width = swapsFootprint ? config.depth : config.width;
    const depth = swapsFootprint ? config.width : config.depth;
    if (item.x < 0 || item.y < 0 || item.x + width > template.width || item.y + depth > template.depth) {
      throw new Error(`Template ${template.id} places ${item.label} outside its ${template.width} x ${template.depth} boundary.`);
    }
  }
}

for (const type of itemCatalog.keys()) {
  if (!sceneSource.includes(`case "${type}"`)) {
    throw new Error(`3D asset ${type} has no explicit Three.js model case.`);
  }
}

for (const spaceType of SPACE_TYPES) {
  if (!SPACE_TEMPLATES.some((template) => template.spaceType === spaceType.id)) {
    throw new Error(`Space type ${spaceType.label} has no starting template.`);
  }
}

process.stdout.write(`Spatial catalog validation passed (${itemCatalog.size} assets, ${SPACE_TEMPLATES.length} templates, ${SPACE_TYPES.length} space types).\n`);
