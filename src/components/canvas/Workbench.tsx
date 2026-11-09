import { useState, useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { S, validateScaleContract } from '../../constants/scale';
import {
  retroMaterials,
  RETRO_PBR_PARAMS,
} from './materials/retroMaterials';
import {
  BenchAssemblyGroup,
  TOWER_SCALE,
  TOWER_BASE_Y,
  TOWER_CENTER_Z,
  TOWER_BUILD_X,
  TOWER_STEP10_X,
} from './hardware/BenchAssemblyGroup';
import { PcCaseEnlight } from './hardware/PcCaseEnlight';
import { PsuSeasonicAT } from './hardware/PsuSeasonicAT';
import { StorageDrives } from './hardware/StorageDrives';
import { ExpansionCards } from './hardware/ExpansionCards';
import { PowerAndFrontCables } from './hardware/PowerAndFrontCables';
import { RibbonCables } from './hardware/RibbonCables';
import { PeripheralsCRT } from './hardware/PeripheralsCRT';
import { useBuildStore } from '../../store/useBuildStore';
import { ASSEMBLY_STEPS } from '../../data/assemblySteps';
import { retroSound } from '../../utils/retroSound';

function remap(val: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (val - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

/**
 * Dựng thanh trụ nối chính xác giữa 2 điểm 3D (Dùng cho cơ cấu tay đòn kép & lò xo của Đèn bàn Anglepoise)
 */
function StrutBetween({
  start,
  end,
  radius,
  material,
}: {
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
  material: THREE.Material;
}) {
  const { pos, quat, len } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(vEnd, vStart);
    const length = dir.length();
    const mid = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { pos: mid, quat: q, len: length };
  }, [start, end]);

  return (
    <mesh position={pos} quaternion={quat} castShadow material={material}>
      <cylinderGeometry args={[radius, radius, len, 14]} />
    </mesh>
  );
}

/**
 * ĐÈN BÀN KỸ THUẬT LÒ XO CÂN BẰNG MẠ CRÔM (CHROME SPRING-BALANCED ARCHITECT LAMP)
 * Thiết kế chuẩn 100% theo ảnh mẫu:
 * - Chân đế tròn vòm crôm bóng gương (Domed Chrome Base)
 * - Tay dưới nghiêng về sau kèm 2 lò xo kéo đối xứng + Khớp khuỷu cơ khí
 * - Tay trên gồm 2 thanh song song (Parallel Twin-Arm) + thanh lò xo vươn cao về phía máy tính
 * - Chụp đèn hình chuông bậc (Stepped Bell Shade) bằng LatheGeometry + dây điện uốn vòng ở cổ đèn
 */
function ChromeArchitectDeskLamp() {
  const isLampOn = useBuildStore((s) => s.isLampOn);
  const toggleLamp = useBuildStore((s) => s.toggleLamp);
  const setHoveredControl = useBuildStore((s) => s.setHoveredControl);
  const [switchHovered, setSwitchHovered] = useState(false);

  useCursor(switchHovered, 'pointer');

  const {
    chromeMat,
    springMat,
    innerShadeMat,
    deskLampCordMat,
    switchHousingMat,
    baseLatheGeo,
    bellShadeGeo,
    topCordGeo,
    deskPowerCordGeo,
  } = useMemo(() => {
    const chrome = new THREE.MeshStandardMaterial({
      color: '#e8edf2',
      roughness: 0.14,
      metalness: 0.92,
    });

    const spring = new THREE.MeshStandardMaterial({
      color: '#bfc6cc',
      roughness: 0.28,
      metalness: 0.85,
    });

    const innerShade = new THREE.MeshStandardMaterial({
      color: '#fff8e8',
      emissive: '#ffdf9a',
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.BackSide,
    });

    const cordMat = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.06,
    });

    const switchHousing = new THREE.MeshStandardMaterial({
      color: '#161616',
      roughness: 0.45,
      metalness: 0.6,
    });

    // 1. Chân đế tròn vòm cong mềm mại (Domed Circular Chrome Base)
    const basePts = [
      new THREE.Vector2(0.0, 0.22),
      new THREE.Vector2(0.09, 0.22),
      new THREE.Vector2(0.11, 0.14),
      new THREE.Vector2(0.32, 0.12),
      new THREE.Vector2(0.56, 0.085),
      new THREE.Vector2(0.68, 0.045),
      new THREE.Vector2(0.7, 0.01),
      new THREE.Vector2(0.0, 0.01),
    ];
    const baseGeo = new THREE.LatheGeometry(basePts, 40);
    baseGeo.computeVertexNormals();

    // 2. Chụp đèn hình chuông có cổ bậc (Stepped Bell Reflector Shade)
    const shadePts = [
      new THREE.Vector2(0.0, 0.46),
      new THREE.Vector2(0.11, 0.45),
      new THREE.Vector2(0.13, 0.34),
      new THREE.Vector2(0.14, 0.2),
      new THREE.Vector2(0.19, 0.15),
      new THREE.Vector2(0.28, 0.04),
      new THREE.Vector2(0.37, -0.12),
      new THREE.Vector2(0.44, -0.28),
      new THREE.Vector2(0.49, -0.43),
      new THREE.Vector2(0.505, -0.45),
      new THREE.Vector2(0.485, -0.46),
    ];
    const shadeGeo = new THREE.LatheGeometry(shadePts, 40);
    shadeGeo.computeVertexNormals();

    // 3. Dây điện màu đen ở khớp cổ chụp đèn
    const topCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.76, 4.78, 0),
      new THREE.Vector3(0.84, 5.05, 0),
      new THREE.Vector3(0.98, 5.08, 0),
      new THREE.Vector3(1.04, 4.92, 0),
    ]);
    const tCordGeo = new THREE.TubeGeometry(topCurve, 24, 0.016, 8, false);

    // 4. DÂY NGUỒN ĐÈN BÀN THỰC TẾ (YÊU CẦU #3):
    // - Đoạn 1: Xuất phát từ cổ chân đế đèn (y ~ 0.035), uốn lượn tự nhiên nằm sát trên mặt bàn
    // - Đoạn 2: Vắt 90 độ qua mép bàn rồi buông thòng thẳng xuống gầm bàn (y từ 0 xuống -3.50)
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.66, 0.035, -0.15),
      new THREE.Vector3(-0.85, 0.024, -0.25),
      new THREE.Vector3(-1.35, 0.022, -0.42),
      new THREE.Vector3(-1.95, 0.022, -0.55),
      new THREE.Vector3(-2.65, 0.022, -0.62),
      new THREE.Vector3(-3.35, 0.022, -0.65),
      new THREE.Vector3(-3.72, 0.016, -0.65),
      // Uốn cong 90 độ vắt qua mép bàn
      new THREE.Vector3(-3.78, -0.06, -0.65),
      new THREE.Vector3(-3.80, -0.25, -0.65),
      // Buông thòng thẳng xuống phía dưới gầm bàn
      new THREE.Vector3(-3.80, -0.85, -0.65),
      new THREE.Vector3(-3.79, -1.85, -0.65),
      new THREE.Vector3(-3.78, -2.75, -0.65),
      new THREE.Vector3(-3.77, -3.50, -0.65),
    ]);
    const dCordGeo = new THREE.TubeGeometry(cordCurve, 64, 0.025, 10, false);

    return {
      chromeMat: chrome,
      springMat: spring,
      innerShadeMat: innerShade,
      deskLampCordMat: cordMat,
      switchHousingMat: switchHousing,
      baseLatheGeo: baseGeo,
      bellShadeGeo: shadeGeo,
      topCordGeo: tCordGeo,
      deskPowerCordGeo: dCordGeo,
    };
  }, []);

  useEffect(() => {
    return () => {
      chromeMat.dispose();
      springMat.dispose();
      innerShadeMat.dispose();
      deskLampCordMat.dispose();
      switchHousingMat.dispose();
      baseLatheGeo.dispose();
      bellShadeGeo.dispose();
      topCordGeo.dispose();
      deskPowerCordGeo.dispose();
    };
  }, [
    chromeMat,
    springMat,
    innerShadeMat,
    deskLampCordMat,
    switchHousingMat,
    baseLatheGeo,
    bellShadeGeo,
    topCordGeo,
    deskPowerCordGeo,
  ]);

  return (
    /* Đặt đèn bàn dịch sang cạnh trái bàn [-4.25, 0, 0.85] để tạo khoảng cách thoáng với màn hình CRT mà vẫn soi rõ toàn bộ bàn máy */
    <group position={[-4.25, 0, 0.85]} rotation={[0, -0.22, 0]}>
      {/* 1. CHÂN ĐẾ TRÒN MẠ CRÔM BÓNG GƯƠNG (DOMED CIRCULAR BASE) */}
      <mesh geometry={baseLatheGeo} castShadow receiveShadow material={chromeMat} />
      {/* Đệm cao su đen chống trượt dưới đáy đế */}
      <mesh position={[0, 0.008, 0]} material={retroMaterials.blackAnodized}>
        <cylinderGeometry args={[0.69, 0.7, 0.016, 36]} />
      </mesh>
      {/* Cổ trụ xoay ở tâm đế */}
      <mesh position={[0, 0.27, 0]} castShadow material={chromeMat}>
        <cylinderGeometry args={[0.065, 0.085, 0.14, 20]} />
      </mesh>

      {/* 1B. NÚT CÔNG TẮC BẬT/TẮT VẬT LÝ TRÊN CHÂN ĐẾ ĐÈN (YÊU CẦU #2) */}
      <group
        position={[0.35, 0.095, 0.22]}
        rotation={[-0.24, 0.52, 0]}
        onClick={(e) => {
          e.stopPropagation();
          toggleLamp();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSwitchHovered(true);
          setHoveredControl('[CLICK] DESK LAMP SWITCH');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setSwitchHovered(false);
          setHoveredControl(null);
        }}
      >
        {/* Khung viền công tắc màu đen chìm vào chân đế */}
        <RoundedBox
          args={[0.08, 0.034, 0.13]}
          radius={0.005}
          smoothness={2}
          castShadow
          material={switchHousingMat}
        />
        {/* Lòng ổ công tắc */}
        <mesh position={[0, 0.006, 0]} material={retroMaterials.blackAnodized}>
          <boxGeometry args={[0.062, 0.016, 0.11]} />
        </mesh>
        {/* Phím bập bênh (Rocker Switch): gạt nghiêng -0.22 khi BẬT (ON) và +0.22 khi TẮT (OFF) */}
        <group position={[0, 0.014, 0]} rotation={[isLampOn ? -0.22 : 0.22, 0, 0]}>
          <RoundedBox
            args={[0.052, 0.024, 0.098]}
            radius={0.005}
            smoothness={2}
            castShadow
          >
            <meshStandardMaterial
              color={isLampOn ? '#d32f2f' : '#681818'}
              emissive={isLampOn ? '#ff3333' : '#000000'}
              emissiveIntensity={isLampOn ? 0.6 : 0.0}
              roughness={0.4}
              metalness={0.1}
            />
          </RoundedBox>
          {/* Vạch ký hiệu công tắc nhỏ trên mặt nút */}
          <mesh position={[0, 0.013, isLampOn ? -0.025 : 0.025]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.018, 0.008]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* 2. CỤM TAY ĐÒN DƯỚI & CẶP LÒ XO CĂNG (LOWER ARTICULATED ARM & TENSION SPRINGS) */}
      {/* Chốt bản lề dưới */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
        <cylinderGeometry args={[0.048, 0.048, 0.16, 16]} />
      </mesh>

      {/* 2 Thanh trụ chính của tay dưới (nghiêng về phía sau tới khớp khuỷu [-1.08, 2.48, ±0.045]) */}
      <StrutBetween
        start={[0, 0.34, 0.042]}
        end={[-1.08, 2.48, 0.042]}
        radius={0.026}
        material={chromeMat}
      />
      <StrutBetween
        start={[0, 0.34, -0.042]}
        end={[-1.08, 2.48, -0.042]}
        radius={0.026}
        material={chromeMat}
      />

      {/* Ngàm móc lò xo dưới & 2 Lò xo kéo chéo đặc trưng */}
      <StrutBetween
        start={[0, 0.34, 0]}
        end={[-0.06, 0.62, 0]}
        radius={0.02}
        material={chromeMat}
      />
      <StrutBetween
        start={[-0.06, 0.62, 0.055]}
        end={[-0.56, 1.45, 0.055]}
        radius={0.022}
        material={springMat}
      />
      <StrutBetween
        start={[-0.06, 0.62, -0.055]}
        end={[-0.56, 1.45, -0.055]}
        radius={0.022}
        material={springMat}
      />

      {/* 3. KHỚP KHUỶU GIỮA MẠ CRÔM (ELBOW JOINT AT [-1.08, 2.48, 0]) */}
      <group position={[-1.08, 2.48, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={chromeMat}>
          <cylinderGeometry args={[0.065, 0.065, 0.16, 18]} />
        </mesh>
        {/* Núm vặn khóa khớp khuỷu */}
        <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={retroMaterials.blackAnodized}>
          <cylinderGeometry args={[0.042, 0.042, 0.04, 14]} />
        </mesh>
      </group>

      {/* 4. CỤM TAY ĐÒN TRÊN SONG SONG VƯƠN CAO VỀ PHÍA MÁY TÍNH (UPPER PARALLEL TWIN-ARM) */}
      <StrutBetween
        start={[-1.06, 2.55, 0]}
        end={[0.84, 4.82, 0]}
        radius={0.025}
        material={chromeMat}
      />
      <StrutBetween
        start={[-1.02, 2.41, 0]}
        end={[0.86, 4.68, 0]}
        radius={0.022}
        material={chromeMat}
      />
      <StrutBetween
        start={[-0.98, 2.35, 0]}
        end={[-0.18, 3.38, 0]}
        radius={0.024}
        material={springMat}
      />
      <StrutBetween
        start={[-0.18, 3.38, 0]}
        end={[0.84, 4.68, 0]}
        radius={0.012}
        material={chromeMat}
      />

      {/* Khớp cổ chụp đèn (Wrist Joint) */}
      <mesh position={[0.86, 4.75, 0]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
        <cylinderGeometry args={[0.045, 0.045, 0.12, 16]} />
      </mesh>
      <StrutBetween
        start={[0.86, 4.75, 0]}
        end={[1.08, 4.68, 0]}
        radius={0.024}
        material={chromeMat}
      />

      {/* Dây điện uốn vòng trên đỉnh cổ đèn */}
      <mesh geometry={topCordGeo} material={deskLampCordMat} />

      {/* Đệm cao su giảm căng (Strain Relief Collar) ở đuôi chân đế đèn */}
      <mesh position={[-0.64, 0.038, -0.14]} rotation={[0, -0.4, 0]} material={deskLampCordMat}>
        <cylinderGeometry args={[0.036, 0.048, 0.07, 12]} />
      </mesh>

      {/* DÂY ĐIỆN NGUỒN CỦA ĐÈN BÀN NẰM SÁT MẶT BÀN & THÒNG XUỐNG GẦM BÀN (YÊU CẦU #3) */}
      <mesh geometry={deskPowerCordGeo} castShadow receiveShadow material={deskLampCordMat} />

      {/* 5. BẦU CHỤP ĐÈN HÌNH CHUÔNG BẬC MẠ CRÔM & BÓNG ĐÈN SỢI ĐỐT (STEPPED BELL REFLECTOR SHADE) */}
      <group position={[1.14, 4.66, 0]} rotation={[0, 0, 0.72]}>
        {/* Mặt ngoài mạ crôm sáng bóng */}
        <mesh geometry={bellShadeGeo} castShadow material={chromeMat} />
        {/* Mặt trong tráng men trắng phản xạ */}
        <mesh
          geometry={bellShadeGeo}
          scale={[0.985, 0.99, 0.985]}
          material={innerShadeMat}
        />

        {/* Núm vặn nhỏ trên đỉnh cổ chụp đèn */}
        <mesh position={[0, 0.5, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.018, 0.024, 0.08, 12]} />
        </mesh>

        {/* Bóng đèn sợi đốt phát sáng vàng ấm bên trong bầu chụp đèn (ĐỘC LẬP THEO isLampOn) */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive="#ffda85"
            emissiveIntensity={isLampOn ? 3.5 : 0.0}
            roughness={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * KHỐI NGƯỜI MẪU 1.70M (DEBUG_SCALE_REF)
 * Dùng để kiểm tra tỉ lệ trực quan (Human-Scale) so với bàn, ghế và thiết bị.
 * Bật bằng flag S.DEBUG_SCALE_REF trong src/constants/scale.ts.
 */
function HumanScaleDummy() {
  return (
    <group position={[1.22, S.FLOOR_Y, 0.15]}>
      {/* Đôi chân (cao 0.80m từ sàn y = -0.75 tới hông y = +0.05) */}
      <mesh position={[-0.1, 0.4, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.8, 12]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      <mesh position={[0.1, 0.4, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.8, 12]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      {/* Thân người (Torso: cao 0.58m, từ y = +0.05 tới y = +0.63) */}
      <mesh position={[0, 1.09, 0]}>
        <boxGeometry args={[0.38, 0.58, 0.22]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      {/* Đầu & Cổ (đỉnh đầu đạt 1.70m so với sàn, y = -0.75 + 1.70 = +0.95) */}
      <mesh position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.08, 12]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      <mesh position={[0, 1.57, 0]}>
        <sphereGeometry args={[0.115, 12, 12]} />
        <meshBasicMaterial color="#00ff88" wireframe />
      </mesh>
      {/* Vạch vàng đánh dấu độ cao mắt người ngồi 1.15m (y = -0.75 + 1.15 = +0.40m trên bàn) */}
      <mesh position={[0, 1.15, 0.12]}>
        <planeGeometry args={[0.24, 0.015]} />
        <meshBasicMaterial color="#ffcc00" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Workbench() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const benchProgress = useBuildStore((s) => s.benchProgress);
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  const targetRingRef = useRef<THREE.Group | null>(null);
  const caseWrapperRef = useRef<THREE.Group | null>(null);
  const componentsStageGroupRef = useRef<THREE.Group | null>(null);
  const prevStepProgRef = useRef<number>(0);
  const transitionTimeRef = useRef<number>(0);
  const transitionPhaseRef = useRef<'EXIT' | 'WAIT' | 'ENTER'>('EXIT');

  useEffect(() => {
    if (stageTransition !== 'IDLE') {
      transitionTimeRef.current = 0;
      transitionPhaseRef.current = 'EXIT';
    }
  }, [stageTransition]);

  const activeStepData = ASSEMBLY_STEPS[currentStep] ?? ASSEMBLY_STEPS[0];

  useFrame((_, delta) => {
    const state = useBuildStore.getState();
    const prevP = prevStepProgRef.current;
    const curP = state.benchProgress;

    // Hiệu ứng âm thanh cơ học cho toàn bộ các bước lắp ráp
    if (state.currentStep === 5) {
      if (prevP < 0.32 && curP >= 0.32) retroSound.playStepTick(state.soundEnabled);
      if (prevP < 0.58 && curP >= 0.58) retroSound.playStepTick(state.soundEnabled);
      if (prevP < 0.85 && curP >= 0.85) retroSound.playSocketLever(state.soundEnabled);
    } else if (state.currentStep === 6) {
      if (prevP < 0.42 && curP >= 0.42) retroSound.playRamSnap(state.soundEnabled);
      if (prevP < 0.82 && curP >= 0.82) retroSound.playStepTick(state.soundEnabled);
    } else if (state.currentStep === 7) {
      if (prevP < 0.38 && curP >= 0.38) retroSound.playStepTick(state.soundEnabled);
      if (prevP < 0.68 && curP >= 0.68) retroSound.playStepTick(state.soundEnabled);
      if (prevP < 0.94 && curP >= 0.94) retroSound.playSocketLever(state.soundEnabled);
    } else if (state.currentStep === 8) {
      if (prevP < 0.45 && curP >= 0.45) retroSound.playStepTick(state.soundEnabled);
      if (prevP < 0.9 && curP >= 0.9) retroSound.playStepTick(state.soundEnabled);
    } else if (state.currentStep === 9) {
      if (prevP < 0.42 && curP >= 0.42) retroSound.playRamSnap(state.soundEnabled);
      if (prevP < 0.9 && curP >= 0.9) retroSound.playRamSnap(state.soundEnabled);
    } else if (state.currentStep === 10) {
      if (prevP < 0.35 && curP >= 0.35) retroSound.playSocketLever(state.soundEnabled);
      if (prevP < 0.78 && curP >= 0.78) retroSound.playTurboClick(state.soundEnabled);
      if (prevP < 0.88 && curP >= 0.88) retroSound.playPostBeep(state.soundEnabled);
    }
    prevStepProgRef.current = curP;

    if (targetRingRef.current) {
      const rotSpeed = isTurbo ? 1.8 : 0.7;
      targetRingRef.current.rotation.y += delta * rotSpeed;

      const [tx, , tz] = activeStepData.cameraTarget;
      targetRingRef.current.position.x = THREE.MathUtils.lerp(
        targetRingRef.current.position.x,
        tx,
        Math.min(1, delta * 8)
      );
      targetRingRef.current.position.z = THREE.MathUtils.lerp(
        targetRingRef.current.position.z,
        tz,
        Math.min(1, delta * 8)
      );
    }

    // YÊU CẦU #1 & #2:
    // Đưa Thùng máy PC về tư thế ĐỨNG THẲNG DỌC (Vertical Mid-Tower: Width=1.6, Height=3.8, Depth=3.6)
    // vuông góc với mặt bàn (y = 0) và xoay mặt trước hướng thẳng về phía Camera chính (+Z_world).
    // Ở Step 10, thùng máy dịch sang bên phải (X_world = +1.85) nhường trung tâm cho Màn hình CRT Sony Trinitron!
    if (caseWrapperRef.current) {
      const step10ShiftX =
        state.currentStep === 10
          ? THREE.MathUtils.lerp(TOWER_BUILD_X, TOWER_STEP10_X, remap(curP, 0.55, 0.82))
          : state.currentStep > 10
            ? TOWER_STEP10_X
            : TOWER_BUILD_X;
      const targetX = state.currentStep >= 2 ? step10ShiftX : 4.2;
      const alpha = Math.min(1, delta * 8);

      caseWrapperRef.current.position.x =
        state.currentStep >= 10
          ? targetX
          : THREE.MathUtils.lerp(caseWrapperRef.current.position.x, targetX, alpha);
      caseWrapperRef.current.position.y = TOWER_BASE_Y;
      caseWrapperRef.current.position.z = TOWER_CENTER_Z;
    }

    // Diễn hoạt chuyển cảnh giữa các phân đoạn (ABOUT / PROJECT / MY CV) mượt mà tuyệt đối (YÊU CẦU #3 & #4):
    // Pha 1 (EXIT: 0.75s với ABOUT, 0.70s với PROJECT/CV): Đẩy toàn bộ cụm máy sang phải (0 -> +18) với Power2.in (p1 * p1)
    // Pha 2 (ENTER: 0.85s): Cụm máy mục tiêu từ bên trái (-18 -> 0) trượt vào với Power3.out (1 - (1 - p2)^3)
    if (stageTransition !== 'IDLE') {
      const dt = Math.min(delta, 0.05);
      transitionTimeRef.current += dt;
      const t = transitionTimeRef.current;

      // XỬ LÝ TO_HOME_STEP1 (Khi click Home từ Step 01):
      // Tween mượt smoothScrollProgress từ 1.0 về 0.0 trong 1.2s với easePower3InOut
      if (stageTransition === 'TO_HOME_STEP1') {
        const duration = 1.2;
        const p = Math.min(1, t / duration);
        // power3.inOut
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const curScroll = THREE.MathUtils.lerp(1.0, 0.0, ease);
        useBuildStore.getState().syncScrollCurrent(curScroll);

        if (p >= 1) {
          useBuildStore.getState().syncScrollCurrent(0.0);
          useBuildStore.getState().setStageTransition('IDLE');
          transitionTimeRef.current = 0;
          retroSound.playPostBeep(useBuildStore.getState().soundEnabled);
        }
        return;
      }

      // XỬ LÝ HOME_TO_ABOUT (Khi click About từ Step 00 - Home):
      // Pha A (0.0s -> 0.85s): Zoom bung ô cửa sổ bo góc ra toàn màn hình và camera lao vào bàn Step 01
      if (stageTransition === 'HOME_TO_ABOUT') {
        const duration = 0.85;
        const p = Math.min(1, t / duration);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // power3.inOut
        const curScroll = THREE.MathUtils.lerp(0.0, 1.0, ease);
        useBuildStore.getState().syncScrollCurrent(curScroll);

        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = 0;
        }

        if (p >= 1) {
          useBuildStore.getState().syncScrollCurrent(1.0);
          useBuildStore.getState().setStep(1);
          useBuildStore.getState().setStageTransition('IDLE');
          transitionTimeRef.current = 0;
          retroSound.playPostBeep(useBuildStore.getState().soundEnabled);
        }
        return;
      }

      // XỬ LÝ HOME_TO_PROJECT & HOME_TO_MY_CV (Khi click Projects hoặc My CV từ Step 00 - Home):
      // Pha A (0.0s -> 0.85s): Bung ô cửa sổ ra toàn màn hình, đồng thời bộ máy hoàn chỉnh trượt từ x = -18 vào giữa bàn x = 0
      if (stageTransition === 'HOME_TO_PROJECT' || stageTransition === 'HOME_TO_MY_CV') {
        const duration = 0.85;
        const p = Math.min(1, t / duration);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // power3.inOut

        // 1. Bung ô cửa sổ bo góc mở rộng ra kín màn hình
        useBuildStore.getState().setHomeTransitionProgress(ease);

        // 2. Bộ máy PC hoàn chỉnh trượt từ bên trái (-18 -> 0) vào giữa bàn
        const offsetX = THREE.MathUtils.lerp(-18, 0, ease);
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = offsetX;
        }

        if (p >= 1) {
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = 0;
          }
          const finishedTransition = stageTransition;
          useBuildStore.getState().setHomeTransitionProgress(1.0);
          transitionTimeRef.current = 0;
          useBuildStore.getState().setStageTransition('IDLE');
          retroSound.playPostBeep(useBuildStore.getState().soundEnabled);

          if (finishedTransition === 'HOME_TO_PROJECT') {
            useBuildStore.getState().applyStep11State();
            useBuildStore.getState().triggerInsertCdSequence();
          } else {
            useBuildStore.getState().applyStep12State();
            useBuildStore.getState().handleCardClick();
          }
        }
        return;
      }

      // XỬ LÝ TO_HOME (Khi click Home từ Step >= 2):
      // Pha 1 (0.0s -> 0.6s): Đẩy mượt cụm máy sang phải x = +18 với power2.in
      // Pha 2 (0.6s -> 1.5s, duration 0.9s): Reset bàn x = 0, tween smoothScrollProgress từ 1.0 về 0.0 với power3.out
      if (stageTransition === 'TO_HOME') {
        const exitDuration = 0.60;
        const enterDuration = 0.90;

        if (transitionPhaseRef.current === 'EXIT') {
          const p1 = Math.min(1, t / exitDuration);
          const easeIn = p1 * p1; // power2.in
          const offsetX = THREE.MathUtils.lerp(0, 18, easeIn);
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = offsetX;
          }

          if (p1 >= 1) {
            transitionPhaseRef.current = 'ENTER';
            transitionTimeRef.current = 0;
            // Bước B (mốc 0.6s): Reset ngầm về Step 00, đưa bàn thiết kế về lại x = 0, đặt scrollCurrent = 1.0
            useBuildStore.getState().applyHomeResetState();
            if (componentsStageGroupRef.current) {
              componentsStageGroupRef.current.position.x = 0;
            }
          }
        } else {
          // Pha ENTER (0.9s): Tween smoothScrollProgress từ 1.0 về 0.0 với power3.out
          const p2 = Math.min(1, t / enterDuration);
          const easeOut = 1 - Math.pow(1 - p2, 3); // power3.out
          const curScroll = THREE.MathUtils.lerp(1.0, 0.0, easeOut);
          useBuildStore.getState().syncScrollCurrent(curScroll);

          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = 0;
          }

          if (p2 >= 1) {
            useBuildStore.getState().syncScrollCurrent(0.0);
            transitionPhaseRef.current = 'EXIT';
            transitionTimeRef.current = 0;
            useBuildStore.getState().setStageTransition('IDLE');
            retroSound.playPostBeep(useBuildStore.getState().soundEnabled);
          }
        }
        return;
      }

      // XỬ LÝ CÁC CHUYỂN CẢNH KHÁC (TO_ABOUT, TO_PROJECT, TO_MY_CV):
      const exitDuration = stageTransition === 'TO_ABOUT' ? 0.75 : 0.70;
      const enterDuration = 0.85;

      if (transitionPhaseRef.current === 'EXIT') {
        const p1 = Math.min(1, t / exitDuration);
        const easeIn = p1 * p1; // power2.in
        const offsetX = THREE.MathUtils.lerp(0, 18, easeIn);
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = offsetX;
        }

        if (p1 >= 1) {
          transitionPhaseRef.current = 'ENTER';
          transitionTimeRef.current = 0;
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = -18;
          }
          if (stageTransition === 'TO_ABOUT') {
            useBuildStore.getState().applyStep1State();
          } else if (stageTransition === 'TO_MY_CV') {
            useBuildStore.getState().applyStep12State();
          } else {
            useBuildStore.getState().applyStep11State();
          }
        }
      } else {
        const p2 = Math.min(1, t / enterDuration);
        const easeOut = 1 - Math.pow(1 - p2, 3);
        const offsetX = THREE.MathUtils.lerp(-18, 0, easeOut);
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = offsetX;
        }

        if (p2 >= 1) {
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = 0;
          }
          const finishedTransition = stageTransition;
          transitionPhaseRef.current = 'EXIT';
          transitionTimeRef.current = 0;
          useBuildStore.getState().setStageTransition('IDLE');
          retroSound.playPostBeep(useBuildStore.getState().soundEnabled);

          if (finishedTransition === 'TO_PROJECT') {
            useBuildStore.getState().triggerInsertCdSequence();
          } else if (finishedTransition === 'TO_MY_CV') {
            useBuildStore.getState().handleCardClick();
          }
        }
      }
    } else {
      if (componentsStageGroupRef.current && componentsStageGroupRef.current.position.x !== 0) {
        componentsStageGroupRef.current.position.x = 0;
      }
    }
  });

  // Tiến trình từng bước:
  const casePrepProgress =
    currentStep < 2 ? 0 : currentStep === 2 ? benchProgress : 1;

  const psuInstallProgress =
    currentStep < 3 ? 0 : currentStep === 3 ? benchProgress : 1;

  const moboScrewsProgress =
    currentStep < 4
      ? 0
      : currentStep === 4
        ? Math.max(0, Math.min(1, (benchProgress - 0.72) / 0.28))
        : 1;

  const driveInstallProgress =
    currentStep < 5 ? 0 : currentStep === 5 ? benchProgress : 1;

  const powerCableProgress =
    currentStep < 6 ? 0 : currentStep === 6 ? benchProgress : 1;

  const ribbonInstallProgress =
    currentStep < 7 ? 0 : currentStep === 7 ? benchProgress : 1;

  const frontPanelProgress =
    currentStep < 8 ? 0 : currentStep === 8 ? benchProgress : 1;

  const cardsInstallProgress =
    currentStep < 9
      ? 0
      : currentStep === 9
        ? Math.min(1, benchProgress / 0.82)
        : 1;

  const uCoverCloseProgress =
    currentStep < 10 ? 0 : currentStep === 10 ? remap(benchProgress, 0.22, 0.52) : 1;
  const peripheralsProgress =
    currentStep < 10
      ? 0
      : currentStep === 10
        ? (isPoweredOn ? 1 : benchProgress)
        : 1;

  // Khi nắp vỏ chữ U đã đóng kín hoàn toàn (Step 10 khi benchProgress >= 0.52 hoặc đã bật nguồn, hoặc Step 11 & 12):
  // Ẩn toàn bộ linh kiện bên trong lòng thùng máy để chống PCB clipping 100% và tối ưu GPU
  const isCaseCoverClosed =
    currentStep > 10 || (currentStep === 10 && (isPoweredOn || benchProgress >= 0.52));

  // Tính toán tọa độ kết cấu bàn vẽ kỹ thuật chuẩn theo S.TABLE (1 Three.js unit = 1 mét)
  const tableLegX = S.TABLE.W / 2 - S.TABLE.LEG_INSET - S.TABLE.LEG / 2; // 0.905m
  const tableLegZ = S.TABLE.D / 2 - S.TABLE.LEG_INSET - S.TABLE.LEG / 2; // 0.380m
  const legHeight = -S.TABLE.TOP_THICK - S.FLOOR_Y; // 0.70m
  const tableLegY = (-S.TABLE.TOP_THICK + S.FLOOR_Y) / 2; // -0.40m
  const tableSpanX = 2 * tableLegX - S.TABLE.LEG; // 1.74m
  const tableSpanZ = 2 * tableLegZ - S.TABLE.LEG; // 0.69m
  const upperRailY = -S.TABLE.TOP_THICK - S.TABLE.RAIL_H / 2; // -0.10m

  return (
    <group position={[0, 0, 0]} visible={!isInsideProjectApp}>
      {/* 1. MẶT BÀN GỖ KỸ THUẬT NỀN DƯỚI (WORKBENCH DESK SLAB) & 4 CHÂN BÀN THÉP CHỊU LỰC (CHUẨN TỈ LỆ S.TABLE) */}
      <RoundedBox
        args={[S.TABLE.W, S.TABLE.TOP_THICK, S.TABLE.D]}
        radius={0.008}
        smoothness={2}
        position={[0, -S.TABLE.TOP_THICK / 2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#0e0e0d" roughness={0.88} metalness={0.06} />
      </RoundedBox>

      {/* 4 Chân bàn thép hộp vuông chịu lực (0.07m x 0.07m) nối từ đáy mặt bàn (y = -0.05) xuống sàn (y = -0.75) */}
      {[-tableLegX, tableLegX].map((lx) =>
        [-tableLegZ, tableLegZ].map((lz) => (
          <group key={`table-leg-${lx}-${lz}`} position={[lx, tableLegY, lz]}>
            {/* Thân chân thép hộp */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[S.TABLE.LEG, legHeight, S.TABLE.LEG]} />
              <meshStandardMaterial color="#1a1c22" roughness={0.45} metalness={0.8} />
            </mesh>
            {/* Đệm chân ren kim loại chạm sàn */}
            <mesh position={[0, -legHeight / 2 + 0.0075, 0]}>
              <cylinderGeometry args={[0.042, 0.048, 0.015, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.85} />
            </mesh>
          </group>
        ))
      )}

      {/* Thanh giằng ngang trên (Apron/Rails) dưới mặt bàn: RAIL_H = 0.10m, Y = -0.10m */}
      <mesh position={[0, upperRailY, -tableLegZ]} castShadow>
        <boxGeometry args={[tableSpanX, S.TABLE.RAIL_H, 0.025]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[0, upperRailY, tableLegZ]} castShadow>
        <boxGeometry args={[tableSpanX, S.TABLE.RAIL_H, 0.025]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[-tableLegX, upperRailY, 0]} castShadow>
        <boxGeometry args={[0.025, S.TABLE.RAIL_H, tableSpanZ]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[tableLegX, upperRailY, 0]} castShadow>
        <boxGeometry args={[0.025, S.TABLE.RAIL_H, tableSpanZ]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>

      {/* Thanh giằng thấp nối các chân (LOWER_BRACE_Y = -0.55m): thanh sau và 2 thanh bên hông (chừa gầm trước) */}
      <mesh position={[0, S.TABLE.LOWER_BRACE_Y, -tableLegZ]} castShadow>
        <boxGeometry args={[tableSpanX, 0.035, 0.035]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[-tableLegX, S.TABLE.LOWER_BRACE_Y, 0]} castShadow>
        <boxGeometry args={[0.035, 0.035, tableSpanZ]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>
      <mesh position={[tableLegX, S.TABLE.LOWER_BRACE_Y, 0]} castShadow>
        <boxGeometry args={[0.035, 0.035, tableSpanZ]} />
        <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
      </mesh>

      {/* CỤM TOÀN BỘ LINH KIỆN MÁY TÍNH TRÊN MẶT BÀN (ĐẶT TRỰC TIẾP TRÊN MẶT BÀN GỖ ĐEN, KHÔNG DÙNG THẢM CẮT ĐỂ TRÁNH CHE LINH KIỆN) */}
      <group
        ref={componentsStageGroupRef}
        scale={[S.DESK_ITEMS_SCALE, S.DESK_ITEMS_SCALE, S.DESK_ITEMS_SCALE]}
      >
        {/* 4. YÊU CẦU #5: 3 Ô ĐEN ĐẶT CHỜ LINH KIỆN TRÊN BÀN CẮT (STAGING PADS)
               Chỉ hiển thị ở Step 01 khi CPU, Tản nhiệt và RAM còn nằm trên bàn;
               ẩn hoàn toàn (visible={currentStep === 1}) ngay sau khi lắp xong Step 01! */}
        <group visible={currentStep === 1}>
        <group position={[-1.72, 0.015, -0.92]}>
          <RoundedBox
            args={[0.68, 0.02, 0.68]}
            radius={0.006}
            smoothness={1}
            receiveShadow
            material={retroMaterials.darkBeige}
          />
          <RoundedBox
            args={[0.58, 0.015, 0.58]}
            radius={0.004}
            smoothness={1}
            position={[0, 0.008, 0]}
            receiveShadow
            material={retroMaterials.blackAnodized}
          />
        </group>

        <group position={[-1.72, 0.015, -0.12]}>
          <RoundedBox
            args={[0.68, 0.02, 0.68]}
            radius={0.006}
            smoothness={1}
            receiveShadow
            material={retroMaterials.darkBeige}
          />
          <RoundedBox
            args={[0.58, 0.015, 0.58]}
            radius={0.004}
            smoothness={1}
            position={[0, 0.008, 0]}
            receiveShadow
            material={retroMaterials.blackAnodized}
          />
        </group>

        <group position={[-1.72, 0.015, 0.78]}>
          <RoundedBox
            args={[0.48, 0.02, 1.06]}
            radius={0.006}
            smoothness={1}
            receiveShadow
            material={retroMaterials.darkBeige}
          />
          <RoundedBox
            args={[0.38, 0.015, 0.96]}
            radius={0.004}
            smoothness={1}
            position={[0, 0.008, 0]}
            receiveShadow
            material={retroMaterials.blackAnodized}
          />
        </group>
      </group>

      {/* 5. THÙNG MÁY PC ĐỨNG THẲNG DỌC (VERTICAL MID-TOWER: 1.6W x 3.8H x 3.6D)
             Xoay hướng thẳng mặt trước về phía Camera chính (+Z_world) */}
      <group
        ref={caseWrapperRef}
        position={[TOWER_BUILD_X, TOWER_BASE_Y, TOWER_CENTER_Z]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        scale={TOWER_SCALE}
        visible={currentStep >= 2}
      >
        <PcCaseEnlight
          casePrepProgress={casePrepProgress}
          moboScrewsProgress={moboScrewsProgress}
          uCoverCloseProgress={uCoverCloseProgress}
        />

        {currentStep >= 3 && (
          <PsuSeasonicAT psuInstallProgress={psuInstallProgress} />
        )}

        {currentStep >= 5 && (
          <StorageDrives
            driveInstallProgress={driveInstallProgress}
            isCaseCoverClosed={isCaseCoverClosed}
          />
        )}

        {currentStep >= 6 && !isCaseCoverClosed && (
          <PowerAndFrontCables
            powerCableProgress={powerCableProgress}
            frontPanelProgress={frontPanelProgress}
          />
        )}

        {currentStep >= 7 && !isCaseCoverClosed && (
          <RibbonCables ribbonInstallProgress={ribbonInstallProgress} />
        )}

        {currentStep >= 9 && !isCaseCoverClosed && (
          <ExpansionCards cardsInstallProgress={cardsInstallProgress} />
        )}
      </group>

      {/* 6. CỤM LINH KIỆN BO MẠCH CHỦ (STEP 01 TRÊN BÀN -> STEP 04 DỰNG ĐỨNG VÀO LÒNG CASE)
             Ẩn hoàn toàn khi nắp vỏ thùng máy đã đóng kín để loại bỏ 100% lỗi lộ bo mạch xanh */}
      <group visible={!isCaseCoverClosed}>
        <BenchAssemblyGroup />
      </group>

      {/* 6B. CỤM NGOẠI VI MÀN HÌNH CRT SONY TRINITRON 15" + BÀN PHÍM IBM MODEL M + CHUỘT BI (STEP 10) */}
      {currentStep >= 10 && (
        <PeripheralsCRT peripheralsProgress={peripheralsProgress} />
      )}

        {/* 7. CON TRỎ NGẮM TỌA ĐỘ TRẠM LẮP RÁP HIỆN TẠI (ACTIVE STEP RETICLE - ẨN Ở STEP 0 VÀ STEP 10) */}
        <group ref={targetRingRef} position={[0, 0.015, 0]} visible={currentStep >= 1 && currentStep < 10}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.38, 0.41, 32]} />
            <meshBasicMaterial
              color={isTurbo ? '#ff2a2a' : '#33ff33'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      </group>

      {/* 8. ĐÈN BÀN LÒ XO MẠ CRÔM CỐ ĐỊNH TRÊN MẶT BÀN (CHROME ARCHITECT DESK LAMP - QUY ĐỔI S) */}
      <group scale={[S.DESK_ITEMS_SCALE, S.DESK_ITEMS_SCALE, S.DESK_ITEMS_SCALE]}>
        <ChromeArchitectDeskLamp />
      </group>

      {/* 9. DEBUG SCALE REFERENCE: Người mẫu 1.70m đứng cạnh bàn (bật bằng flag S.DEBUG_SCALE_REF) */}
      {S.DEBUG_SCALE_REF && <HumanScaleDummy />}
    </group>
  );
}
