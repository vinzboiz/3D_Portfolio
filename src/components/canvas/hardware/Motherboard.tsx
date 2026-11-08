import { forwardRef, useMemo, useEffect } from 'react';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

export const SOCKET7_LOCAL_POS: [number, number, number] = [0.48, 0.045, -0.82];
export const DIMM1_LOCAL_POS: [number, number, number] = [-0.18, 0.055, -0.78];
export const DIMM2_LOCAL_POS: [number, number, number] = [-0.35, 0.055, -0.78];

/**
 * 1. Texture mặt mạch PCB ASUS TX97-E (220x280mm Baby-AT):
 * Đường mạch đồng mờ, chữ in lụa trắng "ASUS TX97-E REV 1.02", 4 lỗ ốc đồng viền vàng ở góc
 */
function createAsusPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1300;
  const ctx = canvas.getContext('2d')!;

  // Nền phủ Solder Mask xanh lá cổ điển (#1a472a)
  ctx.fillStyle = '#1a472a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Vẽ hệ thống đường mạch đồng chìm (Copper Bus Traces)
  ctx.strokeStyle = 'rgba(46, 118, 70, 0.75)';
  ctx.lineWidth = 2;

  // Bus dọc nối từ khu vực RAM/Socket 7 xuống khe PCI/ISA
  for (let x = 110; x <= 910; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 90);
    ctx.lineTo(x, 540);
    ctx.lineTo(x + (x % 28 === 0 ? 18 : -18), 580);
    ctx.lineTo(x + (x % 28 === 0 ? 18 : -18), 1210);
    ctx.stroke();
  }

  // Bus ngang nối khu vực khe cắm PCI và ISA
  ctx.strokeStyle = 'rgba(54, 132, 80, 0.65)';
  for (let y = 580; y <= 1220; y += 12) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(680, y);
    ctx.stroke();
  }

  // Các điểm via hàn mạ thiếc/vàng nhỏ trên mặt mạch
  ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
  for (let y = 120; y < 1200; y += 64) {
    for (let x = 100; x < 924; x += 64) {
      ctx.beginPath();
      ctx.arc(x + ((y * 7) % 24), y + ((x * 5) % 24), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Khung viền lụa trắng (Silkscreen Perimeter)
  ctx.strokeStyle = 'rgba(240, 240, 232, 0.78)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Chữ in lụa trắng (Silkscreen Labels)
  ctx.fillStyle = '#f2efe6';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.fillText('ASUS TX97-E', 64, 625);
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.fillText('REV 1.02 // BABY-AT SYSTEM BOARD', 64, 654);

  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('DIMM1  DIMM2 (3.3V SDRAM)', 260, 120);
  ctx.fillText('SIMM1-4 (72-PIN EDO)', 70, 120);
  ctx.fillText('PGA SOCKET 7', 640, 120);
  ctx.fillText('PCI1', 70, 695);
  ctx.fillText('PCI2', 70, 775);
  ctx.fillText('PCI3', 70, 855);
  ctx.fillText('PCI4', 70, 935);
  ctx.fillText('ISA1 (16-BIT)', 70, 1025);
  ctx.fillText('ISA2 (16-BIT)', 70, 1115);
  ctx.fillText('ISA3 (16-BIT)', 70, 1205);
  ctx.fillText('P8/P9 AT PWR', 835, 195);
  ctx.fillText('PRI_IDE1', 855, 505);
  ctx.fillText('SEC_IDE2', 855, 685);
  ctx.fillText('FLOPPY', 865, 855);
  ctx.fillText('PANEL_HDR', 835, 1165);

  // 4 Lỗ ốc đồng viền vàng lớn ở 4 góc + 2 lỗ ốc giữa mép
  const mountingHoles: [number, number][] = [
    [52, 52],
    [canvas.width - 52, 52],
    [52, canvas.height - 52],
    [canvas.width - 52, canvas.height - 52],
    [52, Math.round(canvas.height / 2)],
    [canvas.width - 52, Math.round(canvas.height / 2)],
  ];

  for (const [hx, hy] of mountingHoles) {
    // Vòng đồng mạ vàng
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(hx, hy, 24, 0, Math.PI * 2);
    ctx.fill();

    // Chấm hàn xung quanh vòng ốc
    ctx.strokeStyle = '#fff3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(hx, hy, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lỗ xuyên tâm
    ctx.fillStyle = '#0e110f';
    ctx.beginPath();
    ctx.arc(hx, hy, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. Texture mặt trên Đế Socket 7 (ZIF Socket):
 * Nền trắng ngà (#e6e2d8), lưới 321 lỗ chân kim (19x19 trừ khoảng trống vuông ở giữa) và chữ in chìm "SOCKET 7"
 */
function createSocket7Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 548;
  const ctx = canvas.getContext('2d')!;

  // Nền nhựa ZIF trắng ngà
  ctx.fillStyle = '#e6e2d8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Phần gờ trên in chìm chữ SOCKET 7
  ctx.fillStyle = '#dad4c6';
  ctx.fillRect(16, 14, canvas.width - 32, 62);
  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 14, canvas.width - 32, 62);

  ctx.fillStyle = '#5c564c';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOCKET 7', canvas.width / 2, 56);

  // Lưới 19x19 lỗ cắm kim (chừa khoảng trống 9x9 ở giữa = 361 - 40 = 321 lỗ chuẩn Socket 7)
  const gridStartX = 48;
  const gridStartY = 104;
  const step = 23;

  for (let row = 0; row < 19; row++) {
    for (let col = 0; col < 19; col++) {
      // Khoảng trống vuông ở giữa lòng Socket
      if (row >= 6 && row <= 12 && col >= 6 && col <= 12) continue;
      // Vát góc Pin 1 (góc trên trái)
      if (row === 0 && col === 0) continue;

      const px = gridStartX + col * step;
      const py = gridStartY + row * step;

      // Hốc vát nhựa của từng lỗ chân kim
      ctx.fillStyle = '#aba393';
      ctx.fillRect(px - 6, py - 6, 12, 12);

      // Lỗ tối bên trong
      ctx.fillStyle = '#26231f';
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Khoảng lõm vuông ở chính giữa Socket
  ctx.fillStyle = '#c8c1b2';
  ctx.fillRect(178, 234, 156, 156);
  ctx.strokeStyle = '#9e9686';
  ctx.lineWidth = 3;
  ctx.strokeRect(178, 234, 156, 156);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. Texture in chữ lên lưng cặp Chipset Intel 430TX PCIset (Northbridge & Southbridge)
 */
function createChipsetTexture(model: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 236);

  // Chấm tròn định vị góc Pin 1
  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.arc(34, 222, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d8d2c5';
  ctx.font = 'italic bold 36px "JetBrains Mono", monospace';
  ctx.fillText('intel®', 28, 74);

  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillStyle = '#b8b0a0';
  ctx.fillText('PCIset', 28, 112);

  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(model, 28, 156);

  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#9ea3a8';
  ctx.fillText(sub, 28, 190);
  ctx.fillText("© '96 INTEL", 28, 220);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4. Texture Tem bạc phản quang cho chip Award BIOS
 */
function createAwardBiosTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 128);
  grad.addColorStop(0, '#d8dee3');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(1, '#9ea8b0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#0000aa';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 116);

  ctx.fillStyle = '#0000aa';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AWARD™', 128, 44);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.fillText('PNP BIOS 1997', 128, 76);
  ctx.font = '16px "IBM Plex Mono", monospace';
  ctx.fillText('S/N: 0894215', 128, 104);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 5. Texture Đỉnh nhôm khía chữ K của Tụ điện hóa học (K-Vent Capacitor Top)
 */
function createCapacitorTopTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#c8cfd4';
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = '#3a3f42';
  ctx.lineWidth = 5;
  ctx.beginPath();
  // Đường khía chữ K đặc trưng trên đỉnh tụ hóa
  ctx.moveTo(36, 20);
  ctx.lineTo(36, 108);
  ctx.moveTo(92, 24);
  ctx.lineTo(40, 64);
  ctx.lineTo(92, 104);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Danh sách 18 tụ điện hóa học rải quanh Socket 7, VRM, RAM và khe PCI/ISA
const ELECTROLYTIC_CAP_POSITIONS: [number, number, number][] = [
  // Cụm lọc nguồn VRM sát Socket 7 (6 tụ)
  [0.92, 0.085, -1.18],
  [0.92, 0.085, -1.02],
  [0.92, 0.085, -0.86],
  [0.92, 0.085, -0.7],
  [0.92, 0.085, -0.54],
  [0.1, 0.085, -1.22],
  // Quanh khe RAM DIMM/SIMM (4 tụ)
  [-0.02, 0.085, -1.24],
  [-0.25, 0.085, -1.24],
  [-0.48, 0.085, -1.24],
  [-0.02, 0.085, -0.26],
  // Quanh Chipset 430TX & Khe PCI/ISA (8 tụ)
  [0.58, 0.085, -0.18],
  [0.58, 0.085, 0.04],
  [-0.92, 0.085, 0.02],
  [-0.92, 0.085, 0.36],
  [-0.92, 0.085, 0.72],
  [-0.92, 0.085, 1.08],
  [0.52, 0.085, 0.72],
  [0.52, 0.085, 1.12],
];

export interface MotherboardProps {
  position?: [number, number, number];
  /** Góc xoay cần gạt Socket 7 (radian: 0 = đóng khóa ngang, Math.PI/2 = dựng đứng 90 độ) */
  leverRef?: React.RefObject<THREE.Group>;
  /** Chốt trắng đầu trên khe DIMM 1 */
  dimm1LatchNorthRef?: React.RefObject<THREE.Group>;
  /** Chốt trắng đầu dưới khe DIMM 1 */
  dimm1LatchSouthRef?: React.RefObject<THREE.Group>;
}

export const Motherboard = forwardRef<THREE.Group, MotherboardProps>(
  function Motherboard(
    { position = [0, 0, 0], leverRef, dimm1LatchNorthRef, dimm1LatchSouthRef },
    ref
  ) {
    const pcbTexture = useMemo(() => createAsusPcbTexture(), []);
    const socket7Texture = useMemo(() => createSocket7Texture(), []);
    const northbridgeTex = useMemo(
      () => createChipsetTexture('FW82439TX', 'L7354192 SL28P'),
      []
    );
    const southbridgeTex = useMemo(
      () => createChipsetTexture('FW82371AB', 'F7381140 PIIX4'),
      []
    );
    const awardBiosTex = useMemo(() => createAwardBiosTexture(), []);
    const capTopTex = useMemo(() => createCapacitorTopTexture(), []);

    useEffect(() => {
      return () => {
        pcbTexture.dispose();
        socket7Texture.dispose();
        northbridgeTex.dispose();
        southbridgeTex.dispose();
        awardBiosTex.dispose();
        capTopTex.dispose();
      };
    }, [
      pcbTexture,
      socket7Texture,
      northbridgeTex,
      southbridgeTex,
      awardBiosTex,
      capTopTex,
    ]);

    return (
      <group ref={ref} position={position}>
        {/* =====================================================================
            1. BẢN MẠCH PCB BABY-AT (2.2 x 0.04 x 2.8 UNITS = 220x280MM)
           ===================================================================== */}
        <RoundedBox
          args={[2.2, 0.04, 2.8]}
          radius={0.008}
          smoothness={2}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={pcbTexture}
            roughness={0.45}
            metalness={0.15}
          />
        </RoundedBox>

        {/* =====================================================================
            2. ĐẾ SOCKET 7 (ZIF SOCKET) + CẦN GẠT CƠ HỌC (SOCKET LEVER)
           ===================================================================== */}
        <group position={SOCKET7_LOCAL_POS}>
          {/* Thân nhựa trắng ngà của Socket 7 */}
          <RoundedBox
            args={[0.58, 0.05, 0.62]}
            radius={0.008}
            smoothness={1}
            castShadow
            receiveShadow
            material={retroMaterials.whiteSlot}
          />

          {/* Mặt trên in lưới 321 lỗ chân kim + chữ SOCKET 7 */}
          <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.56, 0.6]} />
            <meshStandardMaterial
              map={socket7Texture}
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>

          {/* 2 Ngàm nhựa hai bên hông Socket 7 để gài thanh gông thép tản nhiệt */}
          <mesh position={[-0.305, 0.0, 0.02]} material={retroMaterials.whiteSlot}>
            <boxGeometry args={[0.04, 0.025, 0.09]} />
          </mesh>
          <mesh position={[0.305, 0.0, 0.02]} material={retroMaterials.whiteSlot}>
            <boxGeometry args={[0.04, 0.025, 0.09]} />
          </mesh>

          {/* Cần gạt cơ học chữ L (SocketLever): Đặt đúng pivot ở bản lề sau của Socket */}
          <group ref={leverRef} position={[0.315, 0.005, -0.27]}>
            {/* Trục cam bản lề vào lòng Socket */}
            <mesh
              position={[-0.04, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.08, 10]} />
            </mesh>
            {/* Thanh kim loại dọc hông Socket */}
            <mesh
              position={[0, 0, 0.28]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.011, 0.011, 0.56, 10]} />
            </mesh>
            {/* Đầu bẻ ngang chữ L + núm nhựa cầm tay */}
            <mesh
              position={[0.035, 0, 0.56]}
              rotation={[0, 0, Math.PI / 2]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.011, 0.011, 0.07, 10]} />
            </mesh>
            <RoundedBox
              args={[0.055, 0.028, 0.065]}
              radius={0.006}
              smoothness={1}
              position={[0.055, 0, 0.56]}
              material={retroMaterials.beigePlastic}
            />
          </group>
        </group>

        {/* =====================================================================
            3. KHE CẮM RAM: 2 KHE DIMM 168-PIN (CÓ CHỐT LẬT TRẮNG) & 4 KHE SIMM 72-PIN
           ===================================================================== */}
        {/* 2 Khe DIMM 168-pin màu đen */}
        {[DIMM1_LOCAL_POS, DIMM2_LOCAL_POS].map((pos, idx) => {
          const isDimm1 = idx === 0;
          return (
            <group key={`dimm-slot-${idx}`} position={pos}>
              {/* Thân khe cắm nhựa đen */}
              <RoundedBox
                args={[0.085, 0.07, 0.94]}
                radius={0.005}
                smoothness={1}
                castShadow
                receiveShadow
                material={retroMaterials.isaBlack}
              />
              {/* Rãnh cắm sâu màu tối ở giữa */}
              <mesh position={[0, 0.036, 0]}>
                <boxGeometry args={[0.03, 0.004, 0.88]} />
                <meshBasicMaterial color="#050505" />
              </mesh>
              {/* 2 vấu chia rãnh (Notch Keys) chuẩn 168-pin 3.3V SDRAM */}
              <mesh position={[0, 0.036, -0.12]} material={retroMaterials.isaBlack}>
                <boxGeometry args={[0.034, 0.006, 0.025]} />
              </mesh>
              <mesh position={[0, 0.036, 0.22]} material={retroMaterials.isaBlack}>
                <boxGeometry args={[0.034, 0.006, 0.025]} />
              </mesh>

              {/* Chốt lật trắng đầu Bắc (North Latch, z = -0.49) */}
              <group
                ref={isDimm1 ? dimm1LatchNorthRef : undefined}
                position={[0, -0.01, -0.48]}
              >
                <RoundedBox
                  args={[0.07, 0.095, 0.045]}
                  radius={0.005}
                  smoothness={1}
                  position={[0, 0.048, -0.01]}
                  castShadow
                  material={retroMaterials.whiteSlot}
                />
                {/* Tai gạt nhô ra ngoài */}
                <mesh position={[0, 0.09, -0.032]} material={retroMaterials.whiteSlot}>
                  <boxGeometry args={[0.065, 0.022, 0.045]} />
                </mesh>
              </group>

              {/* Chốt lật trắng đầu Nam (South Latch, z = +0.49) */}
              <group
                ref={isDimm1 ? dimm1LatchSouthRef : undefined}
                position={[0, -0.01, 0.48]}
              >
                <RoundedBox
                  args={[0.07, 0.095, 0.045]}
                  radius={0.005}
                  smoothness={1}
                  position={[0, 0.048, 0.01]}
                  castShadow
                  material={retroMaterials.whiteSlot}
                />
                <mesh position={[0, 0.09, 0.032]} material={retroMaterials.whiteSlot}>
                  <boxGeometry args={[0.065, 0.022, 0.045]} />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* 4 Khe SIMM 72-pin màu trắng ngà nằm song song bên trái */}
        {[-0.54, -0.66, -0.78, -0.9].map((xPos, idx) => (
          <group key={`simm-slot-${idx}`} position={[xPos, 0.048, -0.78]}>
            <RoundedBox
              args={[0.065, 0.055, 0.76]}
              radius={0.005}
              smoothness={1}
              castShadow
              receiveShadow
              material={retroMaterials.whiteSlot}
            />
            <mesh position={[0, 0.028, 0]}>
              <boxGeometry args={[0.022, 0.004, 0.7]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
            {/* Lẫy thép khóa 2 đầu khe SIMM */}
            <mesh position={[0, 0.025, -0.39]} material={retroMaterials.galvanizedSteel}>
              <boxGeometry args={[0.05, 0.045, 0.02]} />
            </mesh>
            <mesh position={[0, 0.025, 0.39]} material={retroMaterials.galvanizedSteel}>
              <boxGeometry args={[0.05, 0.045, 0.02]} />
            </mesh>
          </group>
        ))}

        {/* =====================================================================
            4. KHE CẮM MỞ RỘNG: 4 KHE PCI TRẮNG NGÀ & 3 KHE ISA 16-BIT ĐEN DÀI
           ===================================================================== */}
        {/* 4 Khe PCI 32-bit */}
        {[0.08, 0.25, 0.42, 0.59].map((zPos, idx) => (
          <group key={`pci-slot-${idx}`} position={[-0.32, 0.052, zPos]}>
            <RoundedBox
              args={[0.98, 0.065, 0.085]}
              radius={0.005}
              smoothness={1}
              castShadow
              receiveShadow
              material={retroMaterials.whiteSlot}
            />
            {/* Rãnh cắm giữa + Vách ngăn 32-bit */}
            <mesh position={[-0.08, 0.033, 0]}>
              <boxGeometry args={[0.68, 0.004, 0.028]} />
              <meshBasicMaterial color="#141413" />
            </mesh>
            <mesh position={[0.35, 0.033, 0]}>
              <boxGeometry args={[0.14, 0.004, 0.028]} />
              <meshBasicMaterial color="#141413" />
            </mesh>
          </group>
        ))}

        {/* 3 Khe ISA 16-bit màu đen (dài hơn PCI, chia 2 khoang 8-bit + 16-bit) */}
        {[0.82, 1.01, 1.2].map((zPos, idx) => (
          <group key={`isa-slot-${idx}`} position={[-0.12, 0.058, zPos]}>
            <RoundedBox
              args={[1.42, 0.075, 0.095]}
              radius={0.005}
              smoothness={1}
              castShadow
              receiveShadow
              material={retroMaterials.isaBlack}
            />
            {/* Khoang 8-bit dài */}
            <mesh position={[-0.22, 0.038, 0]} material={retroMaterials.goldPin}>
              <boxGeometry args={[0.86, 0.004, 0.03]} />
            </mesh>
            {/* Khoang mở rộng 16-bit */}
            <mesh position={[0.44, 0.038, 0]} material={retroMaterials.goldPin}>
              <boxGeometry args={[0.4, 0.004, 0.03]} />
            </mesh>
            {/* Vách ngăn nhựa giữa 2 khoang ISA */}
            <mesh position={[0.22, 0.039, 0]} material={retroMaterials.isaBlack}>
              <boxGeometry args={[0.04, 0.006, 0.08]} />
            </mesh>
          </group>
        ))}

        {/* =====================================================================
            5. CHIPSET INTEL 430TX (CẦU BẮC & CẦU NAM), AWARD BIOS & PIN CR2032
           ===================================================================== */}
        {/* Chip Cầu Bắc Intel FW82439TX */}
        <group position={[0.2, 0.038, -0.14]}>
          <RoundedBox
            args={[0.32, 0.035, 0.32]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh position={[0, 0.0185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshStandardMaterial map={northbridgeTex} roughness={0.4} metalness={0.2} />
          </mesh>
          {/* Viền chân kim QFP xung quanh 4 cạnh chip */}
          <mesh position={[0, -0.006, 0]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.35, 0.012, 0.35]} />
          </mesh>
        </group>

        {/* Chip Cầu Nam Intel FW82371AB (PIIX4) */}
        <group position={[0.36, 0.036, 0.32]}>
          <RoundedBox
            args={[0.27, 0.032, 0.27]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 0.25]} />
            <meshStandardMaterial map={southbridgeTex} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.006, 0]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.3, 0.01, 0.3]} />
          </mesh>
        </group>

        {/* Chip Award BIOS dán tem bạc phản quang */}
        <group position={[0.74, 0.045, 0.56]}>
          <RoundedBox
            args={[0.16, 0.05, 0.32]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.isaBlack}
          />
          <mesh position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.28, 0.13]} />
            <meshStandardMaterial
              map={awardBiosTex}
              roughness={0.22}
              metalness={0.75}
            />
          </mesh>
        </group>

        {/* Đế pin tròn & Viên pin CMOS CR2032 màu bạc sáng */}
        <group position={[0.76, 0.04, 0.94]}>
          <mesh position={[0, 0.01, 0]} castShadow material={retroMaterials.isaBlack}>
            <cylinderGeometry args={[0.13, 0.13, 0.03, 24]} />
          </mesh>
          <mesh position={[0, 0.028, 0]} castShadow material={retroMaterials.galvanizedSteel}>
            <cylinderGeometry args={[0.105, 0.105, 0.022, 24]} />
          </mesh>
          {/* Chốt kẹp cực dương pin */}
          <mesh position={[0.08, 0.04, 0]} material={retroMaterials.goldPin}>
            <boxGeometry args={[0.06, 0.01, 0.04]} />
          </mesh>
        </group>

        {/* =====================================================================
            6. CỔNG BÀN PHÍM DIN-5, CỔNG NGUỒN AT P8/P9, 2 CỔNG IDE, FLOPPY & HEADERS
           ===================================================================== */}
        {/* Cổng bàn phím DIN-5 hình trụ kim loại tròn to ở mép lưng (-X) bo mạch */}
        <group position={[-1.0, 0.095, -1.12]}>
          <RoundedBox
            args={[0.2, 0.15, 0.2]}
            radius={0.01}
            smoothness={1}
            castShadow
            material={retroMaterials.galvanizedSteel}
          />
          <mesh
            position={[-0.13, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            material={retroMaterials.galvanizedSteel}
          >
            <cylinderGeometry args={[0.072, 0.072, 0.1, 20]} />
          </mesh>
          <mesh
            position={[-0.182, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.isaBlack}
          >
            <cylinderGeometry args={[0.055, 0.055, 0.01, 16]} />
          </mesh>
        </group>

        {/* Cổng cắm nguồn AT P8/P9 (Khung trắng + 12 chân kim mạ vàng) */}
        <group position={[0.94, 0.055, -0.82]}>
          <RoundedBox
            args={[0.11, 0.075, 0.48]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.whiteSlot}
          />
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh
              key={`at-pin-${i}`}
              position={[0, 0.045, -0.205 + i * 0.037]}
              material={retroMaterials.goldPin}
            >
              <boxGeometry args={[0.014, 0.03, 0.014]} />
            </mesh>
          ))}
        </group>

        {/* 2 Cổng IDE 40-pin (Khung nhựa Xanh dương Primary & Đen Secondary) */}
        {[
          { z: -0.22, color: '#0f4c81' },
          { z: 0.18, color: '#1a1a1a' },
        ].map((ide, idx) => (
          <group key={`ide-port-${idx}`} position={[0.92, 0.055, ide.z]}>
            <RoundedBox args={[0.12, 0.075, 0.34]} radius={0.005} smoothness={1} castShadow>
              <meshStandardMaterial color={ide.color} roughness={0.5} metalness={0.1} />
            </RoundedBox>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.075, 0.04, 0.3]} />
              <meshBasicMaterial color="#0b0b0b" />
            </mesh>
          </group>
        ))}

        {/* 1 Cổng Floppy 34-pin */}
        <group position={[0.92, 0.055, 0.54]}>
          <RoundedBox
            args={[0.11, 0.07, 0.28]}
            radius={0.005}
            smoothness={1}
            castShadow
            material={retroMaterials.isaBlack}
          />
        </group>

        {/* Hàng chân cắm Front Panel Headers (TURBO LED, HDD LED, PWR, SPEAKER) */}
        <group position={[0.9, 0.04, 1.16]}>
          <mesh position={[0, -0.005, 0]} material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.08, 0.02, 0.28]} />
          </mesh>
          {Array.from({ length: 16 }).map((_, i) => {
            const row = i % 2;
            const col = Math.floor(i / 2);
            return (
              <mesh
                key={`fp-pin-${i}`}
                position={[-0.015 + row * 0.03, 0.022, -0.11 + col * 0.032]}
                material={retroMaterials.goldPin}
              >
                <cylinderGeometry args={[0.005, 0.005, 0.035, 6]} />
              </mesh>
            );
          })}
        </group>

        {/* =====================================================================
            7. DÀN 18 TỤ HÓA HÌNH TRỤ (INSTANCEDMESH - 1 DRAW CALL)
               Vỏ xanh đen + Đỉnh nhôm khía chữ K
           ===================================================================== */}
        <Instances limit={ELECTROLYTIC_CAP_POSITIONS.length} castShadow receiveShadow>
          <cylinderGeometry args={[0.036, 0.036, 0.13, 14]} />
          <meshStandardMaterial color="#10202b" roughness={0.35} metalness={0.2} />
          {ELECTROLYTIC_CAP_POSITIONS.map((pos, idx) => (
            <Instance key={`cap-sleeve-${idx}`} position={pos} />
          ))}
        </Instances>

        <Instances limit={ELECTROLYTIC_CAP_POSITIONS.length}>
          <cylinderGeometry args={[0.032, 0.032, 0.006, 14]} />
          <meshStandardMaterial
            map={capTopTex}
            roughness={0.28}
            metalness={0.85}
          />
          {ELECTROLYTIC_CAP_POSITIONS.map(([x, y, z], idx) => (
            <Instance key={`cap-kvent-${idx}`} position={[x, y + 0.066, z]} />
          ))}
        </Instances>
      </group>
    );
  }
);
