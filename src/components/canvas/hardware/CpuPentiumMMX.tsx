import { forwardRef, useMemo, useEffect } from 'react';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

/**
 * Tạo CanvasTexture sắc nét cho tấm Heat Spreader mạ niken trên lưng CPU Pentium MMX 233MHz
 */
function createPentiumHeatSpreaderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Nền kim loại mạ niken xước nhẹ
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#c4c9ce');
  grad.addColorStop(0.5, '#e2e6ea');
  grad.addColorStop(1, '#9fa6ad');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Viền khắc laser mảnh
  ctx.strokeStyle = '#3a3d40';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, 476, 476);

  // Chữ khắc laser đậm chuẩn Intel Pentium MMX 1997
  ctx.fillStyle = '#18191a';
  ctx.textAlign = 'left';
  ctx.font = 'italic bold 54px "JetBrains Mono", monospace';
  ctx.fillText('intel®', 48, 108);

  ctx.font = 'bold 46px "JetBrains Mono", monospace';
  ctx.fillText('pentium®', 48, 175);

  ctx.fillStyle = '#222426';
  ctx.font = 'bold 30px "IBM Plex Mono", monospace';
  ctx.fillText('w/ MMX™ tech', 48, 228);

  // Đường kẻ phân cách kỹ thuật
  ctx.strokeStyle = '#4a4e52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(48, 262);
  ctx.lineTo(464, 262);
  ctx.stroke();

  // Thông số xung nhịp & Mã serie
  ctx.fillStyle = '#111213';
  ctx.font = 'bold 38px "JetBrains Mono", monospace';
  ctx.fillText('233 MHz', 48, 320);

  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#333638';
  ctx.fillText('FV80503233 // SL27S', 48, 368);
  ctx.fillText('2.8V CORE / 3.3V I/O', 48, 405);
  ctx.fillText("© '92'97 INTEL MALAY", 48, 452);

  // Dấu chấm góc Pin 1 trên mặt Spreader
  ctx.fillStyle = '#18191a';
  ctx.beginPath();
  ctx.arc(444, 72, 14, 0, Math.PI * 2);
  ctx.fill();

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
      {/* 1. THÂN GỐM (CERAMIC PACKAGE): 0.495 x 0.028 x 0.495 UNITS */}
      <RoundedBox
        args={[0.495, 0.028, 0.495]}
        radius={0.004}
        smoothness={1}
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

      {/* Viền chỉ vàng mảnh quanh mép đế gốm */}
      <mesh position={[0, 0.0142, 0]} rotation={[-Math.PI / 2, 0, 0]} material={retroMaterials.goldPin}>
        <ringGeometry args={[0.23, 0.24, 4]} />
      </mesh>

      {/* 2. MẶT LƯNG KIM LOẠI MẠ NIKEN (HEAT SPREADER) Ở CHÍNH GIỮA MẶT TRÊN */}
      <RoundedBox
        args={[0.33, 0.008, 0.33]}
        radius={0.003}
        smoothness={1}
        position={[0, 0.017, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          map={spreaderTexture}
          roughness={0.25}
          metalness={0.85}
        />
      </RoundedBox>

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

