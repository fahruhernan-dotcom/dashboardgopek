import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Custom SimpleTimer to replace deprecated THREE.Clock
class SimpleTimer {
  constructor() {
    this.startTime = performance.now()
    this.prevTime = this.startTime
    this.elapsedTime = 0
    this.running = true
  }
  
  getDelta() {
    const now = performance.now()
    const delta = (now - this.prevTime) / 1000
    this.prevTime = now
    this.elapsedTime += delta
    return delta
  }
  
  getElapsedTime() {
    return this.elapsedTime
  }
  
  start() {
    this.startTime = performance.now()
    this.prevTime = this.startTime
    this.running = true
  }
  
  stop() {
    this.running = false
  }
}

const globalClock = new SimpleTimer();

const Ring = ({ 
  index, 
  color, 
  colorTwo, 
  speed, 
  lineThickness, 
  radius, 
  opacity, 
  noiseAmount,
  mouse,
  mouseInfluence,
  parallax,
  ringGap = 1.6,
  attenuation = 10,
}) => {
  const meshRef = useRef();
  const materialRef = useRef();
  
  // Use ringGap for Z positioning
  const initialPos = useMemo(() => [0, 0, index * -0.1 * ringGap], [index, ringGap]);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // We update the clock once per frame. 
    // Since useFrame runs for all 5 rings, we just want to ensure it ticks.
    // However, THREE.Clock-style getDelta is problematic if called multiple times.
    // For this implementation, we'll just use the already calculated elapsedTime.
    if (index === 0) globalClock.getDelta(); 
    const t = globalClock.getElapsedTime();
    
    // Rotation animation influenced by attenuation
    const rotSpeed = speed * (index % 2 === 0 ? 1 : -1) * (0.2 + (attenuation / 100));
    meshRef.current.rotation.z += delta * rotSpeed;
    meshRef.current.rotation.x = Math.sin(t * 0.5 + index) * 0.05;
    meshRef.current.rotation.y = Math.cos(t * 0.5 + index) * 0.05;

    // Mouse influence with parallax
    const targetX = mouse.current[0] * mouseInfluence * (1 + index * parallax);
    const targetY = mouse.current[1] * mouseInfluence * (1 + index * parallax);
    
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.05;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.05;

    // Shimmer material
    if (materialRef.current) {
       materialRef.current.distort = noiseAmount + Math.sin(t * speed + index) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={initialPos}>
      <ringGeometry args={[radius, radius + lineThickness * 0.008, 64]} />
      <MeshDistortMaterial
        ref={materialRef}
        color={index % 2 === 0 ? color : colorTwo}
        speed={speed}
        distort={noiseAmount}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        emissive={index % 2 === 0 ? color : colorTwo}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
};

const MagicRings = ({
  color = "#021a02",
  colorTwo = "#021a02",
  ringCount = 5,
  speed = 0.7,
  attenuation = 10,
  lineThickness = 1.2,
  baseRadius = 0.4,
  radiusStep = 0.09,
  scaleRate: _scaleRate = 0.07,
  opacity = 0.65,
  noiseAmount = 0.06,
  followMouse = true,
  mouseInfluence = 0.12,
  parallax = 0.03,
  ringGap = 1.6,
}) => {
  const mouse = useRef([0, 0]);

  const onMouseMove = (e) => {
    if (!followMouse) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.current = [x, y];
  };

  return (
    <div 
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, outline: 'none' }}
      onMouseMove={onMouseMove}
    >
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <group>
          {Array.from({ length: ringCount }).map((_, i) => (
            <Ring
              key={i}
              index={i}
              color={color}
              colorTwo={colorTwo}
              speed={speed}
              lineThickness={lineThickness}
              radius={baseRadius + i * radiusStep}
              opacity={opacity * (1 - i / (ringCount + 1.5))}
              noiseAmount={noiseAmount}
              mouse={mouse}
              mouseInfluence={mouseInfluence}
              parallax={parallax}
              ringGap={ringGap}
              attenuation={attenuation}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
};

export default MagicRings;
