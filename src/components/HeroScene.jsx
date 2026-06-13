import React, { useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, Lightformer, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

/**
 * HeroScene — a fully procedural react-three-fiber backdrop for the storefront
 * hero. No .glb / .hdr / image assets: geometry primitives, metallic standard
 * materials, and inline Lightformers for glossy reflections.
 *
 * A glossy "signature" torus-knot floats among scattered tech-shapes, the whole
 * rig drifts toward the cursor, and a sparkle field adds premium dust. Lazy
 * loaded and only mounted on capable GPUs (Home decides), so weak devices fall
 * back to a pure-CSS gradient hero.
 */

const BLUE = '#2874f0';
const PINK = '#f50057';
const INDIGO = '#4f46e5';
const SKY = '#38bdf8';

function SignatureKnot({ quality }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.25;
      ref.current.rotation.z += delta * 0.08;
    }
  });
  const seg = quality === 'high' ? [220, 32] : [140, 20];
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.9}>
      <mesh ref={ref} scale={1.15}>
        <torusKnotGeometry args={[1.1, 0.34, seg[0], seg[1]]} />
        <meshStandardMaterial color={BLUE} metalness={0.95} roughness={0.12} envMapIntensity={1.6} />
      </mesh>
    </Float>
  );
}

function FloatingShapes() {
  const shapes = useMemo(
    () => [
      { type: 'ico', pos: [-3.4, 1.5, -1], scale: 0.62, color: PINK },
      { type: 'box', pos: [3.3, 1.9, -1.5], scale: 0.6, color: SKY },
      { type: 'octa', pos: [3.6, -1.6, -0.5], scale: 0.7, color: INDIGO },
      { type: 'box', pos: [-3.6, -1.7, -1], scale: 0.5, color: BLUE },
      { type: 'ico', pos: [-1.6, 2.6, -2], scale: 0.42, color: SKY },
      { type: 'octa', pos: [2.0, 2.5, -2.4], scale: 0.5, color: PINK },
    ],
    []
  );
  return (
    <>
      {shapes.map((s, i) => (
        <Float key={i} speed={1 + (i % 4) * 0.25} rotationIntensity={1.1} floatIntensity={1.4}>
          {s.type === 'box' ? (
            <RoundedBox args={[1, 1, 1]} radius={0.16} smoothness={4} position={s.pos} scale={s.scale}>
              <meshStandardMaterial color={s.color} metalness={0.85} roughness={0.18} envMapIntensity={1.3} />
            </RoundedBox>
          ) : (
            <mesh position={s.pos} scale={s.scale}>
              {s.type === 'ico' ? <icosahedronGeometry args={[1, 0]} /> : <octahedronGeometry args={[1, 0]} />}
              <meshStandardMaterial color={s.color} metalness={0.85} roughness={0.2} envMapIntensity={1.3} flatShading />
            </mesh>
          )}
        </Float>
      ))}
    </>
  );
}

function Rig({ pointerRef, quality }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (!group.current) return;
    const p = pointerRef.current;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, p.x * 0.4, 4, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -p.y * 0.25, 4, delta);
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, p.x * 0.5, 4, delta);
  });
  return (
    <group ref={group}>
      <SignatureKnot quality={quality} />
      <FloatingShapes />
      <Sparkles count={quality === 'high' ? 80 : 40} scale={[12, 7, 5]} size={3} speed={0.3} opacity={0.6} color="#ffffff" />
    </group>
  );
}

const HeroScene = ({ quality = 'mid', onLost }) => {
  const pointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onMove = e => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <Canvas
      dpr={[1, quality === 'high' ? 1.8 : 1.3]}
      camera={{ position: [0, 0, 8], fov: 42 }}
      gl={{ antialias: quality === 'high', alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          'webglcontextlost',
          e => {
            e.preventDefault();
            if (onLost) onLost();
          },
          { once: true }
        );
      }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <pointLight position={[6, 5, 6]} intensity={1.4} color={BLUE} />
        <pointLight position={[-6, -3, 3]} intensity={1.1} color={PINK} />
        <Rig pointerRef={pointerRef} quality={quality} />
        <Environment resolution={256} frames={1}>
          <color attach="background" args={['#0a0f1f']} />
          <Lightformer intensity={2.4} position={[4, 3, 4]} scale={[7, 7, 1]} color="#ffffff" />
          <Lightformer intensity={2} position={[-5, -1, 3]} scale={[6, 6, 1]} color={BLUE} />
          <Lightformer intensity={1.6} position={[0, 4, -4]} scale={[10, 4, 1]} color={PINK} />
        </Environment>
      </Suspense>
    </Canvas>
  );
};

export default HeroScene;
