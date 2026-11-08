import { useMemo, useEffect } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smooth(v: number, min: number, max: number): number {
  const t = clamp01((v - min) / (max - min));
  return t * t * (3 - 2 * t);
}

/**
 * Tạo CanvasTexture kẻ sọc 40 sợi dây xám nhám kèm 1 viền đỏ đậm ở mép (Pin 1 Red Stripe)
 */
function createRibbonStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Nền nhựa PVC xám nhám (#9ea3a8)
  ctx.fillStyle = '#9ea3a8';
  ctx.fillRect(0, 0, 256, 256);

  // Kẻ 40 rãnh sợi dây đồng song song
  for (let i = 0; i < 40; i++) {
    const x = (i / 40) * 256;
    ctx.fillStyle = i % 2 === 0 ? '#adb2b8' : '#858a90';
    ctx.fillRect(x, 0, 256 / 40 - 1, 256);
  }

  // Sợi viền đỏ đậm đánh dấu Pin 1 (Pin 1 Red Stripe #b82525) ở mép cáp
  ctx.fillStyle = '#b82525';
  ctx.fillRect(0, 0, 22, 256);
  ctx.fillRect(234, 0, 22, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Helper dựng cáp dẹt ExtrudeGeometry dọc theo đường cong CatmullRomCurve3 kèm viền đỏ Pin 1 nổi
 */
function createFlatRibbonMeshes(
  waypoints: [number, number, number][],
  ribbonWidth: number,
  ribbonThickness = 0.012
) {
  const curve = new THREE.CatmullRomCurve3(
    waypoints.map((p) => new THREE.Vector3(...p)),
    false,
    'catmullrom',
    0.45
  );

  const halfW = ribbonWidth / 2;
  const halfT = ribbonThickness / 2;

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-halfW, -halfT);
  bodyShape.lineTo(halfW, -halfT);
  bodyShape.lineTo(halfW, halfT);
  bodyShape.lineTo(-halfW, halfT);
  bodyShape.closePath();

  const stripeW = ribbonWidth * 0.095;
  const stripeShape = new THREE.Shape();
  stripeShape.moveTo(-halfW, -halfT * 1.12);
  stripeShape.lineTo(-halfW + stripeW, -halfT * 1.12);
  stripeShape.lineTo(-halfW + stripeW, halfT * 1.12);
  stripeShape.lineTo(-halfW, halfT * 1.12);
  stripeShape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 60,
    bevelEnabled: false,
    extrudePath: curve,
  };

  return {
    bodyGeo: new THREE.ExtrudeGeometry(bodyShape, extrudeSettings),
    stripeGeo: new THREE.ExtrudeGeometry(stripeShape, extrudeSettings),
  };
}

export interface RibbonCablesProps {
  /** Tiến trình lắp 3 sợi cáp dẹt IDE 1, IDE 2 & Floppy Twisted ở Step 07 (0 -> 1) */
  ribbonInstallProgress: number;
}

export function RibbonCables({ ribbonInstallProgress }: RibbonCablesProps) {
  const ribbonTex = useMemo(() => createRibbonStripeTexture(), []);

  // 1. Cáp Primary IDE (40-pin): Cổng IDE 1 trên Mainboard [0.92, 0.20, -0.22] -> uốn chữ S lên đuôi HDD Quantum Fireball [1.21, 0.78, -0.17]
  const primaryIde = useMemo(
    () =>
      createFlatRibbonMeshes(
        [
          [0.92, 0.2, -0.22],
          [0.95, 0.42, -0.21],
          [1.06, 0.56, -0.19],
          [1.14, 0.74, -0.18],
          [1.21, 0.78, -0.17],
        ],
        0.24,
        0.012
      ),
    []
  );

  // 2. Cáp Secondary IDE (40-pin): Cổng IDE 2 trên Mainboard [0.92, 0.20, 0.18] -> vươn lên đuôi ổ quang Creative 24X CD-ROM [1.33, 0.63, -1.59]
  const secondaryIde = useMemo(
    () =>
      createFlatRibbonMeshes(
        [
          [0.92, 0.2, 0.18],
          [1.02, 0.56, 0.14],
          [1.12, 0.68, -0.48],
          [1.16, 0.7, -1.12],
          [1.33, 0.63, -1.59],
        ],
        0.24,
        0.012
      ),
    []
  );

  // 3. Cáp Floppy (34-pin Twisted): Bản hẹp hơn cáp IDE (0.185), nối từ cổng FDD [0.92, 0.20, 0.54] lên ổ mềm Sony MPF920 [1.55, 0.80, -0.39]
  //    kèm chi tiết đoạn xoắn đảo chiều (Twist) đặc trưng ở gần đầu cắm vào ổ mềm!
  const floppyMain = useMemo(
    () =>
      createFlatRibbonMeshes(
        [
          [0.92, 0.2, 0.54],
          [1.04, 0.48, 0.48],
          [1.24, 0.64, 0.1],
          [1.38, 0.76, -0.22], // Điểm trước đoạn xoắn đảo chiều Drive A:
        ],
        0.185,
        0.011
      ),
    []
  );

  // Hai dải chéo tạo hình đoạn xoắn đảo chiều (7-wire Twist) ngay trước đầu cắm ổ mềm Sony MPF920
  const floppyTwistLeft = useMemo(
    () =>
      createFlatRibbonMeshes(
        [
          [1.38, 0.76, -0.22],
          [1.46, 0.82, -0.31],
          [1.55, 0.8, -0.39],
        ],
        0.075,
        0.011
      ),
    []
  );

  const floppyTwistRight = useMemo(
    () =>
      createFlatRibbonMeshes(
        [
          [1.38, 0.76, -0.22],
          [1.46, 0.76, -0.32],
          [1.55, 0.8, -0.39],
        ],
        0.095,
        0.011
      ),
    []
  );

  useEffect(() => {
    return () => {
      ribbonTex.dispose();
      primaryIde.bodyGeo.dispose();
      primaryIde.stripeGeo.dispose();
      secondaryIde.bodyGeo.dispose();
      secondaryIde.stripeGeo.dispose();
      floppyMain.bodyGeo.dispose();
      floppyMain.stripeGeo.dispose();
      floppyTwistLeft.bodyGeo.dispose();
      floppyTwistLeft.stripeGeo.dispose();
      floppyTwistRight.bodyGeo.dispose();
      floppyTwistRight.stripeGeo.dispose();
    };
  }, [
    ribbonTex,
    primaryIde,
    secondaryIde,
    floppyMain,
    floppyTwistLeft,
    floppyTwistRight,
  ]);

  const p = clamp01(ribbonInstallProgress);

  // Pha 1 (0.00 -> 0.36): Cáp Primary IDE (HDD Quantum Fireball)
  const priT = smooth(p, 0.0, 0.36);
  // Pha 2 (0.32 -> 0.68): Cáp Secondary IDE (Creative 24X CD-ROM)
  const secT = smooth(p, 0.32, 0.68);
  // Pha 3 (0.64 -> 1.00): Cáp Floppy 34-pin Twisted (Sony MPF920)
  const fddT = smooth(p, 0.64, 1.0);

  return (
    <group>
      {/* =====================================================================
          1. CÁP PRIMARY IDE (40-PIN): MAINBOARD IDE 1 -> Ổ CỨNG QUANTUM FIREBALL
         ===================================================================== */}
      {priT > 0.01 && (
        <group
          position={[0, (1 - priT) * 0.38, 0]}
          scale={[1, THREE.MathUtils.lerp(0.25, 1, priT), 1]}
        >
          <mesh geometry={primaryIde.bodyGeo} castShadow receiveShadow>
            <meshStandardMaterial
              map={ribbonTex}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={primaryIde.stripeGeo}
            material={retroMaterials.ribbonRed}
          />

          {/* Đầu giắc nhựa đen IDC 40-pin tại cổng PRI_IDE1 trên Mainboard */}
          <RoundedBox
            args={[0.11, 0.068, 0.32]}
            radius={0.004}
            smoothness={1}
            position={[0.92, 0.2, -0.22]}
            castShadow
            material={retroMaterials.isaBlack}
          />
          {/* Đầu giắc nhựa đen IDC 40-pin cắm vào đuôi ổ cứng Quantum Fireball */}
          <RoundedBox
            args={[0.058, 0.22, 0.052]}
            radius={0.004}
            smoothness={1}
            position={[1.21, 0.78, -0.17]}
            castShadow
            material={retroMaterials.isaBlack}
          />
        </group>
      )}

      {/* =====================================================================
          2. CÁP SECONDARY IDE (40-PIN): MAINBOARD IDE 2 -> Ổ QUANG CREATIVE 24X CD-ROM
         ===================================================================== */}
      {secT > 0.01 && (
        <group
          position={[0, (1 - secT) * 0.42, 0]}
          scale={[1, THREE.MathUtils.lerp(0.25, 1, secT), 1]}
        >
          <mesh geometry={secondaryIde.bodyGeo} castShadow receiveShadow>
            <meshStandardMaterial
              map={ribbonTex}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={secondaryIde.stripeGeo}
            material={retroMaterials.ribbonRed}
          />

          {/* Đầu giắc nhựa đen IDC 40-pin tại cổng SEC_IDE2 trên Mainboard */}
          <RoundedBox
            args={[0.11, 0.068, 0.32]}
            radius={0.004}
            smoothness={1}
            position={[0.92, 0.2, 0.18]}
            castShadow
            material={retroMaterials.isaBlack}
          />
          {/* Đầu giắc nhựa đen IDC 40-pin cắm vào đuôi ổ CD-ROM Creative 24X */}
          <RoundedBox
            args={[0.058, 0.26, 0.055]}
            radius={0.004}
            smoothness={1}
            position={[1.33, 0.63, -1.59]}
            castShadow
            material={retroMaterials.isaBlack}
          />
        </group>
      )}

      {/* =====================================================================
          3. CÁP FLOPPY (34-PIN TWISTED): MAINBOARD FDD -> Ổ MỀM SONY MPF920
             Có đoạn xoắn đảo chiều (Twist) đặc trưng ở gần đầu cắm vào ổ mềm
         ===================================================================== */}
      {fddT > 0.01 && (
        <group
          position={[0, (1 - fddT) * 0.38, 0]}
          scale={[1, THREE.MathUtils.lerp(0.25, 1, fddT), 1]}
        >
          {/* Thân chính cáp Floppy 34-pin */}
          <mesh geometry={floppyMain.bodyGeo} castShadow receiveShadow>
            <meshStandardMaterial
              map={ribbonTex}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={floppyMain.stripeGeo}
            material={retroMaterials.ribbonRed}
          />

          {/* Đoạn xoắn đảo chiều (Twist) gồm 2 nhánh chéo nhau trước đầu cắm ổ mềm */}
          <mesh geometry={floppyTwistLeft.bodyGeo} castShadow>
            <meshStandardMaterial
              map={ribbonTex}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={floppyTwistLeft.stripeGeo}
            material={retroMaterials.ribbonRed}
          />
          <mesh geometry={floppyTwistRight.bodyGeo} castShadow>
            <meshStandardMaterial
              map={ribbonTex}
              roughness={0.78}
              metalness={0.05}
            />
          </mesh>

          {/* Đầu giắc nhựa đen IDC 34-pin tại cổng FLOPPY trên Mainboard */}
          <RoundedBox
            args={[0.1, 0.062, 0.26]}
            radius={0.004}
            smoothness={1}
            position={[0.92, 0.2, 0.54]}
            castShadow
            material={retroMaterials.isaBlack}
          />
          {/* Đầu giắc nhựa đen IDC 34-pin cắm vào đuôi ổ mềm Sony MPF920 */}
          <RoundedBox
            args={[0.052, 0.2, 0.048]}
            radius={0.004}
            smoothness={1}
            position={[1.55, 0.8, -0.39]}
            castShadow
            material={retroMaterials.isaBlack}
          />
        </group>
      )}
    </group>
  );
}

