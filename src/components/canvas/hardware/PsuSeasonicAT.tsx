import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { useBuildStore } from '../../../store/useBuildStore';
import { PressableControl } from '../interaction/PressableControl';

/**
 * 3. Tạo CanvasTexture cho công tắc gạt đỏ 115V / 230V mặt sau bộ nguồn Seasonic
 */
function createVoltageSwitchTexture(voltage: 115 | 230): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b82525';
  ctx.fillRect(0, 0, 128, 64);

  // Rãnh khía cơ học trên công tắc gạt
  ctx.strokeStyle = '#851a1a';
  ctx.lineWidth = 3;
  for (let x = 16; x < 120; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, 56);
    ctx.stroke();
  }

  // Chữ số 115 / 230 in lụa trắng sắc nét
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(voltage === 115 ? '115V' : '230V', 64, 42);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 1. Tạo CanvasTexture cho Tem thông số điện áp cổ điển dán trên hông bộ nguồn Seasonic SSG-200G
 */
function createSeasonicLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ece8dc';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 484);

  ctx.fillStyle = '#0000aa';
  ctx.fillRect(22, 22, 468, 76);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SEASONIC SSG-200G', 38, 62);
  ctx.font = 'bold 16px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#ffb000';
  ctx.fillText('AT SWITCHING POWER SUPPLY // MAX OUTPUT: 200W', 38, 88);

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('AC INPUT: 115V/230V ~ 5A/2.5A 50/60Hz', 38, 134);

  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 154, 440, 176);

  ctx.fillStyle = '#d8d2c5';
  ctx.fillRect(38, 156, 436, 40);
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('DC OUTPUT   |  +5V  |  +12V |  -5V  | -12V ', 48, 184);

  ctx.beginPath();
  ctx.moveTo(36, 198);
  ctx.lineTo(476, 198);
  ctx.moveTo(36, 260);
  ctx.lineTo(476, 260);
  ctx.stroke();

  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillText('MAX CURRENT |  20A  |  8.0A |  0.5A | 0.5A ', 48, 238);
  ctx.fillStyle = '#b82525';
  ctx.fillText('TOTAL POWER |       200 WATTS CONTINUOUS    ', 48, 304);

  ctx.fillStyle = '#ffb000';
  ctx.fillRect(36, 350, 440, 64);
  ctx.strokeRect(36, 350, 440, 64);
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText('CAUTION! HAZARDOUS AREA. DO NOT REMOVE', 50, 378);
  ctx.fillText('COVER. NO USER SERVICEABLE PARTS INSIDE.', 50, 402);

  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('[UL]  [CSA]  [TUV]  [CE]   MADE IN TAIWAN', 38, 456);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. Tạo CanvasTexture cho tem tròn xanh lá/trắng ở chính giữa trục quạt nguồn 80mm (giống ảnh chụp thực tế)
 */
function createPsuFanHubTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e8ece8';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1d7a3a';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(64, 64, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#141413';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DC 12V', 64, 58);
  ctx.fillStyle = '#1d7a3a';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  ctx.fillText('BALL', 64, 78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export interface PsuSeasonicATProps {
  /** Tiến trình lắp bộ nguồn Seasonic & dây công tắc cơ ở Step 03 (0 -> 1) */
  psuInstallProgress: number;
}

export function PsuSeasonicAT({ psuInstallProgress }: PsuSeasonicATProps) {
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);
  const psuVoltage = useBuildStore((s) => s.psuVoltage);
  const togglePsuVoltage = useBuildStore((s) => s.togglePsuVoltage);
  const psuSparkAt = useBuildStore((s) => s.psuSparkAt);

  const fanRotorRef = useRef<THREE.Group>(null);
  const sparkLightRef = useRef<THREE.PointLight>(null);
  const voltageSliderRef = useRef<THREE.Group>(null);
  const sliderPosRef = useRef(psuVoltage === 115 ? -0.024 : 0.024);

  const labelTex = useMemo(() => createSeasonicLabelTexture(), []);
  const fanHubTex = useMemo(() => createPsuFanHubTexture(), []);
  const voltageTex = useMemo(() => createVoltageSwitchTexture(psuVoltage), [psuVoltage]);

  useEffect(() => {
    return () => {
      labelTex.dispose();
      fanHubTex.dispose();
      voltageTex.dispose();
    };
  }, [labelTex, fanHubTex, voltageTex]);

  // Cánh quạt 80mm quay khi bật máy, công tắc trượt mượt mà & tia lửa quá áp chớp tắt
  useFrame((_, delta) => {
    if (fanRotorRef.current && isPoweredOn) {
      const speed = isTurbo ? 16.0 : 10.0;
      fanRotorRef.current.rotation.x -= delta * speed;
    }

    // Di chuyển thanh gạt đỏ sang trái (-0.024) khi 115V và sang phải (+0.024) khi 230V
    const targetY = psuVoltage === 115 ? -0.024 : 0.024;
    sliderPosRef.current = THREE.MathUtils.damp(sliderPosRef.current, targetY, 18, delta);
    if (voltageSliderRef.current) {
      voltageSliderRef.current.position.y = sliderPosRef.current;
    }

    // Chớp sáng tia lửa quá áp khi gạt 115V trên lưới 230V
    if (sparkLightRef.current) {
      const elapsed = performance.now() - psuSparkAt;
      if (elapsed < 450) {
        const decay = Math.exp(-elapsed * 0.012);
        const flicker = 0.6 + 0.4 * Math.sin(elapsed * 0.4);
        sparkLightRef.current.intensity = 18 * decay * flicker;
      } else {
        sparkLightRef.current.intensity = 0;
      }
    }
  });

  const p = Math.max(0, Math.min(1, psuInstallProgress));
  const boxT = Math.max(0, Math.min(1, p / 0.55));
  const boxSmooth = boxT * boxT * (3 - 2 * boxT);

  const screwT = Math.max(0, Math.min(1, (p - 0.45) / 0.3));
  const screwSmooth = screwT * screwT * (3 - 2 * screwT);

  const cableT = Math.max(0, Math.min(1, (p - 0.55) / 0.45));
  const cableSmooth = cableT * cableT * (3 - 2 * cableT);

  // Đường cong CatmullRomCurve3 cho sợi dây công tắc nguồn cơ (PhysicalPowerCable)
  // Đi ra vuông góc từ đúng lỗ cắm Port 1 [-0.09, 1.02, -1.76] trên mặt +X của bộ nguồn
  const powerCableGeo = useMemo(() => {
    const fullPoints = [
      new THREE.Vector3(-0.12, 1.02, -1.76),
      new THREE.Vector3(0.06, 1.02, -1.76),
      new THREE.Vector3(0.38, 1.08, -1.86),
      new THREE.Vector3(0.95, 1.1, -1.9),
      new THREE.Vector3(1.55, 1.0, -1.89),
      new THREE.Vector3(1.92, 0.62, -1.87),
      new THREE.Vector3(2.14, 0.37, -1.85),
    ];
    const curve = new THREE.CatmullRomCurve3(fullPoints, false, 'centripetal', 0.5);
    return new THREE.TubeGeometry(curve, 56, 0.028, 12, false);
  }, []);

  useEffect(() => {
    return () => {
      powerCableGeo.dispose();
    };
  }, [powerCableGeo]);

  // Khi lắp vào khoang trên của Case đứng:
  // Tâm PSU tại [psuX = -0.61, psuY = 0.68, psuZ = -1.58] (kích thước 1.04 sâu x 1.16 ngang x 0.68 cao)
  const psuX = THREE.MathUtils.lerp(-0.45, -0.61, boxSmooth);
  const psuY = THREE.MathUtils.lerp(2.05, 0.68, boxSmooth);
  const psuZ = -1.58;

  return (
    <group>
      {/* =====================================================================
          1. KHỐI HỘP NGUỒN KIM LOẠI SEASONIC SSG-200G (GALVANIZED STEEL)
         ===================================================================== */}
      <group position={[psuX, psuY, psuZ]}>
        {/* Thân hộp nguồn thép mạ kẽm (Sâu 1.04 x Ngang 1.14 x Cao 0.68) */}
        <RoundedBox
          args={[1.04, 1.14, 0.68]}
          radius={0.01}
          smoothness={2}
          castShadow
          receiveShadow
          material={retroMaterials.galvanizedSteel}
        />

        {/* TEM THÔNG SỐ DÁN Ở MẶT TRONG (+Y) VÀ MẶT DƯỚI (+Z) */}
        <mesh position={[0, 0.572, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.54]} />
          <meshStandardMaterial map={labelTex} roughness={0.45} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0, 0.342]}>
          <planeGeometry args={[0.88, 0.92]} />
          <meshStandardMaterial map={labelTex} roughness={0.45} metalness={0.08} />
        </mesh>

        {/* Các khe thông gió dập nổi ở nửa dưới mặt trong hộp nguồn (+X), tách biệt hoàn toàn với cụm lỗ cắm dây */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={`psu-vent-${i}`}
            position={[0.522, -0.38 + i * 0.085, 0.06]}
            material={retroMaterials.isaBlack}
          >
            <boxGeometry args={[0.01, 0.036, 0.34]} />
          </mesh>
        ))}

        {/* CỤM 3 HỐC LỖ CẮM & VÒNG CAO SU CHỐNG ĐỨT DÂY (CABLE EXIT PORTS & STRAIN-RELIEF GROMMETS) Ở MẶT +X */}
        {/* Port 1: Lỗ ra dây công tắc nguồn AC (local [0.52, 0.34, -0.18] -> case [-0.09, 1.02, -1.76]) */}
        <group position={[0.52, 0.34, -0.18]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.036, 0.036, 0.018, 20]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} material={retroMaterials.isaBlack}>
            <torusGeometry args={[0.038, 0.013, 12, 24]} />
          </mesh>
          <mesh
            position={[0.02, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.blackAnodized}
          >
            <cylinderGeometry args={[0.032, 0.042, 0.042, 16]} />
          </mesh>
        </group>

        {/* Port 2: Hốc lỗ cắm lớn cho bó dây nguồn Mainboard P8/P9 (local [0.52, 0.18, -0.02] -> case [-0.09, 0.86, -1.60]) */}
        <group position={[0.52, 0.18, -0.02]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.062, 0.062, 0.018, 24]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} material={retroMaterials.isaBlack}>
            <torusGeometry args={[0.064, 0.018, 14, 28]} />
          </mesh>
          <mesh
            position={[0.024, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.blackAnodized}
          >
            <cylinderGeometry args={[0.054, 0.066, 0.05, 20]} />
          </mesh>
        </group>

        {/* Port 3: Hốc lỗ cắm cho bó dây nguồn Ổ đĩa Molex/Berg (local [0.52, 0.36, 0.12] -> case [-0.09, 1.04, -1.46]) */}
        <group position={[0.52, 0.36, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.046, 0.046, 0.018, 20]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]} material={retroMaterials.isaBlack}>
            <torusGeometry args={[0.048, 0.015, 12, 24]} />
          </mesh>
          <mesh
            position={[0.022, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={retroMaterials.blackAnodized}
          >
            <cylinderGeometry args={[0.04, 0.05, 0.045, 18]} />
          </mesh>
        </group>

        {/* =====================================================================
            2. MẶT SAU BỘ NGUỒN (X = -0.522 HƯỚNG RA MẶT LƯNG CASE - GIỐNG ẢNH THẬT 100%):
               Nhìn từ mặt sau lưng máy (Trái là -y cục bộ, Phải là +y cục bộ, Trên là -z cục bộ):
               - BÊN TRÁI (y = -0.30): Ổ cắm 3 chấu AC IN nằm ngang ở trên (z = -0.18) + Gạt đỏ 115V/230V ở dưới (z = -0.02)
               - BÊN PHẢI (y = +0.20, z = +0.01): Quạt hút gió 80mm màu đen lớn + Tem tròn xanh lá ở tâm + Lưới thép bảo vệ đồng tâm!
           ===================================================================== */}
        <group position={[-0.522, 0, 0]}>
          {/* A. NỬA BÊN TRÁI (y = -0.30): Ổ cắm AC IN nằm ngang + Công tắc gạt đỏ 115V */}
          {/* 1. Ổ cắm 3 chấu âm AC IN (IEC C14 màu đen nằm ngang ở góc trên trái) */}
          <group position={[-0.006, -0.3, -0.18]}>
            {/* Đế tai bắt ốc hai bên (Flange) */}
            <RoundedBox
              args={[0.018, 0.29, 0.12]}
              radius={0.015}
              smoothness={2}
              material={retroMaterials.isaBlack}
            />
            {/* Hốc cắm 3 chấu chữ nhật vát góc */}
            <RoundedBox
              args={[0.026, 0.19, 0.135]}
              radius={0.008}
              smoothness={1}
              position={[-0.004, 0, 0]}
              material={retroMaterials.isaBlack}
            />
            {/* 2 ốc bạc bắt hai tai ổ cắm AC IN */}
            <mesh
              position={[-0.012, -0.115, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.01, 10]} />
            </mesh>
            <mesh
              position={[-0.012, 0.115, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={retroMaterials.galvanizedSteel}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.01, 10]} />
            </mesh>
            {/* 3 chân đồng IEC C14 nằm ngang */}
            <mesh position={[-0.012, -0.045, 0.02]} material={retroMaterials.galvanizedSteel}>
              <boxGeometry args={[0.018, 0.012, 0.032]} />
            </mesh>
            <mesh position={[-0.012, 0.045, 0.02]} material={retroMaterials.galvanizedSteel}>
              <boxGeometry args={[0.018, 0.012, 0.032]} />
            </mesh>
            <mesh position={[-0.012, 0.0, -0.022]} material={retroMaterials.goldPin}>
              <boxGeometry args={[0.018, 0.012, 0.032]} />
            </mesh>
          </group>

          {/* 2. Công tắc gạt đỏ chọn điện áp 115V / 230V nằm ngang ngay dưới ổ AC IN */}
          <group position={[-0.006, -0.3, -0.02]}>
            {/* Hốc nhựa đen bao quanh công tắc gạt */}
            <mesh material={retroMaterials.isaBlack}>
              <boxGeometry args={[0.018, 0.13, 0.062]} />
            </mesh>

            {/* Cụm công tắc trượt gạt ngang có gắn PressableControl */}
            <PressableControl
              label={`[CLICK] PSU VOLTAGE SELECTOR (${psuVoltage}V → ${psuVoltage === 230 ? 115 : 230}V)`}
              onPress={togglePsuVoltage}
              travel={0.003}
              pressAxis={[-1, 0, 0]}
            >
              <group ref={voltageSliderRef} position={[-0.005, psuVoltage === 115 ? -0.024 : 0.024, 0]}>
                <mesh material={retroMaterials.ribbonRed}>
                  <boxGeometry args={[0.016, 0.062, 0.046]} />
                </mesh>
                {/* Mặt decal hiển thị "115V" hoặc "230V" hướng ra phía sau lưng (-X) */}
                <mesh position={[-0.009, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                  <planeGeometry args={[0.056, 0.038]} />
                  <meshBasicMaterial map={voltageTex} />
                </mesh>
              </group>
            </PressableControl>

            {/* Tia lửa & nguồn sáng chớp nháy quá áp khi kích hoạt Easter Egg */}
            <pointLight
              ref={sparkLightRef}
              color="#ffaa33"
              intensity={0}
              distance={2.8}
              position={[-0.08, 0, 0]}
            />
          </group>

          {/* B. NỬA BÊN PHẢI (y = +0.20, z = +0.01): HỐC QUẠT TRÒN 80MM LỚN + TEM XANH LÁ + LƯỚI BẢO VỆ */}
          <group position={[0, 0.2, 0.01]}>
            {/* Hốc quạt tròn đen 80mm (bán kính 0.29) */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.isaBlack}>
              <cylinderGeometry args={[0.29, 0.29, 0.022, 28]} />
            </mesh>

            {/* Cánh quạt 80mm bên trong + Tem tròn xanh lá/trắng ở tâm quạt */}
            <group ref={fanRotorRef} position={[-0.004, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]} material={retroMaterials.blackAnodized}>
                <cylinderGeometry args={[0.095, 0.095, 0.028, 20]} />
              </mesh>
              {/* Tem tròn xanh lá/trắng dán ở tâm quạt giống hệt ảnh thật */}
              <mesh position={[-0.016, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <circleGeometry args={[0.082, 20]} />
                <meshStandardMaterial map={fanHubTex} roughness={0.4} />
              </mesh>
              {Array.from({ length: 7 }).map((_, idx) => {
                const ang = (idx / 7) * Math.PI * 2;
                return (
                  <group key={`psu-blade-${idx}`} rotation={[ang, 0, 0]}>
                    <mesh
                      position={[0, 0.175, 0]}
                      rotation={[0.45, 0, 0]}
                      material={retroMaterials.blackAnodized}
                    >
                      <boxGeometry args={[0.016, 0.16, 0.068]} />
                    </mesh>
                  </group>
                );
              })}
            </group>

            {/* Lưới bảo vệ quạt đồng tâm (4 vòng tròn + 2 thanh nan chéo chữ X bắt vào 4 góc quạt) */}
            {[0.09, 0.15, 0.21, 0.27].map((r, idx) => (
              <mesh
                key={`grille-ring-${idx}`}
                position={[-0.016, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                material={retroMaterials.galvanizedSteel}
              >
                <torusGeometry args={[r, 0.0055, 8, 28]} />
              </mesh>
            ))}
            {/* 2 thanh nan chéo chữ X của lưới quạt */}
            {[Math.PI / 4, -Math.PI / 4].map((ang, idx) => (
              <mesh
                key={`grille-cross-${idx}`}
                position={[-0.018, 0, 0]}
                rotation={[ang, 0, 0]}
                material={retroMaterials.galvanizedSteel}
              >
                <boxGeometry args={[0.008, 0.62, 0.008]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* =====================================================================
          3. BỐN ỐC VÍT MẶT LƯNG SIẾT CHẶT BỘ NGUỒN VÀO VỎ CASE (STEP 03)
         ===================================================================== */}
      {screwT > 0.01 && (
        <group>
          {[
            [0.34, -1.91],
            [1.12, -1.86],
            [0.14, -1.26],
            [1.12, -1.26],
          ].map(([sy, sz], idx) => {
            const sx = THREE.MathUtils.lerp(-1.65, -1.19, screwSmooth);
            return (
              <mesh
                key={`psu-screw-${idx}`}
                position={[sx, sy, sz]}
                rotation={[0, 0, Math.PI / 2]}
                material={retroMaterials.galvanizedSteel}
              >
                <cylinderGeometry args={[0.022, 0.022, 0.03, 6]} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* =====================================================================
          4. DÂY CÔNG TẮC NGUỒN CƠ (PHYSICAL POWER CABLE - TUBEGEOMETRY)
         ===================================================================== */}
      {cableT > 0.01 && (
        <group scale={[cableSmooth, 1, 1]}>
          <mesh
            geometry={powerCableGeo}
            castShadow
            receiveShadow
            material={retroMaterials.blackAnodized}
          />

          <group position={[2.14, 0.37, -1.85]}>
            <RoundedBox
              args={[0.14, 0.16, 0.14]}
              radius={0.008}
              smoothness={1}
              castShadow
              material={retroMaterials.isaBlack}
            />
            <mesh position={[0.075, 0, 0]} material={retroMaterials.galvanizedSteel}>
              <boxGeometry args={[0.02, 0.24, 0.16]} />
            </mesh>
            {[
              { y: -0.04, z: -0.035, color: '#6e3b1e' },
              { y: 0.04, z: -0.035, color: '#1a4b8c' },
              { y: -0.04, z: 0.035, color: '#1e1e1e' },
              { y: 0.04, z: 0.035, color: '#e6e2d8' },
            ].map((spade, idx) => (
              <mesh key={`spade-${idx}`} position={[-0.085, spade.y, spade.z]}>
                <boxGeometry args={[0.045, 0.025, 0.025]} />
                <meshStandardMaterial color={spade.color} roughness={0.6} />
              </mesh>
            ))}
          </group>
        </group>
      )}
    </group>
  );
}
