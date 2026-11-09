import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { useBuildStore } from '../../../store/useBuildStore';
import { PressableControl } from '../interaction/PressableControl';

/**
 * 1. Texture mặt trước Khay đĩa (Disc Tray) của ổ Creative Infra 24X CD-ROM:
 * In logo "COMPACT disc" và dòng chữ "Creative 24X mx"
 */
function createCdRomTrayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8d2c5';
  ctx.fillRect(0, 0, 512, 128);

  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);

  ctx.fillStyle = '#222220';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('COMPACT', 28, 52);
  ctx.font = 'italic bold 32px "JetBrains Mono", monospace';
  ctx.fillText('disc', 28, 86);
  ctx.font = '13px "IBM Plex Mono", monospace';
  ctx.fillText('DATA STORAGE', 28, 106);

  ctx.fillStyle = '#0000aa';
  ctx.font = 'italic bold 34px "JetBrains Mono", monospace';
  ctx.fillText('Creative', 175, 68);

  ctx.fillStyle = '#b82525';
  ctx.font = 'bold 36px "JetBrains Mono", monospace';
  ctx.fillText('24X', 355, 68);

  ctx.fillStyle = '#141413';
  ctx.font = 'italic bold 24px "IBM Plex Mono", monospace';
  ctx.fillText('mx', 432, 68);

  ctx.font = 'bold 15px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#4a463f';
  ctx.fillText('INFRA 3600 // HIGH SPEED CD-ROM', 178, 98);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. Texture mặt đĩa CD-ROM bạc lấp lánh in chữ "PORTFOLIO SOURCE CODE - 650MB"
 */
function createPortfolioCdDiscTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Nền bạc nhôm phản quang + dải cầu vồng nhiễu xạ đặc trưng đĩa CD-R thập niên 90
  const radGrad = ctx.createRadialGradient(256, 256, 42, 256, 256, 248);
  radGrad.addColorStop(0, '#c8cdd2');
  radGrad.addColorStop(0.28, '#eef2f6');
  radGrad.addColorStop(0.55, '#d4dde4');
  radGrad.addColorStop(0.85, '#f4f6f8');
  radGrad.addColorStop(1, '#aeb6be');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 248, 0, Math.PI * 2);
  ctx.fill();

  // Hai rẻ quạt ánh kim cầu vồng chéo qua tâm đĩa
  const drawIridescentWedge = (baseAngle: number) => {
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(baseAngle);
    const rainbow = ctx.createLinearGradient(-220, -60, 220, 60);
    rainbow.addColorStop(0, 'rgba(255, 90, 120, 0)');
    rainbow.addColorStop(0.25, 'rgba(255, 190, 80, 0.22)');
    rainbow.addColorStop(0.5, 'rgba(90, 240, 170, 0.28)');
    rainbow.addColorStop(0.75, 'rgba(95, 165, 255, 0.24)');
    rainbow.addColorStop(1, 'rgba(200, 110, 255, 0)');
    ctx.fillStyle = rainbow;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 244, -0.38, 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawIridescentWedge(0.55);
  drawIridescentWedge(0.55 + Math.PI);

  // Vòng viền ngoài và vòng nhựa trong suốt quanh lỗ trục
  ctx.strokeStyle = '#788088';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 244, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#8c949c';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(256, 256, 56, 0, Math.PI * 2);
  ctx.stroke();

  // Dải băng xanh dương đậm ở nửa trên đĩa
  ctx.save();
  ctx.beginPath();
  ctx.arc(256, 256, 232, Math.PI * 1.12, Math.PI * 1.88);
  ctx.arc(256, 256, 86, Math.PI * 1.88, Math.PI * 1.12, true);
  ctx.closePath();
  ctx.fillStyle = '#002b88';
  ctx.fill();
  ctx.restore();

  // Chữ in silkscreen sắc nét trên mặt đĩa
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 25px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PORTFOLIO SOURCE CODE', 256, 146);
  ctx.fillStyle = '#ffdf66';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText('- 650MB -', 256, 178);

  ctx.fillStyle = '#181a1b';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('ISO-9660 // WIN95 & DOS', 256, 356);
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#3a4046';
  ctx.fillText('COMPACT DISC DATA STORAGE // 74 MIN', 256, 386);
  ctx.fillText('REV 1997.11 // READ-ONLY MASTER', 256, 412);

  // Lỗ tâm đĩa tối màu
  ctx.fillStyle = '#141413';
  ctx.beginPath();
  ctx.arc(256, 256, 38, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4. Texture nhãn giấy dán trên đĩa mềm 3.5" 1.44MB: "RESUME_CV.PDF"
 */
function createFloppyLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f6f3e8';
  ctx.fillRect(0, 0, 256, 192);

  // Đầu nhãn kẻ sọc đỏ-xanh kiểu đĩa Verbatim/Sony HD
  ctx.fillStyle = '#0033aa';
  ctx.fillRect(0, 0, 256, 38);
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(0, 38, 256, 8);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('3.5" MF-2HD // 1.44MB', 14, 26);

  // Các dòng kẻ ngang viết tay
  ctx.strokeStyle = '#b8b2a2';
  ctx.lineWidth = 2;
  for (let y = 78; y <= 168; y += 30) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(242, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText('RESUME_CV.PDF', 16, 72);
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#0033aa';
  ctx.fillText('A:\\>PORTFOLIO_97.DOC', 16, 102);
  ctx.fillStyle = '#44403a';
  ctx.fillText('FORMAT: FAT12 // BOOTABLE', 16, 132);
  ctx.fillText('DISK 1 OF 1 (WRITE-PROTECT)', 16, 162);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. Texture nhãn dán trắng-đỏ trên nắp ổ cứng cơ Quantum Fireball ST 3.2GB
 */
function createQuantumFireballTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2efe6';
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 364);

  ctx.fillStyle = '#b82525';
  ctx.fillRect(14, 14, 484, 72);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.fillText('QUANTUM FIREBALL ST', 28, 52);
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#ffdf80';
  ctx.fillText('3.2 GB AT // ULTRA ATA-33 // 5400 RPM', 28, 76);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('MODEL: ST3.2A   CYL: 6256  HD: 16  SEC: 63', 28, 122);

  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 140, 456, 132);
  ctx.fillStyle = '#e2ddd0';
  ctx.fillRect(30, 142, 452, 34);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 19px "JetBrains Mono", monospace';
  ctx.fillText('JUMPER SETTINGS: MASTER / SLAVE [DS|CS|PK]', 40, 166);

  ctx.font = 'bold 18px "IBM Plex Mono", monospace';
  ctx.fillText('MASTER (1 DRIVE) : [ | : : ] DS=ON  CS=OFF', 40, 202);
  ctx.fillText('SLAVEDRIVE       : [ : : : ] DS=OFF CS=OFF', 40, 230);
  ctx.fillText('CABLE SELECT     : [ : | : ] DS=OFF CS=ON ', 40, 258);

  for (let x = 32; x < 478; x += 7) {
    ctx.fillRect(x, 290, x % 14 === 0 ? 4 : 2, 46);
  }
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillText('S/N: QF3200ST-1997-1108 // MADE IN JAPAN', 72, 358);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smooth(v: number, min: number, max: number): number {
  const t = clamp01((v - min) / (max - min));
  return t * t * (3 - 2 * t);
}

// 8 ốc vít bắt vào hông lồng ổ đĩa 5.25" (Bay 1) và 3.5" (lệch trái 60%)
const DRIVE_SCREW_TARGETS: [number, number, number][] = [
  // 4 ốc cho ổ CD-ROM 5.25" (Bay 1: Y = 1.11, Z = -1.59)
  [1.62, 1.12, -1.66],
  [1.92, 1.12, -1.66],
  [1.62, 1.12, -1.52],
  [1.92, 1.12, -1.52],
  // 2 ốc cho ổ mềm Sony 3.5" (Khay 3.5" trên lệch trái: Y = 1.12, Z = -0.39)
  [1.76, 1.12, -0.39],
  [1.98, 1.12, -0.39],
  // 2 ốc cho ổ cứng Quantum Fireball 3.5" (Khay 3.5" dưới lệch trái: Y = 1.12, Z = -0.17)
  [1.56, 1.12, -0.17],
  [1.78, 1.12, -0.17],
];

export interface StorageDrivesProps {
  /** Tiến trình lắp 3 ổ đĩa ở Step 05 (0.0 -> 1.0) */
  driveInstallProgress: number;
  isCaseCoverClosed?: boolean;
}

export function StorageDrives({
  driveInstallProgress,
  isCaseCoverClosed = false,
}: StorageDrivesProps) {
  const currentStep = useBuildStore((s) => s.currentStep);
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isCdTrayOpen = useBuildStore((s) => s.isCdTrayOpen);
  const cdLocation = useBuildStore((s) => s.cdLocation);
  const cardLocation = useBuildStore((s) => s.cardLocation);
  const handleCdClickOnDesk = useBuildStore((s) => s.handleCdClickOnDesk);
  const handleCdTrayEjectClick = useBuildStore((s) => s.handleCdTrayEjectClick);
  const handleCdClickOnTray = useBuildStore((s) => s.handleCdClickOnTray);
  const handleCardClick = useBuildStore((s) => s.handleCardClick);

  const cdTrayTex = useMemo(() => createCdRomTrayTexture(), []);
  const hddLabelTex = useMemo(() => createQuantumFireballTexture(), []);
  const cdDiscTex = useMemo(() => createPortfolioCdDiscTexture(), []);
  const floppyLabelTex = useMemo(() => createFloppyLabelTexture(), []);

  const cdTraySlideRef = useRef<THREE.Group>(null);
  const cdTrayOffsetRef = useRef(isCdTrayOpen && isPoweredOn ? 1.2 : 0);
  const floppyDiskGroupRef = useRef<THREE.Group>(null);
  const cardAnimProgRef = useRef(cardLocation === 'INSERTED' ? 1.0 : 0.0);
  const cdDiscGroupRef = useRef<THREE.Group>(null);
  const cdFlightProgRef = useRef(
    cdLocation === 'TRAY' || cdLocation === 'INSIDE' ? 1.0 : 0.0
  );

  useEffect(() => {
    return () => {
      cdTrayTex.dispose();
      hddLabelTex.dispose();
      cdDiscTex.dispose();
      floppyLabelTex.dispose();
    };
  }, [cdTrayTex, hddLabelTex, cdDiscTex, floppyLabelTex]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // 1. Khay đĩa CD-ROM từ từ trượt mượt ra trước mặt nạ 1.2 units trong 0.5s (damp factor 6.0)
    const trayTarget = isCdTrayOpen && isPoweredOn ? 1.2 : 0;
    cdTrayOffsetRef.current = THREE.MathUtils.damp(cdTrayOffsetRef.current, trayTarget, 6.0, dt);
    if (cdTraySlideRef.current) {
      cdTraySlideRef.current.position.x = cdTrayOffsetRef.current;
    }

    // 2. Thẻ nhớ / Đĩa mềm 3.5" diễn hoạt bay 2 giai đoạn vào/ra khe đọc chậm rãi mượt mà trong ~1.2s (damp factor 2.5)
    const cardTarget = cardLocation === 'INSERTED' ? 1.0 : 0.0;
    cardAnimProgRef.current = THREE.MathUtils.damp(
      cardAnimProgRef.current,
      cardTarget,
      2.5,
      dt
    );
    const t = cardAnimProgRef.current;
    if (floppyDiskGroupRef.current) {
      let curX: number;
      let curY: number;
      let curZ: number;

      // Vị trí đĩa mềm nằm phẳng trên mặt bàn (World: X = 1.35, Y = 0.0225, Z = 2.70)
      // Nằm phẳng sát mặt thảm cắt giữa chuột (X = 0.65) và cạnh trái thùng máy (X = 1.71)
      const deskLocalX = 0.646;
      const deskLocalY = 0.252;
      const deskLocalZ = 1.849;

      const hoverLocalX = 0.380; // Ngay trước cửa khe đọc 3.5"
      const hoverLocalY = 0.000;
      const hoverLocalZ = -0.014;

      const insertedLocalX = -0.090; // Đút sâu vào trong khe đọc (chỉ nhô mép ~18% ra ngoài chuẩn thực tế)

      if (t < 0.50) {
        // Giai đoạn 1: Bay giữa Mặt bàn và Điểm chờ ngay trước cửa khe đọc
        const p1 = t / 0.50;
        const s1 = p1 * p1 * (3 - 2 * p1);
        curX = THREE.MathUtils.lerp(deskLocalX, hoverLocalX, s1);
        curY = THREE.MathUtils.lerp(deskLocalY, hoverLocalY, s1);
        const flightArc = Math.sin(p1 * Math.PI) * 0.25;
        curZ = THREE.MathUtils.lerp(deskLocalZ, hoverLocalZ, s1) - flightArc;
      } else {
        // Giai đoạn 2: Đút từ từ từ ngoài vào trong khe đọc (hoặc Rút từ từ từ trong ra ngoài)
        const p2 = (t - 0.50) / 0.50;
        const s2 = p2 * p2 * (3 - 2 * p2);
        curX = THREE.MathUtils.lerp(hoverLocalX, insertedLocalX, s2);
        curY = hoverLocalY;
        curZ = hoverLocalZ;
      }

      floppyDiskGroupRef.current.position.set(curX, curY, curZ);
    }

    // 3. Đĩa CD-ROM diễn hoạt bay 2 giai đoạn trong 0.6s (damp factor 5.2 - YÊU CẦU #1):
    // - Giai đoạn 1 (u: 0 -> 0.55): Bay từ mặt bàn lên điểm lơ lửng ngay phía trên lòng khay đĩa
    // - Giai đoạn 2 (u: 0.55 -> 1.0): HẠ XUỐNG TỪ TỪ TỪ TRÊN XUỐNG khớp vào lòng khay đĩa
    // Khi lấy ra (u: 1.0 -> 0): NHẤC LÊN TỪ TỪ TỪ DƯỚI LÊN khỏi lòng khay, rồi bay hạ xuống bàn
    const cdTarget = (cdLocation === 'TRAY' || cdLocation === 'INSIDE') ? 1.0 : 0.0;
    cdFlightProgRef.current = THREE.MathUtils.damp(
      cdFlightProgRef.current,
      cdTarget,
      5.2,
      dt
    );
    const u = cdFlightProgRef.current;
    if (cdDiscGroupRef.current) {
      // Tâm lòng trũng tròn khay đĩa theo hệ tọa độ StorageDrives (Case space):
      // cdX = 1.84, mặt nạ trước = +0.50, thân khay đen = -0.60, lòng trũng = +0.04
      // => 1.84 + 0.50 - 0.60 + 0.04 = 1.78 + offset
      const trayRecessX = 1.78 + cdTrayOffsetRef.current;
      const trayRecessY = 0.68;
      const trayRecessZ = -1.615;
      const hoverZ = -1.95; // Điểm lơ lửng ngay phía trên lòng khay đĩa (-Z trong Case là +Y World)

      // Vị trí đĩa CD nằm phẳng trên mặt bàn cạnh Thẻ nhớ Floppy (World: X = 1.95, Y = 0.0225, Z = 2.70)
      // Nằm song song ngay cạnh thẻ nhớ (X = 1.35) ở khoảng đệm phía trước thùng máy trên thảm cắt
      const deskX = 2.981;
      const deskY = 0.596;
      const deskZ = 1.459;

      let cx: number;
      let cy: number;
      let cz: number;

      if (u < 0.55) {
        // Giai đoạn 1: Bay giữa Mặt bàn và Điểm lơ lửng phía trên lòng khay đĩa
        const q1 = u / 0.55;
        const w1 = q1 * q1 * (3 - 2 * q1);
        cx = THREE.MathUtils.lerp(deskX, trayRecessX, w1);
        cy = THREE.MathUtils.lerp(deskY, trayRecessY, w1);
        const flightArc = Math.sin(q1 * Math.PI) * 0.35;
        cz = THREE.MathUtils.lerp(deskZ, hoverZ, w1) - flightArc;
      } else {
        // Giai đoạn 2: Hạ từ từ từ trên xuống (hoặc Nhấc từ từ từ dưới lên) vào/ra lòng khay đĩa
        const q2 = (u - 0.55) / 0.45;
        const w2 = q2 * q2 * (3 - 2 * q2);
        cx = trayRecessX; // Giữ chuẩn tâm lòng khay theo chiều trượt
        cy = trayRecessY; // Giữ chuẩn tâm lòng khay theo chiều ngang
        cz = THREE.MathUtils.lerp(hoverZ, trayRecessZ, w2); // Hạ từ từ từ trên xuống!
      }

      cdDiscGroupRef.current.position.set(cx, cy, cz);
    }
  });

  const p = clamp01(driveInstallProgress);

  // Pha 1 (0.00 -> 0.34): Ổ quang Creative 24X CD-ROM trượt thẳng từ phía trước vào Bay 1 trên cùng
  const cdT = smooth(p, 0.0, 0.34);
  // Pha 2 (0.28 -> 0.60): Ổ mềm Sony MPF920 trượt thẳng từ phía trước vào khay 3.5" bên trái (60%)
  const fddT = smooth(p, 0.28, 0.6);
  // Pha 3 (0.52 -> 0.82): Ổ cứng Quantum Fireball 3.2GB trượt từ trong lòng Case vào khay 3.5" dưới
  const hddT = smooth(p, 0.52, 0.82);
  // Pha 4 (0.78 -> 1.00): 8 ốc vít xoáy cố định cả 3 ổ
  const screwT = smooth(p, 0.78, 1.0);

  // 1. Tọa độ ổ CD-ROM Creative 24X:
  // Khớp chính xác 100% vào Bay 1 trên cùng (Y_int = 0.68 -> local y = 0; Z_int = -1.59 -> local z = -1.32)
  const cdX = THREE.MathUtils.lerp(2.95, 1.84, cdT);
  const cdY = 0.68;
  const cdZ = -1.59;

  // 2. Tọa độ ổ mềm Floppy Sony MPF920:
  // Khớp chính xác 100% vào khay 3.5" tầng trên bên trái (Y_int = 0.85 -> local y = +0.17; Z_int = -0.39 -> local z = -0.12)
  const fddX = THREE.MathUtils.lerp(2.85, 1.95, fddT);
  const fddY = 0.85;
  const fddZ = -0.39;

  // 3. Tọa độ ổ cứng Quantum Fireball ST 3.2GB:
  // Ẩn gọn phía sau tấm che nhựa 3.5" tầng dưới bên trái (X_int = 1.62, Y_int = 0.85, Z_int = -0.17)
  const hddX = THREE.MathUtils.lerp(0.85, 1.62, hddT);
  const hddY = THREE.MathUtils.lerp(1.25, 0.85, Math.min(1, hddT * 1.5));
  const hddZ = -0.17;

  return (
    <group>
      {/* =====================================================================
          A. Ổ ĐĨA QUANG CREATIVE INFRA 24X CD-ROM (CHUẨN 5.25 INCH - BAY 1)
             Nằm gọn 100% trong khung hở Bay 1 (rộng 0.81 <= 0.82, cao 0.265 <= 0.275)
         ===================================================================== */}
      <group position={[cdX, cdY, cdZ]}>
        {/* Thân ổ bằng thép mạ kẽm (0.98 x 0.78 x 0.25) - Ẩn khi đóng nắp case */}
        <group visible={!isCaseCoverClosed}>
          <RoundedBox
            args={[0.98, 0.78, 0.25]}
            radius={0.006}
            smoothness={1}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />
        </group>

        {/* Mặt nạ trước bằng nhựa Retro Beige (#d8d2c5) tại X = +0.50 (X_int = 2.34) */}
        <group position={[0.5, 0, 0]}>
          <RoundedBox
            args={[0.036, 0.8, 0.262]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.beigePlastic}
          />

          {/* CỤM KHAY ĐĨA TRƯỢT (SLIDING DISC TRAY + PORTFOLIO CD-ROM 650MB)
              Click vào mặt khay hoặc nút Eject đều đẩy/thu khay đĩa */}
          <group ref={cdTraySlideRef}>
            <PressableControl
              label={`[CLICK] CD-ROM DISC TRAY (${isCdTrayOpen ? 'CLOSE' : 'EJECT'})`}
              onPress={handleCdTrayEjectClick}
              travel={0.004}
            >
              {/* Mặt trước khay đĩa */}
              <RoundedBox
                args={[0.018, 0.7, 0.12]}
                radius={0.004}
                smoothness={1}
                position={[0.016, 0, -0.042]}
                material={retroMaterials.beigePlastic}
              />
              <mesh
                position={[0.026, 0, -0.042]}
                rotation={[0, Math.PI / 2, -Math.PI / 2]}
              >
                <planeGeometry args={[0.68, 0.11]} />
                <meshStandardMaterial map={cdTrayTex} roughness={0.55} metalness={0.05} />
              </mesh>

              {/* Thân khay nhựa đen đỡ đĩa (nằm ngang trong mặt phẳng XY của case, trượt ra ngoài khi Eject) */}
              <group position={[-0.6, 0, -0.012]}>
                <RoundedBox
                  args={[1.22, 0.66, 0.018]}
                  radius={0.004}
                  smoothness={1}
                  castShadow
                  receiveShadow
                  material={retroMaterials.isaBlack}
                />
                {/* Lòng trũng tròn đặt đĩa CD */}
                <mesh position={[0.04, 0, -0.011]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.295, 0.295, 0.004, 36]} />
                  <meshStandardMaterial color="#101010" roughness={0.75} />
                </mesh>
              </group>
            </PressableControl>
          </group>

          {/* Hàng chi tiết dưới khay đĩa (z = +0.068), căn đều từ Trái (+y) qua Phải (-y): */}
          {/* 1. Lỗ cắm tai nghe 3.5mm màu đen (bên trái: y = +0.26) */}
          <mesh
            position={[0.02, 0.26, 0.068]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.isaBlack}
          >
            <cylinderGeometry args={[0.014, 0.014, 0.012, 12]} />
          </mesh>

          {/* 2. Núm xoay chỉnh Volume analog nhỏ (y = +0.15) */}
          <mesh
            position={[0.02, 0.15, 0.068]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.darkBeige}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.014, 16]} />
          </mesh>

          {/* 3. Đèn LED trạng thái màu xanh lá (y = -0.04) */}
          <mesh position={[0.02, -0.04, 0.068]}>
            <boxGeometry args={[0.008, 0.032, 0.014]} />
            <meshStandardMaterial
              color={isPoweredOn ? '#33ff33' : '#1b331b'}
              emissive="#33ff33"
              emissiveIntensity={isPoweredOn ? (isCdTrayOpen ? 2.2 : 1.2) : 0}
            />
          </mesh>

          {/* 4. Nút bấm vuông Eject/Close màu Aged Dark Beige (bên phải: y = -0.22) */}
          <PressableControl
            label={`[CLICK] CD-ROM 24X EJECT (${isCdTrayOpen ? 'CLOSE TRAY' : 'OPEN TRAY'})`}
            onPress={handleCdTrayEjectClick}
            position={[0.02, -0.22, 0.068]}
            travel={0.01}
          >
            <RoundedBox
              args={[0.018, 0.088, 0.036]}
              radius={0.003}
              smoothness={1}
              material={retroMaterials.darkBeige}
            />
          </PressableControl>
        </group>

        {/* Mặt sau ổ CD-ROM (X = -0.49): Khu vực chân cắm IDE 40-pin, Jumper & Molex 4-pin */}
        <group position={[-0.492, 0, 0]} visible={!isCaseCoverClosed}>
          <mesh position={[0, -0.05, 0]} material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.02, 0.28, 0.06]} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={retroMaterials.goldPin}>
            <boxGeometry args={[0.02, 0.08, 0.05]} />
          </mesh>
          <mesh position={[0, 0.28, 0]} material={retroMaterials.whiteSlot}>
            <boxGeometry args={[0.022, 0.12, 0.055]} />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          B. Ổ ĐĨA MỀM SONY MPF920 1.44MB (3.5 INCH BÊN TRÁI 60%)
             Nằm phẳng phiu, khe đĩa nằm ngang gọn 100% trong khung 3.5" bên trái
         ===================================================================== */}
      <group position={[fddX, fddY, fddZ]}>
        {/* Thân ổ mềm bằng kim loại (0.74 x 0.45 x 0.16) - Ẩn khi đóng nắp case */}
        <group visible={!isCaseCoverClosed}>
          <RoundedBox
            args={[0.74, 0.45, 0.16]}
            radius={0.005}
            smoothness={1}
            castShadow
            receiveShadow
            material={retroMaterials.galvanizedSteel}
          />
        </group>

        {/* Mặt nạ trước bằng nhựa Beige tại X = +0.385 (rộng 0.468 <= 0.48 của khung hở) */}
        <group position={[0.385, 0, 0]}>
          <RoundedBox
            args={[0.032, 0.468, 0.18]}
            radius={0.004}
            smoothness={1}
            castShadow
            material={retroMaterials.beigePlastic}
          />

          {/* Khe nhét đĩa mềm nằm ngang chính giữa (rộng 0.36, cao 0.028) có nắp lật bạc bên trong */}
          <mesh position={[0.015, 0, -0.014]} material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.01, 0.36, 0.028]} />
          </mesh>
          <mesh position={[0.013, 0, -0.014]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.008, 0.33, 0.02]} />
          </mesh>

          {/* Nút bấm Eject hình chữ nhật lồi ở góc dưới bên phải (y = -0.13, z = +0.038) */}
          <PressableControl
            label={`[CLICK] 3.5" DRIVE EJECT (${cardLocation === 'INSERTED' ? 'EJECT CARD' : 'INSERT CARD'})`}
            onPress={handleCardClick}
            position={[0.018, -0.13, 0.038]}
            latched={cardLocation === 'INSERTED'}
            travel={0.008}
          >
            <RoundedBox
              args={[0.02, 0.072, 0.032]}
              radius={0.003}
              smoothness={1}
              material={retroMaterials.darkBeige}
            />
          </PressableControl>

          {/* Đèn LED nhỏ màu xanh lá ở góc dưới bên trái (y = +0.13, z = +0.038):
              Sáng xanh rực khi đĩa mềm/thẻ nhớ được cắm vào (cardLocation === 'INSERTED') */}
          <mesh position={[0.018, 0.13, 0.038]}>
            <boxGeometry args={[0.008, 0.026, 0.014]} />
            <meshStandardMaterial
              color={isPoweredOn && cardLocation === 'INSERTED' ? '#33ff33' : '#1b331b'}
              emissive="#33ff33"
              emissiveIntensity={isPoweredOn && cardLocation === 'INSERTED' ? 2.4 : 0}
            />
          </mesh>

          {/* CHIẾC THẺ NHỚ / ĐĨA MỀM 3.5" 1.44MB "RESUME_CV.PDF" (Diễn hoạt bay giữa Bàn và Khe đọc) */}
          <group ref={floppyDiskGroupRef}>
            <PressableControl
              label={`[CLICK] MEMORY CARD: VINZBOIZ_CV.DOC (${cardLocation === 'INSERTED' ? 'EJECT TO DESK' : 'INSERT INTO SLOT'})`}
              onPress={handleCardClick}
              travel={0.01}
            >
              {/* Vỏ nhựa xanh đậm 3.5" */}
              <RoundedBox
                args={[0.36, 0.34, 0.018]}
                radius={0.003}
                smoothness={1}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial color="#1b3b72" roughness={0.55} metalness={0.08} />
              </RoundedBox>
              {/* Cửa trập kim loại trượt (Sliding Metal Shutter) ở đầu đút vào ổ */}
              <mesh position={[-0.125, 0.02, 0]} material={retroMaterials.galvanizedSteel}>
                <boxGeometry args={[0.105, 0.2, 0.02]} />
              </mesh>
              {/* Nhãn giấy "RESUME_CV.PDF" dán mặt trên (-Z_case = +Y_world) */}
              <mesh position={[0.045, 0, -0.01]} rotation={[Math.PI, 0, Math.PI / 2]}>
                <planeGeometry args={[0.22, 0.18]} />
                <meshStandardMaterial map={floppyLabelTex} roughness={0.65} side={THREE.DoubleSide} />
              </mesh>
            </PressableControl>
          </group>
        </group>

        {/* Mặt sau ổ mềm: Cổng cáp Floppy 34-pin & Nguồn Berg 4-pin */}
        <group position={[-0.375, 0, 0]} visible={!isCaseCoverClosed}>
          <mesh position={[0, -0.05, 0]} material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.02, 0.2, 0.045]} />
          </mesh>
          <mesh position={[0, 0.13, 0]} material={retroMaterials.whiteSlot}>
            <boxGeometry args={[0.02, 0.07, 0.038]} />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          C. Ổ CỨNG CƠ QUANTUM FIREBALL ST 3.2GB (CHUẨN 3.5 INCH KÍN BÊN TRONG)
          Ẩn hoàn toàn khi nắp vỏ thùng máy đã đóng để loại bỏ clipping và tối ưu GPU
         ===================================================================== */}
      <group position={[hddX, hddY, hddZ]} visible={!isCaseCoverClosed}>
        {/* Thân ổ cứng bằng kim loại đúc màu đen nhám (0.74 x 0.45 x 0.14) */}
        <RoundedBox
          args={[0.74, 0.45, 0.14]}
          radius={0.006}
          smoothness={1}
          castShadow
          receiveShadow
          material={retroMaterials.blackAnodized}
        />

        {/* Nắp trên bằng thép mạ kẽm sáng bóng có dập gờ nổi đặc trưng dòng Fireball */}
        <RoundedBox
          args={[0.71, 0.42, 0.016]}
          radius={0.004}
          smoothness={1}
          position={[0, 0, -0.074]}
          castShadow
          material={retroMaterials.galvanizedSteel}
        />
        <mesh position={[-0.22, 0, -0.084]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.1, 0.36, 0.01]} />
        </mesh>
        <mesh position={[0.22, 0, -0.084]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.1, 0.36, 0.01]} />
        </mesh>

        {/* Nhãn dán trắng-đỏ "QUANTUM FIREBALL ST | 3.2 GB AT" */}
        <mesh position={[0, 0, -0.088]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.42, 0.32]} />
          <meshStandardMaterial map={hddLabelTex} roughness={0.45} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.228, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
          <planeGeometry args={[0.12, 0.52]} />
          <meshStandardMaterial map={hddLabelTex} roughness={0.45} metalness={0.05} />
        </mesh>

        {/* Mặt sau ổ cứng (X = -0.375): Hàng chân kim IDE 40-pin, Jumper & Cổng nguồn Molex 4-pin */}
        <group position={[-0.375, 0, 0]}>
          <mesh position={[0, -0.07, 0]} material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.022, 0.22, 0.05]} />
          </mesh>
          <mesh position={[-0.008, -0.07, 0]} material={retroMaterials.goldPin}>
            <boxGeometry args={[0.018, 0.18, 0.022]} />
          </mesh>
          <mesh position={[0, 0.07, 0]} material={retroMaterials.goldPin}>
            <boxGeometry args={[0.02, 0.05, 0.036]} />
          </mesh>
          <mesh position={[0, 0.16, 0]} material={retroMaterials.whiteSlot}>
            <boxGeometry args={[0.025, 0.095, 0.046]} />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          D. TÁM ỐC VÍT HÔNG LỒNG ĐĨA TỰ ĐỘNG XOÁY VÀO CỐ ĐỊNH CẢ 3 Ổ (PHA 4)
         ===================================================================== */}
      {screwT > 0.01 && !isCaseCoverClosed && (
        <Instances limit={DRIVE_SCREW_TARGETS.length} material={retroMaterials.galvanizedSteel}>
          <cylinderGeometry args={[0.018, 0.018, 0.028, 8]} />
          {DRIVE_SCREW_TARGETS.map(([tx, ty, tz], idx) => {
            const curY = THREE.MathUtils.lerp(ty + 0.38, ty, screwT);
            return (
              <Instance
                key={`drv-screw-${idx}`}
                position={[tx, curY, tz]}
                rotation={[0, (1 - screwT) * Math.PI * 6, 0]}
              />
            );
          })}
        </Instances>
      )}

      {/* =====================================================================
          E. ĐĨA CD-ROM DIỄN HOẠT BAY 2 GIAI ĐOẠN (MẶT BÀN <-> KHAY ĐĨA <-> TRONG Ổ)
         ===================================================================== */}
      {currentStep >= 5 && (
        <group ref={cdDiscGroupRef}>
          <PressableControl
            label={
              cdLocation === 'INSIDE'
                ? '[CLICK] CD-ROM 650MB (IN DRIVE)'
                : cdLocation === 'TRAY'
                  ? '[CLICK] CD-ROM (EJECT TO DESK)'
                  : '[CLICK] CD-ROM 650MB: PROJECTS_98.EXE (LOAD INTO DRIVE)'
            }
            onPress={
              cdLocation === 'INSIDE'
                ? handleCdTrayEjectClick
                : cdLocation === 'TRAY'
                  ? handleCdClickOnTray
                  : handleCdClickOnDesk
            }
            disabled={cdLocation === 'INSIDE' && !isCdTrayOpen}
            travel={0.003}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.28, 0.28, 0.005, 40]} />
              <meshStandardMaterial
                color="#dfe6ec"
                roughness={0.18}
                metalness={0.85}
              />
            </mesh>
            {/* Mặt in nhãn hướng lên trên (-Z_case = +Y_world) */}
            <mesh position={[0, 0, -0.003]} rotation={[Math.PI, 0, Math.PI / 2]}>
              <circleGeometry args={[0.278, 40]} />
              <meshStandardMaterial
                map={cdDiscTex}
                roughness={0.22}
                metalness={0.78}
                side={THREE.DoubleSide}
              />
            </mesh>
          </PressableControl>
        </group>
      )}
    </group>
  );
}
