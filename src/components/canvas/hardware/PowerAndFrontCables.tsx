import { useMemo, useEffect } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials, RETRO_PBR_PARAMS } from '../materials/retroMaterials';
import { SOCKET7_LOCAL_POS } from './Motherboard';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smooth(v: number, min: number, max: number): number {
  const t = clamp01((v - min) / (max - min));
  return t * t * (3 - 2 * t);
}

export interface PowerAndFrontCablesProps {
  /** Tiến trình Step 06: Cắm giắc nguồn AT P8/P9 (Black-to-Black), Molex 4-pin, Berg 4-pin & Dây quạt CPU 3-pin (0 -> 1) */
  powerCableProgress: number;
  /** Tiến trình Step 08: Cắm cụm dây tín hiệu mặt trước (HDD LED, Power LED, Reset SW, Turbo SW, Speaker) (0 -> 1) */
  frontPanelProgress: number;
}

export function PowerAndFrontCables({
  powerCableProgress,
  frontPanelProgress,
}: PowerAndFrontCablesProps) {
  // ===========================================================================
  // A. CẶP GIẮC NGUỒN MAINBOARD AT P8 & P9 (STEP 06 - QUY TẮC "BLACK-TO-BLACK")
  // ===========================================================================
  const p8p9Wires = useMemo(() => {
    // 12 sợi dây chia làm 2 đầu P8 (6 sợi) và P9 (6 sợi):
    // 4 sợi dây ĐEN (GND) nằm sát nhau ở chính giữa!
    const wireColors = [
      '#ff6600', // P8-1: Power Good (Cam)
      '#cc1818', // P8-2: +5V (Đỏ)
      '#e6b800', // P8-3: +12V (Vàng)
      '#1a5fb4', // P8-4: -12V (Xanh dương)
      '#141413', // P8-5: GND (ĐEN - Giữa)
      '#141413', // P8-6: GND (ĐEN - Giữa)
      '#141413', // P9-1: GND (ĐEN - Giữa)
      '#141413', // P9-2: GND (ĐEN - Giữa)
      '#e6e2d8', // P9-3: -5V (Trắng)
      '#cc1818', // P9-4: +5V (Đỏ)
      '#cc1818', // P9-5: +5V (Đỏ)
      '#cc1818', // P9-6: +5V (Đỏ)
    ];

    return wireColors.map((color, i) => {
      // Bó chụm 12 sợi dây đi từ đúng tâm lỗ cắm Port 2 [-0.09, 0.86, -1.60] trên mặt +X của bộ nguồn Seasonic,
      // sau đó mới xòe phẳng thành dải 12 sợi cắm vào 2 đầu giắc P8 & P9 trên Mainboard
      const ringAngle = (i / 12) * Math.PI * 2;
      const ringRadius = i < 4 ? 0.014 : 0.028;
      const yPort = 0.86 + Math.cos(ringAngle) * ringRadius;
      const zPort = -1.6 + Math.sin(ringAngle) * ringRadius;

      const zEnd = -0.82 - 0.205 + i * 0.037;
      const zMid = -1.26 + (i - 5.5) * 0.024;
      const curve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.12, yPort, zPort),
          new THREE.Vector3(0.05, yPort, zPort),
          new THREE.Vector3(0.44, 0.78, zMid),
          new THREE.Vector3(0.86, 0.48, zEnd),
          new THREE.Vector3(0.94, 0.23, zEnd),
        ],
        false,
        'centripetal',
        0.5
      );
      const geo = new THREE.TubeGeometry(curve, 36, 0.0082, 8, false);
      return { geo, color };
    });
  }, []);

  // ===========================================================================
  // B. CÁP NGUỒN Ổ ĐĨA MOLEX 4-PIN, BERG 4-PIN & DÂY QUẠT CPU 3-PIN (STEP 06)
  // ===========================================================================
  const molexHarnessWires = useMemo(() => {
    // 4 sợi dây chuẩn màu: Vàng (+12V), Đen (GND), Đen (GND), Đỏ (+5V)
    const rails = [
      { dy: 0.018, dz: -0.012, color: '#e6b800' }, // +12V Yellow
      { dy: 0.006, dz: 0.012, color: '#141413' }, // GND Black
      { dy: -0.006, dz: -0.012, color: '#141413' }, // GND Black
      { dy: -0.018, dz: 0.012, color: '#cc1818' }, // +5V Red
    ];

    return rails.map((rail) => {
      // Nhánh chính xuất phát từ đúng tâm lỗ cắm Port 3 [-0.09, 1.04, -1.46] của bộ nguồn Seasonic
      // -> Ổ CD-ROM Creative 24X (Bay 1: Y=0.68, Z=-1.59) -> Ổ cứng Quantum Fireball (Y=0.85, Z=-0.17)
      const mainCurve = new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.12, 1.04 + rail.dy, -1.46 + rail.dz),
          new THREE.Vector3(0.06, 1.04 + rail.dy, -1.46 + rail.dz),
          new THREE.Vector3(0.65, 0.98 + rail.dy, -1.54),
          new THREE.Vector3(1.3, 0.96 + rail.dy, -1.59), // Đuôi ổ CD-ROM Creative
          new THREE.Vector3(1.18, 0.96 + rail.dy, -0.92),
          new THREE.Vector3(1.19, 1.01 + rail.dy, -0.17), // Đuôi ổ cứng Quantum Fireball
        ],
        false,
        'centripetal',
        0.5
      );

      // Nhánh phụ Berg 4-pin rẽ vào đuôi ổ mềm Sony MPF920 (Khay 3.5" trên: Y=0.85, Z=-0.39)
      const bergCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.18, 0.96 + rail.dy * 0.7, -0.92),
        new THREE.Vector3(1.36, 0.98 + rail.dy * 0.7, -0.58),
        new THREE.Vector3(1.53, 0.98 + rail.dy * 0.7, -0.39), // Đuôi ổ mềm Sony MPF920 (cổng Berg tại Y = 0.85 + 0.13 = 0.98)
      ]);

      return {
        mainGeo: new THREE.TubeGeometry(mainCurve, 36, 0.0075, 8, false),
        bergGeo: new THREE.TubeGeometry(bergCurve, 18, 0.0055, 8, false),
        color: rail.color,
      };
    });
  }, []);

  // Dây nhỏ 3-pin nối từ quạt CPU Cooler Master xuống chân CPU_FAN trên Mainboard
  const cpuFanWires = useMemo(() => {
    const fanColors = ['#141413', '#cc1818', '#e6b800']; // GND, +12V, Tachometer
    const sx = SOCKET7_LOCAL_POS[0];
    const sz = SOCKET7_LOCAL_POS[2];

    return fanColors.map((color, idx) => {
      const dz = (idx - 1) * 0.012;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx + 0.22, 0.31, sz - 0.18 + dz),
        new THREE.Vector3(sx + 0.34, 0.34, sz - 0.32 + dz),
        new THREE.Vector3(sx + 0.28, 0.22, sz - 0.42 + dz),
        new THREE.Vector3(sx + 0.18, 0.15, sz - 0.38 + dz),
      ]);
      return {
        geo: new THREE.TubeGeometry(curve, 20, 0.0045, 6, false),
        color,
      };
    });
  }, []);

  // ===========================================================================
  // C. CỤM DÂY TÍN HIỆU MẶT TRƯỚC (FRONT PANEL WIRES - STEP 08)
  //    Các cặp dây xoắn mảnh chạy dọc đáy case từ mặt nạ trước tới góc dưới phải Mainboard
  // ===========================================================================
  const frontPanelTwistedPairs = useMemo(() => {
    const pairs = [
      { zEnd: 1.05, c1: '#cc1818', c2: '#f2efe6', name: 'HDD LED' }, // Đỏ - Trắng
      { zEnd: 1.1, c1: '#2eb844', c2: '#f2efe6', name: 'POWER LED' }, // Xanh - Trắng
      { zEnd: 1.15, c1: '#ff7700', c2: '#f2efe6', name: 'RESET SW' }, // Cam - Trắng
      { zEnd: 1.2, c1: '#141413', c2: '#e6b800', name: 'TURBO SW' }, // Đen - Vàng
      { zEnd: 1.25, c1: '#cc1818', c2: '#141413', name: 'SPEAKER' }, // Đỏ - Đen
    ];

    return pairs.map((pair, pIdx) => {
      // Tạo hiệu ứng 2 sợi dây xoắn vào nhau (Helix Twist) dọc theo đường đi từ mặt nạ trước về góc phải dưới Mainboard
      const baseWaypoints = [
        new THREE.Vector3(2.08, 0.54 - pIdx * 0.04, 0.14 + pIdx * 0.04),
        new THREE.Vector3(1.92, 0.14, 0.68 + pIdx * 0.06),
        new THREE.Vector3(1.52, 0.11, 1.12 + pIdx * 0.035),
        new THREE.Vector3(1.15, 0.12, pair.zEnd + 0.04),
        new THREE.Vector3(0.9, 0.2, pair.zEnd),
      ];
      const baseCurve = new THREE.CatmullRomCurve3(baseWaypoints);
      const samples = 44;
      const pts1: THREE.Vector3[] = [];
      const pts2: THREE.Vector3[] = [];

      for (let s = 0; s <= samples; s++) {
        const u = s / samples;
        const center = baseCurve.getPoint(u);
        const angle = u * Math.PI * 18 + pIdx;
        const r = 0.0055 * Math.sin(u * Math.PI); // Xoắn ở giữa, chụm ở 2 đầu
        const dy = Math.cos(angle) * r;
        const dz = Math.sin(angle) * r;

        pts1.push(new THREE.Vector3(center.x, center.y + dy, center.z + dz));
        pts2.push(new THREE.Vector3(center.x, center.y - dy, center.z - dz));
      }

      const geo1 = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts1),
        40,
        0.0042,
        6,
        false
      );
      const geo2 = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts2),
        40,
        0.0042,
        6,
        false
      );

      return {
        geo1,
        geo2,
        c1: pair.c1,
        c2: pair.c2,
        zEnd: pair.zEnd,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      p8p9Wires.forEach((w) => w.geo.dispose());
      molexHarnessWires.forEach((m) => {
        m.mainGeo.dispose();
        m.bergGeo.dispose();
      });
      cpuFanWires.forEach((f) => f.geo.dispose());
      frontPanelTwistedPairs.forEach((fp) => {
        fp.geo1.dispose();
        fp.geo2.dispose();
      });
    };
  }, [p8p9Wires, molexHarnessWires, cpuFanWires, frontPanelTwistedPairs]);

  const pwrP = clamp01(powerCableProgress);
  const fpP = clamp01(frontPanelProgress);

  // Tiến trình con của Step 06:
  // 0.00 -> 0.45: Cặp giắc P8 & P9 trượt xuống cổng nguồn Mainboard
  const p8p9T = smooth(pwrP, 0.0, 0.45);
  // 0.35 -> 0.80: Các đầu Molex & Berg trượt vào đuôi 3 ổ đĩa
  const molexT = smooth(pwrP, 0.35, 0.8);
  // 0.70 -> 1.00: Giắc 3-pin của quạt CPU cắm xuống chân CPU_FAN
  const cpuFanT = smooth(pwrP, 0.7, 1.0);

  // Tiến trình con của Step 08:
  const fpSlideT = smooth(fpP, 0.0, 1.0);

  return (
    <group>
      {/* =====================================================================
          1. STEP 06: CẶP GIẮC NGUỒN AT P8/P9, MOLEX 4-PIN, BERG & CPU FAN 3-PIN
         ===================================================================== */}
      {pwrP > 0.01 && (
        <group>
          {/* A. Bó dây & 2 đầu giắc P8/P9 rời nhau (luôn neo cố định gốc dây trong lỗ cắm Port 2 của PSU) */}
          <group>
            {p8p9Wires.map((w, idx) => (
              <mesh key={`p8p9-w-${idx}`} geometry={w.geo} castShadow>
                <meshStandardMaterial color={w.color} roughness={0.5} metalness={0.05} />
              </mesh>
            ))}
          </group>

          {/* 2 Đầu cắm nhựa trắng P8 và P9 rời nhau cắm sát nhau trên cổng AT P8/P9 */}
          <group position={[0.94, 0.2 + (1 - p8p9T) * 0.18, -0.82]}>
            {/* Đầu cắm P8 (6-pin nửa Bắc) */}
            <RoundedBox
              args={[0.105, 0.068, 0.222]}
              radius={0.004}
              smoothness={1}
              position={[0, 0, -0.118]}
              castShadow
              material={retroMaterials.whiteSlot}
            />
            {/* Đầu cắm P9 (6-pin nửa Nam) */}
            <RoundedBox
              args={[0.105, 0.068, 0.222]}
              radius={0.004}
              smoothness={1}
              position={[0, 0, 0.118]}
              castShadow
              material={retroMaterials.whiteSlot}
            />
            {/* Vấu khóa nhựa trên lưng P8 và P9 */}
            <mesh position={[-0.056, 0, -0.118]} material={retroMaterials.whiteSlot}>
              <boxGeometry args={[0.015, 0.05, 0.16]} />
            </mesh>
            <mesh position={[-0.056, 0, 0.118]} material={retroMaterials.whiteSlot}>
              <boxGeometry args={[0.015, 0.05, 0.16]} />
            </mesh>
          </group>

          {/* B. Cáp nguồn Ổ đĩa Molex 4-pin & Berg 4-pin (neo cố định gốc dây trong lỗ cắm Port 3 của PSU) */}
          {pwrP > 0.3 && (
            <group>
              {molexHarnessWires.map((m, idx) => (
                <group key={`molex-harness-${idx}`}>
                  <mesh geometry={m.mainGeo} castShadow>
                    <meshStandardMaterial color={m.color} roughness={0.5} />
                  </mesh>
                  <mesh geometry={m.bergGeo} castShadow>
                    <meshStandardMaterial color={m.color} roughness={0.5} />
                  </mesh>
                </group>
              ))}

              {/* Đầu giắc nhựa trắng Molex 8981 cắm vào đuôi ổ CD-ROM Creative 24X */}
              <RoundedBox
                args={[0.065, 0.115, 0.052]}
                radius={0.004}
                smoothness={1}
                position={[1.31 - (1 - molexT) * 0.14, 0.96, -1.59]}
                castShadow
                material={retroMaterials.whiteSlot}
              />

              {/* Đầu giắc nhỏ Berg 4-pin cắm vào đuôi ổ mềm Sony MPF920 */}
              <RoundedBox
                args={[0.048, 0.075, 0.038]}
                radius={0.003}
                smoothness={1}
                position={[1.54 - (1 - molexT) * 0.14, 0.98, -0.39]}
                castShadow
                material={retroMaterials.whiteSlot}
              />

              {/* Đầu giắc nhựa trắng Molex 8981 cắm vào đuôi ổ cứng Quantum Fireball 3.2GB */}
              <RoundedBox
                args={[0.065, 0.105, 0.048]}
                radius={0.004}
                smoothness={1}
                position={[1.21 - (1 - molexT) * 0.14, 1.01, -0.17]}
                castShadow
                material={retroMaterials.whiteSlot}
              />
            </group>
          )}

          {/* C. Dây nhỏ 3-pin nối từ quạt CPU Cooler Master xuống chân CPU_FAN trên Mainboard */}
          {pwrP > 0.65 && (
            <group position={[0, (1 - cpuFanT) * 0.18, 0]}>
              {cpuFanWires.map((fw, idx) => (
                <mesh key={`cpufan-wire-${idx}`} geometry={fw.geo}>
                  <meshStandardMaterial color={fw.color} roughness={0.5} />
                </mesh>
              ))}
              {/* Đầu cắm 3-pin nhựa trắng nhỏ tại chân CPU_FAN */}
              <RoundedBox
                args={[0.032, 0.035, 0.042]}
                radius={0.003}
                smoothness={1}
                position={[
                  SOCKET7_LOCAL_POS[0] + 0.18,
                  0.145,
                  SOCKET7_LOCAL_POS[2] - 0.38,
                ]}
                material={retroMaterials.whiteSlot}
              />
            </group>
          )}
        </group>
      )}

      {/* =====================================================================
          2. STEP 08: CỤM DÂY TÍN HIỆU MẶT TRƯỚC (FRONT PANEL HEADERS)
             5 cặp dây xoắn đôi + Đầu giắc Dupont cắm vào góc dưới bên phải Mainboard
         ===================================================================== */}
      {fpP > 0.01 && (
        <group>
          {frontPanelTwistedPairs.map((fp, idx) => {
            // Hiệu ứng từng sợi trượt lần lượt vào hàng chân kim
            const itemT = smooth(fpSlideT, idx * 0.12, 0.52 + idx * 0.12);
            const dropOffset = (1 - itemT) * 0.36;

            return (
              <group key={`fp-twisted-${idx}`}>
                <group
                  position={[0, dropOffset * 0.3, 0]}
                  scale={[1, THREE.MathUtils.lerp(0.4, 1, itemT), 1]}
                >
                  <mesh geometry={fp.geo1} castShadow>
                    <meshStandardMaterial color={fp.c1} roughness={0.55} />
                  </mesh>
                  <mesh geometry={fp.geo2} castShadow>
                    <meshStandardMaterial color={fp.c2} roughness={0.55} />
                  </mesh>
                </group>

                {/* Đầu giắc nhựa đen Dupont (HDD LED, Power LED, Reset SW, Turbo SW, Speaker) */}
                <RoundedBox
                  args={[0.068, 0.048, 0.034]}
                  radius={0.003}
                  smoothness={1}
                  position={[0.9, 0.175 + dropOffset, fp.zEnd]}
                  castShadow
                >
                  <meshStandardMaterial {...RETRO_PBR_PARAMS.isaBlack} />
                </RoundedBox>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}

