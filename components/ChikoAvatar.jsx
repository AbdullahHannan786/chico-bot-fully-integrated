// components/Avatar.jsx
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF, useAnimations } from "@react-three/drei";

// Aliases → handle your clip names (Angry, Defeated, Talking, Waving, mixamo.com)
const ALIASES = {
  idle: ["idle", "mixamo.com", "rest", "breathing", "standing", "stand"],
  wave: ["waving", "wave", "hello", "greet"],
  talk: ["talking", "talk", "speak", "speaking"],
  angry: ["angry", "rage", "mad"],
  defeated: ["defeated", "sad", "defeat", "tired"],
};

function Model({ emotion }) {
  // Put file at: /public/models/character.glb
  const { scene, animations } = useGLTF("/models/character.glb", true);
  const group = useRef();
  const { actions, names } = useAnimations(animations, group);

  // Build case-insensitive name map once
  const nameMap = useMemo(() => {
    const m = {};
    names.forEach((n) => (m[n.toLowerCase()] = n));
    return m;
  }, [names]);

  const resolvedClip = useMemo(() => {
    const wanted = ALIASES[emotion] || ALIASES.idle;
    for (const alias of wanted) {
      const exact = nameMap[alias.toLowerCase()];
      if (exact) return exact;
    }
    // Absolute fallback: first animation if available
    return names[0];
  }, [emotion, nameMap, names]);

  // Materials → correct color/tone mapping, keep embedded materials
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (obj.material.map) obj.material.map.colorSpace = THREE.SRGBColorSpace;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Crossfade to the chosen clip
  useEffect(() => {
    if (!resolvedClip || !actions) return;
    Object.values(actions).forEach((a) => a?.fadeOut?.(0.2));
    const a = actions[resolvedClip];
    a?.reset()?.setLoop(THREE.LoopRepeat, Infinity)?.fadeIn(0.2)?.play?.();
    return () => a?.fadeOut?.(0.2);
  }, [resolvedClip, actions]);

  // Keep mixer running
  useFrame((_, dt) => {
    // useAnimations handles mixer internally, nothing required here,
    // but keeping group render-safe.
  });

  // Position/scale to show the full body (tuned for your rig)
  return <primitive ref={group} object={scene} dispose={null} position={[0, -2.2, 0]} scale={1.25} />;
}

export default function Avatar({ emotion = "idle" }) {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.6, 6], fov: 40, near: 0.1, far: 100 }}
        gl={{ outputColorSpace: THREE.SRGBColorSpace, physicallyCorrectLights: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        {/* Light-blue sky like your 3001 app */}
        <color attach="background" args={["#b3d9ff"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} castShadow />
        <Environment preset="studio" />

        <Suspense fallback={null}>
          <Model emotion={emotion} />
        </Suspense>

        <OrbitControls
          enableZoom
          enableRotate
          enablePan={false}
          minDistance={2.2}
          maxDistance={8}
          target={[0, 0.6, 0]}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 6}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

// Preload for snappy first render
useGLTF.preload("/models/character.glb");
