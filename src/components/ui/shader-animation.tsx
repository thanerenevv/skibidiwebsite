import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    uniforms: { time: { value: number }; resolution: { value: THREE.Vector2 } };
    animationId: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    };

    // Warm white/yellow shader — concentric glowing rings in amber/gold
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time * 0.04;
          float lw = 0.0025;

          float r = 0.0, g = 0.0, b = 0.0;
          for (int i = 0; i < 6; i++) {
            float fi = float(i);
            float ring = lw * float(i * i + 1) /
              abs(fract(t + fi * 0.013) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.22));
            r += ring * 1.4;
            g += ring * 0.95;
            b += ring * 0.18;
          }

          // Warm cream base + gold ring glow
          vec3 col = vec3(
            0.99 - r * 0.08 + r * 0.55,
            0.96 - g * 0.04 + g * 0.38,
            0.82 - b * 0.12 + b * 0.12
          );

          gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    onResize();
    window.addEventListener('resize', onResize);

    let id = 0;
    const animate = () => {
      id = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
      if (sceneRef.current) sceneRef.current.animationId = id;
    };

    sceneRef.current = { renderer, uniforms, animationId: 0 };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(sceneRef.current?.animationId ?? id);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}
