import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

/**
 * Procedural Canvas Texture cho màn hình Máy Hiện Sóng (Oscilloscope CRT):
 * - Lưới chia tọa độ milimet màu xanh lá đậm
 * - Dạng sóng sin / xung vector màu xanh phosphor phát sáng rực rỡ (#22c55e)
 */
function createOscilloscopeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Nền kính CRT oscilloscope tối màu xanh đen
  ctx.fillStyle = '#06130b';
  ctx.fillRect(0, 0, 512, 512);

  // Lưới tọa độ graticule dạng vạch chia
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.18)';
  ctx.lineWidth = 1;
  const step = 512 / 8;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Trục tâm đậm hơn
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Tia sóng phosphor màu xanh lá phát sáng rực rỡ
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 14;
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let x = 0; x < 512; x++) {
    const rad = (x / 512) * Math.PI * 8;
    const y = 256 + Math.sin(rad) * 95 + Math.sin(rad * 3) * 22;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Thông số tín hiệu góc trên: CH1 1.0V/DIV · 10ms
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('CH1 1.0V/DIV · 10ms', 24, 38);
  ctx.fillText('TRIG: AUTO · 233MHz', 24, 488);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Canvas Texture cho màn hình CRT phụ màu Hổ phách (Amber Matrix Terminal):
 */
function createAmberTerminalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#120a02';
  ctx.fillRect(0, 0, 512, 384);

  // Dòng chữ BIOS / Terminal hổ phách phát sáng
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';

  const lines = [
    'AWARD MODULAR BIOS v4.51PG',
    'INTEL 430TX PCISET BUS INITIALIZING...',
    'CPU: INTEL PENTIUM MMX 233MHz',
    'MEMORY TEST: 32768K OK',
    'PRIMARY MASTER: WDC AC22100H',
    'SECONDARY MASTER: CR-583 CD-ROM',
    'SYSTEM HARDWARE VALIDATED: 1997',
    'READY FOR LAB EXPERIMENTATION_',
  ];

  lines.forEach((line, idx) => {
    ctx.fillText(line, 24, 44 + idx * 36);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Canvas Texture cho Poster Sơ đồ Kỹ thuật trên tường:
 */
function createSchematicPosterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Nền giấy kỹ thuật blueprint xanh thẫm
  ctx.fillStyle = '#0b192c';
  ctx.fillRect(0, 0, 768, 1024);

  // Khung viền bản vẽ kỹ thuật
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 728, 984);
  ctx.strokeRect(26, 26, 716, 972);

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('INTEL ARCHITECTURE LAB 1997', 384, 80);
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText('SOCKET 7 MOTHERBOARD & PCI BUS SCHEMATIC', 384, 115);

  // Sơ đồ khối các chip
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;

  // CPU Block
  ctx.strokeRect(284, 180, 200, 140);
  ctx.fillText('PENTIUM MMX', 384, 245);
  ctx.fillText('PGA SOCKET 7', 384, 275);

  // Northbridge Block
  ctx.strokeRect(284, 400, 200, 130);
  ctx.fillText('82439TX', 384, 460);
  ctx.fillText('NORTHBRIDGE', 384, 490);

  // Southbridge Block
  ctx.strokeRect(284, 610, 200, 130);
  ctx.fillText('82371AB PIIX4', 384, 670);
  ctx.fillText('SOUTHBRIDGE', 384, 700);

  // PCI Slot Blocks
  ctx.strokeRect(80, 480, 140, 70);
  ctx.fillText('PCI BUS #1', 150, 522);
  ctx.strokeRect(80, 590, 140, 70);
  ctx.fillText('PCI BUS #2', 150, 632);

  // Đường dây bus nối giữa các khối
  ctx.beginPath();
  ctx.moveTo(384, 320);
  ctx.lineTo(384, 400);
  ctx.moveTo(384, 530);
  ctx.lineTo(384, 610);
  ctx.moveTo(284, 480);
  ctx.lineTo(220, 515);
  ctx.moveTo(284, 500);
  ctx.lineTo(220, 625);
  ctx.stroke();

  // Bảng thông số góc dưới
  ctx.textAlign = 'left';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText('SPEC: ATX / BABY AT FORM FACTOR', 60, 890);
  ctx.fillText('VOLTAGE: DUAL POWER PLANE (2.8V / 3.3V)', 60, 920);
  ctx.fillText('SYS CLOCK: 66MHz FSB · MULTIPLIER 3.5X', 60, 950);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Procedural Canvas Texture cho Hộp Linh kiện 3dfx Voodoo & Sound Blaster:
 */
function createBoxArtTexture(title: string, sub: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111116';
  ctx.fillRect(0, 0, 512, 512);

  // Dải màu gradient đặc trưng retro box
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#090a0f');
  ctx.fillStyle = grad;
  ctx.fillRect(16, 16, 480, 480);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 46px "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 180);

  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillStyle = '#fde047';
  ctx.fillText(sub, 256, 235);

  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('1997 HIGH-PERFORMANCE HARDWARE', 256, 360);
  ctx.fillText('PCI BUS EXPANSION CARD', 256, 390);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 1. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (WOODEN ENGINEER CHAIR)
 * - Đặt phía trước bàn làm việc: ban đầu tại Step 00 (Home) ở [-0.6, -1.2, 3.2], xoay 0.45 rad
 * - Khi portalProgress tăng từ 0 -> 1: Chiếc ghế trượt lùi sang trái/sau [-3.8, -1.2, 5.0] xoay 1.25 rad
 *   để nhường vị trí trung tâm cho góc nhìn First-Person của người dùng!
 */
function WoodenEngineerChair() {
  const chairRef = useRef<THREE.Group>(null);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);

  const { oakMat, darkSteelMat, chromeMat, casterMat } = useMemo(() => {
    const oak = new THREE.MeshStandardMaterial({
      color: '#6e472b',
      roughness: 0.65,
      metalness: 0.05,
    });
    const darkSteel = new THREE.MeshStandardMaterial({
      color: '#222225',
      roughness: 0.35,
      metalness: 0.85,
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: '#c8d0d8',
      roughness: 0.15,
      metalness: 0.95,
    });
    const caster = new THREE.MeshStandardMaterial({
      color: '#141414',
      roughness: 0.8,
      metalness: 0.1,
    });
    return { oakMat: oak, darkSteelMat: darkSteel, chromeMat: chrome, casterMat: caster };
  }, []);

  useEffect(() => {
    return () => {
      oakMat.dispose();
      darkSteelMat.dispose();
      chromeMat.dispose();
      casterMat.dispose();
    };
  }, [oakMat, darkSteelMat, chromeMat, casterMat]);

  useFrame(() => {
    if (!chairRef.current) return;
    const p = THREE.MathUtils.clamp(homeTransitionProgress, 0, 1);

    // Diễn hoạt trượt lùi sang bên trái nhường chỗ cho người ngồi:
    const targetX = THREE.MathUtils.lerp(-0.6, -3.8, p);
    const targetY = -1.2;
    const targetZ = THREE.MathUtils.lerp(3.2, 5.0, p);
    const targetRotY = THREE.MathUtils.lerp(0.45, 1.25, p);

    chairRef.current.position.set(targetX, targetY, targetZ);
    chairRef.current.rotation.y = targetRotY;
  });

  return (
    <group ref={chairRef} position={[-0.6, -1.2, 3.2]} rotation={[0, 0.45, 0]}>
      {/* A. 5-Star Base (Chân đế sao 5 cánh & Bánh xe nylon chạm sàn) */}
      <group position={[0, -0.38, 0]}>
        {/* Khối hub trung tâm */}
        <mesh material={darkSteelMat} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.08, 16]} />
        </mesh>

        {/* 5 nhánh chân đế sao xòe ra các góc */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * 2 * Math.PI) / 5;
          const legLen = 0.42;
          const lx = Math.sin(angle) * (legLen / 2);
          const lz = Math.cos(angle) * (legLen / 2);
          const wx = Math.sin(angle) * legLen;
          const wz = Math.cos(angle) * legLen;

          return (
            <group key={`chair-leg-${i}`}>
              {/* Nhánh chân thép góc nghiêng nhẹ */}
              <mesh
                position={[lx, 0.02, lz]}
                rotation={[0, angle, 0.08]}
                material={darkSteelMat}
                castShadow
              >
                <boxGeometry args={[0.05, 0.038, legLen]} />
              </mesh>

              {/* Bánh xe đôi nylon chạm sàn */}
              <group position={[wx, -0.03, wz]} rotation={[0, angle, 0]}>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[0.02, 0, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
                </mesh>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[-0.02, 0, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
                </mesh>
                {/* Trục khớp bánh xe */}
                <mesh material={chromeMat} position={[0, 0.028, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* B. Trụ nâng hạ thủy lực & Cần gạt cơ khí */}
      <mesh material={darkSteelMat} position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.038, 0.048, 0.44, 16]} />
      </mesh>
      {/* Ống thụt crôm trên */}
      <mesh material={chromeMat} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.22, 16]} />
      </mesh>
      {/* Cần gạt nâng hạ hơi */}
      <mesh material={darkSteelMat} position={[0.18, 0.16, 0.06]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.007, 0.007, 0.24, 8]} />
      </mesh>
      <mesh material={casterMat} position={[0.3, 0.18, 0.06]}>
        <boxGeometry args={[0.05, 0.022, 0.04]} />
      </mesh>

      {/* C. Mặt đệm ngồi bằng Gỗ sồi ấm (Oak Wood Seat Slab) có bo cong */}
      <group position={[0, 0.22, 0]}>
        {/* Khung đỡ kim loại dưới mặt ghế */}
        <mesh material={darkSteelMat} position={[0, -0.04, 0]}>
          <boxGeometry args={[0.54, 0.025, 0.52]} />
        </mesh>

        {/* Mặt ngồi bằng gỗ sồi bo viền công thái học */}
        <RoundedBox
          args={[0.82, 0.08, 0.76]}
          radius={0.03}
          smoothness={3}
          castShadow
          receiveShadow
          material={oakMat}
        />
      </group>

      {/* D. Tựa lưng Gỗ sồi cong công thái học (Curved Oak Backrest) */}
      <group position={[0, 0.68, -0.36]} rotation={[0.08, 0, 0]}>
        {/* 2 Khung thép hộp chữ nhật uốn cong đỡ lưng từ dưới ghế lên */}
        <mesh material={darkSteelMat} position={[-0.18, -0.22, 0.06]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[0.032, 0.44, 0.02]} />
        </mesh>
        <mesh material={darkSteelMat} position={[0.18, -0.22, 0.06]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[0.032, 0.44, 0.02]} />
        </mesh>

        {/* Khớp bản lề điều chỉnh độ ngả lưng crôm */}
        <mesh material={chromeMat} position={[0, -0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.42, 12]} />
        </mesh>

        {/* Bản tựa lưng gỗ sồi ấm bo cong các mép */}
        <RoundedBox
          args={[0.76, 0.38, 0.075]}
          radius={0.03}
          smoothness={3}
          castShadow
          material={oakMat}
        />
      </group>

      {/* E. Hai bên tay vịn Gỗ & Khung thép (Armrests) */}
      {[-0.44, 0.44].map((sideX, idx) => (
        <group key={`chair-arm-${idx}`} position={[sideX, 0.36, 0]}>
          {/* Trụ thép chữ L đỡ tay vịn */}
          <mesh material={darkSteelMat} position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.28, 12]} />
          </mesh>
          {/* Tấm đệm tay gỗ sồi bóng mờ */}
          <RoundedBox
            args={[0.1, 0.032, 0.44]}
            radius={0.014}
            smoothness={2}
            position={[0, 0.08, 0.02]}
            castShadow
            material={oakMat}
          />
        </group>
      ))}
    </group>
  );
}

/**
 * 2. CĂN PHÒNG RETRO LAB & HỆ THỐNG KỆ SẮT ĐA TẦNG (RETRO LAB ENVIRONMENT)
 */
export function RetroLabEnvironment() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  // YÊU CẦU #3 (TỐI ƯU HIỆU NĂNG / STATE CULLING):
  // Hiển thị đầy đủ căn phòng và kệ máy xung quanh khi:
  // - Đang ở Step 00 (Home)
  // - Đang trong quá trình cuộn zoom vào/ra (portalProgress < 0.999)
  // - Hoặc đang có diễn hoạt chuyển cảnh (stageTransition !== 'IDLE')
  // Khi người dùng đã ngồi hẳn vào bàn làm việc (currentStep >= 1, portalProgress = 1.0 và IDLE),
  // tự động ẩn kệ máy và các chi tiết ngoài tầm nhìn để tối ưu FPS cho mặt bàn 3D!
  const isTransitioning = stageTransition !== 'IDLE';
  const shouldShowLab =
    currentStep === 0 || homeTransitionProgress < 0.999 || isTransitioning;

  // Tạo các Canvas Texture thủ công bằng code
  const oscScreenTex = useMemo(() => createOscilloscopeTexture(), []);
  const amberTerminalTex = useMemo(() => createAmberTerminalTexture(), []);
  const blueprintPosterTex = useMemo(() => createSchematicPosterTexture(), []);
  const voodooBoxTex = useMemo(
    () => createBoxArtTexture('3dfx VOODOO', '3D GRAPHICS ACCELERATOR', '#6b21a8'),
    []
  );
  const soundBoxTex = useMemo(
    () => createBoxArtTexture('SOUND BLASTER', '16-BIT STEREO AUDIO', '#0369a1'),
    []
  );

  useEffect(() => {
    return () => {
      oscScreenTex.dispose();
      amberTerminalTex.dispose();
      blueprintPosterTex.dispose();
      voodooBoxTex.dispose();
      soundBoxTex.dispose();
    };
  }, [oscScreenTex, amberTerminalTex, blueprintPosterTex, voodooBoxTex, soundBoxTex]);

  // Bộ vật liệu PBR chuẩn xưởng phần cứng cổ điển
  const {
    floorMat,
    wallMat,
    shelfSteelMat,
    caseBeigeMat,
    caseSteelMat,
    darkChassisMat,
    crtGlassMat,
    oscFaceMat,
  } = useMemo(() => {
    return {
      floorMat: new THREE.MeshStandardMaterial({
        color: '#111318',
        roughness: 0.85,
        metalness: 0.12,
      }),
      wallMat: new THREE.MeshStandardMaterial({
        color: '#12141a',
        roughness: 0.92,
        metalness: 0.05,
      }),
      shelfSteelMat: new THREE.MeshStandardMaterial({
        color: '#1e2229',
        roughness: 0.42,
        metalness: 0.82,
      }),
      caseBeigeMat: new THREE.MeshStandardMaterial({
        color: '#d6d0c4',
        roughness: 0.65,
        metalness: 0.06,
      }),
      caseSteelMat: new THREE.MeshStandardMaterial({
        color: '#8c9298',
        roughness: 0.35,
        metalness: 0.85,
      }),
      darkChassisMat: new THREE.MeshStandardMaterial({
        color: '#242a35',
        roughness: 0.5,
        metalness: 0.4,
      }),
      crtGlassMat: new THREE.MeshStandardMaterial({
        color: '#1a1f26',
        roughness: 0.25,
        metalness: 0.1,
      }),
      oscFaceMat: new THREE.MeshStandardMaterial({
        color: '#2b3340',
        roughness: 0.45,
        metalness: 0.5,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      floorMat.dispose();
      wallMat.dispose();
      shelfSteelMat.dispose();
      caseBeigeMat.dispose();
      caseSteelMat.dispose();
      darkChassisMat.dispose();
      crtGlassMat.dispose();
      oscFaceMat.dispose();
    };
  }, [
    floorMat,
    wallMat,
    shelfSteelMat,
    caseBeigeMat,
    caseSteelMat,
    darkChassisMat,
    crtGlassMat,
    oscFaceMat,
  ]);

  return (
    <group>
      {/* =======================================================================
          A. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (Đặt trước bàn, tự động lùi sang trái khi vào phòng)
         ======================================================================= */}
      <WoodenEngineerChair />

      {/* =======================================================================
          B. CĂN PHÒNG & HỆ THỐNG KỆ SẮT XUNG QUANH (Áp dụng Frustum / State Culling)
         ======================================================================= */}
      {shouldShowLab && (
        <group>
          {/* 1. SÀN PHÒNG XƯỞNG TỐI MÀU (WORKSHOP CONCRETE FLOOR AT Y = -1.62) */}
          <mesh
            position={[0, -1.62, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            material={floorMat}
          >
            <planeGeometry args={[38, 38]} />
          </mesh>

          {/* 2. TƯỜNG SAU & TƯỜNG TRÁI (ROOM SHELL WALLS) */}
          {/* Tường sau (Back Wall at Z = -9.5) */}
          <mesh position={[0, 4.8, -9.5]} receiveShadow material={wallMat}>
            <planeGeometry args={[38, 14]} />
          </mesh>
          {/* Tường trái (Left Wall at X = -13.5) */}
          <mesh
            position={[-13.5, 4.8, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
            material={wallMat}
          >
            <planeGeometry args={[38, 14]} />
          </mesh>

          {/* 3. POSTER BẢN VẼ SƠ ĐỒ KỸ THUẬT DÁN TRÊN TƯỜNG SAU (BLUEPRINT SCHEMATIC POSTER) */}
          <mesh position={[-2.4, 4.2, -9.42]}>
            <planeGeometry args={[2.8, 3.8]} />
            <meshStandardMaterial
              map={blueprintPosterTex}
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>

          {/* Đường ống kim loại (Industrial Conduits) chạy dọc tường sau */}
          <mesh position={[0, 6.2, -9.38]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 28, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 3.2, -9.38]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 28, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* ===================================================================
              4. KỆ SẮT ĐA TẦNG PHÍA TRÁI (LEFT INDUSTRIAL SHELVING RACK AT X = -7.6)
             =================================================================== */}
          <group position={[-7.6, 0, -0.5]}>
            {/* 4 Trụ thép chữ V sơn tĩnh điện */}
            {[-1.8, 1.8].map((dx, ix) =>
              [-3.2, 3.2].map((dz, iz) => (
                <mesh
                  key={`shelf-post-l-${ix}-${iz}`}
                  position={[dx * 0.45, 1.2, dz * 0.45]}
                  material={shelfSteelMat}
                  castShadow
                >
                  <boxGeometry args={[0.06, 5.6, 0.06]} />
                </mesh>
              ))
            )}

            {/* 4 Tầng kệ thép dập tấm */}
            {[-0.9, 0.5, 1.9, 3.3].map((sy, sIdx) => (
              <group key={`shelf-slab-l-${sIdx}`} position={[0, sy, 0]}>
                <mesh material={shelfSteelMat} receiveShadow castShadow>
                  <boxGeometry args={[1.7, 0.05, 3.1]} />
                </mesh>
              </group>
            ))}

            {/* Vài thanh giằng chéo X-Bracing */}
            <mesh position={[0.82, 1.2, 0]} rotation={[0, 0, 0.6]} material={shelfSteelMat}>
              <cylinderGeometry args={[0.012, 0.012, 3.8, 8]} />
            </mesh>
            <mesh position={[0.82, 1.2, 0]} rotation={[0, 0, -0.6]} material={shelfSteelMat}>
              <cylinderGeometry args={[0.012, 0.012, 3.8, 8]} />
            </mesh>

            {/* --- CÁC THIẾT BỊ PHẦN CỨNG ĐẶT TRÊN KỆ TRÁI --- */}
            {/* Tầng 1 (sy = 0.5): Thùng máy IBM AT Desktop nằm ngang */}
            <group position={[0.05, 0.72, -0.8]} rotation={[0, 0.15, 0]}>
              <RoundedBox
                args={[0.88, 0.36, 0.88]}
                radius={0.02}
                material={caseBeigeMat}
                castShadow
              />
              {/* Mặt nạ trước & 2 Khe ổ đĩa 5.25-inch */}
              <mesh position={[0, 0, 0.445]} material={darkChassisMat}>
                <boxGeometry args={[0.82, 0.3, 0.02]} />
              </mesh>
              <mesh position={[0.22, 0.06, 0.455]}>
                <boxGeometry args={[0.34, 0.08, 0.01]} />
                <meshStandardMaterial color="#2d2b27" roughness={0.7} />
              </mesh>
              <mesh position={[0.22, -0.06, 0.455]}>
                <boxGeometry args={[0.34, 0.08, 0.01]} />
                <meshStandardMaterial color="#2d2b27" roughness={0.7} />
              </mesh>
              {/* Nút nguồn gạt đỏ lớn IBM */}
              <mesh position={[-0.32, -0.04, 0.458]}>
                <boxGeometry args={[0.05, 0.08, 0.02]} />
                <meshStandardMaterial color="#dc2626" roughness={0.4} />
              </mesh>
            </group>

            {/* Tầng 1: Hộp card âm thanh Sound Blaster 16 đặt đứng cạnh thùng máy */}
            <mesh position={[0.05, 0.84, 0.65]} rotation={[0, -0.22, 0]} castShadow>
              <boxGeometry args={[0.18, 0.58, 0.46]} />
              <meshStandardMaterial map={soundBoxTex} roughness={0.5} />
            </mesh>

            {/* Tầng 2 (sy = 1.9): Máy hiện sóng (Oscilloscope CRT) đang phát sóng xanh rực rỡ */}
            <group position={[0.02, 2.22, -0.5]} rotation={[0, 0.28, 0]}>
              {/* Vỏ máy đo oscilloscope màu xám kim loại công nghiệp */}
              <RoundedBox
                args={[0.85, 0.54, 0.95]}
                radius={0.025}
                material={oscFaceMat}
                castShadow
              />
              {/* Màn hình tròn/vuông hiển thị tia sóng Oscilloscope */}
              <mesh position={[-0.16, 0.05, 0.485]}>
                <planeGeometry args={[0.42, 0.36]} />
                <meshStandardMaterial
                  map={oscScreenTex}
                  emissive="#22c55e"
                  emissiveIntensity={1.4}
                  roughness={0.2}
                />
              </mesh>
              {/* Cụm núm vặn & jack BNC bên phải màn hình */}
              {[
                [-0.06, 0.2],
                [0.08, 0.2],
                [-0.06, 0.32],
                [0.08, 0.32],
              ].map(([py, px], k) => (
                <mesh
                  key={`osc-knob-${k}`}
                  position={[px, py, 0.495]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.034, 0.038, 0.035, 12]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
                </mesh>
              ))}
              {/* Điểm đèn LED báo nguồn xanh rực rỡ */}
              <mesh position={[0.34, 0.2, 0.488]}>
                <sphereGeometry args={[0.015, 8, 8]} />
                <meshBasicMaterial color="#34d399" />
              </mesh>
              <pointLight
                position={[-0.16, 0.05, 0.65]}
                intensity={1.2}
                distance={3.5}
                decay={2}
                color="#22c55e"
              />
            </group>

            {/* Tầng 2: Chồng màn hình CRT 14-inch phụ để nghiêng cạnh oscilloscope */}
            <group position={[0.06, 2.24, 0.72]} rotation={[0, -0.32, 0]}>
              <RoundedBox
                args={[0.62, 0.54, 0.64]}
                radius={0.03}
                material={caseBeigeMat}
                castShadow
              />
              <mesh position={[0, 0.02, 0.325]}>
                <planeGeometry args={[0.48, 0.4]} />
                <meshStandardMaterial color="#0e1318" roughness={0.2} metalness={0.1} />
              </mesh>
            </group>

            {/* Tầng 3 (sy = 3.3): Vỏ máy Full-Tower AT đang mở nắp lộ nội thất bên trong */}
            <group position={[0.02, 3.82, 0]} rotation={[0, 0.1, 0]}>
              <RoundedBox
                args={[0.44, 0.95, 0.88]}
                radius={0.02}
                material={caseBeigeMat}
                castShadow
              />
              {/* Lòng trong lộ khung thép mạ kẽm */}
              <mesh position={[0.225, 0, 0]} material={caseSteelMat}>
                <boxGeometry args={[0.02, 0.88, 0.82]} />
              </mesh>
            </group>
          </group>

          {/* ===================================================================
              5. KỆ SẮT ĐA TẦNG PHÍA SAU BÀN (REAR INDUSTRIAL SHELVING RACK AT Z = -6.2)
             =================================================================== */}
          <group position={[0.5, 0, -6.2]}>
            {/* Trụ thép kệ sau */}
            {[-3.6, 3.6].map((dx, ix) =>
              [-0.8, 0.8].map((dz, iz) => (
                <mesh
                  key={`shelf-post-r-${ix}-${iz}`}
                  position={[dx * 0.48, 1.2, dz * 0.48]}
                  material={shelfSteelMat}
                  castShadow
                >
                  <boxGeometry args={[0.06, 5.6, 0.06]} />
                </mesh>
              ))
            )}

            {/* Các tầng kệ thép dài */}
            {[-0.9, 0.5, 1.9, 3.3].map((sy, sIdx) => (
              <group key={`shelf-slab-r-${sIdx}`} position={[0, sy, 0]}>
                <mesh material={shelfSteelMat} receiveShadow castShadow>
                  <boxGeometry args={[3.8, 0.05, 1.1]} />
                </mesh>
              </group>
            ))}

            {/* --- CÁC THIẾT BỊ PHẦN CỨNG ĐẶT TRÊN KỆ SAU --- */}
            {/* Tầng 1: Màn hình CRT Amber Terminal đang chạy chữ màu cam hổ phách */}
            <group position={[-1.0, 0.82, 0]} rotation={[0, 0.18, 0]}>
              <RoundedBox
                args={[0.68, 0.56, 0.68]}
                radius={0.03}
                material={caseBeigeMat}
                castShadow
              />
              {/* Màn hình hiển thị amber BIOS code */}
              <mesh position={[0, 0.02, 0.345]}>
                <planeGeometry args={[0.54, 0.42]} />
                <meshStandardMaterial
                  map={amberTerminalTex}
                  emissive="#f59e0b"
                  emissiveIntensity={1.2}
                  roughness={0.25}
                />
              </mesh>
              <pointLight
                position={[0, 0.02, 0.55]}
                intensity={0.9}
                distance={3.2}
                decay={2}
                color="#f59e0b"
              />
            </group>

            {/* Tầng 1: Hộp đồ họa 3dfx Voodoo Graphics dựng đứng trên kệ */}
            <mesh position={[0.2, 0.84, 0]} rotation={[0, -0.1, 0]} castShadow>
              <boxGeometry args={[0.48, 0.56, 0.16]} />
              <meshStandardMaterial map={voodooBoxTex} roughness={0.5} />
            </mesh>

            {/* Tầng 2: Hai thùng máy PC AT đặt cạnh nhau */}
            <group position={[-0.8, 2.22, 0]}>
              <RoundedBox
                args={[0.82, 0.34, 0.82]}
                radius={0.02}
                material={caseBeigeMat}
                castShadow
              />
            </group>
            <group position={[0.8, 2.22, 0]}>
              <RoundedBox
                args={[0.82, 0.34, 0.82]}
                radius={0.02}
                material={caseBeigeMat}
                castShadow
              />
            </group>

            {/* Tầng 3: Các chồng sách kỹ thuật / Hardware Manuals & Cuộn dây */}
            <group position={[0.9, 3.52, 0]}>
              {[0, 0.08, 0.16].map((by, bIdx) => (
                <mesh key={`manual-book-${bIdx}`} position={[0, by, 0]}>
                  <boxGeometry args={[0.52, 0.065, 0.38]} />
                  <meshStandardMaterial
                    color={bIdx === 0 ? '#1e3a8a' : bIdx === 1 ? '#991b1b' : '#14532d'}
                    roughness={0.7}
                  />
                </mesh>
              ))}
            </group>
          </group>

          {/* 6. CUỘN DÂY CÁP TRÊN SÀN (CABLE SPOOL ON THE FLOOR) */}
          <group position={[-5.8, -1.5, 2.4]} rotation={[0, 0.5, 0]}>
            <mesh material={shelfSteelMat}>
              <cylinderGeometry args={[0.35, 0.35, 0.22, 16]} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.02, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.02, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
