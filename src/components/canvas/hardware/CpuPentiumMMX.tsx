import { forwardRef, useMemo, useEffect } from 'react';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

/**
 * Tạo CanvasTexture độ phân giải cao 1024x1024 cho tấm Heat Spreader mạ vàng (Gold Top Plate)
 * của vi xử lý Intel Pentium MMX Tillamook 233MHz chuẩn 100% như ảnh thực tế:
 * - Nền kim loại vàng bóng phay xước nhẹ
 * - Logo intel® (chữ e hạ thấp kinh điển)
 * - pentium®
 * - MMX™ TECH
 * - Tillamook-233M S96 / 20000012 / Voltage=2.0V / INTEL Ⓜ © '97 '98
 * - Góc vát 45 độ Pin 1 ở góc dưới trái
 */
function createPentiumHeatSpreaderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Nền kim loại vàng hoàng gia mạ bóng phay xước nhẹ (Brushed Gold/Brass)
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, '#cca846');
  grad.addColorStop(0.2, '#f0d77d');
  grad.addColorStop(0.45, '#d9bd59');
  grad.addColorStop(0.65, '#f5e08c');
  grad.addColorStop(0.85, '#d0ae4a');
  grad.addColorStop(1, '#b89431');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Phay xước ngang siêu mảnh tạo bề mặt kim loại phay xước thực tế
  for (let i = 0; i < 450; i++) {
    const y = Math.random() * 1024;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.055)' : 'rgba(0, 0, 0, 0.045)';
    ctx.fillRect(0, y, 1024, 1 + Math.random() * 2);
  }

  // 2. Góc vát 45 độ Pin 1 ở góc dưới bên trái (khớp chuẩn với Ảnh 2)
  ctx.fillStyle = '#2b2321'; // Thân gốm ceramic màu sẫm lộ ra ở góc vát
  ctx.beginPath();
  ctx.moveTo(0, 930);
  ctx.lineTo(94, 1024);
  ctx.lineTo(0, 1024);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#856b23';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 930);
  ctx.lineTo(94, 1024);
  ctx.stroke();

  // 3. Viền khắc laser vàng sẫm quanh mép nắp tản nhiệt
  ctx.strokeStyle = '#9e7e26';
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, 996, 996);

  // 4. Chữ khắc laser đen sẫm chuẩn xác 100% theo Ảnh 2
  ctx.fillStyle = '#161513';
  ctx.textAlign = 'left';

  // Dòng 1: Logo "intel®" với chữ 'e' hạ thấp kinh điển của Intel thập niên 90
  const startX = 305;
  const intelY = 310;
  ctx.font = 'bold 106px Arial, "Helvetica Neue", sans-serif';
  ctx.fillText('int', startX, intelY);
  ctx.fillText('e', startX + 130, intelY + 12);
  ctx.fillText('l', startX + 195, intelY);
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText('®', startX + 232, intelY - 50);

  // Dòng 2: "pentium®"
  const pentiumY = intelY + 118;
  ctx.font = 'bold 112px Arial, "Helvetica Neue", sans-serif';
  ctx.fillText('pentium', startX - 60, pentiumY);
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText('®', startX + 372, pentiumY - 50);

  // Dòng 3: "MMX™ TECH"
  const mmxY = pentiumY + 104;
  ctx.font = '900 114px Arial, "Helvetica Neue", sans-serif';
  ctx.fillText('MMX', startX - 55, mmxY);
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.fillText('T', startX + 218, mmxY - 56);
  ctx.font = 'bold 54px Arial, "JetBrains Mono", sans-serif';
  ctx.fillText('TECH', startX + 258, mmxY);

  // Dòng 4 - 7: Khối thông số kỹ thuật chi tiết của vi xử lý Tillamook
  const specX = 265;
  let specY = mmxY + 155;
  ctx.font = 'bold 44px "JetBrains Mono", "IBM Plex Mono", monospace';
  ctx.fillStyle = '#1c1b18';
  ctx.fillText('Tillamook-233M S96', specX, specY);
  specY += 56;
  ctx.fillText('20000012', specX, specY);
  specY += 56;
  ctx.fillText('Voltage=2.0V', specX, specY);
  specY += 56;
  ctx.fillText("INTEL Ⓜ © '97 '98", specX, specY);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export const CpuPentiumMMX = forwardRef<THREE.Group>(function CpuPentiumMMX(_, ref) {
  const spreaderTexture = useMemo(() => createPentiumHeatSpreaderTexture(), []);

  useEffect(() => {
    return () => {
      spreaderTexture.dispose();
    };
  }, [spreaderTexture]);

  // Lưới chân kim PGA mạ vàng dưới đáy CPU (13x13 chừa khoảng trống 7x7 ở giữa = 120 chân đại diện trong 1 draw call)
  const pinCoords = useMemo(() => {
    const pts: [number, number, number][] = [];
    const grid = 13;
    const half = (grid - 1) / 2;
    const spacing = 0.034;

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const dx = c - half;
        const dz = r - half;
        if (Math.abs(dx) <= 2.5 && Math.abs(dz) <= 2.5) continue;
        pts.push([dx * spacing, -0.024, dz * spacing]);
      }
    }
    return pts;
  }, []);

  return (
    <group ref={ref}>
      {/* 1. THÂN GỐM CERAMIC PACKAGE (0.495 x 0.028 x 0.495 UNITS) */}
      <RoundedBox
        args={[0.495, 0.028, 0.495]}
        radius={0.004}
        smoothness={2}
        castShadow
        receiveShadow
        material={retroMaterials.ceramicCpu}
      />

      {/* Chấm & Vạch tam giác mạ vàng định vị Pin 1 ở góc trên trái (-X, -Z) */}
      <mesh
        position={[-0.205, 0.0145, -0.205]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={retroMaterials.goldPin}
      >
        <ringGeometry args={[0.008, 0.024, 16]} />
      </mesh>
      <mesh
        position={[-0.225, 0.0145, -0.225]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={retroMaterials.goldPin}
      >
        <circleGeometry args={[0.012, 3]} />
      </mesh>

      {/* 2. MẶT LƯNG KIM LOẠI VÀNG (GOLD HEAT SPREADER) TRỌN VẸN MẶT TRÊN NHƯ ẢNH 2 */}
      {/* Khối đế kim loại vàng mạ bóng có độ dày thực tế */}
      <RoundedBox
        args={[0.455, 0.009, 0.455]}
        radius={0.003}
        smoothness={2}
        position={[0, 0.0175, 0]}
        castShadow
        receiveShadow
        material={retroMaterials.goldPin}
      />

      {/* Mặt phẳng in laser kim loại vàng chuẩn planar UV (tuyệt đối không bị co giãn hay cắt xén chữ) */}
      <mesh position={[0, 0.0225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.45, 0.45]} />
        <meshStandardMaterial
          map={spreaderTexture}
          roughness={0.32}
          metalness={0.88}
        />
      </mesh>

      {/* 3. LƯỚI CHÂN KIM VÀNG DƯỚI ĐÁY (PGA GOLD PINS - 1 DRAW CALL INSTANCEDMESH) */}
      <Instances limit={pinCoords.length} material={retroMaterials.goldPin}>
        <cylinderGeometry args={[0.0045, 0.0045, 0.022, 6]} />
        {pinCoords.map((pos, idx) => (
          <Instance key={`cpu-pin-${idx}`} position={pos} />
        ))}
      </Instances>
    </group>
  );
});
