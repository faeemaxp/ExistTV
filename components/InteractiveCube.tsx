'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function InteractiveCube() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 4.5);

    // ── Cube ───────────────────────────────────────────────────
    const geo = new THREE.BoxGeometry(1.7, 1.7, 1.7);

    const faceMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.04, metalness: 0.96 }),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.04, metalness: 0.96 }),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.04, metalness: 0.96 }),
      new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.04, metalness: 0.96 }),
      new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.04, metalness: 0.96 }),
      new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.04, metalness: 0.96 }),
    ];

    const cube = new THREE.Mesh(geo, faceMaterials);
    scene.add(cube);

    // Edge lines
    const edgesGeo = new THREE.EdgesGeometry(geo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    cube.add(edges);

    // Rim glow
    const rimGeo = new THREE.BoxGeometry(1.715, 1.715, 1.715);
    const rimMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.035,
      side: THREE.BackSide,
    });
    cube.add(new THREE.Mesh(rimGeo, rimMat));

    // ── Particles ─────────────────────────────────────────────
    const N = 120;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // ── Lighting ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));

    const key = new THREE.DirectionalLight(0xffffff, 3.8);
    key.position.set(-4, 5, 3);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 1.4);
    fill.position.set(5, 2, 2);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0xffffff, 2.2);
    back.position.set(0, 3, -5);
    scene.add(back);

    // ── Interaction state ──────────────────────────────────────
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotX = 0.3;
    let targetRotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      velX = 0;
      velY = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      velX = dx * 0.013;
      velY = dy * 0.013;
      targetRotY += velX;
      targetRotX += velY;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const onMouseEnter = () => { edgesMat.opacity = 0.45; };
    const onMouseLeave = () => { edgesMat.opacity = 0.2; isDragging = false; };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('mouseenter', onMouseEnter);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);

    // ── Resize ─────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    // ── Animation ─────────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) {
        velX *= 0.93;
        velY *= 0.93;
        targetRotY += velX;
        targetRotX += velY;
        targetRotY += 0.0035; // idle spin
      }

      cube.rotation.y = targetRotY;
      cube.rotation.x = targetRotX;
      cube.position.y = Math.sin(t * 0.55) * 0.14;

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('mouseenter', onMouseEnter);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      geo.dispose();
      edgesGeo.dispose();
      edgesMat.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      faceMaterials.forEach((m) => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="cube-viewport"
    />
  );
}
