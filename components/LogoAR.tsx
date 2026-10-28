'use client';

// Modelo 3D de la estación (GLB en public/modelos/) que aparece sobre la cámara en vivo al escanear su QR.
// Three.js con fondo transparente: entra creciendo, flota suave y reproduce UNA vez la animación que trae el GLB.
// Los materiales son metálicos: se iluminan con un entorno de estudio (RoomEnvironment) para que brillen.
import { useEffect, useRef } from 'react';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const precargas = new Map<string, Promise<GLTF>>();

/** Empieza a bajar el modelo (y three.js) antes de que haga falta, para que salga al instante al escanear. */
export function precargarLogo(url: string) {
  let p = precargas.get(url);
  if (!p) {
    p = import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => new GLTFLoader().loadAsync(url));
    precargas.set(url, p);
    p.catch(() => precargas.delete(url)); // si falló, se reintenta la próxima vez
  }
  return p;
}

export default function LogoAR({ url, className = '', onError }: { url: string; className?: string; onError?: () => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let vivo = true;
    let raf = 0;
    let limpiar = () => {};

    (async () => {
      try {
        const [THREE, { RoomEnvironment }, gltf] = await Promise.all([
          import('three'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
          precargarLogo(url),
        ]);
        const el = caja.current;
        if (!vivo || !el) return;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        el.appendChild(renderer.domElement);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = entorno;
        const sol = new THREE.DirectionalLight(0xffffff, 1.6);
        sol.position.set(1, 2, 3);
        scene.add(sol, new THREE.AmbientLight(0xffffff, 0.35));

        // El modelo, centrado en el origen y de alto 1.
        // Se centra según la pose FINAL de su animación (donde se queda quieto): algunos GLB, como el del
        // logo 4, mueven y giran sus piezas, y centrarlos con la pose inicial los deja corridos al terminar.
        const modelo = gltf.scene.clone(true);
        const poseFinal = gltf.scene.clone(true);
        if (gltf.animations.length) {
          const m = new THREE.AnimationMixer(poseFinal);
          gltf.animations.forEach((a) => {
            const acc = m.clipAction(a);
            acc.setLoop(THREE.LoopOnce, 1);
            acc.clampWhenFinished = true;
            acc.play();
          });
          m.update(Math.max(...gltf.animations.map((a) => a.duration)));
        }
        poseFinal.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(poseFinal);
        const tam = bbox.getSize(new THREE.Vector3());
        const centro = bbox.getCenter(new THREE.Vector3());
        modelo.position.sub(centro);
        const pivote = new THREE.Group();
        pivote.add(modelo);
        const escala = 1 / Math.max(tam.x, tam.y);
        scene.add(pivote);

        // La animación del GLB (el giro del logo) una sola vez, quedando en su pose final.
        const mixer = gltf.animations.length ? new THREE.AnimationMixer(modelo) : null;
        gltf.animations.forEach((a) => {
          const accion = mixer!.clipAction(a);
          accion.setLoop(THREE.LoopOnce, 1);
          accion.clampWhenFinished = true;
          accion.play();
        });

        const camara = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
        camara.position.set(0, 0, 3.1);

        const ajustar = () => {
          const w = el.clientWidth || 1;
          const h = el.clientHeight || 1;
          renderer.setSize(w, h, false);
          camara.aspect = w / h;
          // En pantallas angostas se aleja un poco para que el logo quepa a lo ancho.
          camara.position.z = w < h ? 3.1 * Math.max(1, (h / w) * 0.62) : 3.1;
          camara.updateProjectionMatrix();
        };
        ajustar();
        const ro = new ResizeObserver(ajustar);
        ro.observe(el);

        const reloj = new THREE.Clock();
        const ENTRADA = 0.9; // s
        const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);
        const cuadro = () => {
          const dt = reloj.getDelta();
          const t = reloj.elapsedTime;
          const k = Math.min(1, t / ENTRADA);
          // Entra creciendo y flota suave; el giro lo pone la animación del GLB.
          pivote.scale.setScalar(escala * Math.max(0.001, easeOutBack(k)));
          pivote.position.y = Math.sin(t * 1.6) * 0.035;
          mixer?.update(dt);
          renderer.render(scene, camara);
          raf = requestAnimationFrame(cuadro);
        };
        cuadro();

        limpiar = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          mixer?.stopAllAction();
          entorno.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (e) {
        console.error('[logo 3D]', e);
        if (vivo) onErrorRef.current?.();
      }
    })();

    return () => {
      vivo = false;
      limpiar();
    };
  }, [url]);

  return <div ref={caja} className={`pointer-events-none ${className}`} aria-hidden />;
}
