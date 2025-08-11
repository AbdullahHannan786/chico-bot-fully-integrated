// components/ChikoAvatar.jsx
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF, useAnimations } from "@react-three/drei";

// Minimal animation map – adjust names to your model's clips if needed
const EMOTION_TO_CLIP = {
  talking: ["Talking", "Talk", "Idle"],       // falls back to Idle
  excited_hello: ["Wave", "Hello", "Greet", "Idle"],
  waving: ["Wave", "Hello", "Greet", "Idle"],
  angry: ["Angry", "Frustrated", "Idle"],
  defeated: ["Defeated", "Sad", "Idle"],
  idle: ["Idle", "Breathing", "Rest"],
};

function Model({ emotion }) {
  // Put your model in /public/models/chiko.glb (or change path)
  const { scene, animations } = useGLTF("/models/chiko.glb");
  const group = useRef();
  const { actions, names } = useAnimations(animations, group);

  // Pick the first clip that exists
  const clipName = useMemo(() => {
    const wanted = EMOTION_TO_CLIP[emotion] || EMOTION_TO_CLIP.idle;
    return wanted.find((n) => names.includes(n)) || names[0]; // fallback to first
  }, [emotion, names]);

  useEffect(() => {
    if (!clipName || !actions) return;
    // fade into the selected action
    Object.values(actions).forEach((a) => a?.fadeOut?.(0.2));
    const action = actions[clipName];
    action?.reset()?.fadeIn(0.2)?.play?.();
    return () => action?.fadeOut?.(0.2);
  }, [clipName, actions]);

  // Slow idle rotation so it doesn’t feel static
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
  });

  return <primitive ref={group} object={scene} dispose={null} />;
}

export default function ChikoAvatar({ emotion = "talking" }) {
  return (
    <div className="chiko-canvas">
      <Canvas camera={{ position: [0, 1.2, 2.6], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Model emotion={emotion} />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={2} maxDistance={4} />
      </Canvas>
    </div>
  );
}

// Preload the GLB for faster first render
useGLTF.preload("/models/chiko.glb");
