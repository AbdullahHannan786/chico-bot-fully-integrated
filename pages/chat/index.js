// /pages/chat/index.js
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX, useAnimations } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';

function Chiko({ emotion }) {
  const group = useRef();

  // Base model (no/one animation)
  const gltf = useGLTF('/models/chiko.glb');

  // Load external FBX animations (names set explicitly)
  const talkFBX = useFBX('/Talking.fbx');
  const waveFBX = useFBX('/Waving Gesture.fbx');
  const sadFBX  = useFBX('/Defeated.fbx');
  const angryFBX = useFBX('/Angry.fbx'); // optional

  // Name the clips so we can reference them easily
  if (talkFBX.animations?.[0]) talkFBX.animations[0].name = 'Talking';
  if (waveFBX.animations?.[0]) waveFBX.animations[0].name = 'Waving Gesture';
  if (sadFBX.animations?.[0])  sadFBX.animations[0].name  = 'Defeated';
  if (angryFBX.animations?.[0]) angryFBX.animations[0].name = 'Angry';

  const allClips = useMemo(() => ([
    ...(gltf.animations || []),
    ...(talkFBX.animations || []),
    ...(waveFBX.animations || []),
    ...(sadFBX.animations || []),
    ...(angryFBX.animations || []),
  ]), [gltf, talkFBX, waveFBX, sadFBX, angryFBX]);

  const { actions, names } = useAnimations(allClips, group);

  // Map UI emotion -> clip name (these must match the names above)
  const EMOTION_TO_CLIP = {
    idle: names.find(n => /idle/i.test(n)) || names[0], // fallback to first if no idle
    talk: 'Talking',
    wave: 'Waving Gesture',
    sad:  'Defeated',
    happy: 'Angry', // change if you have a real "Happy" clip
  };

  useEffect(() => {
    const clipName = EMOTION_TO_CLIP[emotion] || EMOTION_TO_CLIP.idle;
    const action = actions?.[clipName];
    if (!action) return;

    // fade to the requested clip
    Object.values(actions || {}).forEach(a => a?.fadeOut?.(0.2));
    action.reset().fadeIn(0.2).play();

    return () => action?.fadeOut?.(0.2);
  }, [emotion, actions]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={gltf.scene} />
    </group>
  );
}
useGLTF.preload('/models/chiko.glb');

export default function Chat3DPage() {
  const [emotion, setEmotion] = useState('idle');

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">Chico Chat</div>
            <div className="card-body bg-dark text-white" style={{height: 420}}>
              {/* your chat UI goes here */}
              <div className="d-flex align-items-end gap-2 position-absolute bottom-0 start-0 p-3 w-100">
                <input className="form-control" placeholder="Type a message..." />
                <button className="btn btn-primary">Send</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span>Chiko 3D</span>
              <div className="btn-group btn-group-sm">
                <button className="btn btn-outline-secondary" onClick={() => setEmotion('idle')}>Idle</button>
                <button className="btn btn-outline-secondary" onClick={() => setEmotion('talk')}>Talk</button>
                <button className="btn btn-outline-secondary" onClick={() => setEmotion('wave')}>Wave</button>
              </div>
            </div>
            <div className="card-body p-0" style={{height: 420}}>
              <Canvas camera={{ position: [0, 1.5, 3], fov: 40 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 5, 2]} intensity={1} />
                <Chiko emotion={emotion} />
                <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
              </Canvas>
            </div>
            <div className="card-footer d-flex gap-2 flex-wrap">
              <button className="btn btn-dark btn-sm" onClick={() => setEmotion('happy')}>😊 Happy</button>
              <button className="btn btn-dark btn-sm" onClick={() => setEmotion('sad')}>😔 Sad</button>
              <button className="btn btn-dark btn-sm" onClick={() => setEmotion('talk')}>🗣️ Talk</button>
              <button className="btn btn-dark btn-sm" onClick={() => setEmotion('wave')}>👋 Wave</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
