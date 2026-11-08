import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  createCuttingMatTexture,
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
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);

  const {
    chromeMat,
    springMat,
    innerShadeMat,
    baseLatheGeo,
    bellShadeGeo,
    topCordGeo,
    baseCordGeo,
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
    // Dọc theo trục Y cục bộ của chụp đèn: từ đỉnh đuôi đui đèn (y = +0.46) xuống miệng loe (y = -0.46)
    const shadePts = [
      new THREE.Vector2(0.0, 0.46),
      new THREE.Vector2(0.11, 0.45),
      new THREE.Vector2(0.13, 0.34),
      new THREE.Vector2(0.14, 0.2),
      // Bậc chuyển tiếp từ cổ trụ sang bầu chuông
      new THREE.Vector2(0.19, 0.15),
      new THREE.Vector2(0.28, 0.04),
      new THREE.Vector2(0.37, -0.12),
      new THREE.Vector2(0.44, -0.28),
      new THREE.Vector2(0.49, -0.43),
      // Gờ cuộn mép miệng chao đèn
      new THREE.Vector2(0.505, -0.45),
      new THREE.Vector2(0.485, -0.46),
    ];
    const shadeGeo = new THREE.LatheGeometry(shadePts, 40);
    shadeGeo.computeVertexNormals();

    // 3. Đoạn dây điện màu trắng uốn cong từ đầu tay đòn trên vòng vào cổ chụp đèn (như ảnh mẫu)
    const topCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.76, 4.78, 0),
      new THREE.Vector3(0.84, 5.05, 0),
      new THREE.Vector3(0.98, 5.08, 0),
      new THREE.Vector3(1.04, 4.92, 0),
    ]);
    const tCordGeo = new THREE.TubeGeometry(topCurve, 24, 0.014, 8, false);

    // 4. Dây nguồn trắng đi từ chân đế ra mép bàn
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.12, 0.14, 0),
      new THREE.Vector3(-0.55, 0.05, -0.15),
      new THREE.Vector3(-1.35, 0.02, -0.45),
      new THREE.Vector3(-2.15, 0.02, -0.85),
    ]);
    const bCordGeo = new THREE.TubeGeometry(bCurve, 24, 0.015, 8, false);

    return {
      chromeMat: chrome,
      springMat: spring,
      innerShadeMat: innerShade,
      baseLatheGeo: baseGeo,
      bellShadeGeo: shadeGeo,
      topCordGeo: tCordGeo,
      baseCordGeo: bCordGeo,
    };
  }, []);

  useEffect(() => {
    return () => {
      chromeMat.dispose();
      springMat.dispose();
      innerShadeMat.dispose();
      baseLatheGeo.dispose();
      bellShadeGeo.dispose();
      topCordGeo.dispose();
      baseCordGeo.dispose();
    };
  }, [
    chromeMat,
    springMat,
    innerShadeMat,
    baseLatheGeo,
    bellShadeGeo,
    topCordGeo,
    baseCordGeo,
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

      {/* Ngàm móc lò xo dưới & 2 Lò xo kéo chéo đặc trưng (như ảnh mẫu) */}
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
      {/* Thanh song song trên */}
      <StrutBetween
        start={[-1.06, 2.55, 0]}
        end={[0.84, 4.82, 0]}
        radius={0.025}
        material={chromeMat}
      />
      {/* Thanh song song dưới */}
      <StrutBetween
        start={[-1.02, 2.41, 0]}
        end={[0.86, 4.68, 0]}
        radius={0.022}
        material={chromeMat}
      />
      {/* Lò xo kéo dọc nửa dưới của tay đòn trên (giống ảnh mẫu) */}
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

      {/* Dây điện màu trắng uốn vòng trên đỉnh cổ đèn & dưới chân đế */}
      <mesh geometry={topCordGeo} material={retroMaterials.beigePlastic} />
      <mesh geometry={baseCordGeo} material={retroMaterials.beigePlastic} />

      {/* 5. BẦU CHỤP ĐÈN HÌNH CHUÔNG BẬC MẠ CRÔM & BÓNG ĐÈN SỢI ĐỐT (STEPPED BELL REFLECTOR SHADE)
             Hướng nghiêng trực tiếp xuống màn hình CRT, bàn phím & thùng máy PC */}
      <group position={[1.14, 4.66, 0]} rotation={[0, 0, 0.72]}>
        {/* Mặt ngoài mạ crôm sáng bóng */}
        <mesh geometry={bellShadeGeo} castShadow material={chromeMat} />
        {/* Mặt trong tráng men trắng phát sáng ấm */}
        <mesh geometry={bellShadeGeo} scale={[0.985, 0.99, 0.985]} material={innerShadeMat} />

        {/* Núm công tắc bật/tắt nhỏ trên đỉnh cổ chụp đèn (như ảnh mẫu) */}
        <mesh position={[0, 0.5, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.018, 0.024, 0.08, 12]} />
        </mesh>

        {/* Bóng đèn sợi đốt phát sáng vàng ấm bên trong bầu chụp đèn */}
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial
            color="#fff6d6"
            emissive="#ffda85"
            emissiveIntensity={isPoweredOn ? 3.2 : 0.35}
            roughness={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}

export function Workbench() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const benchProgress = useBuildStore((s) => s.benchProgress);
  const isTurbo = useBuildStore((s) => s.isTurbo);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  // YÊU CẦU #5: Tạo 2 phiên bản Cutting Mat Texture:
  // - Khi ở Step 01 -> 04: Hiển thị các khung chữ vàng chú thích Staging Zones
  // - Khi từ Step 05 -> 10: Ẩn hoàn toàn các khung chữ vàng chú thích để mặt bàn sạch sẽ cho bộ PC hoàn chỉnh!
  const matWithZonesTex = useMemo(() => createCuttingMatTexture(true), []);
  const matCleanTex = useMemo(() => createCuttingMatTexture(false), []);

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

  useEffect(() => {
    return () => {
      matWithZonesTex.dispose();
      matCleanTex.dispose();
    };
  }, [matWithZonesTex, matCleanTex]);

  const activeStepData = ASSEMBLY_STEPS[currentStep - 1] ?? ASSEMBLY_STEPS[0];

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
          : TOWER_BUILD_X;
      const targetX = state.currentStep >= 2 ? step10ShiftX : 4.2;
      const alpha = Math.min(1, delta * 8);

      caseWrapperRef.current.position.x =
        state.currentStep === 10
          ? targetX
          : THREE.MathUtils.lerp(caseWrapperRef.current.position.x, targetX, alpha);
      caseWrapperRef.current.position.y = TOWER_BASE_Y;
      caseWrapperRef.current.position.z = TOWER_CENTER_Z;
    }

    // Diễn hoạt chuyển cảnh từ ABOUT sang PROJECT mượt mà tuyệt đối:
    // Pha 1 (EXIT: 0.38s): Đẩy các linh kiện rời sang phải (0 -> +10) với Cubic Ease In
    // Pha 2 (WAIT: 0.20s): Chờ ở ngoài màn hình bên trái (-10) để WebGL nạp xong shader mà KHÔNG bị giật hình
    // Pha 3 (ENTER: 0.72s): Dàn PC đầy đủ trượt từ trái (-10 -> 0) với Quintic Ease Out siêu êm đềm
    if (stageTransition === 'ABOUT_TO_PROJECT') {
      const dt = Math.min(delta, 0.05);
      transitionTimeRef.current += dt;
      const t = transitionTimeRef.current;

      if (transitionPhaseRef.current === 'EXIT') {
        const p1 = Math.min(1, t / 0.38);
        const easeOut = p1 * p1 * p1; // Cubic Ease In
        const offsetX = THREE.MathUtils.lerp(0, 10, easeOut);
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = offsetX;
        }

        if (p1 >= 1) {
          // Khi đã bay khuất hoàn toàn sang phải: chuyển sang pha WAIT
          transitionPhaseRef.current = 'WAIT';
          transitionTimeRef.current = 0;
          // Đặt cụm PC đầy đủ ở vị trí xuất phát ngoài màn hình bên trái (-10)
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = -10;
          }
          // Kích hoạt nạp Step 10 trong khi đang ẩn ngoài màn hình
          useBuildStore.getState().applyStep10State();
        }
      } else if (transitionPhaseRef.current === 'WAIT') {
        // Giữ nguyên ngoài màn hình (-10) trong 200ms để GPU biên dịch trọn vẹn 100% shader màn hình CRT & bàn phím
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = -10;
        }
        if (t >= 0.20) {
          transitionPhaseRef.current = 'ENTER';
          transitionTimeRef.current = 0;
        }
      } else {
        // Pha ENTER: Bộ PC đầy đủ di chuyển từ trái sang giữa (0.0s -> 0.72s)
        const p2 = Math.min(1, t / 0.72);
        // Quintic Ease Out siêu êm ái: hãm phanh mềm mại khi vào trung tâm
        const easeIn = 1 - Math.pow(1 - p2, 5);
        const offsetX = THREE.MathUtils.lerp(-10, 0, easeIn);
        if (componentsStageGroupRef.current) {
          componentsStageGroupRef.current.position.x = offsetX;
        }

        if (p2 >= 1) {
          // Hoàn tất chuyển cảnh: Khóa chặt tại tâm (0)
          if (componentsStageGroupRef.current) {
            componentsStageGroupRef.current.position.x = 0;
          }
          transitionPhaseRef.current = 'EXIT';
          transitionTimeRef.current = 0;
          useBuildStore.getState().setStageTransition('IDLE');
          retroSound.playPostBeep(useBuildStore.getState().soundEnabled);
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
    currentStep < 10 ? 0 : remap(benchProgress, 0.22, 0.52);
  const peripheralsProgress = currentStep < 10 ? 0 : benchProgress;

  const activeCuttingMatTex = currentStep >= 5 ? matCleanTex : matWithZonesTex;

  return (
    <group position={[0, 0, 0]} visible={!isInsideProjectApp}>
      {/* 1. MẶT BÀN GỖ KỸ THUẬT NỀN DƯỚI (WORKBENCH DESK SLAB) */}
      <RoundedBox
        args={[16, 0.3, 16]}
        radius={0.04}
        smoothness={2}
        position={[0, -0.17, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#0d0d0c" roughness={0.9} metalness={0.05} />
      </RoundedBox>

      {/* 2. THẢM CẮT CHỐNG TĨNH ĐIỆN (PROCEDURAL CUTTING MAT 10x10 UNITS) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.5, 10.5]} />
        <meshStandardMaterial
          map={activeCuttingMatTex}
          roughness={0.82}
          metalness={0.04}
        />
      </mesh>

      {/* Viền cao su chống tĩnh điện bao quanh Cutting Mat */}
      <RoundedBox
        args={[10.68, 0.02, 10.68]}
        radius={0.008}
        smoothness={1}
        position={[0, -0.008, 0]}
        receiveShadow
      >
        <meshStandardMaterial {...RETRO_PBR_PARAMS.blackAnodized} />
      </RoundedBox>

      {/* 3. NÚT BẤM TIẾP ĐỊA CHỐNG TĨNH ĐIỆN (ESD GROUNDING SNAP CORNER) */}
      <group position={[-4.85, 0.02, 4.85]}>
        <mesh castShadow receiveShadow material={retroMaterials.goldPin}>
          <cylinderGeometry args={[0.12, 0.14, 0.04, 24]} />
        </mesh>
        <mesh position={[0, 0.025, 0]} material={retroMaterials.blackAnodized}>
          <cylinderGeometry args={[0.05, 0.05, 0.025, 16]} />
        </mesh>
      </group>

      {/* CỤM TOÀN BỘ LINH KIỆN MÁY TÍNH TRÊN MẶT BÀN (CHỊU HIỆU ỨNG CHUYỂN CẢNH ĐẨY PHẢI / VÀO TỪ TRÁI) */}
      <group ref={componentsStageGroupRef}>
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
          <StorageDrives driveInstallProgress={driveInstallProgress} />
        )}

        {currentStep >= 6 && (
          <PowerAndFrontCables
            powerCableProgress={powerCableProgress}
            frontPanelProgress={frontPanelProgress}
          />
        )}

        {currentStep >= 7 && (
          <RibbonCables ribbonInstallProgress={ribbonInstallProgress} />
        )}

        {currentStep >= 9 && (
          <ExpansionCards cardsInstallProgress={cardsInstallProgress} />
        )}
      </group>

      {/* 6. CỤM LINH KIỆN BO MẠCH CHỦ (STEP 01 TRÊN BÀN -> STEP 04 DỰNG ĐỨNG VÀO LÒNG CASE) */}
      <BenchAssemblyGroup />

      {/* 6B. CỤM NGOẠI VI MÀN HÌNH CRT SONY TRINITRON 15" + BÀN PHÍM IBM MODEL M + CHUỘT BI (STEP 10) */}
      {currentStep >= 10 && (
        <PeripheralsCRT peripheralsProgress={peripheralsProgress} />
      )}

        {/* 7. CON TRỎ NGẮM TỌA ĐỘ TRẠM LẮP RÁP HIỆN TẠI (ACTIVE STEP RETICLE - ẨN Ở STEP 10) */}
        <group ref={targetRingRef} position={[0, 0.015, 0]} visible={currentStep < 10}>
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

      {/* 8. ĐÈN BÀN LÒ XO MẠ CRÔM CAO LỚN ĐẶT CẠNH TRÁI MÁY TÍNH (CHROME ARCHITECT DESK LAMP) */}
      <ChromeArchitectDeskLamp />
    </group>
  );
}
