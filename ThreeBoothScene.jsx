import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ITEM_LIBRARY_BY_TYPE, getFootprint } from "./Item";

export const FEET_TO_UNITS = 0.38;

export function hasWebGlSupport() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function feet(value) {
  return value * FEET_TO_UNITS;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToSnap(value, snapSize) {
  const snap = Math.max(0.25, Number(snapSize) || 1);
  return Math.round(value / snap) * snap;
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.42,
    metalness: options.metalness ?? 0.12,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: Boolean(options.opacity && options.opacity < 1),
    opacity: options.opacity ?? 1,
  });
}

function roundedCanvasTexture({ brand, width = 1024, height = 512, title = true }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const primary = brand.primaryColor || "#0a6dff";
  const secondary = brand.secondaryColor || "#31c7ff";
  const name = brand.name || "TECHWAVE";

  context.fillStyle = primary;
  context.fillRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.35, "rgba(49,199,255,0.14)");
  gradient.addColorStop(1, "rgba(0,0,0,0.32)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = secondary;
  context.lineWidth = 5;
  for (let index = 0; index < 7; index += 1) {
    context.beginPath();
    const y = height * (0.46 + index * 0.045);
    context.moveTo(width * -0.08, y);
    context.bezierCurveTo(width * 0.22, y - 140, width * 0.54, y + 130, width * 1.08, y - 80);
    context.stroke();
  }

  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  if (title) {
    context.font = `900 ${Math.round(width * 0.095)}px Space Grotesk, Arial, sans-serif`;
    context.fillText(name.toUpperCase(), width / 2, height * 0.48);
    context.font = `700 ${Math.round(width * 0.028)}px Space Grotesk, Arial, sans-serif`;
    context.fillText("INNOVATE. CONNECT. GROW.", width / 2, height * 0.58);
  } else {
    context.font = `900 ${Math.round(width * 0.075)}px Space Grotesk, Arial, sans-serif`;
    context.fillText(name.toUpperCase(), width / 2, height * 0.55);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (brand.logoDataUrl) {
    const image = new Image();
    image.onload = () => {
      const logoCanvas = texture.image;
      const logoContext = logoCanvas.getContext("2d");
      const size = Math.min(width, height) * 0.22;
      logoContext.drawImage(image, width * 0.5 - size / 2, height * 0.12, size, size);
      texture.needsUpdate = true;
    };
    image.src = brand.logoDataUrl;
  }

  return texture;
}

function addBox(group, material, size, position, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, material, radiusTop, radiusBottom, height, position, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 32),
    material
  );
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addBrandPlane(group, material, size, position, rotation = {}) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.y), material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.set(rotation.x ?? 0, rotation.y ?? 0, rotation.z ?? 0);
  mesh.castShadow = false;
  group.add(mesh);
  return mesh;
}

function createModelMaterials(brand) {
  const brandTexture = roundedCanvasTexture({ brand });
  const smallBrandTexture = roundedCanvasTexture({ brand, width: 512, height: 512, title: false });

  return {
    white: makeMaterial(0xf1f4f3, { roughness: 0.34, metalness: 0.05 }),
    ceramic: makeMaterial(0xf8fbfc, { roughness: 0.2, metalness: 0.02 }),
    fabric: makeMaterial(0xc7d2d9, { roughness: 0.88, metalness: 0 }),
    charcoal: makeMaterial(0x102131, { roughness: 0.48, metalness: 0.18 }),
    metal: makeMaterial(0xb7c6cf, { roughness: 0.28, metalness: 0.52 }),
    glass: makeMaterial(0x79d9ff, { opacity: 0.34, roughness: 0.18, metalness: 0.2 }),
    wood: makeMaterial(0xffc666, { roughness: 0.48, metalness: 0.08 }),
    woodDark: makeMaterial(0x604634, { roughness: 0.58, metalness: 0.03 }),
    water: makeMaterial(0x57c7f1, { opacity: 0.55, roughness: 0.12, metalness: 0.04 }),
    green: makeMaterial(0x4fd06f, { roughness: 0.6, metalness: 0.02 }),
    brand: makeMaterial(brand.primaryColor || 0x0a6dff, { roughness: 0.34, metalness: 0.15 }),
    brandAccent: makeMaterial(brand.secondaryColor || 0x31c7ff, {
      roughness: 0.25,
      metalness: 0.18,
      emissive: new THREE.Color(brand.secondaryColor || "#31c7ff"),
      emissiveIntensity: 0.18,
    }),
    brandPanel: new THREE.MeshStandardMaterial({
      map: brandTexture,
      roughness: 0.28,
      metalness: 0.18,
      emissive: new THREE.Color(brand.secondaryColor || "#31c7ff"),
      emissiveIntensity: 0.08,
    }),
    brandSmall: new THREE.MeshStandardMaterial({
      map: smallBrandTexture,
      roughness: 0.32,
      metalness: 0.14,
      emissive: new THREE.Color(brand.secondaryColor || "#31c7ff"),
      emissiveIntensity: 0.06,
    }),
  };
}

function createChair(group, materials) {
  addBox(group, materials.white, { x: 0.58, y: 0.16, z: 0.58 }, { x: 0, y: 0.34, z: 0 });
  addBox(group, materials.white, { x: 0.62, y: 0.58, z: 0.12 }, { x: 0, y: 0.64, z: -0.27 });
  addBox(group, materials.metal, { x: 0.08, y: 0.38, z: 0.08 }, { x: -0.23, y: 0.16, z: 0.2 });
  addBox(group, materials.metal, { x: 0.08, y: 0.38, z: 0.08 }, { x: 0.23, y: 0.16, z: 0.2 });
  addBox(group, materials.charcoal, { x: 0.68, y: 0.06, z: 0.08 }, { x: 0, y: 0.12, z: 0.33 });
}

function createStool(group, materials) {
  addCylinder(group, materials.white, 0.28, 0.28, 0.12, { x: 0, y: 0.7, z: 0 });
  addCylinder(group, materials.metal, 0.045, 0.045, 0.68, { x: 0, y: 0.36, z: 0 }, { segments: 16 });
  addCylinder(group, materials.metal, 0.34, 0.24, 0.05, { x: 0, y: 0.04, z: 0 });
}

function createTable(group, materials) {
  addBox(group, materials.white, { x: 1.1, y: 0.12, z: 0.74 }, { x: 0, y: 0.56, z: 0 });
  addBox(group, materials.metal, { x: 0.06, y: 0.5, z: 0.06 }, { x: -0.45, y: 0.28, z: -0.28 });
  addBox(group, materials.metal, { x: 0.06, y: 0.5, z: 0.06 }, { x: 0.45, y: 0.28, z: -0.28 });
  addBox(group, materials.metal, { x: 0.06, y: 0.5, z: 0.06 }, { x: -0.45, y: 0.28, z: 0.28 });
  addBox(group, materials.metal, { x: 0.06, y: 0.5, z: 0.06 }, { x: 0.45, y: 0.28, z: 0.28 });
  addBox(group, materials.charcoal, { x: 0.3, y: 0.04, z: 0.22 }, { x: 0.25, y: 0.65, z: -0.08 });
  addBox(group, materials.brandSmall, { x: 0.28, y: 0.2, z: 0.03 }, { x: 0.25, y: 0.78, z: -0.21 });
}

function createRoundTable(group, materials) {
  addCylinder(group, materials.white, 0.52, 0.52, 0.12, { x: 0, y: 0.55, z: 0 });
  addCylinder(group, materials.metal, 0.055, 0.055, 0.5, { x: 0, y: 0.28, z: 0 }, { segments: 16 });
  addCylinder(group, materials.metal, 0.36, 0.24, 0.05, { x: 0, y: 0.04, z: 0 });
}

function createScreen(group, materials, footprint) {
  const width = feet(footprint.width) * 0.94;
  addBox(group, materials.white, { x: width + 0.32, y: 2.25, z: 0.16 }, { x: 0, y: 1.18, z: 0 });
  addBrandPlane(group, materials.brandPanel, { x: width, y: 1.55 }, { x: 0, y: 1.25, z: 0.091 });
  addBox(group, materials.brandAccent, { x: width + 0.42, y: 0.05, z: 0.18 }, { x: 0, y: 2.36, z: 0.02 });
  addBox(group, materials.brandAccent, { x: 0.07, y: 1.9, z: 0.18 }, { x: -width / 2 - 0.16, y: 1.18, z: 0.02 });
  addBox(group, materials.brandAccent, { x: 0.07, y: 1.9, z: 0.18 }, { x: width / 2 + 0.16, y: 1.18, z: 0.02 });
}

function createCounter(group, materials) {
  const curved = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.08, 1.02, 48, 1, true, Math.PI * 1.1, Math.PI * 0.78),
    materials.white
  );
  curved.position.y = 0.55;
  curved.scale.z = 0.52;
  curved.castShadow = true;
  curved.receiveShadow = true;
  group.add(curved);

  const face = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.1, 0.72, 48, 1, true, Math.PI * 1.12, Math.PI * 0.74),
    materials.brandSmall
  );
  face.position.y = 0.48;
  face.scale.z = 0.54;
  face.castShadow = true;
  group.add(face);

  addBox(group, materials.brandAccent, { x: 1.55, y: 0.055, z: 0.06 }, { x: 0, y: 0.16, z: 0.5 });
  addBox(group, materials.charcoal, { x: 0.5, y: 0.08, z: 0.16 }, { x: -0.25, y: 1.1, z: 0.02 });
  addBox(group, materials.charcoal, { x: 0.28, y: 0.22, z: 0.04 }, { x: 0.36, y: 1.23, z: -0.12 });
}

function createKiosk(group, materials) {
  addBox(group, materials.white, { x: 0.36, y: 0.82, z: 0.36 }, { x: 0, y: 0.42, z: 0 });
  const screen = addBox(group, materials.brandSmall, { x: 0.48, y: 0.72, z: 0.06 }, { x: 0, y: 1.02, z: -0.16 });
  screen.rotation.x = -0.18;
}

function createBanner(group, materials) {
  addCylinder(group, materials.metal, 0.035, 0.035, 2.0, { x: -0.34, y: 1.0, z: 0 }, { segments: 12 });
  addBrandPlane(group, materials.brandPanel, { x: 0.72, y: 1.42 }, { x: 0.06, y: 1.24, z: 0.02 });
  addBox(group, materials.metal, { x: 0.9, y: 0.05, z: 0.18 }, { x: 0, y: 0.04, z: 0 });
}

function createPlant(group, materials) {
  addBox(group, materials.white, { x: 0.34, y: 0.34, z: 0.34 }, { x: 0, y: 0.17, z: 0 });
  for (let index = 0; index < 7; index += 1) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 8), materials.green);
    leaf.position.set(Math.sin(index) * 0.13, 0.58, Math.cos(index) * 0.13);
    leaf.rotation.z = Math.sin(index) * 0.7;
    leaf.rotation.x = Math.cos(index) * 0.55;
    leaf.castShadow = true;
    group.add(leaf);
  }
}

function getModelSize(footprint, inset = 0.86) {
  return {
    width: Math.max(0.3, feet(footprint.width) * inset),
    depth: Math.max(0.3, feet(footprint.depth) * inset),
  };
}

function createOfficeChair(group, materials) {
  createChair(group, materials);
  addCylinder(group, materials.metal, 0.04, 0.04, 0.34, { x: 0, y: 0.2, z: 0 }, { segments: 12 });
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const arm = addBox(group, materials.metal, { x: 0.34, y: 0.035, z: 0.045 }, { x: Math.sin(angle) * 0.14, y: 0.035, z: Math.cos(angle) * 0.14 });
    arm.rotation.y = angle;
  }
}

function createSofa(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.fabric, { x: width, y: 0.32, z: depth * 0.78 }, { x: 0, y: 0.36, z: 0.06 });
  addBox(group, materials.fabric, { x: width, y: 0.7, z: 0.2 }, { x: 0, y: 0.76, z: -depth * 0.36 });
  addBox(group, materials.fabric, { x: 0.22, y: 0.58, z: depth }, { x: -width * 0.48, y: 0.55, z: 0 });
  addBox(group, materials.fabric, { x: 0.22, y: 0.58, z: depth }, { x: width * 0.48, y: 0.55, z: 0 });
  addBox(group, materials.charcoal, { x: width * 0.28, y: 0.08, z: depth * 0.68 }, { x: -width * 0.17, y: 0.57, z: 0.07 });
  addBox(group, materials.charcoal, { x: width * 0.28, y: 0.08, z: depth * 0.68 }, { x: width * 0.17, y: 0.57, z: 0.07 });
}

function createDesk(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.woodDark, { x: width, y: 0.12, z: depth }, { x: 0, y: 0.72, z: 0 });
  addBox(group, materials.charcoal, { x: width * 0.24, y: 0.64, z: depth * 0.82 }, { x: -width * 0.34, y: 0.34, z: 0 });
  addBox(group, materials.metal, { x: 0.07, y: 0.64, z: 0.07 }, { x: width * 0.4, y: 0.34, z: -depth * 0.36 });
  addBox(group, materials.metal, { x: 0.07, y: 0.64, z: 0.07 }, { x: width * 0.4, y: 0.34, z: depth * 0.36 });
  addBox(group, materials.brandSmall, { x: width * 0.28, y: 0.46, z: 0.035 }, { x: width * 0.12, y: 1.02, z: -depth * 0.12 });
  addBox(group, materials.metal, { x: 0.05, y: 0.28, z: 0.05 }, { x: width * 0.12, y: 0.83, z: -depth * 0.1 });
}

function createCoffeeTable(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.glass, { x: width, y: 0.08, z: depth }, { x: 0, y: 0.42, z: 0 });
  for (const x of [-0.42, 0.42]) {
    for (const z of [-0.36, 0.36]) {
      addBox(group, materials.metal, { x: 0.05, y: 0.38, z: 0.05 }, { x: width * x, y: 0.2, z: depth * z });
    }
  }
}

function createDiningTable(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.woodDark, { x: width, y: 0.14, z: depth }, { x: 0, y: 0.74, z: 0 });
  addBox(group, materials.woodDark, { x: width * 0.72, y: 0.08, z: 0.1 }, { x: 0, y: 0.4, z: 0 });
  for (const x of [-0.42, 0.42]) {
    for (const z of [-0.36, 0.36]) {
      addBox(group, materials.metal, { x: 0.08, y: 0.68, z: 0.08 }, { x: width * x, y: 0.36, z: depth * z });
    }
  }
}

function createStorage(group, materials, footprint, height = 1.5, open = false) {
  const { width, depth } = getModelSize(footprint, 0.9);
  addBox(group, materials.woodDark, { x: width, y: height, z: depth }, { x: 0, y: height / 2, z: 0 });
  const faceMaterial = open ? materials.charcoal : materials.white;
  for (let shelf = 1; shelf < 4; shelf += 1) {
    addBox(group, faceMaterial, { x: width * 0.9, y: 0.035, z: depth * 0.08 }, { x: 0, y: (height / 4) * shelf, z: depth * 0.51 });
  }
  if (!open) {
    addBox(group, materials.metal, { x: 0.025, y: height * 0.68, z: 0.025 }, { x: 0, y: height * 0.52, z: depth * 0.52 });
  }
}

function createBed(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint, 0.92);
  addBox(group, materials.woodDark, { x: width, y: 0.3, z: depth }, { x: 0, y: 0.2, z: 0 });
  addBox(group, materials.fabric, { x: width * 0.94, y: 0.3, z: depth * 0.9 }, { x: 0, y: 0.5, z: depth * 0.03 });
  addBox(group, materials.woodDark, { x: width, y: 1.15, z: 0.16 }, { x: 0, y: 0.62, z: -depth * 0.49 });
  addBox(group, materials.white, { x: width * 0.39, y: 0.16, z: depth * 0.2 }, { x: -width * 0.23, y: 0.73, z: -depth * 0.3 });
  addBox(group, materials.white, { x: width * 0.39, y: 0.16, z: depth * 0.2 }, { x: width * 0.23, y: 0.73, z: -depth * 0.3 });
}

function createVanity(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.woodDark, { x: width, y: 0.76, z: depth }, { x: 0, y: 0.38, z: 0 });
  addBox(group, materials.ceramic, { x: width * 1.02, y: 0.09, z: depth * 1.02 }, { x: 0, y: 0.81, z: 0 });
  for (const x of [-0.26, 0.26]) {
    addCylinder(group, materials.ceramic, width * 0.14, width * 0.14, 0.04, { x: width * x, y: 0.87, z: 0 }, { segments: 28 });
  }
  addBrandPlane(group, materials.glass, { x: width * 0.88, y: 0.85 }, { x: 0, y: 1.45, z: -depth * 0.48 });
}

function createToilet(group, materials) {
  addCylinder(group, materials.ceramic, 0.36, 0.28, 0.42, { x: 0, y: 0.23, z: 0.12 }, { segments: 32 });
  const seat = addCylinder(group, materials.ceramic, 0.38, 0.38, 0.08, { x: 0, y: 0.46, z: 0.1 }, { segments: 32 });
  seat.scale.z = 1.2;
  addBox(group, materials.ceramic, { x: 0.62, y: 0.62, z: 0.24 }, { x: 0, y: 0.53, z: -0.34 });
}

function createShower(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.ceramic, { x: width, y: 0.08, z: depth }, { x: 0, y: 0.04, z: 0 });
  addBox(group, materials.glass, { x: width, y: 2.05, z: 0.04 }, { x: 0, y: 1.03, z: depth / 2 });
  addBox(group, materials.glass, { x: 0.04, y: 2.05, z: depth }, { x: width / 2, y: 1.03, z: 0 });
  addCylinder(group, materials.metal, 0.035, 0.035, 1.65, { x: -width * 0.34, y: 1.04, z: -depth * 0.42 }, { segments: 12 });
  const head = addCylinder(group, materials.metal, 0.18, 0.18, 0.04, { x: -width * 0.34, y: 1.82, z: -depth * 0.25 }, { segments: 24 });
  head.rotation.x = Math.PI / 2;
}

function createBathtub(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.ceramic, { x: width, y: 0.58, z: depth }, { x: 0, y: 0.3, z: 0 });
  addBox(group, materials.water, { x: width * 0.84, y: 0.04, z: depth * 0.7 }, { x: 0, y: 0.58, z: 0 });
  addBox(group, materials.charcoal, { x: width * 0.72, y: 0.4, z: depth * 0.58 }, { x: 0, y: 0.36, z: 0 });
  addBox(group, materials.water, { x: width * 0.68, y: 0.03, z: depth * 0.54 }, { x: 0, y: 0.58, z: 0 });
}

function createKitchenIsland(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.brand, { x: width * 0.88, y: 0.86, z: depth * 0.84 }, { x: 0, y: 0.43, z: 0 });
  addBox(group, materials.ceramic, { x: width, y: 0.11, z: depth }, { x: 0, y: 0.91, z: 0 });
  addBrandPlane(group, materials.brandSmall, { x: width * 0.48, y: 0.38 }, { x: 0, y: 0.48, z: depth * 0.43 });
}

function createRefrigerator(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.metal, { x: width, y: 2.05, z: depth }, { x: 0, y: 1.025, z: 0 });
  addBox(group, materials.charcoal, { x: 0.025, y: 1.8, z: 0.03 }, { x: 0, y: 1.05, z: depth * 0.51 });
  addBox(group, materials.charcoal, { x: 0.035, y: 0.7, z: 0.035 }, { x: width * 0.32, y: 1.2, z: depth * 0.53 });
}

function createRange(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.metal, { x: width, y: 0.92, z: depth }, { x: 0, y: 0.46, z: 0 });
  addBox(group, materials.charcoal, { x: width * 0.72, y: 0.48, z: 0.035 }, { x: 0, y: 0.42, z: depth * 0.51 });
  for (const x of [-0.24, 0.24]) {
    for (const z of [-0.22, 0.22]) {
      addCylinder(group, materials.charcoal, 0.13, 0.13, 0.025, { x: width * x, y: 0.94, z: depth * z }, { segments: 24 });
    }
  }
}

function createSink(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint);
  addBox(group, materials.woodDark, { x: width, y: 0.82, z: depth }, { x: 0, y: 0.41, z: 0 });
  addBox(group, materials.ceramic, { x: width, y: 0.08, z: depth }, { x: 0, y: 0.86, z: 0 });
  addBox(group, materials.charcoal, { x: width * 0.52, y: 0.06, z: depth * 0.62 }, { x: 0, y: 0.91, z: 0 });
  const faucet = addCylinder(group, materials.metal, 0.035, 0.035, 0.46, { x: 0, y: 1.11, z: -depth * 0.32 }, { segments: 12 });
  faucet.rotation.z = 0.15;
}

function createWall(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint, 1);
  addBox(group, materials.white, { x: width, y: 2.5, z: Math.max(depth, 0.12) }, { x: 0, y: 1.25, z: 0 });
}

function createDoor(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint, 1);
  addBox(group, materials.woodDark, { x: width, y: 2.08, z: Math.max(depth, 0.1) }, { x: 0, y: 1.04, z: 0 });
  addBox(group, materials.metal, { x: 0.05, y: 0.05, z: 0.08 }, { x: width * 0.35, y: 1.02, z: Math.max(depth, 0.1) * 0.55 });
}

function createRug(group, materials, footprint) {
  const { width, depth } = getModelSize(footprint, 0.96);
  addBox(group, materials.fabric, { x: width, y: 0.025, z: depth }, { x: 0, y: 0.02, z: 0 });
}

export function createItemGroup(item, brand, selectedId, sharedMaterials) {
  const config = ITEM_LIBRARY_BY_TYPE[item.type];
  const footprint = getFootprint(item);
  const materials = sharedMaterials ?? createModelMaterials(brand);
  const group = new THREE.Group();
  group.userData.itemId = item.id;
  group.userData.item = item;
  const x = (item.x + footprint.width / 2 - brand.boothWidth / 2) * FEET_TO_UNITS;
  const z = (item.y + footprint.depth / 2 - brand.boothDepth / 2) * FEET_TO_UNITS;

  group.position.set(x, 0, z);
  group.rotation.y = (-item.rotation * Math.PI) / 180;
  group.scale.setScalar(config.type === "Screen" || config.type === "Wall" ? 1 : 0.94);

  const footprintMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(feet(footprint.width), feet(footprint.depth)),
    new THREE.MeshBasicMaterial({
      color: item.id === selectedId ? 0x67d6ff : 0x1fb8ff,
      transparent: true,
      opacity: item.id === selectedId ? 0.22 : 0.08,
      side: THREE.DoubleSide,
    })
  );
  footprintMesh.rotation.x = -Math.PI / 2;
  footprintMesh.position.y = 0.012;
  group.add(footprintMesh);

  switch (item.type) {
    case "Chair":
      createChair(group, materials);
      break;
    case "OfficeChair":
      createOfficeChair(group, materials);
      break;
    case "DiningChair":
      createChair(group, materials);
      break;
    case "Stool":
      createStool(group, materials);
      break;
    case "Table":
      createTable(group, materials);
      break;
    case "RoundTable":
      createRoundTable(group, materials);
      break;
    case "Desk":
      createDesk(group, materials, footprint);
      break;
    case "CoffeeTable":
      createCoffeeTable(group, materials, footprint);
      break;
    case "DiningTable":
      createDiningTable(group, materials, footprint);
      break;
    case "Nightstand":
      createStorage(group, materials, footprint, 0.62);
      break;
    case "Sofa":
      createSofa(group, materials, footprint);
      break;
    case "Screen":
      createScreen(group, materials, footprint);
      break;
    case "Counter":
      createCounter(group, materials);
      break;
    case "Kiosk":
      createKiosk(group, materials);
      break;
    case "Banner":
      createBanner(group, materials);
      break;
    case "Plant":
      createPlant(group, materials);
      break;
    case "Bookcase":
      createStorage(group, materials, footprint, 2.1, true);
      break;
    case "Dresser":
      createStorage(group, materials, footprint, 0.9);
      break;
    case "Wardrobe":
      createStorage(group, materials, footprint, 2.15);
      break;
    case "Cabinet":
      createStorage(group, materials, footprint, 2.05);
      break;
    case "Sideboard":
      createStorage(group, materials, footprint, 0.85);
      break;
    case "Bed":
      createBed(group, materials, footprint);
      break;
    case "Vanity":
      createVanity(group, materials, footprint);
      break;
    case "Toilet":
      createToilet(group, materials);
      break;
    case "Shower":
      createShower(group, materials, footprint);
      break;
    case "Bathtub":
      createBathtub(group, materials, footprint);
      break;
    case "KitchenIsland":
      createKitchenIsland(group, materials, footprint);
      break;
    case "Refrigerator":
      createRefrigerator(group, materials, footprint);
      break;
    case "Range":
      createRange(group, materials, footprint);
      break;
    case "Sink":
      createSink(group, materials, footprint);
      break;
    case "Wall":
      createWall(group, materials, footprint);
      break;
    case "Door":
      createDoor(group, materials, footprint);
      break;
    case "Rug":
      createRug(group, materials, footprint);
      break;
    default:
      createTable(group, materials);
  }

  group.traverse((node) => {
    node.userData.itemId = item.id;
    node.userData.item = item;
  });

  return group;
}

export function disposeObject(object) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  object.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.material) {
      const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
      nodeMaterials.forEach((material) => materials.add(material));
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    if (material.map) textures.add(material.map);
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
}

export function buildSceneContent(scene, { booth, items, brand, selectedId, showGrid = false }) {
  const floorWidth = feet(booth.width);
  const floorDepth = feet(booth.depth);
  const floorMaterial = makeMaterial(0x2b343e, { roughness: 0.62, metalness: 0.05 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(floorWidth, 0.08, floorDepth), floorMaterial);
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  floor.userData.isFloor = true;
  scene.add(floor);

  if (showGrid) {
    const grid = new THREE.GridHelper(Math.max(floorWidth, floorDepth), Math.max(booth.width, booth.depth), 0x1fb8ff, 0x284356);
    grid.scale.x = floorWidth / Math.max(floorWidth, floorDepth);
    grid.scale.z = floorDepth / Math.max(floorWidth, floorDepth);
    grid.position.y = 0.01;
    scene.add(grid);
  }

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(floorWidth, 0.1, floorDepth)),
    new THREE.LineBasicMaterial({ color: 0xeaf7ff, transparent: true, opacity: 0.9 })
  );
  edge.position.y = 0.01;
  scene.add(edge);

  const materials = createModelMaterials(brand);
  for (const item of items) {
    scene.add(createItemGroup(item, { ...brand, boothWidth: booth.width, boothDepth: booth.depth }, selectedId, materials));
  }
}

function applyCameraPreset(camera, controls, booth, activeView, zoom) {
  const boothScale = Math.max(feet(booth.width), feet(booth.depth), 4);
  const zoomScale = clamp((100 - zoom) / 45, 0, 1);
  const distance = boothScale * (0.66 + zoomScale * 0.39);
  const target = new THREE.Vector3(0, 0.12, 0);
  const presets = {
    plan: new THREE.Vector3(0.01, distance * 1.75, 0.01),
    front: new THREE.Vector3(0.01, distance * 0.42, distance * 1.35),
    side: new THREE.Vector3(distance * 1.35, distance * 0.42, 0.01),
    iso: new THREE.Vector3(distance * 0.66, distance * 0.9, distance * 1.04),
  };

  camera.position.copy(presets[activeView] ?? presets.iso);
  camera.lookAt(target);
  controls.target.copy(target);
  controls.update();
}

export default function ThreeBoothScene({
  booth,
  items,
  brand,
  selectedId,
  activeView,
  snapSize,
  zoom,
  showGrid,
  onMoveItem,
  onSelectItem,
}) {
  const canvasHostRef = useRef(null);
  const runtimeRef = useRef(null);
  const latestRef = useRef({ activeView, booth, brand, onMoveItem, onSelectItem, snapSize, zoom });
  const [webglUnavailable, setWebglUnavailable] = useState(() => !hasWebGlSupport());

  useEffect(() => {
    latestRef.current = { activeView, booth, brand, onMoveItem, onSelectItem, snapSize, zoom };
  }, [activeView, booth, brand, onMoveItem, onSelectItem, snapSize, zoom]);

  useEffect(() => {
    const container = canvasHostRef.current;
    if (!container || webglUnavailable) {
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      requestAnimationFrame(() => setWebglUnavailable(true));
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06111c);
    const initial = latestRef.current;
    const sceneScale = Math.max(feet(initial.booth.width), feet(initial.booth.depth), 8);
    scene.fog = new THREE.Fog(0x06111c, sceneScale * 0.9, sceneScale * 3.2);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x061018, 1.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 3.8);
    key.position.set(-4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);
    const cyan = new THREE.PointLight(initial.brand.secondaryColor || "#31c7ff", 2.2, 12);
    cyan.position.set(0, 3.5, -3);
    scene.add(cyan);
    const contentRoot = new THREE.Group();
    contentRoot.name = "spatial-content";
    scene.add(contentRoot);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minPolarAngle = 0.16;
    controls.minDistance = 2.8;
    controls.maxDistance = sceneScale * 3;
    controls.screenSpacePanning = false;
    applyCameraPreset(camera, controls, initial.booth, initial.activeView, initial.zoom);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorPoint = new THREE.Vector3();
    const dragState = {
      active: false,
      pointerId: null,
      item: null,
      group: null,
      offset: new THREE.Vector3(),
      latestX: null,
      latestY: null,
    };

    function resize() {
      const { clientWidth, clientHeight } = container;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(1, clientHeight);
      camera.updateProjectionMatrix();
    }

    function setPointerFromEvent(event) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    }

    function getFloorIntersection(event) {
      setPointerFromEvent(event);
      return raycaster.ray.intersectPlane(floorPlane, floorPoint);
    }

    function getItemPositionFromWorld(item, worldPosition) {
      const { booth: currentBooth, snapSize: currentSnapSize } = latestRef.current;
      const footprint = getFootprint(item);
      const rawX = worldPosition.x / FEET_TO_UNITS + currentBooth.width / 2 - footprint.width / 2;
      const rawY = worldPosition.z / FEET_TO_UNITS + currentBooth.depth / 2 - footprint.depth / 2;

      return {
        x: clamp(roundToSnap(rawX, currentSnapSize), 0, Math.max(0, currentBooth.width - footprint.width)),
        y: clamp(roundToSnap(rawY, currentSnapSize), 0, Math.max(0, currentBooth.depth - footprint.depth)),
      };
    }

    function getWorldPositionFromItem(item, x, y) {
      const { booth: currentBooth } = latestRef.current;
      const footprint = getFootprint(item);
      return new THREE.Vector3(
        (x + footprint.width / 2 - currentBooth.width / 2) * FEET_TO_UNITS,
        0,
        (y + footprint.depth / 2 - currentBooth.depth / 2) * FEET_TO_UNITS
      );
    }

    function handlePointerDown(event) {
      setPointerFromEvent(event);
      const hits = raycaster.intersectObjects(scene.children, true);
      const hit = hits.find((entry) => entry.object.userData.itemId);

      if (!hit) {
        latestRef.current.onSelectItem(null);
        return;
      }

      const item = hit.object.userData.item;
      let group = hit.object;
      while (group.parent && group.parent !== contentRoot) {
        group = group.parent;
      }

      if (!item || !group?.userData.itemId) {
        return;
      }

      const floorHit = getFloorIntersection(event);
      latestRef.current.onSelectItem(item.id);

      if (!floorHit) {
        return;
      }

      event.preventDefault();
      renderer.domElement.setPointerCapture?.(event.pointerId);
      dragState.active = true;
      dragState.pointerId = event.pointerId;
      dragState.item = item;
      dragState.group = group;
      dragState.offset.copy(group.position).sub(floorHit);
      dragState.latestX = item.x;
      dragState.latestY = item.y;
      controls.enabled = false;
      container.classList.add("is-dragging-object");
    }

    function handlePointerMove(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      const floorHit = getFloorIntersection(event);
      if (!floorHit) {
        return;
      }

      const nextWorldPosition = floorHit.clone().add(dragState.offset);
      const nextItemPosition = getItemPositionFromWorld(dragState.item, nextWorldPosition);
      const snappedWorldPosition = getWorldPositionFromItem(dragState.item, nextItemPosition.x, nextItemPosition.y);

      dragState.group.position.x = snappedWorldPosition.x;
      dragState.group.position.z = snappedWorldPosition.z;
      dragState.latestX = nextItemPosition.x;
      dragState.latestY = nextItemPosition.y;
    }

    function finishDrag(event) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      renderer.domElement.releasePointerCapture?.(event.pointerId);
      controls.enabled = true;
      container.classList.remove("is-dragging-object");

      if (dragState.item && Number.isFinite(dragState.latestX) && Number.isFinite(dragState.latestY)) {
        latestRef.current.onMoveItem(dragState.item.id, dragState.latestX, dragState.latestY);
      }

      dragState.active = false;
      dragState.pointerId = null;
      dragState.item = null;
      dragState.group = null;
      dragState.latestX = null;
      dragState.latestY = null;
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", finishDrag);
    renderer.domElement.addEventListener("pointercancel", finishDrag);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    runtimeRef.current = { camera, contentRoot, controls, cyan, renderer, scene };

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", finishDrag);
      renderer.domElement.removeEventListener("pointercancel", finishDrag);
      observer.disconnect();
      controls.dispose();
      disposeObject(scene);
      renderer.forceContextLoss();
      renderer.dispose();
      container.replaceChildren();
      runtimeRef.current = null;
    };
  }, [webglUnavailable]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    disposeObject(runtime.contentRoot);
    runtime.contentRoot.clear();
    buildSceneContent(runtime.contentRoot, { booth, items, brand, selectedId, showGrid });

    const sceneScale = Math.max(feet(booth.width), feet(booth.depth), 8);
    runtime.scene.fog = new THREE.Fog(0x06111c, sceneScale * 0.9, sceneScale * 3.2);
    runtime.cyan.color.set(brand.secondaryColor || "#31c7ff");
    runtime.controls.maxDistance = sceneScale * 3;
  }, [booth, brand, items, selectedId, showGrid]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    applyCameraPreset(runtime.camera, runtime.controls, booth, activeView, zoom);
  }, [activeView, booth, zoom]);

  return (
    <div className="three-booth-scene" aria-label={`Interactive 3D ${booth.spaceType || "space"} visualization`}>
      <div ref={canvasHostRef} className="three-booth-scene__host" aria-hidden={webglUnavailable ? "true" : undefined} />
      {webglUnavailable ? (
        <div className="three-booth-fallback">
          <strong>3D preview needs WebGL</strong>
          <span>
            Your browser or device has WebGL disabled. The spatial plan, style controls, AR handoff,
            and export workflow still work; open this view in a WebGL-enabled browser for full 3D.
          </span>
        </div>
      ) : null}
    </div>
  );
}
