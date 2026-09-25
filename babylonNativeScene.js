import * as BABYLON from "@babylonjs/core";

export function createBabylonNativeBoothScene(engine, { booth, items, brand }) {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color4.FromHexString("#06111cff");
  scene.environmentIntensity = 0.9;

  const camera = new BABYLON.ArcRotateCamera(
    "native-booth-camera",
    Math.PI * 0.72,
    Math.PI * 0.34,
    Math.max(booth.width, booth.depth) * 0.72,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.minZ = 0.05;
  camera.maxZ = 200;

  const light = new BABYLON.HemisphericLight("native-studio-ibl-fill", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 0.65;

  const key = new BABYLON.DirectionalLight("native-studio-key", new BABYLON.Vector3(-0.45, -1, -0.35), scene);
  key.intensity = 2.1;

  const floor = BABYLON.MeshBuilder.CreateBox(
    "native-booth-floor",
    { width: booth.width * 0.3048, depth: booth.depth * 0.3048, height: 0.035 },
    scene
  );
  const floorMaterial = new BABYLON.PBRMaterial("native-booth-floor-pbr", scene);
  floorMaterial.albedoColor = BABYLON.Color3.FromHexString("#303a44");
  floorMaterial.metallic = 0.08;
  floorMaterial.roughness = 0.48;
  floor.material = floorMaterial;

  for (const item of items) {
    const material = new BABYLON.PBRMaterial(`native-${item.type}-${item.id}-pbr`, scene);
    material.albedoColor = BABYLON.Color3.FromHexString(
      item.type === "Screen" || item.type === "Counter" || item.type === "Banner"
        ? brand.primaryColor || "#071f3e"
        : "#f1f4f3"
    );
    material.emissiveColor = BABYLON.Color3.FromHexString(brand.secondaryColor || "#1fb8ff").scale(0.08);
    material.metallic = item.type === "Screen" ? 0.32 : 0.16;
    material.roughness = item.type === "Screen" ? 0.22 : 0.38;

    const mesh = BABYLON.MeshBuilder.CreateBox(
      `native-${item.type}-${item.id}`,
      { width: 0.55, depth: 0.55, height: item.type === "Screen" || item.type === "Banner" ? 1.5 : 0.55 },
      scene
    );
    mesh.position.x = (item.x - booth.width / 2) * 0.3048;
    mesh.position.z = (item.y - booth.depth / 2) * 0.3048;
    mesh.position.y = mesh.getBoundingInfo().boundingBox.extendSize.y;
    mesh.rotation.y = BABYLON.Tools.ToRadians(-item.rotation);
    mesh.material = material;
  }

  const pipeline = new BABYLON.DefaultRenderingPipeline("native-pbr-post-pipeline", true, scene, [camera]);
  pipeline.bloomEnabled = true;
  pipeline.bloomWeight = 0.18;
  pipeline.fxaaEnabled = true;
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.exposure = 1;
  pipeline.imageProcessing.contrast = 1.08;

  return { scene, camera, pipeline };
}

export function getBabylonNativeSceneManifest() {
  return {
    runtime: "Babylon Native",
    sceneFactory: "createBabylonNativeBoothScene(engine, { booth, items, brand })",
    rendering: ["PBRMaterial", "DefaultRenderingPipeline", "HDR/IBL-ready environmentIntensity"],
  };
}
