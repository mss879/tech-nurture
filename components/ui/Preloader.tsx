"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const words = ["Clean Water", "Cool Air", "Total Confidence", "Welcome"];

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable scrolling during load
    document.body.style.overflow = "hidden";

    // Text word rotation sequence over 4 seconds
    const timeline = gsap.timeline();
    timeline
      .to({}, { duration: 1.0, onComplete: () => setWordIndex(1) })
      .to({}, { duration: 1.2, onComplete: () => setWordIndex(2) })
      .to({}, { duration: 1.0, onComplete: () => setWordIndex(3) });

    // Preload video in the background
    const videoReq = new XMLHttpRequest();
    videoReq.open("GET", "/hero-vid.mp4", true);
    videoReq.responseType = "blob";
    videoReq.send();

    // Setup Three.js WebGL Particle Morph
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let points: THREE.Points;
    let material: THREE.ShaderMaterial;
    let animationFrameId: number;

    const count = 3000; // Optimal performance particle count

    if (canvasContainerRef.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      canvasContainerRef.current.appendChild(renderer.domElement);

      // Scene & Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.z = 3.5;

      // Geometries
      const geometry = new THREE.BufferGeometry();

      // State 0: Sphere
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1.0 + Math.random() * 0.4;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }

      // State 1: Flowing Sine Wave Helix
      const wavePositions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * 4.0 - 2.0; // x coordinate from -2.0 to 2.0
        const angle = (i / count) * Math.PI * 12.0; // Helix spirals
        const r = 0.25;
        wavePositions[i * 3] = t;
        wavePositions[i * 3 + 1] = Math.sin(t * 3.0) * 0.4 + Math.sin(angle) * r;
        wavePositions[i * 3 + 2] = Math.cos(angle) * r;
      }

      // State 2: Explosion Dispersal (explodes from wave coordinates)
      const explodePositions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const x = wavePositions[i * 3];
        const y = wavePositions[i * 3 + 1];
        const z = wavePositions[i * 3 + 2];
        const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
        const dirX = x / len;
        const dirY = y / len;
        const dirZ = z / len;
        const speed = 4.0 + Math.random() * 4.0;
        explodePositions[i * 3] = x + dirX * speed;
        explodePositions[i * 3 + 1] = y + dirY * speed;
        explodePositions[i * 3 + 2] = z + dirZ * speed;
      }

      // Assign Buffer Attributes
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aWavePosition", new THREE.BufferAttribute(wavePositions, 3));
      geometry.setAttribute("aExplodePosition", new THREE.BufferAttribute(explodePositions, 3));

      // Shaders Material
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uProgress: { value: 0.0 },
          uTime: { value: 0.0 },
          uColor1: { value: new THREE.Color("#8fd13f") }, // Lime
          uColor2: { value: new THREE.Color("#0b5b66") }, // Teal
        },
        vertexShader: `
          uniform float uProgress;
          uniform float uTime;
          attribute vec3 aWavePosition;
          attribute vec3 aExplodePosition;
          varying vec3 vPosition;

          void main() {
            vec3 pos = position;

            if (uProgress < 1.0) {
              pos = mix(position, aWavePosition, uProgress);
            } else {
              pos = mix(aWavePosition, aExplodePosition, uProgress - 1.0);
            }

            // Gentle organic waving wave movement
            pos.x += sin(pos.y * 4.0 + uTime * 1.5) * 0.03;
            pos.y += cos(pos.x * 4.0 + uTime * 1.5) * 0.03;

            vPosition = pos;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Size with camera distance attenuation & pulsate effect
            gl_PointSize = (18.0 / -mvPosition.z) * (1.2 + sin(uTime * 2.0 + pos.x) * 0.3);
          }
        `,
        fragmentShader: `
          varying vec3 vPosition;
          uniform THREE_COLOR uColor1;
          uniform THREE_COLOR uColor2;

          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;

            // Soft particle circle mask
            float alpha = smoothstep(0.5, 0.15, dist);

            // Blend colors based on Y position
            vec3 color = mix(uColor1, uColor2, clamp(vPosition.y + 0.5, 0.0, 1.0));

            gl_FragColor = vec4(color, alpha * 0.85);
          }
        `
          // Note: Next.js and Tailwind compilation resolves THREE_COLOR to vec3 in compilation
          .replace(/THREE_COLOR/g, "vec3"),
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);

      // WebGL Resize handler
      const handleResize = () => {
        if (!renderer || !camera) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", handleResize);

      // Render Loop
      const clock = new THREE.Clock();
      const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        if (material) material.uniforms.uTime.value = elapsedTime;
        if (points) {
          points.rotation.y = elapsedTime * 0.08;
          points.rotation.x = elapsedTime * 0.03;
        }
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
        animationFrameId = requestAnimationFrame(tick);
      };
      tick();

      // Progress bar and state loader animation (exact 4-second sequence)
      const progressObj = { value: 0 };
      const loadingTimeline = gsap.timeline({
        onComplete: () => {
          // Trigger exit sequence
          const exitTl = gsap.timeline({
            onComplete: () => {
              // Enable scroll
              document.body.style.overflow = "";
              // Set global loading complete flag
              (window as any).__preloaderComplete = true;
              window.dispatchEvent(new Event("preloaderComplete"));
            },
          });

          exitTl
            .to([textRef.current, counterRef.current, progressLineRef.current], {
              opacity: 0,
              y: -15,
              duration: 0.5,
              stagger: 0.08,
              ease: "power3.inOut",
            })
            .to(
              containerRef.current,
              {
                yPercent: -100,
                duration: 1.0,
                ease: "power4.inOut",
              },
              "-=0.2"
            );
        },
      });

      // Morph progress uniform from 0.0 to 2.0 (Sphere -> Wave -> Explode)
      loadingTimeline.to(
        material.uniforms.uProgress,
        {
          value: 2.0,
          duration: 4.0,
          ease: "power1.inOut",
        },
        0
      );

      // Counter progress from 0% to 100%
      loadingTimeline.to(
        progressObj,
        {
          value: 100,
          duration: 4.0,
          ease: "power1.inOut",
          onUpdate: () => {
            setProgress(Math.round(progressObj.value));
          },
        },
        0
      );

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameId);

        // Geometries
        geometry.dispose();
        // Materials
        material.dispose();
        // Renderer
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      };
    }
  }, []);

  // Update visual bar width
  useEffect(() => {
    if (progressLineRef.current) {
      gsap.to(progressLineRef.current, {
        width: `${progress}%`,
        duration: 0.2,
        ease: "power1.out",
      });
    }
  }, [progress]);

  return (
    <div
      ref={containerRef}
      className="noise fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-mist select-none overflow-hidden"
      style={{ willChange: "transform" }}
    >
      {/* Three.js canvas container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full -z-10 bg-black"
      />

      {/* Radial overlay to dim corners */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none -z-5" 
           style={{ background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)" }}
      />

      {/* Rotating central text */}
      <div className="h-20 flex items-center justify-center pointer-events-none">
        <h2
          ref={textRef}
          className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-center text-white/90 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          {words[wordIndex]}
        </h2>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-16 left-8 right-8 max-w-lg mx-auto flex flex-col gap-3 w-[calc(100%-4rem)] pointer-events-none">
        <div className="flex justify-between items-end text-xs font-mono tracking-wider opacity-60">
          <span>WebGL HARMONIC FLOW</span>
          <span ref={counterRef}>{progress}%</span>
        </div>
        {/* Progress Line Track */}
        <div className="h-[1px] w-full bg-white/10 rounded-full overflow-hidden">
          {/* Active Progress Line */}
          <div
            ref={progressLineRef}
            className="h-full bg-lime w-0 rounded-full"
            style={{ width: "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
