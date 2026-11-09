import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

// =============================================================================
// PROCEDURAL CANVAS TEXTURES FOR RETRO CRT SCREENS (100% CODE - NO EXTERNAL IMAGES)
// =============================================================================

/**
 * 1. Screen Matrix / DOS Green Phosphor Terminal Texture (#22c55e):
 */
function createGreenMatrixTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#040d07';
  ctx.fillRect(0, 0, 512, 384);

  // Mưa mã số ma trận xanh lá & Dòng lệnh DOS / C Kernel
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';

  const chars = '0123456789ABCDEF!@#$%&*+-=<>~/\\';
  for (let col = 0; col < 28; col++) {
    const x = 16 + col * 17;
    const len = 4 + Math.floor(Math.sin(col * 2.3) * 6 + 7);
    for (let row = 0; row < len; row++) {
      const y = 30 + row * 18;
      const char = chars[(col * 7 + row * 13) % chars.length];
      if (row === len - 1) {
        ctx.fillStyle = '#bbf7d0'; // Đầu tia sáng trắng xanh
      } else {
        ctx.fillStyle = row % 2 === 0 ? '#4ade80' : '#15803d';
      }
      ctx.fillText(char, x, y);
    }
  }

  // Dòng lệnh shell ở đáy
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('C:\\SYS\\SRC> make -j8 ARCH=i386_pentium', 20, 360);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. Screen Amber BIOS / Telemetry Terminal (#f59e0b):
 */
function createAmberTerminalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#120a02';
  ctx.fillRect(0, 0, 512, 384);

  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 7;
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 17px "JetBrains Mono", monospace';

  const lines = [
    'AWARD MODULAR BIOS v4.51PG',
    'CHIPSET: INTEL 430TX PCISET BUS',
    'CPU: PENTIUM MMX 233MHz (66x3.5)',
    'CACHE: 512KB PIPELINED BURST L2',
    'MEMORY: 64MB SDRAM 100MHz OK',
    'HARD DISK: WDC AC22100H 2.1GB',
    'CD-ROM: ATAPI CR-583 24X MAX',
    'STATUS: RETRO LAB SERVERS ONLINE',
  ];

  lines.forEach((line, idx) => {
    ctx.fillText(line, 24, 46 + idx * 36);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. Screen Blue Diagnostics / Windows NT Memory Manager (#2563eb / #38bdf8):
 */
function createBlueDiagnosticsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Nền xanh cobalt đậm cổ điển
  ctx.fillStyle = '#081a4a';
  ctx.fillRect(0, 0, 512, 384);

  // Thanh tiêu đề trắng
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(16, 16, 480, 36);
  ctx.fillStyle = '#081a4a';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText('HARDWARE SUBSYSTEM MONITOR 1997', 28, 41);

  // Bảng lưới dữ liệu kỹ thuật
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 64, 480, 240);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '15px "JetBrains Mono", monospace';
  ctx.fillText('IRQ 00: SYSTEM TIMER         [OK]', 32, 98);
  ctx.fillText('IRQ 01: KEYBOARD CONTROLLER  [OK]', 32, 126);
  ctx.fillText('IRQ 03: COM2 SERIAL PORT     [READY]', 32, 154);
  ctx.fillText('IRQ 09: 3DFX VOODOO 3D ACCEL [ACTIVE]', 32, 182);
  ctx.fillText('IRQ 10: SOUND BLASTER 16     [DSP 4.13]', 32, 210);
  ctx.fillText('DMA 01: 16-BIT AUDIO FIFO    [STREAM]', 32, 238);
  ctx.fillText('DMA 05: BUS MASTER IDE       [LBA MODE]', 32, 266);

  // Thanh tiến trình tải bộ nhớ ở đáy
  ctx.fillStyle = '#fde047';
  ctx.fillRect(32, 325, 340, 22);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(30, 323, 440, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText('SYS LOAD: 78%', 382, 341);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4. Screen SMPTE Retro 7-Color Test Pattern:
 */
function createTestPatternTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const colors = [
    '#c0c0c0', // 75% White
    '#c0c000', // Yellow
    '#00c0c0', // Cyan
    '#00c000', // Green
    '#c000c0', // Magenta
    '#c00000', // Red
    '#0000c0', // Blue
  ];

  const barW = 512 / 7;
  colors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * barW, 0, barW, 260);
  });

  // Dải dưới: Black, white, gradient
  ctx.fillStyle = '#0000c0';
  ctx.fillRect(0, 260, barW, 60);
  ctx.fillStyle = '#111111';
  ctx.fillRect(barW, 260, barW, 60);
  ctx.fillStyle = '#c000c0';
  ctx.fillRect(barW * 2, 260, barW, 60);
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(barW * 3, 260, barW * 4, 60);

  // Đáy: Đồng hồ kiểm chuẩn
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 320, 512, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NTSC/PAL CALIBRATION · 1997', 256, 358);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 5. Screen Oscilloscope Waveform (#10b981):
 */
function createOscilloscopeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05140b';
  ctx.fillRect(0, 0, 512, 384);

  // Lưới graticule
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y <= 384; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Dạng sóng sin đa tần
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let x = 0; x < 512; x++) {
    const rad = (x / 512) * Math.PI * 6;
    const y = 192 + Math.sin(rad) * 78 + Math.cos(rad * 2.5) * 28;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText('OSC CH1: 233.3 MHz · 2.0V P-P', 20, 36);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 6. Screen 3D Wireframe Graphics (#38bdf8):
 */
function createWireframe3DTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#040b17';
  ctx.fillRect(0, 0, 512, 384);

  // Vẽ hình khối lập phương 3D Isometric wireframe
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  const cx = 256;
  const cy = 192;
  const s = 85;

  // Khối Wireframe 1
  ctx.strokeRect(cx - s, cy - s, s * 2, s * 2);
  ctx.strokeRect(cx - s * 0.5, cy - s * 0.5, s, s);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s);
  ctx.lineTo(cx - s * 0.5, cy - s * 0.5);
  ctx.moveTo(cx + s, cy - s);
  ctx.lineTo(cx + s * 0.5, cy - s * 0.5);
  ctx.moveTo(cx - s, cy + s);
  ctx.lineTo(cx - s * 0.5, cy + s * 0.5);
  ctx.moveTo(cx + s, cy + s);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.5);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText('3D PIPELINE: HARDWARE RASTERIZER', 20, 34);
  ctx.fillText('POLYGONS: 18,420 · 60.0 FPS', 20, 362);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// =============================================================================
// 1. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (WOODEN ENGINEER CHAIR)
// =============================================================================
function WoodenEngineerChair() {
  const chairRef = useRef<THREE.Group>(null);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);

  const { oakMat, darkSteelMat, chromeMat, casterMat } = useMemo(() => {
    return {
      oakMat: new THREE.MeshStandardMaterial({
        color: '#6e472b',
        roughness: 0.65,
        metalness: 0.05,
      }),
      darkSteelMat: new THREE.MeshStandardMaterial({
        color: '#222225',
        roughness: 0.35,
        metalness: 0.85,
      }),
      chromeMat: new THREE.MeshStandardMaterial({
        color: '#c8d0d8',
        roughness: 0.15,
        metalness: 0.95,
      }),
      casterMat: new THREE.MeshStandardMaterial({
        color: '#141414',
        roughness: 0.8,
        metalness: 0.1,
      }),
    };
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

    // Khi người dùng tiến vào bàn làm việc (p: 0 -> 1):
    // Ghế trượt lùi sang bên trái nhường chỗ cho góc nhìn First-Person
    const targetX = THREE.MathUtils.lerp(-0.6, -3.8, p);
    const targetY = -1.2;
    const targetZ = THREE.MathUtils.lerp(3.2, 5.0, p);
    const targetRotY = THREE.MathUtils.lerp(0.45, 1.25, p);

    chairRef.current.position.set(targetX, targetY, targetZ);
    chairRef.current.rotation.y = targetRotY;
  });

  return (
    <group ref={chairRef} position={[-0.6, -1.2, 3.2]} rotation={[0, 0.45, 0]}>
      {/* A. Chân đế sao 5 cánh & Bánh xe */}
      <group position={[0, -0.38, 0]}>
        <mesh material={darkSteelMat} position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.08, 16]} />
        </mesh>

        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * 2 * Math.PI) / 5;
          const legLen = 0.42;
          const lx = Math.sin(angle) * (legLen / 2);
          const lz = Math.cos(angle) * (legLen / 2);
          const wx = Math.sin(angle) * legLen;
          const wz = Math.cos(angle) * legLen;

          return (
            <group key={`chair-leg-${i}`}>
              <mesh
                position={[lx, 0.02, lz]}
                rotation={[0, angle, 0.08]}
                material={darkSteelMat}
                castShadow
              >
                <boxGeometry args={[0.05, 0.038, legLen]} />
              </mesh>

              <group position={[wx, -0.03, wz]} rotation={[0, angle, 0]}>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[0.02, 0, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
                </mesh>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[-0.02, 0, 0]}>
                  <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
                </mesh>
                <mesh material={chromeMat} position={[0, 0.028, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* B. Trụ nâng hạ thủy lực */}
      <mesh material={darkSteelMat} position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.038, 0.048, 0.44, 16]} />
      </mesh>
      <mesh material={chromeMat} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.22, 16]} />
      </mesh>

      {/* C. Mặt đệm ngồi bằng Gỗ sồi ấm */}
      <group position={[0, 0.22, 0]}>
        <mesh material={darkSteelMat} position={[0, -0.04, 0]}>
          <boxGeometry args={[0.54, 0.025, 0.52]} />
        </mesh>
        <RoundedBox
          args={[0.82, 0.08, 0.76]}
          radius={0.03}
          smoothness={3}
          castShadow
          receiveShadow
          material={oakMat}
        />
      </group>

      {/* D. Tựa lưng Gỗ sồi cong */}
      <group position={[0, 0.68, -0.36]} rotation={[0.08, 0, 0]}>
        <mesh material={darkSteelMat} position={[-0.18, -0.22, 0.06]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[0.032, 0.44, 0.02]} />
        </mesh>
        <mesh material={darkSteelMat} position={[0.18, -0.22, 0.06]} rotation={[-0.14, 0, 0]}>
          <boxGeometry args={[0.032, 0.44, 0.02]} />
        </mesh>
        <mesh material={chromeMat} position={[0, -0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.42, 12]} />
        </mesh>
        <RoundedBox
          args={[0.76, 0.38, 0.075]}
          radius={0.03}
          smoothness={3}
          castShadow
          material={oakMat}
        />
      </group>

      {/* E. Hai bên tay vịn */}
      {[-0.44, 0.44].map((sideX, idx) => (
        <group key={`chair-arm-${idx}`} position={[sideX, 0.36, 0]}>
          <mesh material={darkSteelMat} position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.28, 12]} />
          </mesh>
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

// =============================================================================
// 2. BỨC TƯỜNG HÀNG TRĂM MÀN HÌNH MÁY TÍNH RETRO SAN SÁT NHAU (RETRO MONITOR WALL)
// =============================================================================
interface MonitorPlacement {
  pos: [number, number, number];
  rot: [number, number, number];
  screenType: 'green' | 'amber' | 'blue' | 'osc' | 'test' | 'wire' | 'off';
}

function RetroMonitorWall() {
  // Tạo mảng tọa độ bố trí màn hình dày đặc (Rear Wall + Left Wing + Right Wing)
  const monitorLayout = useMemo(() => {
    const list: MonitorPlacement[] = [];

    // --- A. BỨC TƯỜNG SAU (REAR MONITOR WALL AT Z = -6.8 TO -7.2) ---
    // 26 Cột ngang (X từ -9.2 đến +9.2, bước 0.74m) x 4 Tầng cao (Y = 0.55, 1.38, 2.22, 3.06)
    const rearCols = 26;
    const rearRows = 4;
    const rearYLevels = [0.55, 1.38, 2.22, 3.06];

    for (let r = 0; r < rearRows; r++) {
      const y = rearYLevels[r];
      for (let c = 0; c < rearCols; c++) {
        const x = -9.25 + c * 0.74;
        // Độ cong vòm nhẹ của bức tường để ôm lấy bàn kỹ thuật
        const z = -6.85 - Math.cos((c / rearCols) * Math.PI - Math.PI / 2) * 0.35;
        const rotY = ((c - rearCols / 2) / (rearCols / 2)) * -0.12;
        const rotX = (r - 1.5) * -0.025;

        // Phân bổ ngẫu nhiên có kiểm soát loại màn hình phát sáng
        const seed = Math.sin(c * 17.3 + r * 31.7);
        let screenType: MonitorPlacement['screenType'] = 'green';
        if (seed > 0.55) screenType = 'green';
        else if (seed > 0.22) screenType = 'amber';
        else if (seed > -0.12) screenType = 'blue';
        else if (seed > -0.42) screenType = 'osc';
        else if (seed > -0.68) screenType = 'wire';
        else if (seed > -0.85) screenType = 'test';
        else screenType = 'off';

        list.push({
          pos: [x, y, z],
          rot: [rotX, rotY, 0],
          screenType,
        });
      }
    }

    // --- B. KỆ MÀN HÌNH HÔNG TRÁI (LEFT WING AT X = -8.2) ---
    // 8 Cột dọc theo trục Z x 3 Tầng cao (Y = 0.55, 1.38, 2.22)
    const sideZCols = 8;
    for (let r = 0; r < 3; r++) {
      const y = rearYLevels[r];
      for (let c = 0; c < sideZCols; c++) {
        const z = -5.8 + c * 0.76;
        const x = -8.4 - Math.sin((c / sideZCols) * 0.5) * 0.2;
        const rotY = Math.PI / 2 - 0.22;

        const seed = Math.cos(c * 23.1 + r * 19.4);
        let screenType: MonitorPlacement['screenType'] = 'green';
        if (seed > 0.45) screenType = 'amber';
        else if (seed > 0.1) screenType = 'green';
        else if (seed > -0.25) screenType = 'blue';
        else if (seed > -0.6) screenType = 'wire';
        else screenType = 'off';

        list.push({
          pos: [x, y, z],
          rot: [0, rotY, 0],
          screenType,
        });
      }
    }

    // --- C. KỆ MÀN HÌNH HÔNG PHẢI (RIGHT WING AT X = +8.2) ---
    for (let r = 0; r < 3; r++) {
      const y = rearYLevels[r];
      for (let c = 0; c < sideZCols; c++) {
        const z = -5.8 + c * 0.76;
        const x = 8.4 + Math.sin((c / sideZCols) * 0.5) * 0.2;
        const rotY = -Math.PI / 2 + 0.22;

        const seed = Math.sin(c * 13.9 + r * 29.1);
        let screenType: MonitorPlacement['screenType'] = 'blue';
        if (seed > 0.45) screenType = 'blue';
        else if (seed > 0.1) screenType = 'green';
        else if (seed > -0.25) screenType = 'amber';
        else if (seed > -0.6) screenType = 'osc';
        else screenType = 'off';

        list.push({
          pos: [x, y, z],
          rot: [0, rotY, 0],
          screenType,
        });
      }
    }

    return list;
  }, []);

  // Các Procedural Textures cho màn hình
  const greenTex = useMemo(() => createGreenMatrixTexture(), []);
  const amberTex = useMemo(() => createAmberTerminalTexture(), []);
  const blueTex = useMemo(() => createBlueDiagnosticsTexture(), []);
  const testTex = useMemo(() => createTestPatternTexture(), []);
  const oscTex = useMemo(() => createOscilloscopeTexture(), []);
  const wireTex = useMemo(() => createWireframe3DTexture(), []);

  useEffect(() => {
    return () => {
      greenTex.dispose();
      amberTex.dispose();
      blueTex.dispose();
      testTex.dispose();
      oscTex.dispose();
      wireTex.dispose();
    };
  }, [greenTex, amberTex, blueTex, testTex, oscTex, wireTex]);

  // Bộ vật liệu dùng chung tối ưu cho InstancedMesh
  const { caseMat, bezelMat, standMat, offGlassMat } = useMemo(() => {
    return {
      caseMat: new THREE.MeshStandardMaterial({
        color: '#d6d0c4',
        roughness: 0.65,
        metalness: 0.05,
      }),
      bezelMat: new THREE.MeshStandardMaterial({
        color: '#282b30',
        roughness: 0.45,
        metalness: 0.15,
      }),
      standMat: new THREE.MeshStandardMaterial({
        color: '#bfb8a8',
        roughness: 0.7,
        metalness: 0.05,
      }),
      offGlassMat: new THREE.MeshStandardMaterial({
        color: '#0a0d10',
        roughness: 0.2,
        metalness: 0.2,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      caseMat.dispose();
      bezelMat.dispose();
      standMat.dispose();
      offGlassMat.dispose();
    };
  }, [caseMat, bezelMat, standMat, offGlassMat]);

  // Phân loại các màn hình theo từng loại texture
  const greenScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'green'), [monitorLayout]);
  const amberScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'amber'), [monitorLayout]);
  const blueScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'blue'), [monitorLayout]);
  const oscScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'osc'), [monitorLayout]);
  const testScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'test'), [monitorLayout]);
  const wireScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'wire'), [monitorLayout]);
  const offScreens = useMemo(() => monitorLayout.filter((m) => m.screenType === 'off'), [monitorLayout]);

  return (
    <group>
      {/* 1. KHUNG THÉP KỆ SẮT ĐA TẦNG PHÍA SAU NÂNG ĐỠ TOÀN BỘ MÀN HÌNH */}
      <group position={[0, 0, -6.9]}>
        {[-9.5, -6.5, -3.5, -0.5, 2.5, 5.5, 8.5].map((sx, idx) => (
          <group key={`rear-rack-col-${idx}`} position={[sx, 1.8, 0]}>
            {/* Trụ đứng thép hộp chữ nhật */}
            <mesh position={[-0.32, 0, -0.22]}>
              <boxGeometry args={[0.06, 4.4, 0.06]} />
              <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.8} />
            </mesh>
            <mesh position={[0.32, 0, -0.22]}>
              <boxGeometry args={[0.06, 4.4, 0.06]} />
              <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* 4 Tầng thanh thép đệm sàn đỡ màn hình */}
        {[0.25, 1.08, 1.92, 2.76].map((sy, sIdx) => (
          <mesh key={`shelf-bar-${sIdx}`} position={[0, sy, -0.22]}>
            <boxGeometry args={[19.6, 0.045, 0.65]} />
            <meshStandardMaterial color="#181a20" roughness={0.55} metalness={0.75} />
          </mesh>
        ))}
      </group>

      {/* 2. INSTANCED MESH CHO TOÀN BỘ 130+ VỎ MÁY MÀN HÌNH RETRO (1 DRAW CALL) */}
      <Instances limit={monitorLayout.length} material={caseMat}>
        <boxGeometry args={[0.66, 0.52, 0.58]} />
        {monitorLayout.map((m, idx) => (
          <Instance
            key={`mon-case-${idx}`}
            position={m.pos}
            rotation={m.rot}
          />
        ))}
      </Instances>

      {/* 3. INSTANCED MESH CHO KHUNG VIỀN MẶT TRƯỚC BEZEL (1 DRAW CALL) */}
      <Instances limit={monitorLayout.length} material={bezelMat}>
        <boxGeometry args={[0.62, 0.46, 0.04]} />
        {monitorLayout.map((m, idx) => {
          // Tính vector dịch phía trước theo góc xoay rotY
          const fwdX = Math.sin(m.rot[1]) * 0.285;
          const fwdZ = Math.cos(m.rot[1]) * 0.285;
          return (
            <Instance
              key={`mon-bezel-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1], m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* 4. INSTANCED MESH CHO CHÂN ĐẾ XOAY TRÒN (1 DRAW CALL) */}
      <Instances limit={monitorLayout.length} material={standMat}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 12]} />
        {monitorLayout.map((m, idx) => (
          <Instance
            key={`mon-stand-${idx}`}
            position={[m.pos[0], m.pos[1] - 0.27, m.pos[2]]}
          />
        ))}
      </Instances>

      {/* 5. CÁC NHÓM MẶT KÍNH MÀN HÌNH PHÁT SÁNG THEO TỪNG LOẠI NỘI DUNG (1 DRAW CALL MỖI LOẠI) */}
      {/* A. Màn hình Green Matrix (Phosphor Green Glow) */}
      <Instances limit={greenScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={greenTex}
          emissive="#22c55e"
          emissiveIntensity={1.35}
          roughness={0.25}
        />
        {greenScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-green-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* B. Màn hình Amber BIOS Terminal (Phosphor Amber Glow) */}
      <Instances limit={amberScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={amberTex}
          emissive="#f59e0b"
          emissiveIntensity={1.25}
          roughness={0.25}
        />
        {amberScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-amber-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* C. Màn hình Blue Diagnostics (Cobalt Blue Glow) */}
      <Instances limit={blueScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={blueTex}
          emissive="#2563eb"
          emissiveIntensity={1.15}
          roughness={0.25}
        />
        {blueScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-blue-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* D. Màn hình Oscilloscope (Waveform Green Glow) */}
      <Instances limit={oscScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={oscTex}
          emissive="#10b981"
          emissiveIntensity={1.4}
          roughness={0.25}
        />
        {oscScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-osc-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* E. Màn hình Wireframe 3D (Cyan Wireframe Glow) */}
      <Instances limit={wireScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={wireTex}
          emissive="#38bdf8"
          emissiveIntensity={1.2}
          roughness={0.25}
        />
        {wireScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-wire-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* F. Màn hình Test Pattern (SMPTE Colors) */}
      <Instances limit={testScreens.length}>
        <planeGeometry args={[0.54, 0.38]} />
        <meshStandardMaterial
          map={testTex}
          emissive="#ffffff"
          emissiveIntensity={0.65}
          roughness={0.3}
        />
        {testScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-test-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* G. Màn hình Tắt / Standby */}
      <Instances limit={offScreens.length} material={offGlassMat}>
        <planeGeometry args={[0.54, 0.38]} />
        {offScreens.map((m, idx) => {
          const fwdX = Math.sin(m.rot[1]) * 0.306;
          const fwdZ = Math.cos(m.rot[1]) * 0.306;
          return (
            <Instance
              key={`screen-off-${idx}`}
              position={[m.pos[0] + fwdX, m.pos[1] + 0.01, m.pos[2] + fwdZ]}
              rotation={m.rot}
            />
          );
        })}
      </Instances>

      {/* 6. ÁNH SÁNG LAN TỎA DỊU TỪ DÀN MÀN HÌNH (ATMOSPHERIC PHOSPHOR GLOW LIGHTS) */}
      <pointLight position={[-4.5, 1.8, -5.5]} intensity={3.2} distance={8.5} decay={2} color="#22c55e" />
      <pointLight position={[0, 2.2, -5.5]} intensity={3.5} distance={9.0} decay={2} color="#f59e0b" />
      <pointLight position={[4.5, 1.8, -5.5]} intensity={3.2} distance={8.5} decay={2} color="#38bdf8" />
    </group>
  );
}

// =============================================================================
// 3. TOÀN CẢNH PHÒNG RETRO LAB 1997 (MAIN RETRO LAB ENVIRONMENT)
// =============================================================================
export function RetroLabEnvironment() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  // YÊU CẦU #3 (TỐI ƯU HIỆU NĂNG / STATE CULLING):
  // Căn phòng và bức tường hàng trăm màn hình retro chỉ hiển thị khi:
  // - Đang ở Step 00 (Home)
  // - Đang cuộn zoom mở/đóng cửa sổ (homeTransitionProgress < 0.999)
  // - Hoặc đang trong chuỗi chuyển cảnh (stageTransition !== 'IDLE')
  // Khi người dùng đã ngồi hẳn vào bàn lắp ráp, tự động culling để giữ 60 FPS tuyệt đối!
  const isTransitioning = stageTransition !== 'IDLE';
  const shouldShowLab =
    currentStep === 0 || homeTransitionProgress < 0.999 || isTransitioning;

  const { floorMat, wallMat } = useMemo(() => {
    return {
      floorMat: new THREE.MeshStandardMaterial({
        color: '#0e1014',
        roughness: 0.85,
        metalness: 0.12,
      }),
      wallMat: new THREE.MeshStandardMaterial({
        color: '#0a0c10',
        roughness: 0.95,
        metalness: 0.05,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      floorMat.dispose();
      wallMat.dispose();
    };
  }, [floorMat, wallMat]);

  return (
    <group>
      {/* A. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (Đặt trước bàn, tự động lùi sang trái khi zoom vào bàn) */}
      <WoodenEngineerChair />

      {/* B. TOÀN BỘ PHÒNG XƯỞNG & DÀN MÀN HÌNH RETRO SAN SÁT NHAU */}
      {shouldShowLab && (
        <group>
          {/* 1. SÀN PHÒNG XƯỞNG TỐI MÀU (Y = -1.62) */}
          <mesh
            position={[0, -1.62, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            material={floorMat}
          >
            <planeGeometry args={[44, 44]} />
          </mesh>

          {/* 2. TƯỜNG SAU & TƯỜNG TRÁI / PHẢI */}
          {/* Tường sau (Z = -9.8) */}
          <mesh position={[0, 5.2, -9.8]} receiveShadow material={wallMat}>
            <planeGeometry args={[44, 15]} />
          </mesh>
          {/* Tường trái (X = -14.2) */}
          <mesh
            position={[-14.2, 5.2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
            material={wallMat}
          >
            <planeGeometry args={[44, 15]} />
          </mesh>
          {/* Tường phải (X = 14.2) */}
          <mesh
            position={[14.2, 5.2, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
            material={wallMat}
          >
            <planeGeometry args={[44, 15]} />
          </mesh>

          {/* 3. DÀN HÀNG TRĂM MÀN HÌNH RETRO CRT SAN SÁT NHAU PHÁT SÁNG TOÀN CĂN PHÒNG */}
          <RetroMonitorWall />

          {/* 4. CUỘN DÂY CÁP LỚN DƯỚI SÀN GÓC PHÒNG */}
          <group position={[-6.2, -1.5, 3.2]} rotation={[0, 0.45, 0]}>
            <mesh>
              <cylinderGeometry args={[0.36, 0.36, 0.24, 16]} />
              <meshStandardMaterial color="#1e2229" roughness={0.6} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <cylinderGeometry args={[0.44, 0.44, 0.025, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.13, 0]}>
              <cylinderGeometry args={[0.44, 0.44, 0.025, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
