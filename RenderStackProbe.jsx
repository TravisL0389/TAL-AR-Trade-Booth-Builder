import { useEffect, useRef } from "react";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.pure.js";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.pure.js";
import { Scene } from "@babylonjs/core/scene.js";

function getBabylonNativeSceneManifest() {
  return {
    runtime: "Babylon Native",
    sceneFactory: "createBabylonNativeBoothScene(engine, { booth, items, brand })",
    rendering: ["PBRMaterial", "DefaultRenderingPipeline", "HDR/IBL-ready environmentIntensity"],
  };
}

export default function RenderStackProbe({ booth, items, brand }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    let disposed = false;
    let engine = null;
    let scene = null;
    let environmentTexture = null;

    async function mountBabylonProbe() {
      if (disposed) {
        return;
      }

      engine = new Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      scene = new Scene(engine);
      scene.clearColor = Color4.FromHexString("#06111cff");
      scene.environmentIntensity = 0.85;
      scene.metadata = {
        stack: "Babylon.js web probe",
        native: getBabylonNativeSceneManifest(),
        boothItems: items.length,
      };

      environmentTexture = CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/environmentSpecular.env",
        scene
      );
      scene.environmentTexture = environmentTexture;

      const camera = new ArcRotateCamera("babylon-pbr-camera", Math.PI * 0.72, Math.PI * 0.34, 4.4, Vector3.Zero(), scene);
      camera.attachControl(canvas, false);

      const light = new HemisphericLight("babylon-ibl-fill", new Vector3(0, 1, 0), scene);
      light.intensity = 0.45;

      const material = new PBRMaterial("babylon-brand-pbr", scene);
      material.albedoColor = Color3.FromHexString(brand.primaryColor || "#071f3e");
      material.emissiveColor = Color3.FromHexString(brand.secondaryColor || "#1fb8ff").scale(0.1);
      material.metallic = 0.62;
      material.roughness = 0.24;

      const mesh = CreateBox(
        "babylon-pbr-booth-sample",
        { width: Math.max(0.4, booth.width / 48), height: 0.42, depth: Math.max(0.4, booth.depth / 64) },
        scene
      );
      mesh.material = material;

      const pipeline = new DefaultRenderingPipeline("babylon-pbr-post-pipeline", true, scene, [camera]);
      pipeline.bloomEnabled = true;
      pipeline.bloomWeight = 0.2;
      pipeline.fxaaEnabled = true;
      pipeline.imageProcessingEnabled = true;
      pipeline.imageProcessing.toneMappingEnabled = true;
      pipeline.imageProcessing.exposure = 1;
      pipeline.imageProcessing.contrast = 1.06;

      engine.runRenderLoop(() => scene.render());
    }

    mountBabylonProbe().catch(() => {
      if (!disposed) {
        canvas.dataset.renderStack = "babylon-pbr-postprocess-ibl-unavailable";
      }
    });

    return () => {
      disposed = true;
      engine?.stopRenderLoop();
      environmentTexture?.dispose();
      scene?.dispose();
      engine?.dispose();
    };
  }, [booth.depth, booth.width, brand.primaryColor, brand.secondaryColor, items.length]);

  return (
    <canvas
      ref={canvasRef}
      className="render-stack-probe-canvas render-stack-probe-canvas--babylon"
      aria-hidden="true"
      data-render-stack="babylon-pbr-postprocess-ibl"
    />
  );
}
