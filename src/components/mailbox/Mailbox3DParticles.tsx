"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface Mailbox3DParticlesProps {
  className?: string;
  count?: number;
}

export function Mailbox3DParticles({
  className = "",
  count = 45,
}: Mailbox3DParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Crear Escena Three.js
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Cámara en perspectiva
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 180;

    // 3. Renderer WebGL con fondo transparente
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Geometría de partículas luminosas
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 320;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 260;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;

      speeds[i] = 0.2 + Math.random() * 0.35;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // 5. Textura circular suave generada con canvas
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(220, 240, 255, 0.8)");
      gradient.addColorStop(0.7, "rgba(180, 220, 250, 0.3)");
      gradient.addColorStop(1, "rgba(180, 220, 250, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 4.5,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x9dc6ec,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 6. Bucle de animación suave
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        // Ascenso suave
        pos[i * 3 + 1] += speeds[i];
        // Oscilación lateral armónica
        pos[i * 3] += Math.sin(elapsedTime * 0.8 + i) * 0.15;

        // Reiniciar abajo si sale por arriba
        if (pos[i * 3 + 1] > 140) {
          pos[i * 3 + 1] = -140;
          pos[i * 3] = (Math.random() - 0.5) * 320;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Rotación suave del campo
      particles.rotation.y = elapsedTime * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Manejador de redimensionado
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none -z-10 overflow-hidden ${className}`}
    />
  );
}
