"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

/**
 * WebGL animated "liquid light" backdrop.
 * A fullscreen fragment shader blends the TechNature palette
 * (navy → teal → green → lime) through flowing fbm noise +
 * caustic ripples, with a soft pointer-reactive light.
 */
export default function LiquidBackground({
  className = "",
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    el.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const geometry = new Triangle(gl);

    const vertex = /* glsl */ `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;

      // palette
      const vec3 INK   = vec3(0.039, 0.078, 0.063);
      const vec3 NAVY  = vec3(0.020, 0.184, 0.266);
      const vec3 TEAL  = vec3(0.043, 0.356, 0.400);
      const vec3 GREEN = vec3(0.122, 0.572, 0.262);
      const vec3 LIME  = vec3(0.560, 0.819, 0.247);

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        float a = hash(i);
        float b = hash(i+vec2(1.0,0.0));
        float c = hash(i+vec2(0.0,1.0));
        float d = hash(i+vec2(1.0,1.0));
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }

      float fbm(vec2 p){
        float v = 0.0;
        float amp = 0.55;
        for(int i=0;i<6;i++){
          v += amp * noise(p);
          p *= 2.02;
          amp *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 uv = vUv;
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        vec2 p = uv;
        p.x *= aspect;

        float t = uTime * 0.05;

        // flowing domain-warped fbm (liquid)
        vec2 q = vec2(fbm(p + t), fbm(p - t + 5.2));
        vec2 r = vec2(
          fbm(p + 1.7*q + vec2(1.7, 9.2) + 0.15*t),
          fbm(p + 1.7*q + vec2(8.3, 2.8) - 0.12*t)
        );
        float f = fbm(p + 2.4*r);

        // caustic ripples
        float caustic = sin((p.x + r.x*2.0)*6.0 + uTime*0.6)
                      * sin((p.y + r.y*2.0)*6.0 - uTime*0.5);
        caustic = pow(abs(caustic), 2.0) * 0.18;

        // colour ramp through the brand palette (navy/teal led, lime as highlight)
        vec3 col = mix(INK, NAVY, smoothstep(0.0, 0.55, f));
        col = mix(col, TEAL, smoothstep(0.42, 0.82, f + 0.12*r.x));
        col = mix(col, GREEN, smoothstep(0.68, 1.0, f + 0.16*q.y));
        col = mix(col, LIME, smoothstep(0.9, 1.12, f + caustic*1.2));
        col += LIME * caustic * 0.28;

        // pointer light
        vec2 m = uMouse;
        m.x *= aspect;
        float d = distance(p, m);
        col += LIME * 0.08 * exp(-d*2.6);

        // vignette toward ink at edges
        float vig = smoothstep(1.2, 0.2, distance(uv, vec2(0.5)));
        col = mix(INK, col, vig*0.88 + 0.12);
        col *= 0.92;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(1, 1) },
        uMouse: { value: new Vec2(0.5, 0.5) },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const { clientWidth, clientHeight } = el;
      renderer.setSize(clientWidth, clientHeight);
      program.uniforms.uResolution.value.set(clientWidth, clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    const target = new Vec2(0.5, 0.5);
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const now = performance.now();
      program.uniforms.uTime.value = reduce ? 6 : (now - t0) / 1000;
      // ease mouse
      const m = program.uniforms.uMouse.value as Vec2;
      m.x += (target.x - m.x) * 0.05;
      m.y += (target.y - m.y) * 0.05;
      renderer.render({ scene: mesh });
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    if (reduce) {
      renderer.render({ scene: mesh });
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={ref} className={className} aria-hidden="true" />;
}
