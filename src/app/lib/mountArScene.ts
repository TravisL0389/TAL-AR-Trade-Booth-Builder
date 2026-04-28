import type { BoothDefinition, BoothItem } from "./boothBuilder";
import { LIBRARY_ITEM_BY_TYPE, getFootprint } from "./boothBuilder";

const FEET_TO_METERS = 0.3048;

function buildBoothGroup(
  THREE: typeof import("three"),
  booth: BoothDefinition,
  items: BoothItem[],
) {
  const group = new THREE.Group();
  const footprintWidth = booth.width * FEET_TO_METERS;
  const footprintDepth = booth.depth * FEET_TO_METERS;

  const floorGeometry = new THREE.PlaneGeometry(footprintWidth, footprintDepth, booth.width, booth.depth);
  const floorMaterial = new THREE.MeshBasicMaterial({
    color: booth.ambience === "day" ? 0x111827 : 0x09090f,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const grid = new THREE.GridHelper(
    Math.max(footprintWidth, footprintDepth),
    Math.max(booth.width, booth.depth),
    0xa78bfa,
    0x312e81,
  );
  grid.position.y = 0.01;
  group.add(grid);

  items.forEach((item) => {
    const config = LIBRARY_ITEM_BY_TYPE[item.type];
    const footprint = getFootprint(item);
    const geometry = new THREE.BoxGeometry(
      footprint.width * FEET_TO_METERS,
      config.heightMeters,
      footprint.depth * FEET_TO_METERS,
    );
    const material = new THREE.MeshStandardMaterial({
      color: config.accent,
      emissive: config.accent,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: item.type === "screen" ? 0.9 : 0.95,
      roughness: 0.38,
      metalness: 0.12,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const x = (item.x + footprint.width / 2 - booth.width / 2) * FEET_TO_METERS;
    const z = (item.y + footprint.depth / 2 - booth.depth / 2) * FEET_TO_METERS;

    mesh.position.set(x, config.heightMeters / 2, z);
    mesh.rotation.y = (-item.rotation * Math.PI) / 180;

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeLines = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
    );
    mesh.add(edgeLines);
    group.add(mesh);
  });

  return group;
}

export async function mountArScene(
  container: HTMLElement,
  booth: BoothDefinition,
  items: BoothItem[],
) {
  const [THREE, { ARButton }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/webxr/ARButton.js"),
  ]);

  container.innerHTML = "";

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.domElement.className = "fixed inset-0 z-[120] hidden h-full w-full";
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const ambient = new THREE.HemisphereLight(0xffffff, 0x0b0b15, 2.5);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xffffff, 1.4);
  directional.position.set(0.8, 2.4, 1.2);
  scene.add(directional);

  const boothGroup = buildBoothGroup(THREE, booth, items);
  boothGroup.visible = false;
  scene.add(boothGroup);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.12, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", () => {
    if (!reticle.visible) {
      return;
    }

    boothGroup.visible = true;
    boothGroup.position.setFromMatrixPosition(reticle.matrix);
    boothGroup.rotation.y = camera.rotation.y;
  });
  scene.add(controller);

  const helperText = document.createElement("p");
  helperText.className = "text-sm text-white/70";
  helperText.textContent = "Scan for a surface, then tap once to place the booth at full scale.";
  container.appendChild(helperText);

  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body },
  });
  arButton.className =
    "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110";
  arButton.textContent = "Start Live AR";
  container.appendChild(arButton);

  let localSpace: any = null;
  let hitTestSource: any = null;
  let hitTestRequested = false;

  renderer.xr.addEventListener("sessionstart", () => {
    renderer.domElement.classList.remove("hidden");
  });

  renderer.xr.addEventListener("sessionend", () => {
    renderer.domElement.classList.add("hidden");
    boothGroup.visible = false;
    reticle.visible = false;
    localSpace = null;
    hitTestSource = null;
    hitTestRequested = false;
  });

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", resize);

  renderer.setAnimationLoop((_time, frame) => {
    if (frame) {
      const session = renderer.xr.getSession() as any;

      if (!hitTestRequested) {
        session.requestReferenceSpace("viewer").then((space) => {
          session.requestHitTestSource({ space }).then((source) => {
            hitTestSource = source;
          });
        });

        session.requestReferenceSpace("local").then((space) => {
          localSpace = space;
        });

        session.addEventListener("end", () => {
          hitTestRequested = false;
          hitTestSource = null;
        });

        hitTestRequested = true;
      }

      if (hitTestSource && localSpace) {
        const hitResults = frame.getHitTestResults(hitTestSource);

        if (hitResults.length) {
          const pose = hitResults[0].getPose(localSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          }
        } else {
          reticle.visible = false;
        }
      }
    }

    renderer.render(scene, camera);
  });

  return () => {
    renderer.setAnimationLoop(null);

    const session = renderer.xr.getSession();
    if (session) {
      session.end().catch(() => {});
    }

    window.removeEventListener("resize", resize);
    helperText.remove();
    arButton.remove();
    renderer.domElement.remove();
    renderer.dispose();
  };
}
