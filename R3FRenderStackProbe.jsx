import { useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

function PostProcessingPipeline() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const effectComposer = new EffectComposer(gl);
    effectComposer.addPass(new RenderPass(scene, camera));
    effectComposer.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.12, 0.55, 0.82));
    effectComposer.addPass(new OutputPass());
    return effectComposer;
  }, [camera, gl, scene, size.height, size.width]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.height, size.width]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame(() => composer.render(), 1);
  return null;
}

export default function R3FRenderStackProbe({ brand }) {
  const accent = brand.secondaryColor || "#1fb8ff";
  return (
    <Canvas
      className="render-stack-probe-canvas"
      camera={{ position: [0, 0.8, 2.6], fov: 38 }}
      dpr={1}
      gl={{ antialias: true, alpha: true, outputColorSpace: THREE.SRGBColorSpace, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}
    >
      <color attach="background" args={["#06111c"]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[1.5, 2.2, 1.6]} intensity={2.2} color={accent} />
      <mesh rotation={[0.42, 0.62, 0.18]}>
        <boxGeometry args={[0.72, 0.72, 0.72]} />
        <meshStandardMaterial color={accent} roughness={0.24} metalness={0.78} emissive={accent} emissiveIntensity={0.08} />
      </mesh>
      <PostProcessingPipeline />
    </Canvas>
  );
}
