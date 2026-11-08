import { useMemo, useEffect } from 'react';
import { RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

/**
 * 1. Texture cho 2 con chip vuông lớn "3dfx Interactive" (FBI & TMU) trên card Diamond Monster 3D
 */
function create3dfxChipTexture(chipRole: string, partNo: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#171717';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 236);

  // Chấm định vị Pin 1
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(32, 224, 9, 0, Math.PI * 2);
  ctx.fill();

  // Logo 3dfx Interactive sắc nét
  ctx.fillStyle = '#ffb000';
  ctx.font = 'italic bold 42px "JetBrains Mono", monospace';
  ctx.fillText('3dfx', 28, 72);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px "JetBrains Mono", monospace';
  ctx.fillText('Interactive', 28, 102);

  ctx.fillStyle = '#d8d2c5';
  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillText(chipRole, 28, 148);

  ctx.fillStyle = '#9ea3a8';
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillText(partNo, 28, 182);
  ctx.fillText('VOODOO GRAPHICS', 28, 214);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. Texture mặt mạch PCB và dòng chữ trắng nổi bật "SOUND BLASTER 16" trên card âm thanh Creative CT2940
 */
function createSoundBlasterPcbTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Nền PCB xanh lá đậm cổ điển
  ctx.fillStyle = '#184226';
  ctx.fillRect(0, 0, 512, 256);

  // Đường mạch đồng mảnh
  ctx.strokeStyle = 'rgba(52, 130, 76, 0.7)';
  ctx.lineWidth = 2;
  for (let y = 40; y < 220; y += 14) {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(480, y);
    ctx.stroke();
  }

  // Dòng chữ Silkscreen trắng lớn "SOUND BLASTER 16" ở góc trên bo mạch
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.fillText('SOUND BLASTER 16', 110, 48);

  ctx.fillStyle = '#ffdf80';
  ctx.font = 'bold 18px "IBM Plex Mono", monospace';
  ctx.fillText('CREATIVE LABS // MODEL CT2940 // PnP', 112, 74);

  ctx.fillStyle = '#e6e2d8';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText('CD_IN   LINE_IN   AUX_IN   IDE_CD', 120, 102);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3. Texture cho chip vuông Creative Vibra16 / DSP ở trung tâm card Sound Blaster 16
 */
function createCreativeDspTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#161616';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.fillText('CREATIVE', 26, 74);

  ctx.fillStyle = '#ffb000';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText('VIBRA 16C', 26, 118);

  ctx.fillStyle = '#d8d2c5';
  ctx.font = 'bold 20px "IBM Plex Mono", monospace';
  ctx.fillText('CT2505-TDQ2', 26, 160);
  ctx.fillText('OPL3 FM SYNTH', 26, 194);
  ctx.fillText('© 1996 CREATIVE', 26, 224);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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

export interface ExpansionCardsProps {
  /** Tiến trình lắp bộ đôi Card mở rộng ở Step 09 (0 = Nằm chờ trên bàn cắt -> 1 = Đã cắm vào PCI 1 & ISA 1) */
  cardsInstallProgress: number;
}

export function ExpansionCards({ cardsInstallProgress }: ExpansionCardsProps) {
  const fbiTex = useMemo(
    () => create3dfxChipTexture('FBI PIXELFX', '500-0003-03'),
    []
  );
  const tmuTex = useMemo(
    () => create3dfxChipTexture('TMU TEXELFX', '500-0004-02'),
    []
  );
  const sb16PcbTex = useMemo(() => createSoundBlasterPcbTexture(), []);
  const dspTex = useMemo(() => createCreativeDspTexture(), []);

  useEffect(() => {
    return () => {
      fbiTex.dispose();
      tmuTex.dispose();
      sb16PcbTex.dispose();
      dspTex.dispose();
    };
  }, [fbiTex, tmuTex, sb16PcbTex, dspTex]);

  // 8 con chip nhớ EDO DRAM xếp theo hình vòng cung (Arc) vây quanh 2 chip 3dfx trên Diamond Monster 3D
  const voodooRamArc = useMemo(() => {
    const items: { pos: [number, number, number]; rotZ: number }[] = [];
    const numChips = 8;
    const centerX = 0.04;
    const centerY = 0.0;
    const radiusX = 0.36;
    const radiusY = 0.16;

    for (let i = 0; i < numChips; i++) {
      // Góc vòng cung từ -70 độ đến +110 độ bao quanh cụm FBI/TMU
      const angle = -1.1 + (i / (numChips - 1)) * 2.2;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      items.push({
        pos: [x, y, 0.015],
        rotZ: angle * 0.35,
      });
    }
    return items;
  }, []);

  // Hàng chân vàng PCI 32-bit dưới đáy card 3dfx Voodoo
  const pciGoldPins = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    for (let x = -0.38; x <= 0.4; x += 0.026) {
      if (Math.abs(x - 0.24) < 0.035) continue;
      pts.push([x, -0.21, 0]);
    }
    return pts;
  }, []);

  // Hàng chân vàng ISA 16-bit (chia 2 đoạn: 8-bit dài + 16-bit ngắn) dưới đáy card Sound Blaster 16
  const isaGoldPins = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    // Đoạn 8-bit
    for (let x = -0.62; x <= 0.18; x += 0.028) {
      pts.push([x, -0.225, 0]);
    }
    // Đoạn 16-bit mở rộng (sau vách ngăn tại x = 0.22)
    for (let x = 0.26; x <= 0.62; x += 0.028) {
      pts.push([x, -0.225, 0]);
    }
    return pts;
  }, []);

  // Hàng tụ hóa nhỏ trên mạch âm thanh Sound Blaster 16
  const sbCapCoords = useMemo<[number, number, number][]>(
    () => [
      [-0.52, 0.08, 0.02],
      [-0.52, -0.02, 0.02],
      [-0.52, -0.12, 0.02],
      [-0.38, 0.06, 0.02],
      [-0.38, -0.06, 0.02],
      [0.18, -0.08, 0.02],
      [0.32, -0.08, 0.02],
      [0.46, -0.08, 0.02],
    ],
    []
  );

  const p = clamp01(cardsInstallProgress);

  // ===========================================================================
  // LOGIC ANIMATION STEP 09:
  // - Khi p = 0 (Step 01 -> Step 08): Cả 2 card nằm chờ gọn gàng trên mặt bàn cắt bên trái Case
  // - Pha 1 (0.00 -> 0.48): Card 3dfx Voodoo nâng lên từ bàn cắt, xoay thẳng đứng và cắm xuống khe PCI 1 (Z = 0.08), xoáy ốc bracket
  // - Pha 2 (0.48 -> 1.00): Card Sound Blaster 16 bay vào, hạ thẳng xuống khe ISA 1 (Z = 0.82), xoáy ốc bracket
  // ===========================================================================

  // 1. Tọa độ Card đồ họa 3dfx Voodoo PCI:
  // Đưa từ phía ngoài cửa mở bên hông thùng máy đứng (Y_int = 2.05) cắm thẳng vào khe PCI 1 (X=-0.32, Y=0.39, Z=0.08)
  const vgaMove = smooth(p, 0.0, 0.42);
  const vgaScrew = smooth(p, 0.4, 0.5);

  const vgaX = THREE.MathUtils.lerp(-0.18, -0.32, vgaMove);
  const vgaY = THREE.MathUtils.lerp(2.05, 0.39, vgaMove);
  const vgaZ = 0.08;
  const vgaRotX = 0;

  // 2. Tọa độ Card âm thanh Sound Blaster 16 ISA:
  // Đưa từ phía ngoài cửa mở bên hông thùng máy đứng (Y_int = 2.05) cắm thẳng vào khe ISA 1 (X=-0.12, Y=0.41, Z=0.82)
  const sbMove = smooth(p, 0.48, 0.9);
  const sbScrew = smooth(p, 0.88, 1.0);

  const sbX = THREE.MathUtils.lerp(0.02, -0.12, sbMove);
  const sbY = THREE.MathUtils.lerp(2.05, 0.41, sbMove);
  const sbZ = 0.82;
  const sbRotX = 0;

  return (
    <group>
      {/* =====================================================================
          A. CARD ĐỒ HỌA 3DFX VOODOO GRAPHICS - DIAMOND MONSTER 3D (KHE PCI 1)
         ===================================================================== */}
      <group position={[vgaX, vgaY, vgaZ]} rotation={[vgaRotX, 0, 0]}>
        {/* Bản mạch PCB xanh lá đậm (1.10 x 0.42 x 0.02) */}
        <RoundedBox
          args={[1.1, 0.42, 0.02]}
          radius={0.004}
          smoothness={1}
          castShadow
          receiveShadow
          material={retroMaterials.pcbGreen}
        />

        {/* Lưỡi cắm PCI dưới đáy + Chân mạ vàng (InstancedMesh) */}
        <mesh position={[0, -0.205, 0]} material={retroMaterials.pcbGreen}>
          <boxGeometry args={[0.84, 0.035, 0.018]} />
        </mesh>
        <Instances limit={pciGoldPins.length} material={retroMaterials.goldPin}>
          <boxGeometry args={[0.015, 0.036, 0.022]} />
          {pciGoldPins.map((pos, idx) => (
            <Instance key={`voodoo-pin-${idx}`} position={pos} />
          ))}
        </Instances>

        {/* Chip xử lý #1: 3dfx Interactive FBI (Frame Buffer Interface) */}
        <group position={[-0.2, -0.01, 0.016]}>
          <RoundedBox
            args={[0.175, 0.175, 0.016]}
            radius={0.003}
            smoothness={1}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial map={fbiTex} roughness={0.35} metalness={0.2} />
          </mesh>
        </group>

        {/* Chip xử lý #2: 3dfx Interactive TMU (Texture Mapping Unit) */}
        <group position={[0.04, -0.01, 0.016]}>
          <RoundedBox
            args={[0.175, 0.175, 0.016]}
            radius={0.003}
            smoothness={1}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial map={tmuTex} roughness={0.35} metalness={0.2} />
          </mesh>
        </group>

        {/* 8 con chip nhớ EDO DRAM xếp theo hình vòng cung (Arc) vây quanh 2 chip 3dfx (InstancedMesh) */}
        <Instances limit={voodooRamArc.length} castShadow material={retroMaterials.blackAnodized}>
          <boxGeometry args={[0.082, 0.046, 0.014]} />
          {voodooRamArc.map((chip, idx) => (
            <Instance
              key={`voodoo-ram-${idx}`}
              position={chip.pos}
              rotation={[0, 0, chip.rotZ]}
            />
          ))}
        </Instances>

        {/* Thanh chắn kim loại (Bracket) ánh vàng đồng (#b5a888) ở đầu card (khớp X = -1.16, Y = 0.48 tại lưng Case) */}
        <group position={[-0.84, 0.09, 0]}>
          <RoundedBox
            args={[0.022, 0.7, 0.105]}
            radius={0.003}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#b5a888" roughness={0.32} metalness={0.82} />
          </RoundedBox>
          {/* Tai chữ L bên phải thanh chắn để bắt ốc vào gờ lưng Case */}
          <mesh position={[0.042, 0.35, 0]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.085, 0.025, 0.105]} />
          </mesh>

          {/* 1. BÊN TRÁI (dy = -0.22 -> y_int = 0.26): Cổng xuất hình VGA D-Sub 15-pin màu xanh dương (#0038a8) + 2 ốc lục giác */}
          <group position={[-0.024, -0.22, 0]}>
            <RoundedBox
              args={[0.036, 0.18, 0.072]}
              radius={0.004}
              smoothness={1}
              material={retroMaterials.galvanizedSteel}
            />
            <RoundedBox args={[0.044, 0.115, 0.048]} radius={0.004} smoothness={1}>
              <meshStandardMaterial color="#0038a8" roughness={0.38} metalness={0.12} />
            </RoundedBox>
            {[-0.072, 0.072].map((sy, sIdx) => (
              <mesh
                key={`vga-hex-${sIdx}`}
                position={[-0.008, sy, 0]}
                rotation={[0, 0, Math.PI / 2]}
                material={retroMaterials.galvanizedSteel}
              >
                <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
              </mesh>
            ))}
          </group>

          {/* 2. Ở GIỮA (dy = -0.04 -> y_int = 0.44): Cổng tròn màu đen S-Video / Mini-DIN Pass-through */}
          <group position={[-0.022, -0.04, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.isaBlack}>
              <cylinderGeometry args={[0.034, 0.034, 0.024, 16]} />
            </mesh>
            <mesh position={[-0.01, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.01, 12]} />
              <meshBasicMaterial color="#060606" />
            </mesh>
          </group>

          {/* 3. BÊN PHẢI CỔNG TRÒN (dy = +0.06 -> y_int = 0.54): Giắc tròn kim loại bạc (Composite / Pass-through Jack) */}
          <group position={[-0.024, 0.06, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.galvanizedSteel}>
              <cylinderGeometry args={[0.026, 0.026, 0.028, 16]} />
            </mesh>
            <mesh position={[-0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.008, 12]} />
              <meshBasicMaterial color="#050505" />
            </mesh>
          </group>

          {/* Ốc vít cố định thanh Bracket vào gờ lưng Case */}
          {vgaScrew > 0.01 && (
            <mesh
              position={[0.045, THREE.MathUtils.lerp(0.65, 0.37, vgaScrew), 0]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.02, 0.015, 0.028, 6]} />
            </mesh>
          )}
        </group>
      </group>

      {/* =====================================================================
          B. CARD ÂM THANH CREATIVE SOUND BLASTER 16 CT2940 (KHE ISA 1)
         ===================================================================== */}
      <group position={[sbX, sbY, sbZ]} rotation={[sbRotX, 0, 0]}>
        {/* Bản mạch PCB dài hơn card PCI (1.52 x 0.44 x 0.02) in chữ "SOUND BLASTER 16" */}
        <RoundedBox
          args={[1.52, 0.44, 0.02]}
          radius={0.004}
          smoothness={1}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={sb16PcbTex}
            roughness={0.45}
            metalness={0.15}
          />
        </RoundedBox>

        {/* Chân cắm chuẩn ISA 16-bit chia 2 đoạn mạ vàng khớp với khe ISA 1 màu đen */}
        <mesh position={[-0.22, -0.22, 0]} material={retroMaterials.pcbGreen}>
          <boxGeometry args={[0.84, 0.036, 0.018]} />
        </mesh>
        <mesh position={[0.44, -0.22, 0]} material={retroMaterials.pcbGreen}>
          <boxGeometry args={[0.38, 0.036, 0.018]} />
        </mesh>
        <Instances limit={isaGoldPins.length} material={retroMaterials.goldPin}>
          <boxGeometry args={[0.016, 0.038, 0.022]} />
          {isaGoldPins.map((pos, idx) => (
            <Instance key={`isa-pin-${idx}`} position={pos} />
          ))}
        </Instances>

        {/* Chip vuông Creative Vibra16 / DSP ở trung tâm bo mạch */}
        <group position={[-0.08, -0.02, 0.016]}>
          <RoundedBox
            args={[0.18, 0.18, 0.016]}
            radius={0.003}
            smoothness={1}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[0.165, 0.165]} />
            <meshStandardMaterial map={dspTex} roughness={0.35} metalness={0.2} />
          </mesh>
        </group>

        {/* Hàng tụ hóa lọc âm nhỏ trên mạch (InstancedMesh) */}
        <Instances limit={sbCapCoords.length} castShadow material={retroMaterials.blackAnodized}>
          <cylinderGeometry args={[0.02, 0.02, 0.032, 10]} />
          {sbCapCoords.map((pos, idx) => (
            <Instance
              key={`sb-cap-${idx}`}
              position={pos}
              rotation={[Math.PI / 2, 0, 0]}
            />
          ))}
        </Instances>

        {/* Các chân cắm CD-Audio Header 4-pin ở mép trên card để nối lên ổ CD-ROM */}
        {[-0.32, -0.16, 0.0].map((hx, idx) => (
          <mesh
            key={`cd-audio-hdr-${idx}`}
            position={[hx, 0.2, 0.015]}
            material={idx === 0 ? retroMaterials.whiteSlot : retroMaterials.isaBlack}
          >
            <boxGeometry args={[0.09, 0.03, 0.022]} />
          </mesh>
        ))}

        {/* Thanh chắn kim loại (Bracket) ánh vàng đồng (#b5a888) tại X = -1.04 cục bộ (khớp X = -1.16, Y = 0.48 tại lưng Case!) */}
        <group position={[-1.04, 0.07, 0]}>
          <RoundedBox
            args={[0.022, 0.7, 0.105]}
            radius={0.003}
            smoothness={1}
            castShadow
          >
            <meshStandardMaterial color="#b5a888" roughness={0.32} metalness={0.82} />
          </RoundedBox>
          {/* Tai chữ L bên phải thanh chắn */}
          <mesh position={[0.042, 0.35, 0]} material={retroMaterials.galvanizedSteel}>
            <boxGeometry args={[0.085, 0.025, 0.105]} />
          </mesh>

          {/* 1. BÊN TRÁI (dy = -0.19 -> y_int = 0.29): Cổng Gameport / MIDI 15-pin dài nằm ngang + 2 ốc lục giác */}
          <group position={[-0.024, -0.19, 0]}>
            <RoundedBox
              args={[0.038, 0.23, 0.072]}
              radius={0.004}
              smoothness={1}
              material={retroMaterials.galvanizedSteel}
            />
            <RoundedBox args={[0.044, 0.165, 0.046]} radius={0.003} smoothness={1}>
              <meshStandardMaterial color="#1f1f1f" roughness={0.45} metalness={0.2} />
            </RoundedBox>
            {[-0.095, 0.095].map((sy, sIdx) => (
              <mesh
                key={`gameport-hex-${sIdx}`}
                position={[-0.008, sy, 0]}
                rotation={[0, 0, Math.PI / 2]}
                material={retroMaterials.galvanizedSteel}
              >
                <cylinderGeometry args={[0.011, 0.011, 0.018, 6]} />
              </mesh>
            ))}
          </group>

          {/* 2. BÊN PHẢI (dy = +0.02, +0.11, +0.20 -> y_int = 0.50, 0.59, 0.68):
              3 Giắc cắm âm thanh tròn 3.5mm xếp hàng ngang đúng theo ảnh thật */}
          {[
            { y: 0.02, color: '#33cc55' }, // Line Out (Green)
            { y: 0.11, color: '#3388ff' }, // Line In (Blue)
            { y: 0.2, color: '#ff6699' }, // Mic In (Pink)
          ].map((jack, idx) => (
            <group key={`audio-jack-${idx}`} position={[-0.022, jack.y, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.022, 0.026, 14]} />
                <meshStandardMaterial color={jack.color} roughness={0.4} />
              </mesh>
              <mesh position={[-0.014, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.011, 0.011, 0.005, 12]} />
                <meshBasicMaterial color="#050505" />
              </mesh>
            </group>
          ))}

          {/* Ốc vít cố định thanh Bracket vào gờ lưng Case */}
          {sbScrew > 0.01 && (
            <mesh
              position={[0.045, THREE.MathUtils.lerp(0.65, 0.37, sbScrew), 0]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.02, 0.015, 0.028, 6]} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

