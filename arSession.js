import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { FEET_TO_UNITS, buildSceneContent, disposeObject } from "./ThreeBoothScene";

const FEET_TO_METERS = 0.3048;
const AR_MODEL_SCALE = FEET_TO_METERS / FEET_TO_UNITS;

function buildBoothGroup(booth, items, brand) {
  const group = new THREE.Group();
  group.scale.setScalar(AR_MODEL_SCALE);
  buildSceneContent(group, { booth, items, brand, selectedId: null });

  return group;
}

export async function mountArSceneLauncher(container, { booth, items, brand }) {
  container.replaceChildren();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "ar-render-surface";
  renderer.domElement.style.display = "none";
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x0b1e28, 2.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0.8, 2.5, 1.3);
  scene.add(directionalLight);

  const boothGroup = buildBoothGroup(booth, items, brand);
  boothGroup.visible = false;
  scene.add(boothGroup);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.12, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x36d7ff })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const controller = renderer.xr.getController(0);
  function handleSelect() {
    if (reticle.visible) {
      boothGroup.visible = true;
      boothGroup.position.setFromMatrixPosition(reticle.matrix);
      boothGroup.rotation.y = camera.rotation.y;
    }
  }
  controller.addEventListener("select", handleSelect);
  scene.add(controller);

  const status = document.createElement("p");
  status.className = "panel-copy";
  status.textContent = "Tap the launcher, scan for a surface, then tap once to place the complete spatial layout.";
  container.appendChild(status);

  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "light-estimation"],
    domOverlay: { root: container },
  });
  button.className = "primary-button ar-native-button";
  button.textContent = "Start Live AR";
  container.appendChild(button);

  let hitTestSource = null;
  let localSpace = null;
  let hitTestSourceRequested = false;

  renderer.xr.addEventListener("sessionstart", () => {
    renderer.domElement.style.display = "block";
  });

  renderer.xr.addEventListener("sessionend", () => {
    renderer.domElement.style.display = "none";
    boothGroup.visible = false;
    reticle.visible = false;
    hitTestSource = null;
    localSpace = null;
    hitTestSourceRequested = false;
  });

  function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", handleResize);

  function resetHitTestSource() {
    hitTestSourceRequested = false;
    hitTestSource = null;
  }

  renderer.setAnimationLoop((_timestamp, frame) => {
    if (frame) {
      const session = renderer.xr.getSession();

      if (!hitTestSourceRequested) {
        session
          .requestReferenceSpace("viewer")
          .then((referenceSpace) => session.requestHitTestSource({ space: referenceSpace }))
          .then((source) => {
            hitTestSource = source;
          })
          .catch(resetHitTestSource);

        session
          .requestReferenceSpace("local")
          .then((space) => {
            localSpace = space;
          })
          .catch(() => {
            localSpace = null;
          });

        session.addEventListener("end", resetHitTestSource, { once: true });

        hitTestSourceRequested = true;
      }

      if (hitTestSource && localSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(localSpace);

          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
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

    window.removeEventListener("resize", handleResize);
    controller.removeEventListener("select", handleSelect);
    controller.removeFromParent();
    button.remove();
    status.remove();
    renderer.domElement.remove();
    disposeObject(scene);
    renderer.dispose();
  };
}
