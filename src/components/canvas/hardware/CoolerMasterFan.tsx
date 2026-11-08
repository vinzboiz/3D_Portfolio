import { forwardRef, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { useBuildStore } from '../../../store/useBuildStore';

/**
 * Tạo CanvasTexture cho tem tròn ở tâm quạt Cooler Master 40mm
 */
function createFanHubStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Nền bạc ánh kim
  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#e6e2d8';
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  // Vòng tròn viền xanh/vàng cổ điển
  ctx.strokeStyle = '#0000aa';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#0000aa';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('COOLER', 128, 96);
  ctx.fillText('MASTER', 128, 124);

  ctx.fillStyle = '#b82525';
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.fillText('BALL BEARING', 128, 156);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 17px "IBM Plex Mono", monospace';
  ctx.fillText('DC 12V 0.11A', 128, 184);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const CoolerMasterFan = forwardRef<THREE.Group>(function CoolerMasterFan(_, ref) {
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);

  const rotorRef = useRef<THREE.Group | null>(null);
  const hubStickerTex = useMemo(() => createFanHubStickerTexture(), []);

  useEffect(() => {
    return () => {
      hubStickerTex.dispose();
    };
  }, [hubStickerTex]);

  // 14 lá nhôm tản nhiệt (xẻ rãnh dọc, chừa rãnh giữa cho thanh gông thép) dùng InstancedMesh
  const finPositions = useMemo(() => {
    const coords: [number, number, number][] = [];
    const numFins = 14;
    const span = 0.46;
    const step = span / (numFins - 1);

    for (let i = 0; i < numFins; i++) {
      const x = -span / 2 + i * step;
      // Mỗi lá nhôm chia làm 2 nửa trước/sau để chừa khe giữa cho thanh gông thép
      coords.push([x, 0.068, -0.135]);
      coords.push([x, 0.068, 0.135]);
    }
    return coords;
  }, []);

  // Cánh quạt nghiêng quay tít khi isPoweredOn === true, và nhanh gấp đôi khi isTurbo === true
  useFrame((_, delta) => {
    if (!rotorRef.current || !isPoweredOn) return;
    const baseSpeed = 14.0; // rad/s ở 66MHz
    const speed = isTurbo ? baseSpeed * 2.0 : baseSpeed; // Gấp đôi tốc độ khi bật TURBO 233MHz
    rotorRef.current.rotation.y -= delta * speed;
  });

  const numBlades = 7;

  return (
    <group ref={ref}>
      {/* =====================================================================
          1. KHỐI ĐẾ & LÁ NHÔM TẢN NHIỆT ĐEN (BLACK ANODIZED HEATSINK)
         ===================================================================== */}
      {/* Đế nhôm dày tiếp xúc lưng CPU */}
      <RoundedBox
        args={[0.5, 0.028, 0.5]}
        radius={0.004}
        smoothness={1}
        position={[0, 0.014, 0]}
        castShadow
        receiveShadow
        material={retroMaterials.blackAnodized}
      />

      {/* 28 lá nhôm xẻ rãnh dọc gộp trong 1 Draw Call bằng <Instances> */}
      <Instances limit={finPositions.length} castShadow receiveShadow material={retroMaterials.blackAnodized}>
        <boxGeometry args={[0.014, 0.085, 0.21]} />
        {finPositions.map((pos, idx) => (
          <Instance key={`sink-fin-${idx}`} position={pos} />
        ))}
      </Instances>

      {/* =====================================================================
          2. THANH GÔNG THÉP ĐÀN HỒI (MOUNTING CLIP) XUYÊN QUA GIỮA HEATSINK
         ===================================================================== */}
      <group position={[0, 0.042, 0]}>
        {/* Thanh thép ngang nằm trong rãnh giữa Heatsink */}
        <mesh castShadow material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.58, 0.014, 0.036]} />
        </mesh>
        {/* Chân móc trái bẻ xuống ngàm Socket 7 */}
        <mesh position={[-0.295, -0.048, 0]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.014, 0.095, 0.036]} />
        </mesh>
        <mesh position={[-0.285, -0.09, 0]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.028, 0.014, 0.036]} />
        </mesh>
        {/* Chân móc phải + tai gạt tháo lắp */}
        <mesh position={[0.295, -0.048, 0]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.014, 0.095, 0.036]} />
        </mesh>
        <mesh position={[0.312, -0.01, 0]} rotation={[0, 0, -0.4]} material={retroMaterials.galvanizedSteel}>
          <boxGeometry args={[0.04, 0.012, 0.036]} />
        </mesh>
      </group>

      {/* =====================================================================
          3. QUẠT LÀM MÁT 40MM (COOLER MASTER 40MM FAN) GẮN TRÊN ĐỈNH HEATSINK
         ===================================================================== */}
      <group position={[0, 0.145, 0]}>
        {/* Khung vỏ quạt vuông 4 góc bằng nhựa đen */}
        {/* 4 cạnh bao quanh lồng quạt */}
        <RoundedBox
          args={[0.48, 0.068, 0.045]}
          radius={0.005}
          smoothness={1}
          position={[0, 0, -0.218]}
          castShadow
          material={retroMaterials.isaBlack}
        />
        <RoundedBox
          args={[0.48, 0.068, 0.045]}
          radius={0.005}
          smoothness={1}
          position={[0, 0, 0.218]}
          castShadow
          material={retroMaterials.isaBlack}
        />
        <RoundedBox
          args={[0.045, 0.068, 0.39]}
          radius={0.005}
          smoothness={1}
          position={[-0.218, 0, 0]}
          castShadow
          material={retroMaterials.isaBlack}
        />
        <RoundedBox
          args={[0.045, 0.068, 0.39]}
          radius={0.005}
          smoothness={1}
          position={[0.218, 0, 0]}
          castShadow
          material={retroMaterials.isaBlack}
        />

        {/* Vòng tròn bảo vệ hốc gió trong khung quạt */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={retroMaterials.isaBlack}>
          <torusGeometry args={[0.205, 0.016, 10, 28]} />
        </mesh>

        {/* 4 Đầu ốc thép bắt ở 4 góc quạt xuống lá nhôm */}
        {[
          [-0.2, 0.035, -0.2],
          [0.2, 0.035, -0.2],
          [-0.2, 0.035, 0.2],
          [0.2, 0.035, 0.2],
        ].map((screwPos, idx) => (
          <mesh
            key={`fan-screw-${idx}`}
            position={screwPos as [number, number, number]}
            material={retroMaterials.galvanizedSteel}
          >
            <cylinderGeometry args={[0.018, 0.018, 0.008, 10]} />
          </mesh>
        ))}

        {/* Cụm Trục & 7 Cánh Quạt Quay (Rotor) */}
        <group ref={rotorRef}>
          {/* Bầu trục tròn ở tâm quạt */}
          <mesh castShadow material={retroMaterials.isaBlack}>
            <cylinderGeometry args={[0.088, 0.088, 0.056, 24]} />
          </mesh>

          {/* Tem tròn Cooler Master / Ball Bearing dán trên mặt trục */}
          <mesh position={[0, 0.029, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.08, 24]} />
            <meshStandardMaterial map={hubStickerTex} roughness={0.35} metalness={0.2} />
          </mesh>

          {/* 7 Cánh quạt xoay nghiêng góc 32 độ */}
          {Array.from({ length: numBlades }).map((_, i) => {
            const angle = (i / numBlades) * Math.PI * 2;
            return (
              <group key={`blade-${i}`} rotation={[0, angle, 0]}>
                <mesh
                  position={[0.132, 0, 0]}
                  rotation={[0.58, 0, 0]}
                  castShadow
                  material={retroMaterials.blackAnodized}
                >
                  <boxGeometry args={[0.115, 0.008, 0.055]} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
});

