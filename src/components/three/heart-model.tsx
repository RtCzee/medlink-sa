"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** scroll progress 0..1 driven by parent (0 = hero top, 1 = hero fully scrolled past) */
  scrollProgress?: number;
  className?: string;
};

/**
 * HeartModel — loads the realistic_human_heart.glb from /public/heart.glb.
 * The heart:
 *   - at scroll 0: centered, large, beating
 *   - as scroll increases: shrinks, drifts to the right, wanders slightly, fades out
 * Mouse parallax is layered on top.
 *
 * Robust: handles load errors (falls back to a procedural heart), WebGL context loss,
 * and prefers-reduced-motion (no rotation, gentle pulse only).
 */
export default function HeartModel({ scrollProgress = 0, className }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  // live scroll ref so the animation loop reads the latest value without restarting
  const scrollRef = useRef(scrollProgress);
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- renderer ----
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    mount.appendChild(renderer.domElement);

    // ---- scene + camera ----
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7);

    // ---- environment map (image-based lighting) ----
    // Without this, MeshStandardMaterial.envMapIntensity is a no-op and the
    // model loses all reflective surface detail. Built procedurally from a
    // tiny gradient canvas so it costs no network request.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 16;
    envCanvas.height = 64;
    const ectx = envCanvas.getContext("2d");
    if (ectx) {
      const grad = ectx.createLinearGradient(0, 0, 0, 64);
      grad.addColorStop(0, "#dbe9ff");
      grad.addColorStop(0.5, "#5b7fa6");
      grad.addColorStop(1, "#0b1220");
      ectx.fillStyle = grad;
      ectx.fillRect(0, 0, 16, 64);
    }
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const envRT = pmrem.fromEquirectangular(envTex);
    scene.environment = envRT.texture;
    envTex.dispose();
    pmrem.dispose();

    // ---- lights ----
    // Budget kept near ~3 total. Higher values clip the material to pure
    // white under ACES tone mapping, which is what made the heart look blank.
    const hemi = new THREE.HemisphereLight(0xffffff, 0x223355, 0.35);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x60a5fa, 0.35);
    fill.position.set(-5, 2, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x22d3ee, 0.7);
    rim.position.set(0, -3, -5);
    scene.add(rim);

    const accent = new THREE.PointLight(0x3b82f6, 0.6, 18);
    accent.position.set(-2, 1, 4);
    scene.add(accent);

    // ---- container group (we animate this) ----
    const group = new THREE.Group();
    scene.add(group);

    let heart: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let prevTime = performance.now();
    const startTime = prevTime;

    // ---- load GLB ----
    const loader = new GLTFLoader();
    loader.load(
      "/heart.glb",
      (gltf) => {
        heart = gltf.scene;
        // normalise into a nice framing
        const box = new THREE.Box3().setFromObject(heart);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 3.4;
        const s = targetSize / maxDim;
        heart.scale.setScalar(s);
        heart.position.sub(center.multiplyScalar(s));
        // rotate so the apex points down (anatomical), front facing camera
        heart.rotation.y = Math.PI * 0.05;
        heart.rotation.x = Math.PI * 0.02;

        // Override all materials with a consistent heart material.
        // The GLB textures may fail to load (blob URL issues), so we replace
        // them with a solid MeshPhysicalMaterial that looks anatomically correct.
        heart.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            const heartMat = new THREE.MeshPhysicalMaterial({
              color: 0xb91c2c,
              roughness: 0.35,
              metalness: 0.05,
              clearcoat: 0.3,
              clearcoatRoughness: 0.4,
              emissive: 0x4a0000,
              emissiveIntensity: 0.15,
              envMapIntensity: 1.2,
            });
            mesh.material = heartMat;
          }
        });

        group.add(heart);

        // animations (if any in the GLB)
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(heart);
          mixer.clipAction(gltf.animations[0]).play();
        }

        setLoaded(true);
      },
      undefined,
      () => {
        // fallback: procedural heart
        setFailed(true);
        buildProceduralHeart(group);
        setLoaded(true);
      }
    );

    function buildProceduralHeart(parent: THREE.Group) {
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0.5, 0.5);
      heartShape.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0);
      heartShape.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7);
      heartShape.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9);
      heartShape.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7);
      heartShape.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0);
      heartShape.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5);
      const geo = new THREE.ExtrudeGeometry(heartShape, {
        depth: 0.55,
        bevelEnabled: true,
        bevelSegments: 18,
        bevelSize: 0.32,
        bevelThickness: 0.32,
        curveSegments: 48,
      });
      geo.center();
      const mat = new THREE.MeshStandardMaterial({
        color: 0xb91c2c,
        roughness: 0.45,
        metalness: 0.05,
        emissive: 0x3b0000,
        emissiveIntensity: 0.25,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.setScalar(1.7);
      mesh.rotation.z = Math.PI;
      parent.add(mesh);
      heart = mesh;
    }

    // ---- particle ambient ----
    const count = reduce ? 0 : 280;
    if (count > 0) {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 3 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x93c5fd,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(pGeo, pMat);
      scene.add(points);
      (group.userData as { points?: THREE.Points }).points = points;
    }

    // ---- mouse parallax ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // ---- grab-to-rotate + poke-to-deform ----
    // Distinguishes a TAP (poke) from a DRAG (rotate) by movement threshold.
    // Both work ON the heart model (not just outside it).
    // After drag ends, the heart auto-resets to its default rotation over ~1s.
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const drag = {
      active: false,
      started: false,       // true once movement exceeds threshold
      startX: 0,
      startY: 0,
      rotX: 0,
      rotY: 0,
      velX: 0,
      velY: 0,
      startTime: 0,
      hitHeart: false,
    };
    const reset = { active: false, fromRotX: 0, fromRotY: 0, time: 0 };
    const poke = { active: false, point: new THREE.Vector3(), strength: 0, time: 0, normal: new THREE.Vector3() };
    const originalPositions = new Map<THREE.BufferGeometry, Float32Array>();

    const storeOriginal = (geo: THREE.BufferGeometry) => {
      if (originalPositions.has(geo)) return;
      const pos = geo.getAttribute("position");
      if (pos) originalPositions.set(geo, Float32Array.from(pos.array as Float32Array));
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const targets: THREE.Object3D[] = [];
      if (heart) heart.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) targets.push(m); });
      const hits = raycaster.intersectObjects(targets, false);
      // Always start a potential drag; decide poke vs drag on pointerup/move
      drag.active = true;
      drag.started = false;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.startTime = performance.now();
      drag.hitHeart = hits.length > 0;
      if (hits.length > 0) {
        // Store hit point + normal for potential poke
        poke.point.copy(hits[0].point);
        if (hits[0].face) {
          poke.normal.copy(hits[0].face.normal);
          // Transform normal to world space
          poke.normal.transformDirection(hits[0].object.matrixWorld);
        }
        const mesh = hits[0].object as THREE.Mesh;
        if (mesh.geometry) storeOriginal(mesh.geometry);
      }
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMoveDrag = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      // Only start rotating after exceeding a movement threshold (so a tap doesn't rotate)
      if (!drag.started && Math.abs(dx) + Math.abs(dy) > 6) {
        drag.started = true;
        // Cancel any pending poke
        poke.active = false;
      }
      if (drag.started) {
        drag.velY = dx * 0.005;
        drag.velX = dy * 0.005;
        drag.rotY += drag.velY;
        drag.rotX += drag.velX;
        drag.startX = e.clientX;
        drag.startY = e.clientY;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag.active) return;
      const elapsed = performance.now() - drag.startTime;
      // If it was a TAP (little movement, short time) on the heart → POKE
      if (!drag.started && drag.hitHeart && elapsed < 300) {
        poke.active = true;
        poke.strength = 0.15; // small but noticeable dent
        poke.time = 0;
      }
      // After drag ends, start auto-reset to default view
      if (drag.started) {
        reset.active = true;
        reset.fromRotX = drag.rotX;
        reset.fromRotY = drag.rotY;
        reset.time = 0;
      }
      drag.active = false;
      drag.started = false;
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMoveDrag, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";

    // ---- resize ----
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const onLost = (e: Event) => e.preventDefault();
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    // ---- loop ----
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - startTime) / 1000;
      const dt = (performance.now() - prevTime) / 1000;
      prevTime = performance.now();
      const sp = scrollRef.current; // 0..1

      // Lifelike heartbeat: double-thump (lub-dub) at ~55 bpm.
      // Strong visible pulse — scales the heart ~8% on each thump.
      const beat =
        reduce || sp > 0.85
          ? 0
          : Math.max(
              0,
              Math.sin(t * 5.7) ** 6 * 0.7 +
                Math.sin(t * 5.7 - 0.5) ** 12 * 0.45
            );

      // ---- scroll-driven transform ----
      // size: 1.0 -> 0.42 as you scroll
      const scale = 1 - sp * 0.62;
      // drift right (positive x) and wander
      const driftX = sp * 2.6 + Math.sin(t * 0.4 + sp * 3) * sp * 0.6;
      const driftY =
        Math.sin(t * 0.5 + sp * 4) * sp * 0.4 - sp * 0.2;
      const driftZ = Math.cos(t * 0.3) * sp * 0.5;
      // opacity fade: full until 0.6, then fade to 0 by 1.0
      const opacity = sp < 0.6 ? 1 : Math.max(0, 1 - (sp - 0.6) / 0.4);

      group.scale.setScalar(scale * (1 + beat * 0.08));
      group.position.x = driftX;
      group.position.y = driftY;
      group.position.z = driftZ;

      // base rotation
      group.rotation.y = sp * Math.PI * 0.5 + Math.sin(t * 0.3) * 0.1;
      group.rotation.x = sp * -0.2 + Math.cos(t * 0.25) * 0.05;

      // grab-to-rotate (drag) — layered on top, with velocity damping.
      // When not dragging, if reset is active, ease rotation back to 0.
      if (!drag.active) {
        if (reset.active) {
          // Auto-reset to default view over ~1s with easeOutCubic
          reset.time += dt;
          const rt = Math.min(reset.time / 1.0, 1);
          const eased = 1 - Math.pow(1 - rt, 3);
          const curRotX = reset.fromRotX * (1 - eased);
          const curRotY = reset.fromRotY * (1 - eased);
          group.rotation.y += curRotY;
          group.rotation.x += curRotX;
          // Also apply residual velocity damping
          drag.velX *= 0.9;
          drag.velY *= 0.9;
          if (rt >= 1) {
            reset.active = false;
            drag.rotX = 0;
            drag.rotY = 0;
            drag.velX = 0;
            drag.velY = 0;
          }
        } else {
          // velocity damping after release
          drag.velX *= 0.92;
          drag.velY *= 0.92;
          drag.rotX += drag.velX;
          drag.rotY += drag.velY;
          group.rotation.y += drag.rotY;
          group.rotation.x += drag.rotX;
        }
      } else {
        group.rotation.y += drag.rotY;
        group.rotation.x += drag.rotX;
      }

      // mouse parallax (layered, eased) — only when not dragging
      if (!drag.active && !reset.active) {
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        group.rotation.y += mouse.x * 0.25 * (1 - sp * 0.5);
        group.rotation.x += mouse.y * -0.18 * (1 - sp * 0.5);
      }

      // ---- poke deformation (small dent + bouncy bounce-back) ----
      // Phase 1 (0-0.15s): dent pushes inward (quick poke)
      // Phase 2 (0.15-0.8s): bounces back — overshoots outward past original,
      //   oscillates with damped sine, settles to original (like poking jelly)
      if (poke.active && heart) {
        poke.time += dt;
        const T_DENT = 0.15;   // dent-in duration
        const T_BOUNCE = 0.65; // bounce-back duration
        const T_TOTAL = T_DENT + T_BOUNCE;

        // Compute displacement amplitude at this time
        let amplitude: number;
        if (poke.time < T_DENT) {
          // Phase 1: quick dent inward (ease-out)
          const p = poke.time / T_DENT;
          amplitude = poke.strength * (1 - Math.pow(1 - p, 3));
        } else if (poke.time < T_TOTAL) {
          // Phase 2: damped oscillation around 0 (bounce back past original)
          const bp = (poke.time - T_DENT) / T_BOUNCE;
          // Starts at -strength (inward), oscillates: sin wave * decay
          // Negative = inward, positive = outward (bounce past original)
          const decay = Math.exp(-bp * 3.5);
          const oscillation = Math.sin(bp * Math.PI * 3);
          amplitude = -poke.strength * decay * oscillation;
        } else {
          amplitude = 0;
        }

        const nx = poke.normal.x;
        const ny = poke.normal.y;
        const nz = poke.normal.z;
        heart.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry) return;
          const geo = mesh.geometry;
          storeOriginal(geo);
          const pos = geo.getAttribute("position");
          const orig = originalPositions.get(geo);
          if (!pos || !orig) return;
          const px = poke.point.x;
          const py = poke.point.y;
          const pz = poke.point.z;
          const arr = pos.array as Float32Array;
          const RADIUS = 0.15; // very small, localized poke
          for (let i = 0; i < arr.length; i += 3) {
            const ox = orig[i];
            const oy = orig[i + 1];
            const oz = orig[i + 2];
            const dx = ox - px;
            const dy = oy - py;
            const dz = oz - pz;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist > RADIUS) {
              arr[i] = ox;
              arr[i + 1] = oy;
              arr[i + 2] = oz;
              continue;
            }
            const influence = 1 - dist / RADIUS;
            const smooth = influence * influence * (3 - 2 * influence);
            // Push along normal. Negative amplitude = inward, positive = outward
            const push = smooth * amplitude;
            arr[i] = ox - nx * push;
            arr[i + 1] = oy - ny * push;
            arr[i + 2] = oz - nz * push;
          }
          pos.needsUpdate = true;
          geo.computeVertexNormals();
        });

        if (poke.time >= T_TOTAL) {
          // Full restore
          heart.traverse((obj) => {
            const mesh = obj as THREE.Mesh;
            if (!mesh.isMesh || !mesh.geometry) return;
            const geo = mesh.geometry;
            const orig = originalPositions.get(geo);
            const pos = geo.getAttribute("position");
            if (orig && pos) {
              (pos.array as Float32Array).set(orig);
              pos.needsUpdate = true;
              geo.computeVertexNormals();
            }
          });
          poke.active = false;
        }
      }

      group.visible = opacity > 0.01;
      if (heart) {
        heart.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              const mat = m as THREE.MeshStandardMaterial;
              mat.transparent = true;
              mat.opacity = opacity;
            });
          }
        });
      }

      // particles fade + slow spin
      const pts = (group.userData as { points?: THREE.Points }).points;
      if (pts) {
        pts.rotation.y = t * 0.03;
        (pts.material as THREE.PointsMaterial).opacity = 0.6 * opacity;
        pts.visible = opacity > 0.05;
      }

      if (mixer) mixer.update(dt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // Stop rendering entirely while the canvas is scrolled out of view or the
    // tab is hidden. Without this the GPU keeps drawing the model for the whole
    // session, which is a needless battery and CPU drain on a landing page.
    let onScreen = true;
    const resume = () => {
      if (!onScreen || document.hidden) return;
      cancelAnimationFrame(raf);
      prevTime = performance.now(); // drop the accumulated pause so motion does not jump
      raf = requestAnimationFrame(tick);
    };
    const visObserver = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) resume();
        else cancelAnimationFrame(raf);
      },
      { threshold: 0 }
    );
    visObserver.observe(mount);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      visObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onPointerMoveDrag);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      ro.disconnect();
      envRT.dispose();
      renderer.dispose();
      if (heart) {
        heart.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m.dispose());
          }
        });
      }
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    >
      {!loaded && (
        <div className="grid h-full w-full place-items-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-medical/25 blur-3xl" />
        </div>
      )}
      {failed && loaded && (
        <div className="pointer-events-none absolute bottom-2 right-2 text-[0.6rem] text-muted-foreground/50">
          procedural fallback
        </div>
      )}
    </div>
  );
}
