"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import gsap from "gsap";

/* The welcome sequence belongs to the homepage alone — every other page should
   load straight into its content (and never have its scroll locked for it).

   The decision is taken once, when the site layout mounts, so it follows the
   page the visitor actually landed on. The layout survives client-side
   navigation, which means coming back to / later never replays the intro. */
export default function Preloader() {
  const pathname = usePathname();
  const [enabled] = useState(() => pathname === "/");

  useEffect(() => {
    if (enabled) return;
    /* No intro on this load, so release anything waiting on it right away —
       the hero holds its entrance animation until this fires. */
    (
      window as unknown as { __preloaderComplete?: boolean }
    ).__preloaderComplete = true;
    window.dispatchEvent(new Event("preloaderComplete"));
  }, [enabled]);

  return enabled ? <PreloaderOverlay /> : null;
}

function PreloaderOverlay() {
  const [progress, setProgress] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable scrolling during load
    document.body.style.overflow = "hidden";

    // Preload video in the background
    const videoReq = new XMLHttpRequest();
    videoReq.open("GET", "/hero-particles.mp4", true);
    videoReq.responseType = "blob";
    videoReq.send();

    // Setup Three.js WebGL Particle Morph
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let points: THREE.Points;
    let material: THREE.ShaderMaterial;
    let animationFrameId: number;

    const count = 8000; // Increased particle count for premium density and detail

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
        const r = 1.1 + Math.random() * 0.3;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }

      // State 1: Flowing Sine Wave Helix
      const wavePositions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const t = (i / count) * 4.0 - 2.0; // x coordinate from -2.0 to 2.0
        const angle = (i / count) * Math.PI * 12.0; // Helix spirals
        const r = 0.28;
        wavePositions[i * 3] = t;
        wavePositions[i * 3 + 1] = Math.sin(t * 3.0) * 0.45 + Math.sin(angle) * r;
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
        const speed = 4.5 + Math.random() * 4.5;
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

            // Use smoothstep for fluid transition morph easing
            float t = clamp(uProgress, 0.0, 2.0);
            if (t < 1.0) {
              float ease = smoothstep(0.0, 1.0, t);
              pos = mix(position, aWavePosition, ease);
            } else {
              float ease = smoothstep(0.0, 1.0, t - 1.0);
              pos = mix(aWavePosition, aExplodePosition, ease);
            }

            // High-fluidity organic 3D wave warp (sinusoidal fluid distortion)
            float speed = 1.6;
            float strength = 0.08;
            
            float distortX = sin(pos.y * 3.5 + uTime * speed) * strength + cos(pos.z * 4.5 + uTime * speed * 0.8) * (strength * 0.5);
            float distortY = cos(pos.x * 3.5 + uTime * speed) * strength + sin(pos.z * 4.5 + uTime * speed * 0.8) * (strength * 0.5);
            float distortZ = sin(pos.x * 4.0 + uTime * speed * 0.9) * strength + cos(pos.y * 4.0 + uTime * speed * 0.9) * (strength * 0.5);
            
            pos.x += distortX;
            pos.y += distortY;
            pos.z += distortZ;

            vPosition = pos;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Camera distance size attenuation with dynamic pulse wave
            gl_PointSize = (24.0 / -mvPosition.z) * (1.2 + sin(uTime * 2.5 + pos.x * 2.0) * 0.3);
          }
        `,
        fragmentShader: `
          varying vec3 vPosition;
          uniform THREE_COLOR uColor1;
          uniform THREE_COLOR uColor2;

          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;

            // Fluid soft circle particle falloff
            float alpha = smoothstep(0.5, 0.12, dist);

            // Interpolate colors based on Y position and depth Z for a rich volumetric look
            float mixFactor = clamp((vPosition.y + 0.5) * 0.7 + (vPosition.z + 0.2) * 0.3, 0.0, 1.0);
            vec3 color = mix(uColor1, uColor2, mixFactor);

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
          points.rotation.y = elapsedTime * 0.12;
          points.rotation.x = elapsedTime * 0.04;
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
          ease: "power2.inOut",
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

      {/* Welcome Display Text */}
      <div className="h-28 flex flex-col items-center justify-center pointer-events-none select-none z-10">
        <span className="eyebrow text-lime/50 mb-3 tracking-[0.25em] text-[10px] sm:text-xs">
          TECH NURTURE
        </span>
        <h2
          ref={textRef}
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[0.15em] text-center bg-gradient-to-r from-lime via-mist-200 to-teal bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(143,209,63,0.15)] font-display uppercase"
        >
          Welcome
        </h2>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-16 left-8 right-8 max-w-lg mx-auto flex flex-col gap-3 w-[calc(100%-4rem)] pointer-events-none z-10">
        <div className="flex justify-between items-end text-xs font-mono tracking-wider opacity-60">
          <span>LOADING</span>
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
