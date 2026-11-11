import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { useBuildStore } from '../../../store/useBuildStore';
import { PressableControl } from '../interaction/PressableControl';

export const STANDOFF_XZ_COORDS: [number, number][] = [
  [-0.98, -1.28],
  [0.98, -1.28],
  [-0.98, 0.0],
  [0.98, 0.0],
  [-0.98, 1.28],
  [0.98, 1.28],
];

// Tọa độ Z nội bộ của 7 khe cắm mở rộng (4 PCI + 3 ISA) khớp chính xác từng milimet với Motherboard.tsx
const ALL_SLOT_Z = [0.08, 0.25, 0.42, 0.59, 0.82, 1.01, 1.2];
// Khe PCI 1 (index 0: z=0.08) và ISA 1 (index 4: z=0.82) sẽ được tháo chắn sắt ở Step 02
const FIXED_BRACKET_Z = [0.25, 0.42, 0.59, 1.01, 1.2];
const REMOVABLE_BRACKET_Z = [0.08, 0.82];

/**
 * 1. CanvasTexture cho nhãn chữ "POWER" nằm phẳng phiu ở góc trên bên phải viền trên Bezel
 */
function createPowerTextTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8d2c5';
  ctx.fillRect(0, 0, 256, 64);

  // Ký hiệu nguồn & chữ POWER in lụa sắc nét
  ctx.strokeStyle = '#3a3630';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(36, 32, 14, 0.3 * Math.PI, 2.7 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, 12);
  ctx.lineTo(36, 32);
  ctx.stroke();

  ctx.fillStyle = '#3a3630';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('POWER', 64, 42);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. CanvasTexture cho cụm Control Panel phẳng phiu bên phải (35% bề ngang lòng mặt nạ):
 *    - Nhãn dán nền trắng in chữ "ALPHA" màu xanh dương (#0033aa) ở phía trên trái
 *    - Ô LED 7-segment nhỏ hiển thị 233 / 66 MHz
 *    - Chữ "RESET" nhỏ phía trên hốc nút Reset ở dưới trái
 *    - Ký hiệu PWR / HDD bên cạnh 2 bóng đèn LED tròn 3mm ở cột phải
 */
function createAlphaControlTexture(
  isPoweredOn: boolean,
  isTurbo: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Nền nhựa Beige phẳng phiu của cụm Control Panel
  ctx.fillStyle = '#d8d2c5';
  ctx.fillRect(0, 0, 256, 384);

  // Viền rãnh mảnh bao quanh cụm Control Panel
  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 372);

  // 1. Nhãn dán chữ nhật nền trắng in chữ "ALPHA" màu xanh dương (#0033aa) ở góc trên trái
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(20, 24, 146, 54);
  ctx.strokeStyle = '#0033aa';
  ctx.lineWidth = 4;
  ctx.strokeRect(22, 26, 142, 50);

  ctx.fillStyle = '#0033aa';
  ctx.font = 'italic bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALPHA', 93, 63);

  // 2. Ô hiển thị xung nhịp LED 7-segment nhỏ gọn bên dưới nhãn ALPHA (233 / 66 MHz)
  ctx.fillStyle = '#070a07';
  ctx.fillRect(20, 94, 146, 56);
  ctx.strokeStyle = '#4a463f';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 94, 146, 56);

  ctx.font = 'bold 42px "VT323", "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#182018';
  ctx.fillText('888', 120, 136);

  if (isPoweredOn) {
    ctx.fillStyle = isTurbo ? '#ff2a2a' : '#33ff33';
    ctx.fillText(isTurbo ? '233' : ' 66', 120, 136);
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#33ff33';
    ctx.textAlign = 'left';
    ctx.fillText('MHz', 124, 134);
  }

  // 3. Chữ "RESET" nhỏ phía trên hốc nút nhấn RESET ở góc dưới trái
  ctx.fillStyle = '#3a3630';
  ctx.font = 'bold 19px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RESET', 88, 214);

  // 4. Nhãn ký hiệu bên cạnh 2 bóng đèn LED tròn 3mm ở cột bên phải
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('PWR', 198, 160);
  ctx.fillText('HDD', 198, 250);

  // 5. Nhãn "TURBO" phía trên nút nhấn TURBO ở cột phải (dưới đèn HDD)
  ctx.textAlign = 'center';
  ctx.fillText('TURBO', 198, 302);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. CanvasTexture cho Case Badge "Intel Inside / Pentium MMX" dán trong ô vuông lõm góc trên bên trái thân dưới
 */
function createIntelMmxBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#002288');
  grad.addColorStop(0.5, '#0044cc');
  grad.addColorStop(1, '#001855');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#d8d2c5';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 240, 240);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(128, 92, 92, 48, -0.15, 0.2, Math.PI * 1.85);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 36px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('intel', 128, 84);
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText('inside', 128, 114);

  ctx.fillStyle = '#141413';
  ctx.fillRect(18, 156, 220, 78);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.fillText('pentium®', 128, 188);

  ctx.fillStyle = '#ff2a2a';
  ctx.font = 'italic bold 34px "JetBrains Mono", monospace';
  ctx.fillText('MMX™', 128, 224);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4. CanvasTexture cho Tem sơ đồ hướng dẫn tháo khay Mainboard (Slide-out Tray Diagram Sticker)
 *    dán ở góc trên bên phải của khay Mainboard phía sau lưng thùng máy InWin A500
 */
function createTrayInstructionStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Nền tem xám bạc ánh xanh kỹ thuật
  ctx.fillStyle = '#c4cbc8';
  ctx.fillRect(0, 0, 320, 256);

  // Khung viền đen mảnh chuẩn tem hướng dẫn OEM
  ctx.strokeStyle = '#1e2220';
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 304, 240);

  // Vạch chia phần tiêu đề trên và dưới
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, 56);
  ctx.lineTo(312, 56);
  ctx.moveTo(8, 204);
  ctx.lineTo(312, 204);
  ctx.stroke();

  // Dòng hướng dẫn 1 (Trên)
  ctx.fillStyle = '#141816';
  ctx.font = 'bold 15px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('1. Pull the clip at bottom side of', 18, 28);
  ctx.fillText('   panel and swing out to release.', 18, 46);

  // Sơ đồ hình vẽ kỹ thuật thùng máy & khay trượt ở giữa
  ctx.strokeStyle = '#1e2220';
  ctx.lineWidth = 3;
  // Hình khối thùng máy đứng bên phải
  ctx.strokeRect(184, 72, 76, 118);
  ctx.strokeRect(194, 84, 56, 32);
  ctx.strokeRect(194, 126, 56, 52);

  // Hình tấm khay trượt nghiêng bên trái + mũi tên kéo ra
  ctx.beginPath();
  ctx.moveTo(74, 182);
  ctx.lineTo(106, 76);
  ctx.lineTo(126, 76);
  ctx.lineTo(94, 182);
  ctx.closePath();
  ctx.stroke();

  // Mũi tên chỉ hướng tháo
  ctx.fillStyle = '#1e2220';
  ctx.beginPath();
  ctx.moveTo(138, 128);
  ctx.lineTo(168, 128);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(134, 128);
  ctx.lineTo(148, 120);
  ctx.lineTo(148, 136);
  ctx.closePath();
  ctx.fill();

  // Dòng hướng dẫn 2 (Dưới)
  ctx.font = 'bold 15px "IBM Plex Mono", monospace';
  ctx.fillText('2. Pull the tray out carefully for', 18, 224);
  ctx.fillText('   motherboard installation.', 18, 242);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 5. CanvasTexture cho tem tròn màu trắng ở tâm quạt gió phụ 80mm phía sau lưng máy
 */
function createAuxFanHubTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2f0ec';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8c9296';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#222222';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DC 12V', 64, 52);
  ctx.font = '12px "IBM Plex Mono", monospace';
  ctx.fillText('0.14A', 64, 72);
  ctx.fillText('BALL BEARING', 64, 90);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface PcCaseEnlightProps {
  /** Tiến trình lắp ốc đồng & tháo chắn khe PCI1/ISA1 ở Step 02 (0 -> 1) */
  casePrepProgress: number;
  /** Tiến trình siết 6 ốc vít cố định Mainboard ở Step 04 (0 -> 1) */
  moboScrewsProgress: number;
  /** Tiến trình đóng nắp vỏ chữ U (Step 10, mặc định 0 = tách rời để nhìn rõ nội thất) */
  uCoverCloseProgress?: number;
  /** Độ mờ nắp vỏ ngoài khi camera đến gần */
  caseOpacity?: number;
}

export function PcCaseEnlight({
  casePrepProgress,
  moboScrewsProgress,
  uCoverCloseProgress = 0,
  caseOpacity = 1.0,
}: PcCaseEnlightProps) {
  const currentStep = useBuildStore((s) => s.currentStep);
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);
  const togglePower = useBuildStore((s) => s.togglePower);
  const toggleTurbo = useBuildStore((s) => s.toggleTurbo);
  const triggerReset = useBuildStore((s) => s.triggerReset);

  const standoffsGroupRef = useRef<THREE.Group>(null);
  const removableBracketsRef = useRef<THREE.Group>(null);
  const moboScrewsRef = useRef<THREE.Group>(null);
  const rearFanBladesRef = useRef<THREE.Group>(null);
  const hddLedMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const powerTextTex = useMemo(() => createPowerTextTexture(), []);
  const alphaControlTex = useMemo(
    () => createAlphaControlTexture(isPoweredOn, isTurbo),
    [isPoweredOn, isTurbo]
  );
  const intelBadgeTex = useMemo(() => createIntelMmxBadgeTexture(), []);
  const trayInstructionTex = useMemo(() => createTrayInstructionStickerTexture(), []);
  const auxFanHubTex = useMemo(() => createAuxFanHubTexture(), []);

  // Tọa độ các tai dập nổi chữ U (Stamped Sheet-Metal U-Loops) chạy dọc theo:
  // 1) Mép ngoài bên trái (y_int = 0.045)
  // 2) Đường rãnh khay trượt ở giữa (y_int = 0.91)
  // 3) Mép ngoài bên phải (y_int = 1.30)
  const rearStampedLoops = useMemo<[number, number, number][]>(() => {
    const loops: [number, number, number][] = [];
    const leftAndRightZ = [-1.72, -1.35, -0.98, -0.61, -0.24, 0.13, 0.5, 0.87, 1.24];
    for (const z of leftAndRightZ) {
      loops.push([-0.024, 0.045, z]); // Cột mép trái
      loops.push([-0.024, 1.305, z]); // Cột mép phải
    }
    const middleSeamZ = [-0.96, -0.68, -0.4, 0.12, 0.36, 0.84, 1.08, 1.32];
    for (const z of middleSeamZ) {
      loops.push([-0.024, 0.91, z]); // Cột dọc theo rãnh khay trượt Mainboard
    }
    return loops;
  }, []);

  // Danh sách tọa độ 48 lỗ thông gió tròn trên Bay 3 & Bay 4 (mỗi tấm gồm 2 cụm trái/phải x 4 cột x 3 hàng = 24 lỗ)
  const bay3And4VentHoles = useMemo(() => {
    const holes: [number, number, number][] = [];
    const bayZCenters = [-0.74, -0.45]; // Bay 3 và Bay 4
    const clusterYCenters = [0.2, -0.2]; // Cụm Trái (+y) và Cụm Phải (-y)

    for (const bz of bayZCenters) {
      for (const cy of clusterYCenters) {
        for (let col = 0; col < 4; col++) {
          for (let row = 0; row < 3; row++) {
            const hy = cy + (col - 1.5) * 0.066;
            const hz = bz + (row - 1) * 0.054;
            holes.push([0.142, hy, hz]);
          }
        }
      }
    }
    return holes;
  }, []);

  // Danh sách tọa độ 40 lỗ tròn hút gió đáy (Lower Split Panel):
  // 2 cụm đối xứng Trái (+y) và Phải (-y) qua đường rãnh giữa, mỗi bên 5 cột x 4 hàng = 20 lỗ tròn
  const lowerIntakeVentHoles = useMemo(() => {
    const holes: [number, number, number][] = [];
    const sideYCenters = [0.24, -0.24]; // Tấm Trái (+y) và Tấm Phải (-y)

    for (const sy of sideYCenters) {
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 4; row++) {
          const hy = sy + (col - 2) * 0.068;
          const hz = 1.14 + (row - 1.5) * 0.092;
          holes.push([0.14, hy, hz]);
        }
      }
    }
    return holes;
  }, []);

  useEffect(() => {
    return () => {
      powerTextTex.dispose();
      alphaControlTex.dispose();
      intelBadgeTex.dispose();
      trayInstructionTex.dispose();
      auxFanHubTex.dispose();
    };
  }, [powerTextTex, alphaControlTex, intelBadgeTex, trayInstructionTex, auxFanHubTex]);

  useFrame((state, delta) => {
    // Hiệu ứng đèn HDD LED (3mm dưới) nhấp nháy đỏ cam (#ff3300) khi ổ cứng hoạt động
    if (hddLedMatRef.current) {
      if (!isPoweredOn) {
        hddLedMatRef.current.emissiveIntensity = 0;
      } else {
        const t = state.clock.elapsedTime;
        const pulse =
          Math.sin(t * 19) * Math.cos(t * 31) > 0.35 || Math.sin(t * 7) > 0.75
            ? 2.4
            : 0.15;
        hddLedMatRef.current.emissiveIntensity = pulse;
      }
    }

    // Quay quạt gió phụ 80mm phía sau lưng máy khi bật nguồn
    if (rearFanBladesRef.current && isPoweredOn) {
      const speed = isTurbo ? 18 : 10;
      rearFanBladesRef.current.rotation.x -= delta * speed;
    }
  });

  // Nội suy tọa độ 6 chân ốc đồng (BrassStandoffs) ở Step 02
  const standoffP = Math.max(0, Math.min(1, casePrepProgress));
  const standoffSmooth = standoffP * standoffP * (3 - 2 * standoffP);

  // Nội suy 2 thanh chắn khe PCI 1 và ISA 1 ở Step 02
  const bracketRemoveP = Math.max(0, Math.min(1, (casePrepProgress - 0.35) / 0.65));
  const bracketSmooth = bracketRemoveP * bracketRemoveP * (3 - 2 * bracketRemoveP);

  // Nội suy 6 ốc vít siết Mainboard ở Step 04
  const screwP = Math.max(0, Math.min(1, moboScrewsProgress));
  const screwSmooth = screwP * screwP * (3 - 2 * screwP);

  return (
    <group>
      {/* =======================================================================
          A. KHUNG THÉP NỘI THẤT (CHASSIS FRAME - GALVANIZED STEEL)
         ======================================================================= */}
      <group name="ChassisFrame">
        {/* 1. Vách gắn Mainboard (Motherboard Tray: X từ -1.18 đến +2.10, Z từ -2.02 đến +1.48) */}
        <RoundedBox
          args={[3.28, 0.04, 3.5]}
          radius={0.008}
          smoothness={1}
          position={[0.46, 0.02, -0.27]}
          castShadow
          receiveShadow
          material={retroMaterials.galvanizedSteel}
        />

        {/* Gờ dập nổi gia cường trên tấm Motherboard Tray */}
        <mesh position={[0.0, 0.042, -0.27]} receiveShadow material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[2.35, 0.006, 2.95]} />
        </mesh>

        {/* 2. Vách thép nóc thùng máy (Tower Top Rail tại Z = -2.00) & Đáy thùng máy (Tower Bottom Base tại Z = +1.46) */}
        <RoundedBox
          args={[3.28, 0.14, 0.05]}
          radius={0.006}
          smoothness={1}
          position={[0.46, 1.28, -2.0]}
          castShadow
          material={retroMaterials.galvanizedSteel}
        />
        <RoundedBox
          args={[3.28, 0.04, 0.05]}
          radius={0.006}
          smoothness={1}
          position={[0.46, 0.08, -2.0]}
          castShadow
          material={retroMaterials.galvanizedSteel}
        />
        {/* Sàn đáy kim loại của thùng máy đứng (Z = +1.46) */}
        <RoundedBox
          args={[3.28, 1.32, 0.05]}
          radius={0.006}
          smoothness={1}
          position={[0.46, 0.68, 1.46]}
          castShadow
          receiveShadow
          material={retroMaterials.galvanizedSteel}
        />

        {/* 3. Khung lồng gắn 4 khoang 5.25" (trên: Y tâm 0.68, Z từ -1.80 đến -0.56)
               và 2 khay 3.5" lệch sang bên trái 60% (dưới: Y tâm 0.85, Z từ -0.56 đến +0.02) */}
        <group position={[1.65, 0, 0]}>
          {/* Khung lồng 5.25" (đỡ ổ CD-ROM Creative 24X ở Bay 1: Y=0.68, Z=-1.59) */}
          <RoundedBox
            args={[0.88, 0.88, 0.032]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.68, -1.78]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          <RoundedBox
            args={[0.88, 0.88, 0.032]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.68, -0.56]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Vách ngăn dưới Bay 1 (Z = -1.43) */}
          <mesh position={[0, 0.68, -1.43]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.86, 0.84, 0.018]} />
          </mesh>
          {/* Vách hông ngoài của lồng 5.25" (Y = 1.11) */}
          <RoundedBox
            args={[0.88, 0.032, 1.24]}
            radius={0.005}
            smoothness={1}
            position={[0, 1.11, -1.17]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />

          {/* Khung lồng 3.5" bên trái 60% (Y tâm = 0.85, đỡ ổ mềm Sony Z=-0.39 & ổ cứng Quantum Z=-0.17) */}
          <RoundedBox
            args={[0.76, 0.54, 0.032]}
            radius={0.005}
            smoothness={1}
            position={[0.04, 0.85, -0.02]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Tấm đỡ giữa ổ mềm Floppy và ổ cứng Quantum (Z = -0.28) */}
          <mesh position={[0.04, 0.85, -0.28]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.74, 0.52, 0.018]} />
          </mesh>
          {/* Vách hông ngoài của lồng 3.5" (Y = 1.11) */}
          <RoundedBox
            args={[0.76, 0.032, 0.56]}
            radius={0.005}
            smoothness={1}
            position={[0.04, 1.11, -0.29]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
        </group>

        {/* ===================================================================
            4. MẶT LƯNG KIM LOẠI PHÍA SAU CHUẨN INWIN A500 (REAR PANEL tại X = -1.16)
               Khi nhìn trực diện từ phía sau thùng máy đứng:
               - TRÊN XUỐNG DƯỚI: z_int từ -2.02 (Đỉnh) xuống +1.48 (Đáy)
               - TRÁI SANG PHẢI: y_int từ 0.01 (Mép trái - Khay Mainboard) sang 1.35 (Mép phải - Sau khoang ổ đĩa)
           =================================================================== */}
        <group position={[-1.16, 0, 0]}>
          {/* -----------------------------------------------------------------
              4.1. KHUNG VIỀN TÔN CỐ ĐỊNH & DẢI TÔN LIỀN BÊN PHẢI 35% (y_int = 0.89 -> 1.34)
             ----------------------------------------------------------------- */}
          {/* Viền ngang trên cùng (z_int = -1.98) */}
          <RoundedBox
            args={[0.045, 1.34, 0.09]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.68, -1.98]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Cột viền đứng mép ngoài cùng bên trái (y_int = 0.045, chạy dọc từ đỉnh xuống đáy) */}
          <RoundedBox
            args={[0.045, 0.09, 3.48]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.045, -0.26]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Mảng tôn liền cố định 35% bên phải (y_int từ 0.89 đến 1.35, z_int từ -1.20 đến +1.48) */}
          <RoundedBox
            args={[0.045, 0.46, 2.68]}
            radius={0.005}
            smoothness={1}
            position={[0, 1.12, 0.14]}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Mảng tôn bên trái & bên phải hốc Nguồn AT ở tầng trên cùng (z_int từ -1.94 đến -1.20) */}
          <RoundedBox
            args={[0.045, 0.15, 0.74]}
            radius={0.004}
            smoothness={1}
            position={[0, 0.14, -1.57]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          <RoundedBox
            args={[0.045, 0.18, 0.74]}
            radius={0.004}
            smoothness={1}
            position={[0, 1.26, -1.57]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Thanh ngang ngăn cách dưới Nguồn AT và đỉnh khay trượt Mainboard (z_int = -1.18) */}
          <RoundedBox
            args={[0.045, 0.82, 0.08]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.49, -1.18]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Thanh ngang đáy dưới cùng của khay trượt (z_int = +1.41) */}
          <RoundedBox
            args={[0.045, 0.82, 0.14]}
            radius={0.005}
            smoothness={1}
            position={[0, 0.49, 1.41]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />

          {/* Lỗ tròn nhỏ màu đen ở góc dưới bên phải mặt lưng (y_int = 1.12, z_int = 1.36) */}
          <mesh
            position={[-0.024, 1.12, 1.36]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.isaBlack}
          >
            <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
          </mesh>

          {/* 3 hàng tai dập nổi chữ U dọc (Stamped Sheet-Metal U-Loops - InstancedMesh) */}
          <Instances
            limit={rearStampedLoops.length}
            castShadow
            material={retroMaterials.galvanizedSteel}
          >
            <boxGeometry args={[0.014, 0.042, 0.022]} />
            {rearStampedLoops.map((pos, idx) => (
              <Instance key={`rear-u-loop-${idx}`} position={pos} />
            ))}
          </Instances>

          {/* 3 Tai kéo cong hình chữ D (D-Shaped Slide-out Tray Pull Tabs) dọc đường rãnh khay trượt y_int = 0.92 */}
          {[-0.86, -0.18, 0.56].map((tz, idx) => (
            <mesh
              key={`tray-pull-tab-${idx}`}
              position={[-0.024, 0.93, tz]}
              rotation={[0, Math.PI / 2, 0]}
              material={retroMaterials.galvanizedSteel}
            >
              <torusGeometry args={[0.036, 0.008, 8, 16, Math.PI]} />
            </mesh>
          ))}
          {/* 1 Tai cong chữ D ở mép trái (y_int = 0.055, z_int = 0.35) */}
          <mesh
            position={[-0.024, 0.055, 0.35]}
            rotation={[0, Math.PI / 2, 0]}
            material={retroMaterials.galvanizedSteel}
          >
            <torusGeometry args={[0.034, 0.008, 8, 16, Math.PI]} />
          </mesh>

          {/* -----------------------------------------------------------------
              4.2. KHU VỰC KHAY TRƯỢT MAINBOARD NỬA TRÊN (y_int từ 0.09 đến 0.89, z_int từ -1.14 đến -0.02)
                   Chia mảng tôn xung quanh hốc Quạt mặt sau (y_int = 0.63, z_int = -0.36)
                   để hốc quạt thông suốt 100% từ trong lòng thùng máy ra mặt lưng ngoài!
             ----------------------------------------------------------------- */}
          {/* Nửa bên trái khay trượt (chứa tấm chắn I/O Shield: y_int từ 0.09 đến 0.41, z_int từ -1.14 đến -0.02) */}
          <RoundedBox
            args={[0.032, 0.32, 1.12]}
            radius={0.004}
            smoothness={1}
            position={[0.014, 0.25, -0.58]}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Phần tôn phía trên Quạt mặt sau (chứa Tem sơ đồ hướng dẫn tháo khay: y_int từ 0.41 đến 0.89, z_int từ -1.14 đến -0.58) */}
          <RoundedBox
            args={[0.032, 0.48, 0.56]}
            radius={0.004}
            smoothness={1}
            position={[0.014, 0.65, -0.86]}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />
          {/* Phần tôn phía dưới Quạt mặt sau (y_int từ 0.41 đến 0.89, z_int từ -0.14 đến -0.02) */}
          <RoundedBox
            args={[0.032, 0.48, 0.12]}
            radius={0.004}
            smoothness={1}
            position={[0.014, 0.65, -0.08]}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />

          {/* A. CỘT TRÁI (y_int = 0.25, z_int = -0.57): TẤM CHẮN I/O SHIELD CHỮ NHẬT ĐỨNG (0.28 x 0.96) */}
          <group position={[-0.005, 0.25, -0.57]}>
            {/* Tấm thép I/O Shield mạ kẽm sáng có viền gờ mảnh */}
            <RoundedBox
              args={[0.018, 0.28, 0.96]}
              radius={0.004}
              smoothness={1}
              castShadow
            >
              <meshStandardMaterial color="#b4bcc0" roughness={0.3} metalness={0.85} />
            </RoundedBox>

            {/* HÀNG 1 (Trên cùng z_local = -0.37 -> z_int = -0.94): 2 cổng tròn PS/2 Bàn phím (trái) & Chuột (phải) */}
            {[
              { dy: -0.06, color: '#4b2878' }, // PS/2 Keyboard (Trái - Tím/Đen)
              { dy: 0.06, color: '#1f7a3a' }, // PS/2 Mouse (Phải - Xanh lá/Đen)
            ].map((ps2, idx) => (
              <group key={`io-ps2-${idx}`} position={[-0.012, ps2.dy, -0.37]}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.galvanizedSteel}>
                  <cylinderGeometry args={[0.036, 0.036, 0.012, 16]} />
                </mesh>
                <mesh position={[-0.004, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.026, 0.026, 0.012, 16]} />
                  <meshStandardMaterial color={ps2.color} roughness={0.45} />
                </mesh>
                <mesh position={[-0.008, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.008, 10]} />
                  <meshBasicMaterial color="#080808" />
                </mesh>
              </group>
            ))}

            {/* HÀNG 2 (z_local = -0.21 -> z_int = -0.78): 2 khe cắm USB chữ nhật đứng màu đen ở nửa bên trái */}
            {[-0.072, -0.016].map((dy, idx) => (
              <group key={`io-usb-${idx}`} position={[-0.012, dy, -0.21]}>
                <RoundedBox
                  args={[0.014, 0.038, 0.082]}
                  radius={0.002}
                  smoothness={1}
                  material={retroMaterials.galvanizedSteel}
                />
                <mesh position={[-0.005, 0, 0]} material={retroMaterials.isaBlack}>
                  <boxGeometry args={[0.01, 0.024, 0.066]} />
                </mesh>
              </group>
            ))}

            {/* HÀNG 3 (z_local từ -0.02 đến +0.22):
                - Bên trái (dy = -0.06): 2 cổng DB-9 Serial (COM1 trên z=-0.04, COM2 dưới z=+0.19) màu xanh cổ vịt đậm
                - Bên phải (dy = +0.065): 1 cổng DB-25 Parallel (LPT1 máy in) dài dọc màu đỏ rượu/tím hồng (#7a2248) */}
            {[-0.04, 0.19].map((dz, idx) => (
              <group key={`io-com-${idx}`} position={[-0.014, -0.06, dz]}>
                <RoundedBox
                  args={[0.022, 0.072, 0.15]}
                  radius={0.004}
                  smoothness={1}
                  material={retroMaterials.galvanizedSteel}
                />
                <RoundedBox args={[0.026, 0.046, 0.1]} radius={0.003} smoothness={1}>
                  <meshStandardMaterial color="#194d4d" roughness={0.4} metalness={0.2} />
                </RoundedBox>
                {/* 2 ốc lục giác trên/dưới cổng COM */}
                {[-0.056, 0.056].map((sz, sIdx) => (
                  <mesh
                    key={`com-hex-${sIdx}`}
                    position={[-0.008, 0, sz]}
                    rotation={[0, 0, Math.PI / 2]}
                    material={retroMaterials.galvanizedSteel}
                  >
                    <cylinderGeometry args={[0.012, 0.012, 0.018, 6]} />
                  </mesh>
                ))}
              </group>
            ))}

            {/* Cổng Parallel LPT1 25-pin dài dọc bên phải (dy = +0.065, dz = +0.075) */}
            <group position={[-0.014, 0.065, 0.075]}>
              <RoundedBox
                args={[0.022, 0.076, 0.34]}
                radius={0.004}
                smoothness={1}
                material={retroMaterials.galvanizedSteel}
              />
              <RoundedBox args={[0.026, 0.048, 0.27]} radius={0.003} smoothness={1}>
                <meshStandardMaterial color="#7a2248" roughness={0.4} metalness={0.15} />
              </RoundedBox>
              {/* 2 ốc lục giác trên/dưới cổng LPT */}
              {[-0.145, 0.145].map((sz, sIdx) => (
                <mesh
                  key={`lpt-hex-${sIdx}`}
                  position={[-0.008, 0, sz]}
                  rotation={[0, 0, Math.PI / 2]}
                  material={retroMaterials.galvanizedSteel}
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.018, 6]} />
                </mesh>
              ))}
            </group>

            {/* HÀNG 4 (Dưới cùng z_local = +0.36): Các ô dập chờ (knockout outlines) cho Audio & Gameport onboard */}
            {[-0.09, -0.03, 0.03].map((dz, idx) => (
              <mesh
                key={`io-knockout-circle-${idx}`}
                position={[-0.01, -0.06, 0.34 + dz * 0.45]}
                rotation={[0, Math.PI / 2, 0]}
                material={retroMaterials.galvanizedSteel}
              >
                <ringGeometry args={[0.012, 0.018, 12]} />
              </mesh>
            ))}
            <RoundedBox
              args={[0.012, 0.042, 0.14]}
              radius={0.002}
              smoothness={1}
              position={[-0.006, 0.055, 0.35]}
              material={retroMaterials.galvanizedSteel}
            />
          </group>

          {/* B. CỘT PHẢI CỦA KHAY TRƯỢT (y_int = 0.63):
                 - Trên (z_int = -0.89): Tem sơ đồ hướng dẫn tháo khay trượt (Instruction Diagram Sticker)
                 - Giữa (z_int = -0.68): Ô dập chờ DB-9 ngang
                 - Dưới (z_int = -0.38): Quạt gió phụ 80mm màu đen + Tem tròn trắng ở tâm + Khung ngàm nhựa đen */}
          {/* 1. Tem hướng dẫn tháo khay Mainboard (y_int = 0.63, z_int = -0.89) */}
          <mesh
            position={[-0.006, 0.63, -0.89]}
            rotation={[0, -Math.PI / 2, -Math.PI / 2]}
          >
            <planeGeometry args={[0.36, 0.28]} />
            <meshStandardMaterial
              map={trayInstructionTex}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>

          {/* 2. Ô dập chờ cổng Serial ngang nhỏ ngay dưới tem hướng dẫn (y_int = 0.56, z_int = -0.68) */}
          <RoundedBox
            args={[0.016, 0.14, 0.065]}
            radius={0.003}
            smoothness={1}
            position={[-0.002, 0.56, -0.68]}
            material={retroMaterials.galvanizedSteel}
          />

          {/* 3. CỤM QUẠT TẢN NHIỆT MẶT SAU LẮP SẴN TRÊN VỎ CASE (PRE-INSTALLED 3D 80x80x25mm REAR EXHAUST FAN)
                 Đặt tại (y_int = 0.63, z_int = -0.36), có thân hộp 3D dày dặn nhô vào trong lòng thùng máy (x_local từ -0.015 đến +0.24)
                 để nhìn từ BÊN TRONG lòng thùng máy hay nhìn từ MẶT SAU ngoài vỏ đều thấy rõ nguyên cụm quạt 3D hoàn chỉnh! */}
          <group position={[0, 0.63, -0.36]}>
            {/* A. Khung vỏ hộp quạt 3D dày 25mm (depth_x = 0.22, rộng 0.44 x cao 0.44) nhô vào lòng Case */}
            {/* Thành hộp trên & dưới */}
            <RoundedBox
              args={[0.22, 0.44, 0.038]}
              radius={0.006}
              smoothness={2}
              position={[0.105, 0, -0.205]}
              castShadow
              receiveShadow
              material={retroMaterials.blackAnodized}
            />
            <RoundedBox
              args={[0.22, 0.44, 0.038]}
              radius={0.006}
              smoothness={2}
              position={[0.105, 0, 0.205]}
              castShadow
              receiveShadow
              material={retroMaterials.blackAnodized}
            />
            {/* Thành hộp trái & phải (nhìn trực diện từ cửa hông thùng máy thấy rõ bề dày 3D của quạt!) */}
            <RoundedBox
              args={[0.22, 0.038, 0.44]}
              radius={0.006}
              smoothness={2}
              position={[0.105, -0.205, 0]}
              castShadow
              receiveShadow
              material={retroMaterials.blackAnodized}
            />
            <RoundedBox
              args={[0.22, 0.038, 0.44]}
              radius={0.006}
              smoothness={2}
              position={[0.105, 0.205, 0]}
              castShadow
              receiveShadow
              material={retroMaterials.blackAnodized}
            />

            {/* Ống trụ dẫn gió tròn bên trong lòng hộp quạt (Venturi Tunnel) */}
            <mesh
              position={[0.105, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={retroMaterials.isaBlack}
            >
              <cylinderGeometry args={[0.195, 0.195, 0.21, 24, 1, true]} />
            </mesh>

            {/* 4 Gân gia cường & 4 Ốc bạc bắt cố định ở 4 góc mặt trong hộp quạt (x_local = +0.22) */}
            {[
              [-0.175, -0.175],
              [0.175, -0.175],
              [-0.175, 0.175],
              [0.175, 0.175],
            ].map(([cy, cz], cIdx) => (
              <group key={`rear-fan-corner-${cIdx}`} position={[0.218, cy, cz]}>
                <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.galvanizedSteel}>
                  <cylinderGeometry args={[0.018, 0.018, 0.016, 6]} />
                </mesh>
              </group>
            ))}

            {/* B. Tâm mô-tơ (Hub) xuyên suốt chiều dày 3D + 7 Cánh quạt 3D bản rộng + Tem tròn trắng ở CẢ 2 MẶT (Trong & Ngoài) */}
            <group ref={rearFanBladesRef} position={[0.105, 0, 0]}>
              {/* Trục mô-tơ trung tâm dày suốt lòng quạt */}
              <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.blackAnodized}>
                <cylinderGeometry args={[0.092, 0.092, 0.19, 20]} />
              </mesh>

              {/* Tem tròn trắng ở mặt ngoài (nhìn từ mặt lưng sau máy) */}
              <mesh
                position={[-0.098, 0, 0]}
                rotation={[0, -Math.PI / 2, -Math.PI / 2]}
              >
                <circleGeometry args={[0.084, 24]} />
                <meshStandardMaterial map={auxFanHubTex} roughness={0.35} />
              </mesh>

              {/* Tem tròn trắng ở mặt trong (nhìn từ trong lòng thùng máy) */}
              <mesh
                position={[0.098, 0, 0]}
                rotation={[0, Math.PI / 2, Math.PI / 2]}
              >
                <circleGeometry args={[0.084, 24]} />
                <meshStandardMaterial map={auxFanHubTex} roughness={0.35} />
              </mesh>

              {/* 7 Cánh quạt 3D có độ sâu thực (sâu 0.14 theo trục X) */}
              {Array.from({ length: 7 }).map((_, bIdx) => {
                const ang = (bIdx / 7) * Math.PI * 2;
                return (
                  <group key={`aux-blade-${bIdx}`} rotation={[ang, 0, 0]}>
                    <mesh
                      position={[0, 0.135, 0]}
                      rotation={[0.42, 0, 0]}
                      castShadow
                      material={retroMaterials.blackAnodized}
                    >
                      <boxGeometry args={[0.13, 0.115, 0.048]} />
                    </mesh>
                  </group>
                );
              })}
            </group>

            {/* C. Lưới bảo vệ kim loại đồng tâm ở mặt trong lòng thùng máy (Inner Chrome Finger Guard Grille tại x_local = +0.222) */}
            <group position={[0.222, 0, 0]}>
              {[0.07, 0.125, 0.18].map((r, rIdx) => (
                <mesh
                  key={`inner-fan-ring-${rIdx}`}
                  rotation={[0, Math.PI / 2, 0]}
                  material={retroMaterials.galvanizedSteel}
                >
                  <torusGeometry args={[r, 0.005, 8, 24]} />
                </mesh>
              ))}
              {[Math.PI / 4, -Math.PI / 4].map((rotAngle, bIdx) => (
                <mesh
                  key={`inner-fan-bar-${bIdx}`}
                  rotation={[rotAngle, 0, 0]}
                  material={retroMaterials.galvanizedSteel}
                >
                  <boxGeometry args={[0.008, 0.4, 0.01]} />
                </mesh>
              ))}
            </group>

            {/* D. Dây cấp nguồn Đỏ/Đen của quạt mặt sau đi gọn từ đỉnh hộp quạt lên phía bộ nguồn Seasonic */}
            <mesh
              position={[0.16, 0.16, -0.52]}
              material={retroMaterials.ribbonRed}
            >
              <cylinderGeometry args={[0.009, 0.009, 0.64, 8]} />
            </mesh>
            <mesh
              position={[0.18, 0.16, -0.52]}
              material={retroMaterials.isaBlack}
            >
              <cylinderGeometry args={[0.009, 0.009, 0.64, 8]} />
            </mesh>

            {/* E. Chi tiết mặt ngoài: Thanh gờ kẹp bảo vệ dọc & các vấu ngàm nhựa đen ở mặt lưng (như ảnh chụp) */}
            <RoundedBox
              args={[0.022, 0.058, 0.44]}
              radius={0.003}
              smoothness={1}
              position={[-0.016, 0.095, 0]}
              material={retroMaterials.galvanizedSteel}
            />
            <RoundedBox
              args={[0.035, 0.12, 0.06]}
              radius={0.004}
              smoothness={1}
              position={[-0.01, -0.04, -0.22]}
              material={retroMaterials.blackAnodized}
            />
            <RoundedBox
              args={[0.035, 0.055, 0.12]}
              radius={0.004}
              smoothness={1}
              position={[-0.01, 0.18, -0.14]}
              material={retroMaterials.blackAnodized}
            />
          </group>

          {/* -----------------------------------------------------------------
              4.3. KHU VỰC 7 KHE CẮM MỞ RỘNG NẰM NGANG Ở NỬA DƯỚI BÊN TRÁI
                   (y_int từ 0.13 đến 0.83, tâm tại y_int = 0.48, rộng 0.70,
                    z_int = ALL_SLOT_Z = [0.08, 0.25, 0.42, 0.59, 0.82, 1.01, 1.20])
             ----------------------------------------------------------------- */}
          {/* Khung dọc bên phải giữ ốc vít của 7 thanh chắn khe (y_int = 0.84, z_int = 0.64) */}
          <RoundedBox
            args={[0.045, 0.08, 1.36]}
            radius={0.004}
            smoothness={1}
            position={[0, 0.84, 0.64]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />

          {/* Các thanh ngang phân cách giữa 7 khe cắm mở rộng */}
          {ALL_SLOT_Z.map((zVal, idx) => (
            <mesh
              key={`slot-divider-${idx}`}
              position={[0, 0.48, zVal - 0.085]}
              castShadow
              material={retroMaterials.galvanizedSteel}
            >
              <boxGeometry args={[0.035, 0.74, 0.03]} />
            </mesh>
          ))}

          {/* 5 Thanh sắt chắn khe cố định (PCI 2, 3, 4 & ISA 2, 3):
              Màu thép mạ kẽm ánh vàng đồng nhạt (#b5a888) có rãnh dập nổi nằm ngang ở giữa như ảnh chụp! */}
          {FIXED_BRACKET_Z.map((zVal, idx) => (
            <group key={`fixed-bracket-${idx}`} position={[0.006, 0.48, zVal]}>
              <RoundedBox
                args={[0.022, 0.7, 0.11]}
                radius={0.003}
                smoothness={1}
                castShadow
              >
                <meshStandardMaterial color="#b5a888" roughness={0.32} metalness={0.82} />
              </RoundedBox>
              {/* Rãnh dập nổi nằm ngang ở chính giữa thanh chắn khe */}
              <mesh position={[-0.012, 0, 0]}>
                <boxGeometry args={[0.006, 0.52, 0.026]} />
                <meshStandardMaterial color="#6e6652" roughness={0.5} metalness={0.7} />
              </mesh>
              {/* Ốc vít bắt thanh chắn khe ở đầu bên phải (dy = +0.34) */}
              <mesh
                position={[-0.014, 0.34, 0]}
                rotation={[0, 0, Math.PI / 2]}
                material={retroMaterials.galvanizedSteel}
              >
                <cylinderGeometry args={[0.016, 0.016, 0.014, 6]} />
              </mesh>
            </group>
          ))}

          {/* YÊU CẦU #6: 2 Thanh sắt chắn khe PCI 1 (z=0.08) và ISA 1 (z=0.82)
              Chỉ hiển thị hiệu ứng tháo ra ở Step 02 (visible={currentStep <= 2}),
              từ Step 03 trở đi biến mất hoàn toàn để không nằm thừa trên mặt bàn! */}
          <group ref={removableBracketsRef} visible={currentStep <= 2}>
            {REMOVABLE_BRACKET_Z.map((zVal, idx) => {
              const curX = THREE.MathUtils.lerp(0.006, -0.75, bracketSmooth);
              const curY = THREE.MathUtils.lerp(0.48, 1.75, bracketSmooth);
              const curZ = THREE.MathUtils.lerp(zVal, zVal + idx * 0.18, bracketSmooth);
              const rotZ = THREE.MathUtils.lerp(0, Math.PI / 4, bracketSmooth);

              return (
                <group
                  key={`rem-bracket-${idx}`}
                  position={[curX, curY, curZ]}
                  rotation={[0, 0, rotZ]}
                >
                  <RoundedBox
                    args={[0.022, 0.7, 0.11]}
                    radius={0.003}
                    smoothness={1}
                    castShadow
                  >
                    <meshStandardMaterial color="#b5a888" roughness={0.32} metalness={0.82} />
                  </RoundedBox>
                  <mesh position={[-0.012, 0, 0]}>
                    <boxGeometry args={[0.006, 0.52, 0.026]} />
                    <meshStandardMaterial color="#6e6652" roughness={0.5} metalness={0.7} />
                  </mesh>
                  <mesh position={[0.04, 0.35, 0]} material={retroMaterials.galvanizedSteel}>
                    <boxGeometry args={[0.08, 0.025, 0.11]} />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>

        {/* 5. SÁU CHÂN ỐC ĐỒNG (BRASS STANDOFFS) & SÁU ỐC VÍT CỐ ĐỊNH MAINBOARD */}
        <group ref={standoffsGroupRef}>
          <Instances limit={6} castShadow receiveShadow material={retroMaterials.goldPin}>
            <cylinderGeometry args={[0.032, 0.032, 0.06, 6]} />
            {STANDOFF_XZ_COORDS.map(([tx, tz], idx) => {
              const y = THREE.MathUtils.lerp(1.45, 0.07, standoffSmooth);
              const rotY = (1 - standoffSmooth) * Math.PI * 6;

              return (
                <Instance
                  key={`brass-standoff-${idx}`}
                  position={[tx, y, tz]}
                  rotation={[0, rotY, 0]}
                />
              );
            })}
          </Instances>
        </group>

        {screwP > 0.01 && (
          <group ref={moboScrewsRef}>
            <Instances limit={6} castShadow material={retroMaterials.galvanizedSteel}>
              <cylinderGeometry args={[0.026, 0.018, 0.035, 12]} />
              {STANDOFF_XZ_COORDS.map(([tx, tz], idx) => {
                const y = THREE.MathUtils.lerp(0.85, 0.15, screwSmooth);
                const rotY = (1 - screwSmooth) * Math.PI * 8;
                return (
                  <Instance
                    key={`mobo-screw-${idx}`}
                    position={[tx, y, tz]}
                    rotation={[0, rotY, 0]}
                  />
                );
              })}
            </Instances>
          </group>
        )}
      </group>

      {/* =======================================================================
          B. MẶT NẠ NHỰA PHÍA TRƯỚC CHUẨN INWIN A500 (PHẲNG LIỀN MẠCH, KHÔNG GÃY KHỐI)
             Khi thùng máy dựng đứng & xoay hướng về người nhìn:
             - local z từ -1.75 (Đỉnh trên cùng, Y_world = 3.80) xuống +1.75 (Sát mặt bàn, Y_world = 0.00)
             - local y > 0 (+y) là BÊN TRÁI của mặt nạ (-X_world)
             - local y < 0 (-y) là BÊN PHẢI của mặt nạ (+X_world)
             - local +x là hướng thẳng ra phía trước mặt người nhìn (+Z_world)
         ======================================================================= */}
      <group name="FrontBezel" position={[2.22, 0.68, -0.27]}>
        {/* -------------------------------------------------------------------
            1. KHỐI MẶT NẠ CHỮ NHẬT PHẲNG LIỀN MẠCH, CẠNH TRÊN THẲNG TRƠN & BO GÓC NHẸ
               (YÊU CẦU #3: Xóa bỏ hoàn toàn bậc thụt gãy UI ở đỉnh trên cùng, radius = 0.04)
           ------------------------------------------------------------------- */}
        <RoundedBox
          args={[0.24, 1.35, 3.5]}
          radius={0.04}
          smoothness={4}
          position={[0.01, 0, 0]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* NÚT POWER CHÍNH nằm phẳng phiu, gọn gàng ở GÓC TRÊN BÊN PHẢI (local y = -0.32, local z = -1.58)
            ngay bên trong mặt phẳng viền trên của bezel (không tạo thêm cục nhựa lồi ra ngoài khung) */}
        <group position={[0.122, -0.31, -1.58]}>
          {/* Hốc viền âm mỏng bao quanh nút Power */}
          <RoundedBox
            args={[0.016, 0.19, 0.088]}
            radius={0.006}
            smoothness={2}
            position={[0, 0, 0]}
            material={retroMaterials.darkBeige}
          />
          {/* Nút bấm vật lý Power (Latching Switch nguồn AT): nhô ra khi tắt, lún sâu 0.03 gần phẳng mặt nạ khi bật */}
          <PressableControl
            label="[CLICK] POWER SWITCH (AT LATCH)"
            onPress={togglePower}
            latched={isPoweredOn}
            travel={0.03}
            stiffness={18}
          >
            <RoundedBox
              args={[0.05, 0.165, 0.068]}
              radius={0.01}
              smoothness={2}
              position={[0.017, 0, 0]}
              castShadow
              material={retroMaterials.beigePlastic}
            />
          </PressableControl>
          {/* Tem chữ "POWER" phẳng phiu ngay bên trái nút Power */}
          <mesh
            position={[0.01, 0.19, 0]}
            rotation={[0, Math.PI / 2, -Math.PI / 2]}
          >
            <planeGeometry args={[0.15, 0.05]} />
            <meshStandardMaterial map={powerTextTex} roughness={0.6} metalness={0.05} />
          </mesh>
        </group>

        {/* -------------------------------------------------------------------
            2. KHU VỰC 4 KHOANG 5.25" (TỪ TRÊN XUỐNG: BAY 1 -> BAY 4, CĂN GIỮA local y = 0)
               Trên cùng là ổ CD-ROM (Y_world ~ 3.3) -> tiếp theo là các tấm che 5.25"
           ------------------------------------------------------------------- */}
        {/* Khung rãnh âm chứa 4 khoang 5.25" (z từ -1.46 đến -0.30, rộng y = 0.86) */}
        <RoundedBox
          args={[0.036, 0.86, 1.18]}
          radius={0.006}
          smoothness={1}
          position={[0.118, 0, -0.885]}
          material={retroMaterials.darkBeige}
        />

        {/* BAY 1 (Trên cùng: local z = -1.32, tương ứng Z_internal = -1.59, Y_world ~ 3.33):
            Khung hở rộng 0.82 để ổ quang Creative 24X CD-ROM lộ mặt nạ ra ngoài vừa khít 100% */}
        <group position={[0.125, 0, -1.32]}>
          <mesh position={[0, -0.42, 0]} material={retroMaterials.darkBeige}>
            <boxGeometry args={[0.024, 0.02, 0.275]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={retroMaterials.darkBeige}>
            <boxGeometry args={[0.024, 0.02, 0.275]} />
          </mesh>
        </group>

        {/* BAY 2 (local z = -1.03): Tấm che nhựa phẳng (Blank Cover) */}
        <RoundedBox
          args={[0.032, 0.82, 0.272]}
          radius={0.006}
          smoothness={2}
          position={[0.126, 0, -1.03]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* BAY 3 (local z = -0.74) & BAY 4 (local z = -0.45):
            Hai tấm che nhựa có đục lỗ thông gió tròn (2 cụm x 4 cột x 3 hàng = 24 lỗ mỗi tấm) */}
        {[-0.74, -0.45].map((bayZ, idx) => (
          <RoundedBox
            key={`inwin-bay525-vent-${idx}`}
            args={[0.032, 0.82, 0.272]}
            radius={0.006}
            smoothness={2}
            position={[0.126, 0, bayZ]}
            castShadow
            receiveShadow
            material={retroMaterials.beigePlastic}
          />
        ))}

        {/* InstancedMesh cho 48 lỗ tròn màu đen trên Bay 3 & Bay 4 */}
        <Instances
          limit={bay3And4VentHoles.length}
          material={retroMaterials.isaBlack}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.01, 12]} />
          {bay3And4VentHoles.map(([hx, hy, hz], idx) => (
            <Instance
              key={`bay-vent-hole-${idx}`}
              position={[hx, hy, hz]}
              rotation={[0, 0, Math.PI / 2]}
            />
          ))}
        </Instances>

        {/* Thanh nẹp nhựa phẳng mỏng ngăn cách phía dưới Bay 4 (local z = -0.285) */}
        <RoundedBox
          args={[0.038, 0.88, 0.034]}
          radius={0.004}
          smoothness={1}
          position={[0.126, 0, -0.285]}
          castShadow
          material={retroMaterials.beigePlastic}
        />

        {/* -------------------------------------------------------------------
            3. KHU VỰC TRUNG TÂM CHIA ĐÔI (YÊU CẦU #4: TỶ LỆ 60% TRÁI - KHE HỞ - 35% PHẢI)
               Ở độ cao giữa thùng máy (Y_world ~ 1.9), tuyệt đối không đè chồng (zero overlap)
           ------------------------------------------------------------------- */}
        {/* A. BÊN TRÁI (60% bề ngang lòng mặt nạ: local y từ -0.08 đến +0.42, tâm tại local y = +0.17, rộng 0.50):
               Cụm 2 khay 3.5" (Tầng trên: Khung hở Ổ đĩa mềm Sony MPF920; Tầng dưới: Tấm che phẳng 3.5") */}
        <group position={[0.12, 0.17, -0.01]}>
          {/* Khung viền âm bao quanh 2 khay 3.5" bên trái */}
          <RoundedBox
            args={[0.028, 0.5, 0.42]}
            radius={0.005}
            smoothness={1}
            position={[-0.004, 0, 0]}
            material={retroMaterials.darkBeige}
          />

          {/* Tầng trên (local z = -0.11 -> FrontBezel z = -0.12 -> Z_internal = -0.39):
              Khung hở rộng 0.48 cho Ổ đĩa mềm Sony MPF920 nằm phẳng, khe đĩa nằm ngang */}
          <mesh position={[0.008, -0.245, -0.11]} material={retroMaterials.darkBeige}>
            <boxGeometry args={[0.02, 0.016, 0.19]} />
          </mesh>
          <mesh position={[0.008, 0.245, -0.11]} material={retroMaterials.darkBeige}>
            <boxGeometry args={[0.02, 0.016, 0.19]} />
          </mesh>

          {/* Tầng dưới (local z = +0.10 -> FrontBezel z = +0.09 -> Z_internal = -0.18):
              Tấm che nhựa phẳng 3.5" (che ổ cứng Quantum Fireball nằm ẩn phía sau) */}
          <RoundedBox
            args={[0.032, 0.48, 0.19]}
            radius={0.005}
            smoothness={2}
            position={[0.006, 0, 0.1]}
            castShadow
            receiveShadow
            material={retroMaterials.beigePlastic}
          />
        </group>

        {/* B. BÊN PHẢI (35% bề ngang lòng mặt nạ, cách khay ổ mềm một khe hở 0.05 rõ ràng:
               local y từ -0.42 đến -0.13, tâm tại local y = -0.275, rộng 0.29):
               Bảng Control Panel phẳng phiu chứa tem ALPHA, nút RESET và 2 đèn LED */}
        <group position={[0.124, -0.275, -0.01]}>
          {/* Đế nhựa phẳng của cụm Control Panel */}
          <RoundedBox
            args={[0.028, 0.29, 0.42]}
            radius={0.006}
            smoothness={2}
            castShadow
            receiveShadow
            material={retroMaterials.beigePlastic}
          />

          {/* Mặt decal CanvasTexture hiển thị Nhãn "ALPHA" nền trắng chữ xanh (#0033aa),
              Ô LED 7-segment nhỏ, chữ "RESET" và ký hiệu PWR/HDD (cách mặt nhựa 0.016 để zero z-fighting) */}
          <mesh
            position={[0.016, 0, 0]}
            rotation={[0, Math.PI / 2, -Math.PI / 2]}
          >
            <planeGeometry args={[0.275, 0.4]} />
            <meshStandardMaterial
              map={alphaControlTex}
              roughness={0.5}
              metalness={0.05}
            />
          </mesh>

          {/* Phía dưới trái của Control Panel (local y = +0.04, z = +0.10):
              Nút nhấn RESET hình trụ tròn nhỏ nằm trong hốc tròn vát lõm */}
          <group position={[0.016, 0.04, 0.1]}>
            <mesh
              position={[0.002, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              material={retroMaterials.darkBeige}
            >
              <ringGeometry args={[0.022, 0.036, 20]} />
            </mesh>
            {/* Nút nhấn nhả (Momentary): lún nhanh rồi tự nảy ra */}
            <PressableControl
              label="[CLICK] RESET BUTTON (HARD REBOOT)"
              onPress={triggerReset}
              travel={0.009}
              momentaryMs={130}
            >
              <mesh
                position={[0.004, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                material={retroMaterials.beigePlastic}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.018, 16]} />
              </mesh>
            </PressableControl>
          </group>

          {/* Nút TURBO (cột phải, dưới đèn HDD): nút chốt giữ – lún khi đang chạy 233MHz */}
          <group position={[0.016, -0.075, 0.142]}>
            <RoundedBox
              args={[0.006, 0.072, 0.042]}
              radius={0.002}
              smoothness={1}
              position={[0.001, 0, 0]}
              material={retroMaterials.darkBeige}
            />
            <PressableControl
              label={`[CLICK] TURBO SWITCH (${isTurbo ? '233 → 66' : '66 → 233'} MHz)`}
              onPress={toggleTurbo}
              latched={isTurbo}
              travel={0.007}
            >
              <RoundedBox
                args={[0.018, 0.058, 0.03]}
                radius={0.004}
                smoothness={2}
                position={[0.009, 0, 0]}
                castShadow
                material={retroMaterials.beigePlastic}
              />
            </PressableControl>
          </group>

          {/* Cột bên phải của Control Panel (local y = -0.095): 2 bóng đèn LED tròn 3mm xếp dọc */}
          {/* Đèn trên (Power LED): Phát sáng xanh lá (#33ff33) khi isPoweredOn === true */}
          <mesh
            position={[0.018, -0.095, -0.04]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.014, 0.014, 0.016, 14]} />
            <meshStandardMaterial
              color={isPoweredOn ? '#33ff33' : '#1b331b'}
              emissive="#33ff33"
              emissiveIntensity={isPoweredOn ? 2.2 : 0}
              roughness={0.2}
            />
          </mesh>

          {/* Đèn dưới (HDD LED): Nhấp nháy đỏ cam (#ff3300) khi ổ cứng hoạt động */}
          <mesh
            position={[0.018, -0.095, 0.05]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.014, 0.014, 0.016, 14]} />
            <meshStandardMaterial
              ref={hddLedMatRef}
              color="#ff3300"
              emissive="#ff3300"
              emissiveIntensity={0.2}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* -------------------------------------------------------------------
            4. KHU VỰC THÂN DƯỚI CHIA ĐÔI (LOWER SPLIT PANEL - SÁT MẶT BÀN Y_world ~ 0.6)
               z từ +0.25 đến +1.64, chia 2 cánh đối xứng Trái (+y) và Phải (-y)
           ------------------------------------------------------------------- */}
        {/* Cánh nhựa thân dưới Bên Trái (local y = +0.24) */}
        <RoundedBox
          args={[0.036, 0.45, 1.34]}
          radius={0.01}
          smoothness={2}
          position={[0.122, 0.24, 0.94]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Cánh nhựa thân dưới Bên Phải (local y = -0.24) */}
        <RoundedBox
          args={[0.036, 0.45, 1.34]}
          radius={0.01}
          smoothness={2}
          position={[0.122, -0.24, 0.94]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Đường rãnh dọc thẳng tắp ở chính giữa (Center Vertical Seam: local y = 0) kéo dài xuống sát đáy */}
        <mesh position={[0.132, 0, 0.94]}>
          <boxGeometry args={[0.02, 0.022, 1.36]} />
          <meshStandardMaterial color="#5a544a" roughness={0.85} />
        </mesh>

        {/* CASE BADGE (Góc trên bên trái của phần thân dưới: local y = +0.29, local z = +0.44):
            Ô vuông lõm kích thước nhỏ dán tem vuông "Intel Inside Pentium MMX" */}
        <group position={[0.134, 0.29, 0.44]}>
          <RoundedBox
            args={[0.014, 0.19, 0.19]}
            radius={0.004}
            smoothness={1}
            material={retroMaterials.darkBeige}
          />
          <mesh
            position={[0.009, 0, 0]}
            rotation={[0, Math.PI / 2, -Math.PI / 2]}
          >
            <planeGeometry args={[0.165, 0.165]} />
            <meshStandardMaterial
              map={intelBadgeTex}
              roughness={0.32}
              metalness={0.25}
            />
          </mesh>
        </group>

        {/* LƯỚI LỖ TRÒN HÚT GIÓ ĐÁY (InstancedMesh):
            Ở nửa dưới của cả 2 cánh Trái và Phải, tạo 2 cụm lỗ thông gió hình tròn đen
            (mỗi bên là ma trận 5 cột x 4 hàng = 20 lỗ tròn, tổng cộng 40 lỗ ở đáy) */}
        <Instances
          limit={lowerIntakeVentHoles.length}
          material={retroMaterials.isaBlack}
        >
          <cylinderGeometry args={[0.018, 0.018, 0.012, 14]} />
          {lowerIntakeVentHoles.map(([hx, hy, hz], idx) => (
            <Instance
              key={`lower-intake-hole-${idx}`}
              position={[hx, hy, hz]}
              rotation={[0, 0, Math.PI / 2]}
            />
          ))}
        </Instances>

        {/* ĐẾ CHÂN (BASE LIP): Phần gờ nhựa dưới cùng (local z = +1.68, chạm mặt bàn y = 0) */}
        <RoundedBox
          args={[0.2, 1.28, 0.12]}
          radius={0.012}
          smoothness={2}
          position={[-0.01, 0, 1.68]}
          castShadow
          receiveShadow
          material={retroMaterials.darkBeige}
        />
      </group>

      {/* =======================================================================
          C. NẮP VỎ CHỮ U (CASE U-COVER - BEIGE PLASTIC) & 4 ỐC LƯNG (CHỈ HIỆN Ở STEP 10)
         ======================================================================= */}
      {(() => {
        const uSlideT = Math.max(0, Math.min(1, uCoverCloseProgress / 0.72));
        const uSlideSmooth = uSlideT * uSlideT * (3 - 2 * uSlideT);
        const uScrewT = Math.max(0, Math.min(1, (uCoverCloseProgress - 0.68) / 0.32));
        const uScrewSmooth = uScrewT * uScrewT * (3 - 2 * uScrewT);

        const coverX = THREE.MathUtils.lerp(-0.45, 0.46, uSlideSmooth);
        const isCaseTransparent = caseOpacity < 0.99;

        return (
          <group name="CaseUCoverGroup" visible={uCoverCloseProgress > 0.001}>
              <group position={[coverX, 0.68, -0.27]}>
                {/* Mặt nắp hông trái (Y_int = +0.66) */}
                <RoundedBox
                  args={[3.26, 0.035, 3.5]}
                  radius={0.01}
                  smoothness={2}
                  position={[0, 0.66, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color="#d8d2c5"
                    roughness={0.65}
                    metalness={0.05}
                    transparent={isCaseTransparent}
                    opacity={caseOpacity}
                    depthWrite={!isCaseTransparent}
                  />
                </RoundedBox>

                {/* Vách nóc trên cùng của thùng máy đứng (Z_int = -1.75) */}
                <RoundedBox
                  args={[3.26, 1.32, 0.035]}
                  radius={0.01}
                  smoothness={2}
                  position={[0, 0, -1.75]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color="#d8d2c5"
                    roughness={0.65}
                    metalness={0.05}
                    transparent={isCaseTransparent}
                    opacity={caseOpacity}
                    depthWrite={!isCaseTransparent}
                  />
                </RoundedBox>

                {/* Mặt nắp hông phải (Y_int = -0.66) */}
                <RoundedBox
                  args={[3.26, 0.035, 3.5]}
                  radius={0.01}
                  smoothness={2}
                  position={[0, -0.66, 0]}
                  castShadow
                  receiveShadow
                >
                  <meshStandardMaterial
                    color="#d8d2c5"
                    roughness={0.65}
                    metalness={0.05}
                    transparent={isCaseTransparent}
                    opacity={caseOpacity}
                    depthWrite={!isCaseTransparent}
                  />
                </RoundedBox>
              </group>

              {/* 4 Ốc vít mặt lưng siết chặt nắp vỏ chữ U ở Step 10 */}
              {uScrewT > 0.01 && (
                <group>
                  {[
                    [0.18, -1.98],
                    [1.22, -1.98],
                    [0.18, 1.44],
                    [1.22, 1.44],
                  ].map(([sy, sz], idx) => (
                    <mesh
                      key={`ucover-screw-${idx}`}
                      position={[
                        THREE.MathUtils.lerp(-1.55, -1.19, uScrewSmooth),
                        sy,
                        sz,
                      ]}
                      rotation={[0, 0, Math.PI / 2]}
                      material={retroMaterials.galvanizedSteel}
                    >
                      <cylinderGeometry args={[0.022, 0.022, 0.032, 6]} />
                    </mesh>
                  ))}
                </group>
              )}
            </group>
          );
        })()}
    </group>
  );
}
