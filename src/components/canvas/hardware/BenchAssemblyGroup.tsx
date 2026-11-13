import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Motherboard,
  SOCKET7_LOCAL_POS,
  DIMM1_LOCAL_POS,
} from './Motherboard';
import { CpuPentiumMMX } from './CpuPentiumMMX';
import { CoolerMasterFan } from './CoolerMasterFan';
import { RamStick } from './RamStick';
import { useBuildStore } from '../../../store/useBuildStore';
import { retroSound } from '../../../utils/retroSound';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function remap(v: number, inMin: number, inMax: number): number {
  const t = clamp01((v - inMin) / (inMax - inMin));
  return t * t * (3 - 2 * t);
}

// Tọa độ chờ (Staging / Exploded = Bước 0) trên các ô quy định của mặt bàn Cutting Mat bên trái Mainboard
const CPU_STAGE_POS = new THREE.Vector3(-1.72, 0.075, -0.92);
const FAN_STAGE_POS = new THREE.Vector3(-1.72, 0.075, -0.12);
const RAM_STAGE_POS = new THREE.Vector3(-1.72, 0.09, 0.78);

// Tọa độ lắp hoàn chỉnh trên Mainboard ASUS TX97-E (Mainboard đặt tại Y = 0.05 trong hệ quy chiếu cục bộ của BenchAssemblyGroup)
const MOBO_Y = 0.05;
const CPU_INSTALLED_POS = new THREE.Vector3(
  SOCKET7_LOCAL_POS[0],
  MOBO_Y + SOCKET7_LOCAL_POS[1] + 0.036,
  SOCKET7_LOCAL_POS[2]
);
const FAN_INSTALLED_POS = new THREE.Vector3(
  SOCKET7_LOCAL_POS[0],
  CPU_INSTALLED_POS.y + 0.02,
  SOCKET7_LOCAL_POS[2]
);
const RAM_INSTALLED_POS = new THREE.Vector3(
  DIMM1_LOCAL_POS[0],
  MOBO_Y + DIMM1_LOCAL_POS[1] + 0.015,
  DIMM1_LOCAL_POS[2]
);

// Hệ số tỷ lệ của Thùng máy đứng (Width = 1.60, Height = 3.80, Depth = 3.60)
export const TOWER_SCALE: [number, number, number] = [1.023, 1.185, 1.086];
export const TOWER_BASE_Y = 1.607; // Đặt đáy thùng máy (z_int = +1.48) chạm khít mặt bàn y = 0.00
export const TOWER_CENTER_Z = -0.35;
export const TOWER_BUILD_X = 0.806; // Tâm X_world = 0.0 ở Step 02 -> 09
export const TOWER_STEP10_X = 2.656; // Dịch sang bên phải màn hình CRT (X_world = +1.85) ở Step 10

export function BenchAssemblyGroup() {
  const rootGroupRef = useRef<THREE.Group>(null);
  const moboRef = useRef<THREE.Group>(null);
  const leverRef = useRef<THREE.Group>(null);
  const latchNorthRef = useRef<THREE.Group>(null);
  const latchSouthRef = useRef<THREE.Group>(null);

  const cpuRef = useRef<THREE.Group>(null);
  const fanRef = useRef<THREE.Group>(null);
  const ramRef = useRef<THREE.Group>(null);

  const prevProgressRef = useRef<number>(0);

  useFrame((_, delta) => {
    const state = useBuildStore.getState();
    const { currentStep } = state;
    let stepP = state.benchProgress;

    // Tự động tăng/giảm tiến trình benchProgress về benchAutoTarget nếu người dùng không kéo thanh trượt
    if (!state.benchScrubbing) {
      const target = state.benchAutoTarget;
      if (Math.abs(target - stepP) > 0.0005) {
        const speed = state.isTurbo ? 0.36 : 0.25;
        const dir = target > stepP ? 1 : -1;
        stepP = clamp01(stepP + dir * delta * speed);
        state.setBenchProgress(stepP, false);
      } else if (stepP !== target) {
        stepP = target;
        state.setBenchProgress(stepP, false);
      }
    }

    const scrollCurrent = state.scrollCurrent;

    // Tiến trình lắp linh kiện trên bàn (CPU, Cooler, RAM) ở Step 01:
    // Đồng bộ trực tiếp 100% với cuộn chuột scrollCurrent (0.0 -> 1.0)
    const p = (currentStep === 0)
      ? 0.0
      : (state.hasCompletedAssembly || currentStep > 1)
        ? 1.0
        : Math.max(clamp01(scrollCurrent), clamp01(stepP));

    // Tiến trình nâng bo mạch chủ vào lòng case ở Step 04:
    // Đồng bộ trực tiếp với cuộn chuột scrollCurrent (3.0 -> 4.0)
    const step4ScrollP = (state.hasCompletedAssembly || currentStep > 4)
      ? 1.0
      : currentStep === 4
        ? clamp01(scrollCurrent - 3.0)
        : 0.0;
    const effectiveStep4P = Math.max(step4ScrollP, clamp01(stepP));

    const prevP = prevProgressRef.current;

    if (currentStep === 1) {
      if (prevP < 0.55 && p >= 0.55) {
        retroSound.playSocketLever(state.soundEnabled);
      }
      if (prevP < 0.97 && p >= 0.97) {
        retroSound.playRamSnap(state.soundEnabled);
      }
    } else if (currentStep === 4) {
      if (prevP < 0.72 && effectiveStep4P >= 0.72) {
        retroSound.playSocketLever(state.soundEnabled);
      }
    }
    prevProgressRef.current = currentStep === 1 ? p : effectiveStep4P;

    // =========================================================================
    // ĐIỀU KHIỂN VỊ TRÍ & GÓC DỰNG ĐỨNG CỦA BENCH ASSEMBLY GROUP THEO STEP (01 -> 10)
    // =========================================================================
    if (rootGroupRef.current) {
      const seatedMoboX = TOWER_BUILD_X - 0.07 * TOWER_SCALE[1]; // 0.723
      const step10MoboX = TOWER_STEP10_X - 0.07 * TOWER_SCALE[1]; // 2.573

      const isAtCompletedHome =
        state.hasCompletedAssembly &&
        (currentStep === 0 ||
          state.stageTransition === 'POST_ABOUT_TO_HOME' ||
          state.stageTransition === 'HOME_TO_POST_ABOUT_INSPECT');
      if (isAtCompletedHome || currentStep >= 10) {
        // Step 10+ hoặc ở Home đã hoàn tất: Dịch chuyển đồng bộ cùng Thùng máy đứng sang bên phải màn hình CRT (X_world = +1.85) sau khi đậy nắp chữ U
        const isPowered = state.isPoweredOn;
        const shiftT = isAtCompletedHome || currentStep > 10 || isPowered ? 1 : THREE.MathUtils.smoothstep(state.scrollCurrent, 9.65, 9.95);
        const curX = THREE.MathUtils.lerp(seatedMoboX, step10MoboX, shiftT);
        const alpha = Math.min(1, delta * 8);
        rootGroupRef.current.position.x = THREE.MathUtils.lerp(rootGroupRef.current.position.x, curX, alpha);
        rootGroupRef.current.position.y = TOWER_BASE_Y;
        rootGroupRef.current.position.z = TOWER_CENTER_Z;
        rootGroupRef.current.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        rootGroupRef.current.scale.set(...TOWER_SCALE);
      } else if (currentStep === 0 || currentStep === 1) {
        // Step 00 & Step 01: Đặt phẳng ở chính giữa bàn bản vẽ kỹ thuật (không dựng đứng trong thùng máy)
        const alpha = Math.min(1, delta * 8);
        rootGroupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), alpha);
        rootGroupRef.current.rotation.set(0, 0, 0);
        rootGroupRef.current.scale.set(1, 1, 1);
      } else if (currentStep === 2 || currentStep === 3) {
        // Step 02 & 03: Đã hoàn tất lắp CPU/Fan/RAM ở Step 01, bo mạch chủ nằm phẳng phiu trên mặt bàn
        // bên trái thùng máy [-0.95, 0.0, 0.2], KHÔNG bay lơ lửng che thùng máy và KHÔNG đè lên text!
        const alpha = Math.min(1, delta * 8);
        rootGroupRef.current.position.lerp(new THREE.Vector3(-0.95, 0.0, 0.2), alpha);
        rootGroupRef.current.rotation.set(0, 0, 0);
        rootGroupRef.current.scale.set(1, 1, 1);
      } else if (currentStep === 4) {
        // Step 04: Nâng cụm BenchAssemblyGroup từ vị trí mặt bàn [-0.95, 0.0, 0.2],
        // xoay dựng đứng [Math.PI/2, 0, Math.PI/2] song song với vách Motherboard Tray,
        // đưa vào lòng Thùng máy đứng qua cửa hông trái và khóa lên 6 chân ốc đồng!
        const liftAndRotate = remap(effectiveStep4P, 0.0, 0.52);
        const seatOnStandoffs = remap(effectiveStep4P, 0.52, 0.74);

        const hoverX = THREE.MathUtils.lerp(-0.95, -0.15, liftAndRotate);
        const targetX = THREE.MathUtils.lerp(hoverX, seatedMoboX, seatOnStandoffs);
        const targetY = THREE.MathUtils.lerp(0.0, TOWER_BASE_Y, liftAndRotate);
        const hoverZ = THREE.MathUtils.lerp(0.2, TOWER_CENTER_Z + 0.08, liftAndRotate);
        const targetZ = THREE.MathUtils.lerp(hoverZ, TOWER_CENTER_Z, seatOnStandoffs);

        rootGroupRef.current.position.set(targetX, targetY, targetZ);
        rootGroupRef.current.rotation.set(
          THREE.MathUtils.lerp(0, Math.PI / 2, liftAndRotate),
          THREE.MathUtils.lerp(0, 0, liftAndRotate),
          THREE.MathUtils.lerp(0, Math.PI / 2, liftAndRotate)
        );
        rootGroupRef.current.scale.set(
          THREE.MathUtils.lerp(1, TOWER_SCALE[0], liftAndRotate),
          THREE.MathUtils.lerp(1, TOWER_SCALE[1], liftAndRotate),
          THREE.MathUtils.lerp(1, TOWER_SCALE[2], liftAndRotate)
        );
      } else {
        // Step 05 -> Step 09: Cố định vững chắc trên 6 chân ốc đồng trong lòng Thùng máy đứng
        rootGroupRef.current.position.set(seatedMoboX, TOWER_BASE_Y, TOWER_CENTER_Z);
        rootGroupRef.current.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        rootGroupRef.current.scale.set(...TOWER_SCALE);
      }
    }

    // =========================================================================
    // PHA 1 (0.00 -> 0.16) & PHA 3 (0.44 -> 0.58) CỦA STEP 01: CẦN GẠT CƠ HỌC SOCKET 7
    // =========================================================================
    if (leverRef.current) {
      const liftT = remap(p, 0.0, 0.16);
      const lockT = remap(p, 0.44, 0.58);
      const openAngle = -Math.PI / 2;
      const idleAngle = -0.45;
      const angleBeforeLock = THREE.MathUtils.lerp(idleAngle, openAngle, liftT);
      const finalLeverAngle = THREE.MathUtils.lerp(angleBeforeLock, 0, lockT);
      leverRef.current.rotation.x = finalLeverAngle;
    }

    // =========================================================================
    // PHA 2 (0.14 -> 0.44) CỦA STEP 01: CPU PENTIUM MMX HẠ VÀO SOCKET 7
    // =========================================================================
    if (cpuRef.current) {
      const arcT = remap(p, 0.14, 0.34);
      const dropT = remap(p, 0.34, 0.44);

      const hoverHeight = 0.45;
      const x = THREE.MathUtils.lerp(CPU_STAGE_POS.x, CPU_INSTALLED_POS.x, arcT);
      const z = THREE.MathUtils.lerp(CPU_STAGE_POS.z, CPU_INSTALLED_POS.z, arcT);

      const arcY =
        THREE.MathUtils.lerp(CPU_STAGE_POS.y, CPU_INSTALLED_POS.y + hoverHeight, arcT) +
        Math.sin(arcT * Math.PI) * 0.38;
      const y = THREE.MathUtils.lerp(arcY, CPU_INSTALLED_POS.y, dropT);

      cpuRef.current.position.set(x, y, z);
      cpuRef.current.rotation.z = Math.sin(arcT * Math.PI) * -0.18 * (1 - dropT);
    }

    // =========================================================================
    // PHA 4 (0.56 -> 0.80) CỦA STEP 01: TẢN NHIỆT COOLER MASTER HẠ XUỐNG LƯNG CPU
    // =========================================================================
    if (fanRef.current) {
      const arcT = remap(p, 0.56, 0.72);
      const clampT = remap(p, 0.72, 0.8);

      const hoverHeight = 0.42;
      const x = THREE.MathUtils.lerp(FAN_STAGE_POS.x, FAN_INSTALLED_POS.x, arcT);
      const z = THREE.MathUtils.lerp(FAN_STAGE_POS.z, FAN_INSTALLED_POS.z, arcT);

      const arcY =
        THREE.MathUtils.lerp(FAN_STAGE_POS.y, FAN_INSTALLED_POS.y + hoverHeight, arcT) +
        Math.sin(arcT * Math.PI) * 0.35;
      const y = THREE.MathUtils.lerp(arcY, FAN_INSTALLED_POS.y, clampT);

      fanRef.current.position.set(x, y, z);
      fanRef.current.rotation.z = Math.sin(arcT * Math.PI) * -0.14 * (1 - clampT);
    }

    // =========================================================================
    // PHA 5 (0.78 -> 1.00) CỦA STEP 01: THANH RAM SDRAM TRƯỢT XUỐNG KHE DIMM 1
    // =========================================================================
    if (ramRef.current) {
      const moveT = remap(p, 0.78, 0.9);
      const insertT = remap(p, 0.9, 0.98);

      const hoverHeight = 0.38;
      const x = THREE.MathUtils.lerp(RAM_STAGE_POS.x, RAM_INSTALLED_POS.x, moveT);
      const z = THREE.MathUtils.lerp(RAM_STAGE_POS.z, RAM_INSTALLED_POS.z, moveT);

      const arcY =
        THREE.MathUtils.lerp(RAM_STAGE_POS.y, RAM_INSTALLED_POS.y + hoverHeight, moveT) +
        Math.sin(moveT * Math.PI) * 0.25;
      const y = THREE.MathUtils.lerp(arcY, RAM_INSTALLED_POS.y, insertT);

      ramRef.current.position.set(x, y, z);
      ramRef.current.rotation.z = THREE.MathUtils.lerp(0.45, 0, moveT);
    }

    const latchSnapT = remap(p, 0.93, 1.0);
    const openLatchAngle = 0.58;
    const currentLatchAngle = THREE.MathUtils.lerp(openLatchAngle, 0, latchSnapT);

    if (latchNorthRef.current) {
      latchNorthRef.current.rotation.x = -currentLatchAngle;
    }
    if (latchSouthRef.current) {
      latchSouthRef.current.rotation.x = currentLatchAngle;
    }
  });

  return (
    <group ref={rootGroupRef}>
      {/* 1. Bo mạch chủ ASUS TX97-E */}
      <Motherboard
        ref={moboRef}
        position={[0, MOBO_Y, 0]}
        leverRef={leverRef}
        dimm1LatchNorthRef={latchNorthRef}
        dimm1LatchSouthRef={latchSouthRef}
      />

      {/* 2. CPU Intel Pentium MMX 233MHz */}
      <CpuPentiumMMX ref={cpuRef} />

      {/* 3. Cụm Tản nhiệt nhôm đen & Quạt Cooler Master 40mm */}
      <CoolerMasterFan ref={fanRef} />

      {/* 4. Thanh RAM PC100 32MB SDRAM */}
      <RamStick ref={ramRef} />
    </group>
  );
}
