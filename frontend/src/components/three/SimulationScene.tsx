'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Stars } from '@react-three/drei';
import { useGameStore } from '@/lib/gameStore';
import * as THREE from 'three';

function Terrain() {
  return (
    <>
      <Grid
        args={[500, 500]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#003300"
        sectionSize={50}
        sectionThickness={1}
        sectionColor="#004400"
        fadeDistance={500}
        fadeStrength={1}
        infiniteGrid
        position={[0, -0.5, 0]}
      />
    </>
  );
}

function DroneTarget() {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useGameStore((s) => s.phase);
  const distance = useGameStore((s) => s.droneDistance);
  
  const showDrone = ['DETECTED', 'CLASSIFYING', 'AWAITING_ACTION', 'WRONG_ACTION', 'CORRECT_ACTION', 'ENGAGEMENT'].includes(phase);
  const isNeutralized = phase === 'NEUTRALIZED';

  useFrame((state) => {
    if (!meshRef.current) return;
    if (!showDrone && !isNeutralized) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    
    // Position based on distance
    const normalizedDist = distance / 2000;
    meshRef.current.position.x = normalizedDist * 200;
    meshRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 2) * 3;
    meshRef.current.position.z = -normalizedDist * 80;
    
    // Rotate
    meshRef.current.rotation.y += 0.02;
    
    // Scale pulsing for threat
    if (phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION') {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  const color = isNeutralized ? '#004400' : (phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION') ? '#ff0033' : '#ff6600';

  return (
    <mesh ref={meshRef} visible={false}>
      <octahedronGeometry args={[3, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isNeutralized ? 0.1 : 0.8}
        wireframe={!isNeutralized}
        transparent={isNeutralized}
        opacity={isNeutralized ? 0.3 : 1}
      />
    </mesh>
  );
}

function SensorCone() {
  const coneRef = useRef<THREE.Mesh>(null);
  const phase = useGameStore((s) => s.phase);
  
  const showCone = phase !== 'BRIEFING';
  
  useFrame(() => {
    if (coneRef.current) {
      coneRef.current.rotation.y += 0.005;
    }
  });

  if (!showCone) return null;

  return (
    <mesh ref={coneRef} position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[100, 60, 32, 1, true]} />
      <meshStandardMaterial
        color="#00ff41"
        wireframe
        transparent
        opacity={0.08}
      />
    </mesh>
  );
}

function ExplosionEffect() {
  const phase = useGameStore((s) => s.phase);
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      direction: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize(),
      speed: 0.5 + Math.random() * 2,
    }));
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    if (phase !== 'NEUTRALIZED') {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      mesh.position.add(particles[i].direction.clone().multiplyScalar(particles[i].speed * 0.3));
      mesh.scale.multiplyScalar(0.97);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity *= 0.98;
    });
  });

  return (
    <group ref={groupRef} position={[40, 30, -20]}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.5 + Math.random(), 4, 4]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff3300"
            emissiveIntensity={2}
            transparent
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function SimulationScene() {
  return (
    <Canvas
      camera={{ position: [100, 80, 100], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#050a12' }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[50, 100, 50]} intensity={0.5} color="#88aaff" />
      <pointLight position={[0, 20, 0]} intensity={1} color="#00ff41" distance={200} />
      
      <Stars radius={300} depth={100} count={3000} factor={4} saturation={0} fade speed={0.5} />
      
      <Terrain />
      <DroneTarget />
      <SensorCone />
      <ExplosionEffect />
      
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={300}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      <fog attach="fog" args={['#050a12', 100, 500]} />
    </Canvas>
  );
}
