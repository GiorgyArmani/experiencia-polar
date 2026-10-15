// Oso polar 3D low poly, armado con primitivas facetadas (flatShading).
// No depende de modelos externos: cuando el artista entregue un .glb con las mismas piezas
// y animaciones, este componente se puede reemplazar sin tocar las pantallas.
//
// Reacciones: idle · celebrar · duda · pensar · error  (+ `graduado` le pone birrete y toga)
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber/native';
import { useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Group, Mesh } from 'three';
import { optionOf, type Avatar } from '@shared/avatar';
import { C } from '@/lib/theme';

export type Reaction = 'idle' | 'celebrar' | 'duda' | 'pensar' | 'error';

interface Props {
  avatar: Avatar;
  reaction?: Reaction;
  graduado?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function Bear3D({ avatar, reaction = 'idle', graduado = false, background = C.sky, style }: Props) {
  return (
    <View style={[styles.box, style]}>
      <Canvas camera={{ position: [0, 0.25, 4.6], fov: 36 }}>
        <color attach="background" args={[background]} />
        <hemisphereLight args={['#ffffff', '#7FA9CF', 1.4]} />
        <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
        <Bear avatar={avatar} reaction={reaction} graduado={graduado} />
      </Canvas>
    </View>
  );
}

/* ───────────────────────── Modelo ───────────────────────── */

type MeshProps = ThreeElements['mesh'];

// d = nivel de subdivisión: 20·(d+1)² caras. 3 para piezas medianas, 5 para cabeza y torso.
function Ico({ r, d = 3, color, children, ...props }: { r: number; d?: number; color: string } & MeshProps) {
  return (
    <mesh {...props}>
      <icosahedronGeometry args={[r, d]} />
      <meshStandardMaterial color={color} flatShading roughness={0.85} />
      {children}
    </mesh>
  );
}

function Mat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.85} />;
}

const HALF = Math.PI / 2;

function Bear({ avatar, reaction, graduado }: { avatar: Avatar; reaction: Reaction; graduado: boolean }) {
  const fur = optionOf('pelaje', avatar.pelaje);
  const ropa = optionOf('ropa', avatar.ropa);
  const cabeza = optionOf('cabeza', avatar.cabeza);
  const acc = optionOf('accesorio', avatar.accesorio);
  const furC = fur.color;
  const furS = fur.accent ?? '#DCE6EE';
  const shirt = graduado ? C.navy : ropa.color;
  const shirtS = graduado ? C.yellow : (ropa.accent ?? ropa.color);

  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const armL = useRef<Group>(null); // lado izquierdo de la pantalla (x < 0)
  const armR = useRef<Group>(null);
  const eyeL = useRef<Mesh>(null);
  const eyeR = useRef<Mesh>(null);

  // Reinicia el reloj de la reacción cada vez que cambia.
  const since = useRef({ reaction, t: 0 });
  const clock = useRef(0);

  useFrame((_, dt) => {
    clock.current += dt;
    const t = clock.current;
    if (since.current.reaction !== reaction) since.current = { reaction, t };
    const age = t - since.current.t;
    const pose = poseFor(reaction, t, age);
    const k = 1 - Math.exp(-dt * 10); // suavizado entre poses

    const lerp = (a: number, b: number) => a + (b - a) * k;
    if (root.current) {
      root.current.position.y = lerp(root.current.position.y, pose.rootY);
      root.current.rotation.y = lerp(root.current.rotation.y, pose.turn);
    }
    if (body.current) {
      body.current.rotation.x = lerp(body.current.rotation.x, pose.bodyX);
      body.current.scale.y = lerp(body.current.scale.y, pose.breath);
    }
    if (head.current) {
      head.current.rotation.x = lerp(head.current.rotation.x, pose.headX);
      head.current.rotation.y = lerp(head.current.rotation.y, pose.headY);
      head.current.rotation.z = lerp(head.current.rotation.z, pose.headZ);
    }
    if (armL.current) {
      armL.current.rotation.x = lerp(armL.current.rotation.x, pose.armL[0]);
      armL.current.rotation.z = lerp(armL.current.rotation.z, pose.armL[1]);
    }
    if (armR.current) {
      armR.current.rotation.x = lerp(armR.current.rotation.x, pose.armR[0]);
      armR.current.rotation.z = lerp(armR.current.rotation.z, pose.armR[1]);
    }
    for (const eye of [eyeL.current, eyeR.current]) if (eye) eye.scale.y = lerp(eye.scale.y, pose.eyes);
  });

  const stripes = useMemo(() => [0.62, 0.98], []);

  return (
    <group ref={root} position={[0, -1.25, 0]}>
      {/* Piernas */}
      <Ico r={0.26} color={furC} position={[-0.28, 0.24, 0.05]} scale={[1, 1.1, 1]} />
      <Ico r={0.26} color={furC} position={[0.28, 0.24, 0.05]} scale={[1, 1.1, 1]} />
      {/* Patas: pie alargado hacia adelante con almohadilla */}
      <Ico r={0.2} color={furC} position={[-0.3, 0.08, 0.2]} scale={[1, 0.55, 1.3]} />
      <Ico r={0.2} color={furC} position={[0.3, 0.08, 0.2]} scale={[1, 0.55, 1.3]} />
      <Ico r={0.11} d={2} color={furS} position={[-0.3, 0.08, 0.43]} scale={[1, 0.8, 0.3]} />
      <Ico r={0.11} d={2} color={furS} position={[0.3, 0.08, 0.43]} scale={[1, 0.8, 0.3]} />

      <group ref={body}>
        {/* Torso con la ropa */}
        <Ico r={0.62} d={5} color={shirt} position={[0, 0.85, 0]} scale={[1, 1.08, 0.88]} />
        {/* Colita */}
        <Ico r={0.12} d={2} color={furC} position={[0, 0.45, -0.5]} />
        {/* Cuello de pelo entre la ropa y la cabeza */}
        <Ico r={0.36} color={furC} position={[0, 1.4, 0]} scale={[1.15, 0.45, 1]} />
        {!graduado && ropa.id === 'pelotero' &&
          stripes.map((y) => (
            <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.88]}>
              <cylinderGeometry args={[0.6, 0.6, 0.06, 28, 1, true]} />
              <Mat color={shirtS} />
            </mesh>
          ))}
        {!graduado && ropa.id === 'bata' && (
          <>
            <mesh position={[-0.13, 0.95, 0.5]} rotation={[0, 0, 0.25]}>
              <boxGeometry args={[0.12, 0.5, 0.05]} />
              <Mat color={shirtS} />
            </mesh>
            <mesh position={[0.13, 0.95, 0.5]} rotation={[0, 0, -0.25]}>
              <boxGeometry args={[0.12, 0.5, 0.05]} />
              <Mat color={shirtS} />
            </mesh>
          </>
        )}
        {!graduado && ropa.id === 'chaqueta' && (
          <mesh position={[0, 0.85, 0.54]}>
            <boxGeometry args={[0.05, 0.9, 0.04]} />
            <Mat color={shirtS} />
          </mesh>
        )}
        {graduado && (
          <>
            <mesh position={[-0.16, 0.95, 0.5]} rotation={[0.1, 0, 0.12]}>
              <boxGeometry args={[0.13, 0.7, 0.05]} />
              <Mat color={C.yellow} />
            </mesh>
            <mesh position={[0.16, 0.95, 0.5]} rotation={[0.1, 0, -0.12]}>
              <boxGeometry args={[0.13, 0.7, 0.05]} />
              <Mat color={C.yellow} />
            </mesh>
          </>
        )}

        {/* Brazos: el pivote está en el hombro */}
        <group ref={armL} position={[-0.55, 1.25, 0]}>
          <Ico r={0.2} color={shirt} position={[0, -0.28, 0]} scale={[1, 1.8, 1]} />
          <Ico r={0.17} color={furC} position={[0, -0.6, 0]} />
          <Ico r={0.08} d={2} color={furS} position={[0, -0.64, 0.13]} scale={[1, 0.9, 0.4]} />
        </group>
        <group ref={armR} position={[0.55, 1.25, 0]}>
          <Ico r={0.2} color={shirt} position={[0, -0.28, 0]} scale={[1, 1.8, 1]} />
          <Ico r={0.17} color={furC} position={[0, -0.6, 0]} />
          <Ico r={0.08} d={2} color={furS} position={[0, -0.64, 0.13]} scale={[1, 0.9, 0.4]} />
        </group>

        {/* Accesorios de cuello */}
        {acc.id === 'bufanda' && (
          <>
            <mesh position={[0, 1.42, 0]} rotation={[HALF, 0, 0]}>
              <torusGeometry args={[0.4, 0.1, 10, 28]} />
              <Mat color={acc.color} />
            </mesh>
            <mesh position={[0.2, 1.15, 0.42]} rotation={[0.2, 0, 0.15]}>
              <boxGeometry args={[0.16, 0.45, 0.06]} />
              <Mat color={acc.color} />
            </mesh>
          </>
        )}
        {acc.id === 'corbatin' && (
          <group position={[0, 1.38, 0.5]}>
            <mesh position={[-0.1, 0, 0]} rotation={[0, 0, -HALF]}>
              <coneGeometry args={[0.08, 0.18, 8]} />
              <Mat color={acc.color} />
            </mesh>
            <mesh position={[0.1, 0, 0]} rotation={[0, 0, HALF]}>
              <coneGeometry args={[0.08, 0.18, 8]} />
              <Mat color={acc.color} />
            </mesh>
            <Ico r={0.05} d={2} color={acc.color} />
          </group>
        )}

        {/* Cabeza: el pivote está en el cuello */}
        <group ref={head} position={[0, 1.45, 0]}>
          <Ico r={0.55} d={5} color={furC} position={[0, 0.42, 0]} scale={[1.08, 0.95, 0.95]} />
          {/* Mejillas: ensanchan la cara por abajo */}
          <Ico r={0.26} color={furC} position={[-0.26, 0.26, 0.22]} scale={[1, 0.85, 0.9]} />
          <Ico r={0.26} color={furC} position={[0.26, 0.26, 0.22]} scale={[1, 0.85, 0.9]} />
          {/* Orejas */}
          <Ico r={0.18} d={2} color={furC} position={[-0.42, 0.85, -0.05]} scale={[1, 1, 0.7]} />
          <Ico r={0.18} d={2} color={furC} position={[0.42, 0.85, -0.05]} scale={[1, 1, 0.7]} />
          <Ico r={0.1} d={2} color={furS} position={[-0.42, 0.85, 0.06]} scale={[1, 1, 0.5]} />
          <Ico r={0.1} d={2} color={furS} position={[0.42, 0.85, 0.06]} scale={[1, 1, 0.5]} />
          {/* Hocico, nariz, boca, ojos, cejas, cachetes */}
          <Ico r={0.24} color={furS} position={[0, 0.28, 0.45]} scale={[1.15, 0.8, 0.75]} />
          <Ico r={0.08} d={2} color={C.ink} position={[0, 0.36, 0.64]} scale={[1.25, 0.8, 0.9]}>
            <Ico r={0.025} d={1} color="#FFFFFF" position={[-0.025, 0.045, 0.06]} />
          </Ico>
          <mesh position={[0, 0.25, 0.62]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.018, 0.1, 0.02]} />
            <Mat color={C.ink} />
          </mesh>
          <mesh position={[0, 0.2, 0.6]} rotation={[0.35, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.012, 6, 16, Math.PI]} />
            <Mat color={C.ink} />
          </mesh>
          <Ico ref={eyeL} r={0.06} d={2} color={C.ink} position={[-0.2, 0.52, 0.47]}>
            <Ico r={0.02} d={1} color="#FFFFFF" position={[0.02, 0.025, 0.045]} />
          </Ico>
          <Ico ref={eyeR} r={0.06} d={2} color={C.ink} position={[0.2, 0.52, 0.47]}>
            <Ico r={0.02} d={1} color="#FFFFFF" position={[0.02, 0.025, 0.045]} />
          </Ico>
          <mesh position={[-0.2, 0.65, 0.47]} rotation={[0, 0, HALF + 0.12]}>
            <capsuleGeometry args={[0.014, 0.08, 4, 8]} />
            <Mat color={furS} />
          </mesh>
          <mesh position={[0.2, 0.65, 0.47]} rotation={[0, 0, HALF - 0.12]}>
            <capsuleGeometry args={[0.014, 0.08, 4, 8]} />
            <Mat color={furS} />
          </mesh>
          <Ico r={0.07} d={2} color="#FFB3C1" position={[-0.33, 0.3, 0.4]} scale={[1, 0.6, 0.5]} />
          <Ico r={0.07} d={2} color="#FFB3C1" position={[0.33, 0.3, 0.4]} scale={[1, 0.6, 0.5]} />

          {acc.id === 'lentes' && (
            <>
              <mesh position={[-0.2, 0.52, 0.52]}>
                <torusGeometry args={[0.12, 0.025, 8, 24]} />
                <Mat color={acc.color} />
              </mesh>
              <mesh position={[0.2, 0.52, 0.52]}>
                <torusGeometry args={[0.12, 0.025, 8, 24]} />
                <Mat color={acc.color} />
              </mesh>
              <mesh position={[0, 0.54, 0.54]}>
                <boxGeometry args={[0.16, 0.03, 0.03]} />
                <Mat color={acc.color} />
              </mesh>
            </>
          )}

          {graduado ? (
            <Birrete />
          ) : (
            <HeadItem id={cabeza.id} color={cabeza.color} accent={cabeza.accent ?? cabeza.color} />
          )}
        </group>
      </group>
    </group>
  );
}

function HeadItem({ id, color, accent }: { id: string; color: string; accent: string }) {
  switch (id) {
    case 'gorra':
      return (
        <>
          <mesh position={[0, 0.55, 0]} scale={[1.05, 0.8, 1]}>
            <sphereGeometry args={[0.6, 28, 12, 0, Math.PI * 2, 0, HALF]} />
            <Mat color={color} />
          </mesh>
          <mesh position={[0, 0.57, 0.55]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.42]} />
            <Mat color={accent} />
          </mesh>
          <Ico r={0.06} d={2} color={accent} position={[0, 1.04, 0]} />
        </>
      );
    case 'melena':
      return (
        <>
          {[
            [-0.14, 0.97, 0.12, 0.35],
            [0, 1.03, 0.08, 0],
            [0.14, 0.97, 0.12, -0.35],
          ].map(([x, y, z, rz]) => (
            <mesh key={x} position={[x, y, z]} rotation={[0.2, 0, rz]}>
              <coneGeometry args={[0.11, 0.32, 10]} />
              <Mat color={accent} />
            </mesh>
          ))}
        </>
      );
    case 'lazo':
      return (
        <group position={[0.3, 0.92, 0.12]} rotation={[0, 0, -0.3]}>
          <mesh position={[-0.13, 0, 0]} rotation={[0, 0, -HALF]}>
            <coneGeometry args={[0.12, 0.26, 8]} />
            <Mat color={color} />
          </mesh>
          <mesh position={[0.13, 0, 0]} rotation={[0, 0, HALF]}>
            <coneGeometry args={[0.12, 0.26, 8]} />
            <Mat color={color} />
          </mesh>
          <Ico r={0.06} d={2} color={accent} />
        </group>
      );
    case 'gorro':
      return (
        <>
          <mesh position={[0, 0.55, 0]} scale={[1.05, 0.95, 1]}>
            <sphereGeometry args={[0.6, 28, 12, 0, Math.PI * 2, 0, HALF]} />
            <Mat color={color} />
          </mesh>
          <mesh position={[0, 0.57, 0]} rotation={[HALF, 0, 0]} scale={[1.05, 1, 1]}>
            <torusGeometry args={[0.6, 0.07, 8, 28]} />
            <Mat color={accent} />
          </mesh>
          <Ico r={0.13} d={2} color={accent} position={[0, 1.15, 0]} />
        </>
      );
    case 'audifonos':
      return (
        <>
          <mesh position={[0, 0.45, 0]}>
            <torusGeometry args={[0.64, 0.045, 8, 28, Math.PI]} />
            <Mat color={color} />
          </mesh>
          {[-0.64, 0.64].map((x) => (
            <mesh key={x} position={[x, 0.42, 0]} rotation={[0, 0, HALF]}>
              <cylinderGeometry args={[0.15, 0.15, 0.12, 20]} />
              <Mat color={accent} />
            </mesh>
          ))}
        </>
      );
    default:
      return null;
  }
}

function Birrete() {
  return (
    <group position={[0, 0.86, 0]} rotation={[-0.12, 0, 0.08]}>
      <mesh>
        <cylinderGeometry args={[0.42, 0.46, 0.2, 24]} />
        <Mat color={C.navy} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.95]} />
        <Mat color={C.navy} />
      </mesh>
      <mesh position={[0.42, -0.02, 0.3]}>
        <cylinderGeometry args={[0.015, 0.015, 0.28, 6]} />
        <Mat color={C.yellow} />
      </mesh>
      <Ico r={0.06} d={2} color={C.yellow} position={[0.42, -0.18, 0.3]} />
    </group>
  );
}

/* ───────────────────────── Poses ───────────────────────── */

interface Pose {
  rootY: number;
  turn: number;
  bodyX: number;
  breath: number;
  headX: number;
  headY: number;
  headZ: number;
  armL: [number, number]; // [rotX, rotZ]
  armR: [number, number];
  eyes: number; // escala vertical de los ojos (1 abiertos, ~0.3 entrecerrados)
}

function poseFor(r: Reaction, t: number, age: number): Pose {
  const breath = 1 + Math.sin(t * 2.2) * 0.02;
  const blink = Math.sin(t * 0.9) > 0.985 ? 0.15 : 1;
  const base: Pose = {
    rootY: -1.25,
    turn: Math.sin(t * 0.6) * 0.35,
    bodyX: 0,
    breath,
    headX: 0,
    headY: 0,
    headZ: Math.sin(t * 1.1) * 0.05,
    armL: [0, -0.15 - Math.sin(t * 2.2) * 0.04],
    armR: [0, 0.15 + Math.sin(t * 2.2) * 0.04],
    eyes: blink,
  };

  switch (r) {
    case 'celebrar':
      return {
        ...base,
        rootY: -1.25 + Math.abs(Math.sin(t * 5)) * 0.32,
        turn: Math.sin(t * 2.5) * 0.2,
        headX: -0.18,
        armL: [0, -2.5 - Math.sin(t * 10) * 0.3],
        armR: [0, 2.5 + Math.sin(t * 10) * 0.3],
        eyes: 0.3,
      };
    case 'duda':
      return {
        ...base,
        rootY: -1.25 + Math.abs(Math.sin(t * 3)) * 0.04,
        turn: 0.15,
        headZ: 0.32 + Math.sin(t * 1.5) * 0.04,
        armL: [-0.4, -1.0 + Math.sin(t * 3) * 0.1],
        armR: [-0.4, 1.0 - Math.sin(t * 3) * 0.1],
      };
    case 'pensar':
      return {
        ...base,
        turn: -0.2 + Math.sin(t * 0.5) * 0.1,
        headX: -0.15,
        headZ: -0.18 + Math.sin(t * 1.5) * 0.05,
        armR: [-2.25, -0.55], // pata a la barbilla
        armL: [0, -0.2],
      };
    case 'error': {
      const decay = Math.exp(-age * 1.3);
      return {
        ...base,
        turn: 0,
        bodyX: 0.18,
        headX: 0.28,
        headY: Math.sin(t * 14) * 0.45 * decay,
        headZ: 0,
        armL: [0.1, -0.05],
        armR: [0.1, 0.05],
        eyes: 0.45,
      };
    }
    default:
      return base;
  }
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
});
