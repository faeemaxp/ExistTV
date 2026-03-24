'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MonolithBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    mount.appendChild(renderer.domElement);

    // ── Scene ─────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 6);
    camera.lookAt(0, 0.5, 0);

    // ── Monolith ──────────────────────────────────────────────
    const monolithGeo = new THREE.BoxGeometry(1, 3.2, 0.22);

    // Base dark material
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.05,
      metalness: 0.95,
      envMapIntensity: 1.2,
    });

    const monolith = new THREE.Mesh(monolithGeo, monolithMat);
    monolith.position.set(0, 0.6, 0);
    monolith.castShadow = true;
    monolith.receiveShadow = false;
    scene.add(monolith);

    // Edge glow geometry — slightly larger box, wireframe-ish rim
    const rimGeo = new THREE.BoxGeometry(1.008, 3.21, 0.23);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.copy(monolith.position);
    scene.add(rim);

    // Scanline overlay plane (front face only)
    const scanGeo = new THREE.PlaneGeometry(1, 3.2);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.018,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanPlane = new THREE.Mesh(scanGeo, scanMat);
    scanPlane.position.set(0, 0.6, 0.112);
    scene.add(scanPlane);

    // ── Floor reflection plane ─────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft floor glow disc
    const glowGeo = new THREE.CircleGeometry(1.2, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowDisc = new THREE.Mesh(glowGeo, glowMat);
    glowDisc.rotation.x = -Math.PI / 2;
    glowDisc.position.set(0, -0.99, 0);
    scene.add(glowDisc);

    // ── Lighting ──────────────────────────────────────────────
    // Ambient — very low
    const ambient = new THREE.AmbientLight(0xffffff, 0.06);
    scene.add(ambient);

    // Key light — cool white, left rim
    const keyLight = new THREE.DirectionalLight(0xddeeff, 2.5);
    keyLight.position.set(-3, 4, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    // Fill light — warm, right
    const fillLight = new THREE.DirectionalLight(0xfff0cc, 0.8);
    fillLight.position.set(4, 2, 1);
    scene.add(fillLight);

    // Back rim light — strong, creates silhouette
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);

    // Ground point
    const groundLight = new THREE.PointLight(0xffffff, 0.6, 6);
    groundLight.position.set(0, -0.8, 1.5);
    scene.add(groundLight);

    // ── Particles ─────────────────────────────────────────────
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Mouse parallax ────────────────────────────────────────
    let targetRotX = 0;
    let targetRotY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 0.35;
      targetRotX = ((e.clientY / window.innerHeight) - 0.5) * -0.15;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Resize ────────────────────────────────────────────────
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ── Animation loop ────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow idle sway
      monolith.rotation.y += (targetRotY - monolith.rotation.y) * 0.04;
      monolith.rotation.x += (targetRotX - monolith.rotation.x) * 0.04;
      rim.rotation.copy(monolith.rotation);
      scanPlane.rotation.copy(monolith.rotation);

      // Subtle vertical float
      const floatY = Math.sin(t * 0.4) * 0.06;
      monolith.position.y = 0.6 + floatY;
      rim.position.y = monolith.position.y;
      scanPlane.position.y = monolith.position.y;

      // Floor glow pulses with float
      const glowPulse = 0.04 + Math.sin(t * 0.8) * 0.015;
      glowMat.opacity = glowPulse;

      // Slow particle drift
      particles.rotation.y = t * 0.015;
      particles.rotation.x = t * 0.007;

      // Scanline scroll
      scanMat.opacity = 0.018 + Math.sin(t * 1.2) * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      monolithGeo.dispose();
      monolithMat.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      scanGeo.dispose();
      scanMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="monolith-canvas"
    />
  );
}
