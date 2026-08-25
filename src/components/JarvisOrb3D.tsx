/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface JarvisOrb3DProps {
  isSpeaking: boolean;
  isListening: boolean;
  forcedState?: 'idle' | 'écoute' | 'parole';
  onStateChange?: (state: 'idle' | 'écoute' | 'parole') => void;
}

export const JarvisOrb3D: React.FC<JarvisOrb3DProps> = ({ 
  isSpeaking, 
  isListening,
  forcedState,
  onStateChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const effectiveSpeaking = isSpeaking || forcedState === 'parole';
  const effectiveListening = isListening || forcedState === 'écoute';
  const isSpeakingRef = useRef<boolean>(effectiveSpeaking);
  const isListeningRef = useRef<boolean>(effectiveListening);
  const [webglAvailable, setWebglAvailable] = useState<boolean>(true);

  // Keep live references updated without re-running Three.js initialization
  useEffect(() => {
    isSpeakingRef.current = isSpeaking || forcedState === 'parole';
    isListeningRef.current = isListening || forcedState === 'écoute';
  }, [isSpeaking, isListening, forcedState]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Check WebGL support safely before creating renderer
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!checkWebGL()) {
      setWebglAvailable(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number = 0;

    // Determine device capabilities
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const width = currentMount.clientWidth || window.innerWidth || 800;
    const height = currentMount.clientHeight || window.innerHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 5;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        precision: isMobile ? 'mediump' : 'highp',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
      currentMount.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to CSS Orb:', e);
      setWebglAvailable(false);
      return;
    }

    // 1. Central Complex Wireframe Core (Tony Stark FUI Style)
    // Use detail 2 (subdivision 2) instead of 4 for maximum performance & stability
    const geometry = new THREE.IcosahedronGeometry(1.6, isMobile ? 1 : 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Inner glowing core sphere
    const innerGeo = new THREE.SphereGeometry(1.05, isMobile ? 16 : 24, isMobile ? 16 : 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.35,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerSphere);

    // 2. Full-Screen Atmospheric Cloud of Atoms & Particles
    const particleCount = isMobile ? 1000 : 2200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 2.0 + Math.random() * (isMobile ? 5.0 : 6.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: isMobile ? 0.05 : 0.04,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 3. Cosmic Orbital Rings
    const ringGroup = new THREE.Group();
    const ringsCount = isMobile ? 2 : 3;
    const ringGeometries: THREE.RingGeometry[] = [];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];

    for (let i = 0; i < ringsCount; i++) {
      const ringGeo = new THREE.RingGeometry(2.5 + i * 0.9, 2.52 + i * 0.9, isMobile ? 32 : 48);
      ringGeometries.push(ringGeo);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x38bdf8 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25 - i * 0.05,
        wireframe: true,
      });
      ringMaterials.push(ringMat);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / (2.5 + i);
      ringMesh.rotation.y = Math.PI / (3 + i);
      ringGroup.add(ringMesh);
    }
    scene.add(ringGroup);

    // 4. Cosmic Network Connecting Lines
    const lineCount = isMobile ? 120 : 300;
    const linePositions = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount * 6; i += 6) {
      const idx1 = Math.floor(Math.random() * particleCount) * 3;
      const idx2 = Math.floor(Math.random() * particleCount) * 3;
      linePositions[i] = particlePositions[idx1];
      linePositions[i + 1] = particlePositions[idx1 + 1];
      linePositions[i + 2] = particlePositions[idx1 + 2];
      linePositions[i + 3] = particlePositions[idx2];
      linePositions[i + 4] = particlePositions[idx2 + 1];
      linePositions[i + 5] = particlePositions[idx2 + 2];
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const cosmicLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(cosmicLines);

    // Animation Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      sphere.rotation.x = elapsedTime * 0.25;
      sphere.rotation.y = elapsedTime * 0.35;
      innerSphere.rotation.y = -elapsedTime * 0.45;
      particleSystem.rotation.y = elapsedTime * 0.08;
      ringGroup.rotation.z = elapsedTime * 0.15;
      cosmicLines.rotation.y = elapsedTime * 0.08;

      // Pulse reaction based on mutable refs
      const speaking = isSpeakingRef.current;
      const listening = isListeningRef.current;

      let pulseSpeed = 2.0;
      let pulseMagnitude = 0.06;

      if (speaking) {
        pulseSpeed = 8.5;
        pulseMagnitude = 0.18;
        material.color.setHex(0xfcd34d);
        particleMaterial.color.setHex(0xfcd34d);
        lineMaterial.color.setHex(0xfcd34d);
        lineMaterial.opacity = 0.35;
      } else if (listening) {
        pulseSpeed = 6.0;
        pulseMagnitude = 0.14;
        material.color.setHex(0x38bdf8);
        particleMaterial.color.setHex(0x38bdf8);
        lineMaterial.color.setHex(0x38bdf8);
        lineMaterial.opacity = 0.35;
      } else {
        material.color.setHex(0xf59e0b);
        particleMaterial.color.setHex(0xfbbf24);
        lineMaterial.color.setHex(0xf59e0b);
        lineMaterial.opacity = 0.18;
      }

      const scale = 1 + Math.sin(elapsedTime * pulseSpeed) * pulseMagnitude;
      sphere.scale.set(scale, scale, scale);

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    const handleResize = () => {
      if (!currentMount || !renderer) return;
      const w = currentMount.clientWidth || window.innerWidth;
      const h = currentMount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      animate();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('webglcontextlost', handleContextLost, false);
    domElem.addEventListener('webglcontextrestored', handleContextRestored, false);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (domElem) {
        domElem.removeEventListener('webglcontextlost', handleContextLost);
        domElem.removeEventListener('webglcontextrestored', handleContextRestored);
      }
      cancelAnimationFrame(animationFrameId);

      if (currentMount && renderer?.domElement && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }

      if (renderer) {
        try {
          renderer.dispose();
          renderer.forceContextLoss();
        } catch (e) {}
      }

      // Memory cleanup
      geometry.dispose();
      material.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      ringGeometries.forEach((g) => g.dispose());
      ringMaterials.forEach((m) => m.dispose());
    };
  }, []); // Run ONLY once on mount to prevent context exhaustion!

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      {webglAvailable ? (
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      ) : (
        /* CSS / SVG Holographic Fallback for devices without WebGL */
        <div className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80">
          <div
            className={`absolute inset-0 rounded-full border-2 border-dashed ${
              isSpeaking
                ? 'border-amber-300 animate-spin scale-110 shadow-[0_0_50px_rgba(252,211,77,0.5)]'
                : isListening
                ? 'border-sky-400 animate-spin scale-105 shadow-[0_0_50px_rgba(56,189,248,0.5)]'
                : 'border-amber-500/40 animate-[spin_12s_linear_infinite]'
            }`}
          />
          <div
            className={`w-32 h-32 rounded-full border border-amber-400/60 flex items-center justify-center ${
              isSpeaking
                ? 'bg-amber-400/20 scale-125 animate-pulse'
                : isListening
                ? 'bg-sky-400/20 scale-110 animate-pulse'
                : 'bg-amber-500/10 animate-pulse'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full shadow-[0_0_30px_#f59e0b] ${
                isSpeaking ? 'bg-amber-300' : isListening ? 'bg-sky-400' : 'bg-amber-500'
              }`}
            />
          </div>
        </div>
      )}

      {/* Edge-to-edge full screen cosmic FUI corner nodes and laser lines */}
      <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
            <div className="w-10 md:w-16 h-[1px] bg-amber-500/40" />
            <span className="font-mono text-[8px] md:text-[9px] text-amber-500/60 tracking-widest">SYS.GRID.01</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[8px] md:text-[9px] text-amber-500/60 tracking-widest">QUANTUM.SECURE</span>
            <div className="w-10 md:w-16 h-[1px] bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
            <div className="w-10 md:w-16 h-[1px] bg-amber-500/40" />
            <span className="font-mono text-[8px] md:text-[9px] text-amber-500/60 tracking-widest">CORE.ACTIVE</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[8px] md:text-[9px] text-amber-500/60 tracking-widest">STARK_OS_v10</span>
            <div className="w-10 md:w-16 h-[1px] bg-amber-500/40" />
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
          </div>
        </div>
      </div>
    </div>
  );
};
