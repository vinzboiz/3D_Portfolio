import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

const FONT_PATH = '/fonts/helvetiker_bold.typeface.json';

export interface Solid3DTextStepData {
  step: number;
  line1: string;
  line2: string;
  plinthText: string;
}

export const SOLID_3D_STEPS: Solid3DTextStepData[] = [
  {
    step: 1,
    line1: 'ARCHITECTURE',
    line2: 'FOUNDATION',
    plinthText: '01 // HUTECH SE · GPA 3.43',
  },
  {
    step: 2,
    line1: 'FULL-STACK',
    line2: 'CORE LOGIC',
    plinthText: '02 // .NET CORE · SPRING · NODE',
  },
  {
    step: 3,
    line1: 'DISCIPLINE',
    line2: 'ENDURANCE',
    plinthText: '03 // 4:45 AM · HACKATHON',
  },
  {
    step: 4,
    line1: 'REALTIME',
    line2: 'DATA STATE',
    plinthText: '04 // POSTGRES · ANGULAR · REACT',
  },
  {
    step: 5,
    line1: 'ENTERPRISE',
    line2: 'SYSTEMS',
    plinthText: '05 // PUNGKOOK · PLM MES SCADA',
  },
  {
    step: 6,
    line1: 'AI VISION',
    line2: 'PIPELINE',
    plinthText: '06 // ALCHERA CV · 360 MEDIA',
  },
  {
    step: 7,
    line1: '3D WEBGL',
    line2: 'DIGITAL TWIN',
    plinthText: '07 // THREE.JS · APS FORGE 60FPS',
  },
  {
    step: 8,
    line1: 'SEAMLESS',
    line2: 'TEAMWORK',
    plinthText: '08 // FIGMA UI/UX · CLEAN API',
  },
  {
    step: 9,
    line1: 'CRAFTED',
    line2: 'PRECISION',
    plinthText: '09 // CLEAN CODE · MICRO-UX',
  },
  {
    step: 10,
    line1: 'SYSTEM',
    line2: 'ONLINE',
    plinthText: '10 // EXPLORE CRT · PROJECTS & CV',
  },
];

export function DeskSpatialText() {
  const rootGroupRef = useRef<THREE.Group>(null);
  const stepGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const textProgressRef = useRef(1.0);

  useFrame((_, delta) => {
    const state = useBuildStore.getState();
    const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
    const isAboutActive = state.currentStep >= 1 && portalProgress >= 0.45;

    if (rootGroupRef.current) {
      rootGroupRef.current.visible = isAboutActive;
    }

    if (!isAboutActive) return;

    // Tốc độ lerp tiến trình chữ chậm rãi 0.032 mỗi frame theo đúng yêu cầu
    const targetScroll = THREE.MathUtils.clamp(state.scrollCurrent, 1.0, 10.0);
    const lerpFactor = Math.min(1, Math.max(0.015, delta * 2.1));
    textProgressRef.current = THREE.MathUtils.lerp(
      textProgressRef.current,
      targetScroll,
      lerpFactor
    );

    const curP = textProgressRef.current;

    for (let i = 0; i < SOLID_3D_STEPS.length; i++) {
      const stepIdx = i + 1;
      const stepDelta = stepIdx - curP;
      const grp = stepGroupRefs.current[i];
      if (!grp) continue;

      if (Math.abs(stepDelta) >= 1.0) {
        grp.visible = false;
        continue;
      }

      grp.visible = true;

      if (stepDelta <= 0) {
        // Bước cũ: từ từ hạ chìm xuống dưới mặt bàn (y: 0.02 -> -0.45, scale.y -> 0.01)
        const t = THREE.MathUtils.clamp(-stepDelta, 0, 1);
        const ease = t * t * (3 - 2 * t); // smoothstep
        grp.position.y = THREE.MathUtils.lerp(0.02, -0.45, ease);
        grp.scale.y = THREE.MathUtils.lerp(1.0, 0.01, ease);
        grp.scale.x = THREE.MathUtils.lerp(1.0, 0.96, ease);
        grp.scale.z = THREE.MathUtils.lerp(1.0, 0.96, ease);
      } else {
        // Bước mới: trồi chậm rãi từ mặt thảm cắt lên (y: -0.45 -> 0.02, scale.y: 0.01 -> 1.0)
        const t = THREE.MathUtils.clamp(1 - stepDelta, 0, 1);
        const ease = t * t * (3 - 2 * t); // smoothstep
        grp.position.y = THREE.MathUtils.lerp(-0.45, 0.02, ease);
        grp.scale.y = THREE.MathUtils.lerp(0.01, 1.0, ease);
        grp.scale.x = THREE.MathUtils.lerp(0.96, 1.0, ease);
        grp.scale.z = THREE.MathUtils.lerp(0.96, 1.0, ease);
      }
    }
  });

  return (
    <group
      ref={rootGroupRef}
      position={[-2.5, 0.02, 0.8]}
      rotation={[-0.18, 0.32, 0]}
    >
      {/* Nguồn sáng điểm nhẹ chiếu xiên tôn lên vát cạnh cơ khí (bevel) của chữ 3D */}
      <pointLight
        position={[0.2, 1.6, 1.2]}
        intensity={1.2}
        color="#fff4e6"
        distance={3.8}
        decay={2}
      />

      {SOLID_3D_STEPS.map((item, idx) => (
        <group
          key={item.step}
          ref={(el) => {
            stepGroupRefs.current[idx] = el;
          }}
          visible={idx === 0}
          position={[0, 0.02, 0]}
        >
          {/* ===================================================================
              1. THANH ĐẾ ĐỠ 3D TRÊN MẶT BÀN (3D HARDWARE NAMEPLATE PLINTH)
             =================================================================== */}
          <group position={[0, -0.04, 0]}>
            {/* Khối đế kim loại tối dập vát cạnh */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.8, 0.08, 0.45]} />
              <meshStandardMaterial
                color="#181a20"
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>

            {/* Viền chỉ cam công nghiệp chạy dọc mép trước thanh đế */}
            <mesh position={[0, 0.041, 0.22]}>
              <boxGeometry args={[2.8, 0.008, 0.015]} />
              <meshStandardMaterial
                color="#e05a47"
                emissive="#e05a47"
                emissiveIntensity={0.6}
                roughness={0.2}
              />
            </mesh>

            {/* Dòng chữ chỉ mục nhỏ nổi trên mặt vát đứng phía trước thanh đế */}
            <group position={[-1.25, -0.01, 0.23]}>
              <Center left>
                <Text3D
                  font={FONT_PATH}
                  size={0.065}
                  height={0.015}
                  curveSegments={4}
                >
                  {item.plinthText}
                  <meshStandardMaterial
                    color="#ff7a5c"
                    emissive="#e05a47"
                    emissiveIntensity={0.35}
                    roughness={0.3}
                  />
                </Text3D>
              </Center>
            </group>
          </group>

          {/* ===================================================================
              2. DÒNG KHỐI CHỮ TRẮNG LỚN (LINE 1) — ĐỘ DÀY ĐẶC SÂU 14CM
             =================================================================== */}
          <group position={[-1.25, 0.38, -0.06]}>
            <Center left>
              <Text3D
                font={FONT_PATH}
                size={0.34}
                height={0.14}
                curveSegments={8}
                bevelEnabled
                bevelThickness={0.022}
                bevelSize={0.015}
                bevelSegments={4}
                castShadow
                receiveShadow
              >
                {item.line1}
                <meshStandardMaterial
                  color="#f4f4f6"
                  roughness={0.3}
                  metalness={0.1}
                />
              </Text3D>
            </Center>
          </group>

          {/* ===================================================================
              3. DÒNG KHỐI CHỮ ĐỎ CAM (LINE 2) — ĐỘ DÀY ĐẶC SÂU 12CM
             =================================================================== */}
          <group position={[-1.25, 0.04, 0.05]}>
            <Center left>
              <Text3D
                font={FONT_PATH}
                size={0.30}
                height={0.12}
                curveSegments={8}
                bevelEnabled
                bevelThickness={0.020}
                bevelSize={0.012}
                bevelSegments={4}
                castShadow
                receiveShadow
              >
                {item.line2}
                <meshStandardMaterial
                  color="#e05a47"
                  emissive="#e05a47"
                  emissiveIntensity={0.22}
                  roughness={0.35}
                />
              </Text3D>
            </Center>
          </group>
        </group>
      ))}
    </group>
  );
}
