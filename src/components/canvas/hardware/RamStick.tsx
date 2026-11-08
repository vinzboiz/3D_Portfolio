import { forwardRef, useMemo, useEffect } from 'react';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

/**
 * Tạo CanvasTexture cho tem thông số nhỏ dán trên thanh RAM: "PC100 32MB SDRAM"
 */
function createRamStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f5f2e8';
  ctx.fillRect(0, 0, 256, 96);

  ctx.strokeStyle = '#0000aa';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 88);

  ctx.fillStyle = '#0000aa';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText('PC100 32MB SDRAM', 14, 38);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 17px "IBM Plex Mono", monospace';
  ctx.fillText('168-PIN 3.3V // CL2', 14, 64);

  // Barcode nhỏ
  for (let x = 14; x < 238; x += 6) {
    ctx.fillRect(x, 72, x % 12 === 0 ? 3 : 1.5, 12);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const RamStick = forwardRef<THREE.Group>(function RamStick(_, ref) {
  const stickerTex = useMemo(() => createRamStickerTexture(), []);

  useEffect(() => {
    return () => {
      stickerTex.dispose();
    };
  }, [stickerTex]);

  // Bản mạch RAM định hướng dọc theo trục Z (chiều dài 0.88, chiều cao 0.22, dày 0.018)
  // có 2 vết khuyết (notches) ở cạnh dưới khớp với khe DIMM 168-pin
  const pcbGeometry = useMemo(() => {
    const L = 0.88;
    const H = 0.22;
    const halfL = L / 2;

    const shape = new THREE.Shape();
    // Bắt đầu từ góc dưới trái, đi dọc cạnh đáy và khoét 2 rãnh khuyết (notches) tại -0.12 và +0.22
    shape.moveTo(-halfL, 0);
    shape.lineTo(-0.145, 0);
    shape.lineTo(-0.145, 0.032);
    shape.lineTo(-0.095, 0.032);
    shape.lineTo(-0.095, 0);

    shape.lineTo(0.195, 0);
    shape.lineTo(0.195, 0.032);
    shape.lineTo(0.245, 0.032);
    shape.lineTo(0.245, 0);

    shape.lineTo(halfL, 0);
    // Cạnh bên phải (có hốc khuyết cho chốt trắng)
    shape.lineTo(halfL, 0.11);
    shape.lineTo(halfL - 0.022, 0.11);
    shape.lineTo(halfL - 0.022, 0.15);
    shape.lineTo(halfL, 0.15);
    shape.lineTo(halfL, H);

    // Cạnh đỉnh thanh RAM
    shape.lineTo(-halfL, H);

    // Cạnh bên trái (có hốc khuyết cho chốt trắng)
    shape.lineTo(-halfL, 0.15);
    shape.lineTo(-halfL + 0.022, 0.15);
    shape.lineTo(-halfL + 0.022, 0.11);
    shape.lineTo(-halfL, 0.11);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 1,
    });
    // Xoay để chiều dài thanh RAM chạy dọc theo trục Z (khớp với khe DIMM trên Motherboard)
    geo.translate(0, 0, -0.009);
    geo.rotateY(Math.PI / 2);
    return geo;
  }, []);

  // 8 con chip nhớ đen đính dọc 2 mặt thanh RAM (= 16 chip trong 1 Draw Call)
  const chipCoords = useMemo(() => {
    const coords: [number, number, number][] = [];
    const zPositions = [-0.36, -0.26, -0.16, -0.06, 0.06, 0.16, 0.26, 0.36];
    for (const z of zPositions) {
      coords.push([0.012, 0.125, z]); // Mặt phải (+X)
      coords.push([-0.012, 0.125, z]); // Mặt trái (-X)
    }
    return coords;
  }, []);

  // Hàng chân cắm mạ vàng (Gold Edge Fingers) ở mép dưới thanh RAM (chừa 2 vết khuyết)
  const goldPinCoords = useMemo(() => {
    const coords: [number, number, number][] = [];
    for (let z = -0.41; z <= 0.41; z += 0.024) {
      if (Math.abs(z - -0.12) < 0.032) continue;
      if (Math.abs(z - 0.22) < 0.032) continue;
      coords.push([0, 0.015, z]);
    }
    return coords;
  }, []);

  return (
    <group ref={ref}>
      {/* 1. BẢN MẠCH XANH LÁ (PCB BLADE VỚI 2 RÃNH KHUYẾT) */}
      <mesh
        geometry={pcbGeometry}
        castShadow
        receiveShadow
        material={retroMaterials.pcbGreen}
      />

      {/* 2. DẢI CHÂN TIẾP XÚC MẠ VÀNG DƯỚI ĐÁY (INSTANCED GOLD FINGERS) */}
      <Instances limit={goldPinCoords.length} material={retroMaterials.goldPin}>
        <boxGeometry args={[0.023, 0.028, 0.014]} />
        {goldPinCoords.map((pos, idx) => (
          <Instance key={`ram-gold-${idx}`} position={pos} />
        ))}
      </Instances>

      {/* 3. 16 CHIP NHỚ SDRAM MÀU ĐEN ĐÍNH 2 MẶT (1 DRAW CALL INSTANCEDMESH) */}
      <Instances limit={chipCoords.length} castShadow material={retroMaterials.blackAnodized}>
        <boxGeometry args={[0.01, 0.11, 0.068]} />
        {chipCoords.map((pos, idx) => (
          <Instance key={`dram-ic-${idx}`} position={pos} />
        ))}
      </Instances>

      {/* 4. TEM DÁN THÔNG SỐ "PC100 32MB SDRAM" */}
      <mesh position={[0.0185, 0.13, -0.21]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.22, 0.078]} />
        <meshStandardMaterial map={stickerTex} roughness={0.45} metalness={0.05} />
      </mesh>
    </group>
  );
});

