import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  createBjcBadgesTexture,
  createRearFeederPaperTexture,
  createCvPaperTexture,
} from './bjcPrinterTextures';
import { bjcPrinterAudio } from './bjcPrinterAudio';
import { useBuildStore } from '../../../store/useBuildStore';

export type PrinterState = 'IDLE' | 'PRINTING' | 'PRINTED_HANGING';

// Kích thước chuẩn Canon BJC-250 (1997)
const PAPER_W = 0.21;   // Rộng giấy A4 210mm
const PAPER_H = 0.297;  // Dài giấy A4 297mm
const PAPER_SEG_X = 24;
const PAPER_SEG_Y = 64;

interface PrinterSceneProps {
  printerState: PrinterState;
  setPrinterState: (state: PrinterState) => void;
  hoveredTarget: 'PRINTER' | 'PAPER' | null;
  setHoveredTarget: (target: 'PRINTER' | 'PAPER' | null) => void;
  onPrinterClick: () => void;
  onPaperClick: () => void;
}

function PrinterScene({
  printerState,
  setPrinterState,
  hoveredTarget,
  setHoveredTarget,
  onPrinterClick,
  onPaperClick,
}: PrinterSceneProps) {
  const soundEnabled = useBuildStore((s) => s.soundEnabled);

  const printerRigRef = useRef<THREE.Group>(null);
  const carriageRef = useRef<THREE.Group>(null);
  const feedingPaperRef = useRef<THREE.Mesh>(null);
  const outputPaperMeshRef = useRef<THREE.Mesh>(null);
  const ledMeshRef = useRef<THREE.Mesh>(null);

  const printProgressRef = useRef(0);
  const printDurationRef = useRef(6.2); // 6.2s in từ từ đúng thực tế
  const lastSoundStepTimeRef = useRef(0);

  // Khởi tạo Texture và Material
  const badgesTex = useMemo(() => createBjcBadgesTexture(), []);
  const rearPaperTex = useMemo(() => createRearFeederPaperTexture(), []);
  const cvPaperTex = useMemo(() => createCvPaperTexture(), []);

  const materials = useMemo(() => {
    return {
      // Vỏ nhựa đúc: màu trắng xám retro thập niên 90
      mainPlastic: new THREE.MeshStandardMaterial({
        color: '#d6d3cb',
        roughness: 0.65,
        metalness: 0.05,
      }),
      // Nắp đỉnh: màu kem ngà ngả vàng nhẹ theo thời gian
      topYellowed: new THREE.MeshStandardMaterial({
        color: '#d8d2be',
        roughness: 0.68,
        metalness: 0.05,
      }),
      // Hốc bán nguyệt: màu bóng tối cùng tông nhựa thân máy
      scoopCavity: new THREE.MeshStandardMaterial({
        color: '#cac5b8',
        roughness: 0.75,
        metalness: 0.05,
      }),
      // Khoang tối, con lăn và rãnh kỹ thuật
      darkCavity: new THREE.MeshStandardMaterial({
        color: '#1a1a1c',
        roughness: 0.85,
        metalness: 0.15,
      }),
      // Thanh trượt kim loại đầu in
      metalRail: new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.25,
        metalness: 0.90,
      }),
      // Cụm đầu phun (Carriage)
      carriageBox: new THREE.MeshStandardMaterial({
        color: '#222328',
        roughness: 0.60,
        metalness: 0.30,
      }),
      // Cổng LPT Parallel kim loại mạ kẽm chuẩn phần cứng 1997
      parallelPortMetal: new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        roughness: 0.30,
        metalness: 0.85,
      }),
      // Lõi chân cắm cổng LPT (nhựa kỹ thuật đen mờ)
      portInsert: new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.70,
        metalness: 0.20,
      }),
      // Tem thông số kỹ thuật mặt sau (nhôm xước ánh kim)
      specPlate: new THREE.MeshStandardMaterial({
        color: '#b0b5be',
        roughness: 0.40,
        metalness: 0.75,
      }),
      // Đèn LED trạng thái
      ledGreen: new THREE.MeshStandardMaterial({
        color: '#22c55e',
        emissive: '#16a34a',
        emissiveIntensity: 1.8,
        roughness: 0.2,
      }),
      ledAmber: new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        emissive: '#d97706',
        emissiveIntensity: 2.2,
        roughness: 0.2,
      }),
      ledOff: new THREE.MeshStandardMaterial({
        color: '#4b5563',
        roughness: 0.6,
      }),
      // Tem nhãn Canon & BJC-250 (nền trong suốt 100%, không bị viền chữ nhật)
      badgesPlane: new THREE.MeshStandardMaterial({
        map: badgesTex,
        roughness: 0.65,
        metalness: 0.05,
        transparent: true,
        alphaTest: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      // Giấy nạp khay sau (FrontSide duy nhất, tuyệt đối không nhìn xuyên qua lưng khay)
      rearPaperMat: new THREE.MeshStandardMaterial({
        map: rearPaperTex,
        roughness: 0.82,
        metalness: 0.02,
        side: THREE.FrontSide,
      }),
      // Giấy CV xuất ra phía trước
      outputCvMat: new THREE.MeshStandardMaterial({
        map: cvPaperTex,
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    };
  }, [badgesTex, rearPaperTex, cvPaperTex]);

  useEffect(() => {
    return () => {
      badgesTex.dispose();
      rearPaperTex.dispose();
      cvPaperTex.dispose();
    };
  }, [badgesTex, rearPaperTex, cvPaperTex]);

  // Lưới hình học tờ giấy A4 xuất ra (OutputCVSheet)
  const outputPaperGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(PAPER_W, PAPER_H, PAPER_SEG_X, PAPER_SEG_Y);
    geom.rotateX(Math.PI / 2);
    return geom;
  }, []);

  // 1. Hốc bán nguyệt (CenterScoop) mở miệng lên trên, cung cong võng xuống dưới (hình chữ U ngửa)
  const scoopGeom = useMemo(() => {
    const shape = new THREE.Shape();
    // Bắt đầu từ mép phẳng trên cùng (-0.038, 0), kẻ sang (0.038, 0)
    shape.moveTo(-0.038, 0);
    shape.lineTo(0.038, 0);
    // Đi từ góc 0 sang Math.PI theo chiều kim đồng hồ (clockwise = true)
    // -> điểm đầu (0.038, 0), võng cong xuống qua (0, -0.036), về điểm (-0.038, 0)
    shape.absarc(0, 0, 0.038, 0, Math.PI, true);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.0025,
      bevelEnabled: true,
      bevelThickness: 0.0008,
      bevelSize: 0.0008,
      bevelSegments: 2,
    });
  }, []);

  // 2. Vòm bán nguyệt đỉnh khay giấy sau (ArchBackplate)
  const archBackplateGeom = useMemo(() => {
    const shape = new THREE.Shape();
    // Vòm nửa elip rộng 0.16m, nhô cao 0.035m ở giữa
    shape.moveTo(-0.08, 0);
    shape.quadraticCurveTo(0, 0.038, 0.08, 0);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2,
    });
  }, []);

  // 3. Lưỡi đỡ giấy hình vòm cánh cung ở đáy trước (CurvedOutputLip)
  const curvedOutputLipGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const halfW = 0.11; // Rộng 0.22m
    shape.moveTo(-halfW, 0);
    // Đường cong hình cánh cung nhô ra 0.038m ở chính giữa
    shape.quadraticCurveTo(0, 0.038, halfW, 0);
    shape.lineTo(halfW, -0.012);
    shape.lineTo(-halfW, -0.012);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.0035,
      bevelEnabled: true,
      bevelThickness: 0.001,
      bevelSize: 0.001,
      bevelSegments: 2,
    });
  }, []);

  // VÒNG LẶP RENDER & VẬT LÝ UỐN CONG GIẤY (Physics Loop)
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const safeDelta = Math.min(delta, 0.05);

    // A. HIỆU ỨNG LƠ LỬNG ZERO-G
    if (printerRigRef.current) {
      const floatY = Math.sin(time * 1.5) * 0.007;
      const tiltX = Math.cos(time * 1.1) * 0.010;
      const tiltZ = Math.sin(time * 0.9) * 0.006;
      const swayY = Math.sin(time * 0.8) * 0.010;

      // Dịch vị trí sang trái (-0.08m) và xuống dưới (-0.04m) hài hòa trong khung chiều cao mới
      printerRigRef.current.position.x = -0.08;
      printerRigRef.current.position.y = -0.055 + floatY;
      printerRigRef.current.position.z = 0;
      printerRigRef.current.rotation.x = 0.10 + tiltX;
      // Góc xoay 3D isometric 3/4 tinh tế (-0.22 rad ~ 12.5 độ hướng mặt nhẹ về phía cụm chữ)
      printerRigRef.current.rotation.y = -0.22 + swayY;
      printerRigRef.current.rotation.z = tiltZ;
    }

    // B. STATE MACHINE: ĐIỀU PHỐI TIẾN ĐỘ IN
    if (printerState === 'PRINTING') {
      printProgressRef.current += safeDelta / printDurationRef.current;

      // Phát âm thanh đầu in quét ngang và bước kéo giấy theo chu kỳ
      if (time - lastSoundStepTimeRef.current > 0.32) {
        lastSoundStepTimeRef.current = time;
        bjcPrinterAudio.playCarriageSweep(soundEnabled);
        setTimeout(() => {
          bjcPrinterAudio.playPaperFeedStep(soundEnabled);
        }, 150);
      }

      // Đầu in chạy qua lại bên trong lòng máy
      if (carriageRef.current) {
        carriageRef.current.position.x = Math.sin(time * 14) * 0.105;
      }

      // Đèn LED nhấp nháy cam khi đang in
      if (ledMeshRef.current) {
        const blink = Math.sin(time * 12) > 0;
        ledMeshRef.current.material = blink ? materials.ledAmber : materials.ledOff;
      }

      // Giấy nạp ở khay sau tụt dần vào trong lòng máy (biến mất khi vào hết)
      if (feedingPaperRef.current) {
        if (printProgressRef.current >= 0.85) {
          feedingPaperRef.current.visible = false;
        } else {
          feedingPaperRef.current.visible = true;
          const drop = printProgressRef.current * 0.13;
          feedingPaperRef.current.position.y = 0.10 - drop;
          feedingPaperRef.current.scale.y = Math.max(0.01, 1.0 - printProgressRef.current * 0.85);
        }
      }

      // Hoàn tất in 100%: chuyển sang trạng thái TREO GIẤY
      if (printProgressRef.current >= 1.0) {
        printProgressRef.current = 1.0;
        setPrinterState('PRINTED_HANGING');
        if (ledMeshRef.current) {
          ledMeshRef.current.material = materials.ledGreen;
        }
      }
    } else {
      if (ledMeshRef.current) {
        ledMeshRef.current.material = materials.ledGreen;
      }
      if (carriageRef.current) {
        carriageRef.current.position.x = THREE.MathUtils.lerp(carriageRef.current.position.x, 0, safeDelta * 5);
      }
      if (printerState === 'IDLE' && feedingPaperRef.current) {
        feedingPaperRef.current.visible = true;
        feedingPaperRef.current.position.y = 0.10;
        feedingPaperRef.current.scale.y = 1.0;
      }
    }

    // C. VẬT LÝ UỐN CONG GIẤY THEO TRỌNG LỰC (ARC-LENGTH PRESERVING GRAVITY DROOP)
    // Delay thời điểm giấy bắt đầu nhả ra họng trước:
    // Giai đoạn đầu (progress < 0.35 ~ 2.1s): nạp giấy sau, đầu in quét bên trong, giấy trước CHƯA thò ra
    const emergeStartProgress = 0.35;
    const isEmerged = printerState === 'PRINTED_HANGING' || (printerState === 'PRINTING' && printProgressRef.current > emergeStartProgress);

    if (outputPaperMeshRef.current && isEmerged) {
      outputPaperMeshRef.current.visible = true;
      const posAttr = outputPaperMeshRef.current.geometry.attributes.position;
      const count = posAttr.count;

      // Tiến độ đùn giấy thực tế từ lúc bắt đầu thò ra ngoài họng máy
      const normalizedEmerge = printerState === 'PRINTED_HANGING'
        ? 1.0
        : Math.min(1.0, Math.max(0.0, (printProgressRef.current - emergeStartProgress) / (1.0 - emergeStartProgress)));

      const expelledLength = normalizedEmerge * PAPER_H * 0.90;
      const isPrinting = printerState === 'PRINTING';
      const isHanging = printerState === 'PRINTED_HANGING';

      // Khe thoát giấy chuẩn nằm tại y = 0.022, z = 0.075
      const slotY = 0.022;
      const slotZ = 0.075;
      const lipLength = 0.035;
      const lipSlope = 0.12; // góc dốc của lưỡi đỡ

      for (let i = 0; i < count; i++) {
        const origX = ((i % (PAPER_SEG_X + 1)) / PAPER_SEG_X - 0.5) * PAPER_W;
        const v = Math.floor(i / (PAPER_SEG_X + 1)) / PAPER_SEG_Y;
        const distFromLeadingEdge = (1.0 - v) * PAPER_H;

        const s = expelledLength - distFromLeadingEdge;

        if (s <= 0) {
          // BẮT BUỘC: ĐOẠN CHƯA THOÁT RA PHẢI THỤT GỌN TRONG CON LĂN HỌNG MÁY!
          // TUYỆT ĐỐI KHÔNG ĐƯỢC CHỌC RA PHÍA SAU LƯNG MÁY IN!
          posAttr.setXYZ(i, origX, slotY, slotZ);
        } else if (s <= lipLength) {
          // Đoạn trượt trên lưỡi đỡ khe thoát giấy
          const curY = slotY - s * Math.sin(lipSlope);
          const curZ = slotZ + s * Math.cos(lipSlope);
          posAttr.setXYZ(i, origX, curY, curZ);
        } else {
          // Đoạn rủ tự do xuống dưới theo trọng lực
          const freeS = s - lipLength;
          const thetaMax = 1.30; // ~75 độ chúc xuống
          const k = 26.0;
          const theta = thetaMax * (1.0 - Math.exp(-k * freeS * freeS));

          const vib = isPrinting ? Math.sin(time * 42) * 0.001 * s : 0;
          const sway = isHanging ? Math.sin(time * 1.8 + s * 5) * 0.0025 * s : 0;

          const baseLipY = slotY - lipLength * Math.sin(lipSlope);
          const baseLipZ = slotZ + lipLength * Math.cos(lipSlope);

          const curZ = baseLipZ + Math.cos(theta) * freeS;
          const curY = baseLipY - Math.sin(theta) * freeS + vib + sway;

          posAttr.setXYZ(i, origX, curY, curZ);
        }
      }

      posAttr.needsUpdate = true;
      outputPaperMeshRef.current.geometry.computeVertexNormals();
    } else if (outputPaperMeshRef.current) {
      outputPaperMeshRef.current.visible = false;
    }
  });

  return (
    <group ref={printerRigRef} position={[-0.08, -0.04, 0]} scale={1.05} rotation={[0.10, -0.22, 0]}>
      {/* =====================================================================
          1. TOÀN BỘ MÁY IN TRONG CÙNG HỆ TRỤC TỌA ĐỘ CHUẨN (KHÔNG BỊ LỆCH TRỤC)
         ===================================================================== */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onPrinterClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredTarget('PRINTER');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredTarget(null);
        }}
      >
        {/* 1.1 Khối Thân Chính Liền Khối (MainBody - Tâm tại 0, 0.08, 0) */}
        <RoundedBox
          args={[0.36, 0.14, 0.16]}
          radius={0.008}
          smoothness={4}
          position={[0, 0.08, 0]}
          castShadow
          receiveShadow
        >
          <primitive object={materials.mainPlastic} attach="material" />
        </RoundedBox>

        {/* 1.2 Khối Mặt Trước Bo Vát (FrontShell: z = 0.065, y = 0.082, rotation.x = -0.12) */}
        <group position={[0, 0.082, 0.065]} rotation={[-0.12, 0, 0]}>
          <RoundedBox
            args={[0.36, 0.135, 0.04]}
            radius={0.006}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <primitive object={materials.mainPlastic} attach="material" />
          </RoundedBox>

          {/* Tem nhãn Canon & BJC-250 gắn trực tiếp sát lên bề mặt FrontShell */}
          <mesh position={[0, -0.006, 0.0206]}>
            <planeGeometry args={[0.34, 0.085]} />
            <primitive object={materials.badgesPlane} attach="material" />
          </mesh>

          {/* Rãnh ngang mảnh (SeamLine) chạy suốt chiều ngang mặt trước, nối vào 2 mép hốc bán nguyệt */}
          <mesh position={[-0.108, 0.0672, 0.0205]}>
            <boxGeometry args={[0.14, 0.0015, 0.0012]} />
            <primitive object={materials.darkCavity} attach="material" />
          </mesh>
          <mesh position={[0.108, 0.0672, 0.0205]}>
            <boxGeometry args={[0.14, 0.0015, 0.0012]} />
            <primitive object={materials.darkCavity} attach="material" />
          </mesh>

          {/* Hốc bán nguyệt (CenterScoop) mở miệng phẳng lên trên, cung cong võng xuống dưới (hình chữ U ngửa ◡) */}
          <group position={[0, 0.0675, 0.0195]}>
            <mesh geometry={scoopGeom} castShadow receiveShadow>
              <primitive object={materials.scoopCavity} attach="material" />
            </mesh>
            {/* Khe dọc hẹp màu tối 2.5mm x 13mm ở sát đáy bán nguyệt */}
            <mesh position={[0, -0.024, 0.0028]}>
              <planeGeometry args={[0.0025, 0.013]} />
              <primitive object={materials.darkCavity} attach="material" />
            </mesh>
          </group>
        </group>

        {/* 1.3 Nắp Đỉnh (TopCover: y = 0.15, z = 0.01) */}
        <group position={[0, 0.15, 0.01]}>
          <RoundedBox
            args={[0.358, 0.022, 0.12]}
            radius={0.004}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <primitive object={materials.topYellowed} attach="material" />
          </RoundedBox>

          {/* 2 nút bấm nhỏ hình bầu dục màu xám và đèn LED trạng thái */}
          <group position={[0, 0.012, 0.02]}>
            {/* Nút Power */}
            <mesh position={[-0.025, 0, 0]} castShadow>
              <cylinderGeometry args={[0.007, 0.007, 0.003, 16]} />
              <meshStandardMaterial color="#64748b" roughness={0.4} />
            </mesh>
            {/* Nút Resume */}
            <mesh position={[0.005, 0, 0]} castShadow>
              <cylinderGeometry args={[0.007, 0.007, 0.003, 16]} />
              <meshStandardMaterial color="#64748b" roughness={0.4} />
            </mesh>
            {/* Đèn LED trạng thái */}
            <mesh ref={ledMeshRef} position={[0.032, 0.001, 0]}>
              <cylinderGeometry args={[0.004, 0.004, 0.002, 12]} />
              <primitive object={materials.ledGreen} attach="material" />
            </mesh>
          </group>
        </group>

        {/* 1.3b Nắp dốc phía sau đỉnh máy (RearTopDeck) - Đóng kín hoàn toàn khoảng hở, không lộ khoảng trống */}
        <group position={[0, 0.143, -0.054]} rotation={[-0.14, 0, 0]}>
          <RoundedBox
            args={[0.358, 0.018, 0.046]}
            radius={0.003}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <primitive object={materials.topYellowed} attach="material" />
          </RoundedBox>
          {/* Khe rãnh hẹp dẫn giấy vào máy */}
          <mesh position={[0, 0.008, 0.004]}>
            <boxGeometry args={[0.23, 0.004, 0.008]} />
            <primitive object={materials.darkCavity} attach="material" />
          </mesh>
        </group>

        {/* 1.4 Khối Đế Dưới (BaseTray: y = 0.0, z = 0.0) & Lưỡi Đỡ Giấy Vòm Cung */}
        <group position={[0, 0.0, 0.0]}>
          <RoundedBox
            args={[0.35, 0.025, 0.16]}
            radius={0.004}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <primitive object={materials.mainPlastic} attach="material" />
          </RoundedBox>

          {/* Lưỡi đỡ giấy hình vòm cánh cung nhô ra trước ở đáy khe thoát giấy */}
          <mesh
            geometry={curvedOutputLipGeom}
            position={[0, 0.010, 0.076]}
            rotation={[-Math.PI / 2 - 0.08, 0, 0]}
            castShadow
            receiveShadow
          >
            <primitive object={materials.mainPlastic} attach="material" />
          </mesh>
        </group>

        {/* 1.5 Hốc Khe Thoát Giấy (OutputSlot Cavity) */}
        <mesh position={[0, 0.018, 0.04]}>
          <boxGeometry args={[0.26, 0.014, 0.08]} />
          <primitive object={materials.darkCavity} attach="material" />
        </mesh>

        {/* 1.6 Nội thất bên trong: Thanh trượt kim loại & Cụm đầu phun (Nằm gọn trong lòng máy) */}
        <group position={[0, 0.06, 0.02]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.28, 16]} />
            <primitive object={materials.metalRail} attach="material" />
          </mesh>
          <group ref={carriageRef} position={[0, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.045, 0.032, 0.032]} />
              <primitive object={materials.carriageBox} attach="material" />
            </mesh>
          </group>
        </group>

        {/* 1.7 Mặt sau: Cổng LPT DB-25 kim loại, Ổ cắm AC & Tem kỹ thuật (Chìm phẳng vào thân vỏ, chuẩn 1997) */}
        <group position={[0, 0.048, -0.081]}>
          {/* Cụm Cổng LPT DB-25 kim loại chuẩn Centronics/Parallel */}
          <group position={[-0.075, 0, 0]}>
            <mesh position={[0, 0, 0.001]}>
              <boxGeometry args={[0.052, 0.018, 0.002]} />
              <primitive object={materials.parallelPortMetal} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.0022]}>
              <boxGeometry args={[0.044, 0.010, 0.001]} />
              <primitive object={materials.portInsert} attach="material" />
            </mesh>
            <mesh position={[-0.023, 0, 0.0025]}>
              <cylinderGeometry args={[0.0015, 0.0015, 0.002, 6]} />
              <primitive object={materials.parallelPortMetal} attach="material" />
            </mesh>
            <mesh position={[0.023, 0, 0.0025]}>
              <cylinderGeometry args={[0.0015, 0.0015, 0.002, 6]} />
              <primitive object={materials.parallelPortMetal} attach="material" />
            </mesh>
          </group>

          {/* Tem nhãn thông số kỹ thuật kim loại */}
          <mesh position={[0.005, 0, 0.001]}>
            <planeGeometry args={[0.065, 0.022]} />
            <primitive object={materials.specPlate} attach="material" />
          </mesh>

          {/* Ổ cắm nguồn AC 2 chân chìm */}
          <group position={[0.082, 0, 0]}>
            <mesh position={[0, 0, 0.001]}>
              <boxGeometry args={[0.026, 0.016, 0.002]} />
              <primitive object={materials.portInsert} attach="material" />
            </mesh>
            <mesh position={[-0.005, 0, 0.002]}>
              <cylinderGeometry args={[0.001, 0.001, 0.0015, 8]} />
              <primitive object={materials.parallelPortMetal} attach="material" />
            </mesh>
            <mesh position={[0.005, 0, 0.002]}>
              <cylinderGeometry args={[0.001, 0.001, 0.0015, 8]} />
              <primitive object={materials.parallelPortMetal} attach="material" />
            </mesh>
          </group>
        </group>

        {/* =====================================================================
            1.8 KHAY GIẤY ĐỨNG PHÍA SAU (FEEDERGROUP: y = 0.12, z = -0.055, rot.x = -0.22)
           ===================================================================== */}
        <group position={[0, 0.12, -0.055]} rotation={[-0.22, 0, 0]}>
          {/* Tấm lưng đỡ giấy (Backplate) */}
          <RoundedBox
            args={[0.24, 0.18, 0.008]}
            radius={0.004}
            smoothness={4}
            position={[0, 0.09, 0]}
            castShadow
            receiveShadow
          >
            <primitive object={materials.mainPlastic} attach="material" />
          </RoundedBox>

          {/* Vòm bán nguyệt đỉnh khay giấy sau (ArchBackplate) nhô cao thêm 0.035m làm điểm tựa lưng cao nhất */}
          <mesh
            geometry={archBackplateGeom}
            position={[0, 0.18, -0.003]}
            castShadow
            receiveShadow
          >
            <primitive object={materials.mainPlastic} attach="material" />
          </mesh>

          {/* Thanh kẹp mép giấy trái và phải */}
          <mesh position={[-0.11, 0.09, 0.008]}>
            <boxGeometry args={[0.012, 0.16, 0.012]} />
            <primitive object={materials.mainPlastic} attach="material" />
          </mesh>
          <mesh position={[0.11, 0.09, 0.008]}>
            <boxGeometry args={[0.012, 0.16, 0.012]} />
            <primitive object={materials.mainPlastic} attach="material" />
          </mesh>

          {/* Tờ giấy chờ nạp (InputSheet): Tọa độ cục bộ sát mặt trước tấm lưng */}
          <mesh
            ref={feedingPaperRef}
            position={[0, 0.10, 0.006]}
            castShadow
          >
            <planeGeometry args={[PAPER_W, 0.22]} />
            <primitive object={materials.rearPaperMat} attach="material" />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          2. TỜ GIẤY CV XUẤT RA PHÍA TRƯỚC (OUTPUT CV SHEET - GRAVITY DROOP)
         ===================================================================== */}
      <mesh
        ref={outputPaperMeshRef}
        geometry={outputPaperGeom}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onPaperClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredTarget('PAPER');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredTarget(null);
        }}
      >
        <primitive object={materials.outputCvMat} attach="material" />
      </mesh>
    </group>
  );
}

interface CanonBjcPrinterProps {
  onOpenCvModal: () => void;
}

export function CanonBjcPrinter({ onOpenCvModal }: CanonBjcPrinterProps) {
  const [printerState, setPrinterState] = useState<PrinterState>('IDLE');
  const [hoveredTarget, setHoveredTarget] = useState<'PRINTER' | 'PAPER' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const pointerDownInfo = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasAutoPrintedRef = useRef(false);

  // TỰ ĐỘNG IN TỪ TỪ KHI CUỘN TỚI LẦN ĐẦU TIÊN
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAutoPrintedRef.current) {
          hasAutoPrintedRef.current = true;
          // Chờ một thoáng ngắn (450ms) để người dùng kịp nhìn thấy máy in rồi tự động in từ từ
          setTimeout(() => {
            setPrinterState((prev) => {
              if (prev === 'IDLE') {
                bjcPrinterAudio.playButtonClick(true);
                return 'PRINTING';
              }
              return prev;
            });
          }, 450);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Click vào thân máy in: CHỈ kích hoạt in khi đang IDLE!
  // Tuyệt đối KHÔNG mở CV Modal khi click vào thân máy in!
  const handlePrinterClick = () => {
    if (printerState === 'IDLE') {
      bjcPrinterAudio.playButtonClick(true);
      setPrinterState('PRINTING');
    }
  };

  // Click vào tờ giấy CV: DUY NHẤT click vào tờ giấy mới mở Fullscreen CV Modal!
  const handlePaperClick = () => {
    if (printerState === 'PRINTED_HANGING') {
      onOpenCvModal();
    }
  };

  const getCursorStyle = () => {
    if (hoveredTarget === 'PAPER' && printerState === 'PRINTED_HANGING') return 'pointer';
    if (hoveredTarget === 'PRINTER' && printerState === 'IDLE') return 'pointer';
    return 'grab';
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      style={{ cursor: getCursorStyle() }}
    >
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.04, 1.22], fov: 32, near: 0.05, far: 20 }}
      >
        <ambientLight intensity={0.85} color="#dbeafe" />

        {/* 1. Key Light ấm chiếu từ góc trước-trên */}
        <directionalLight
          position={[0.45, 0.7, 0.8]}
          intensity={2.6}
          color="#fff5eb"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* 2. Fill Light dịu làm mềm khối */}
        <directionalLight
          position={[-0.5, 0.35, 0.6]}
          intensity={1.2}
          color="#93c5fd"
        />

        {/* 3. Rim Light 1: Đèn viền cam đỏ (#e85d4a) đồng bộ màu dấu & */}
        <pointLight
          position={[-0.55, 0.25, -0.45]}
          intensity={5.5}
          distance={3.0}
          color="#e85d4a"
        />

        {/* 4. Rim Light 2: Đèn viền trắng lạnh tách khối máy khỏi nền đen */}
        <pointLight
          position={[0.55, 0.3, -0.45]}
          intensity={4.5}
          distance={3.0}
          color="#f0f9ff"
        />

        <PrinterScene
          printerState={printerState}
          setPrinterState={setPrinterState}
          hoveredTarget={hoveredTarget}
          setHoveredTarget={setHoveredTarget}
          onPrinterClick={handlePrinterClick}
          onPaperClick={handlePaperClick}
        />

        {/* OrbitControls: Xoay 360 độ ngang, giới hạn góc dọc, TẮT ZOOM để không cản trở cuộn trang */}
        <OrbitControls
          ref={controlsRef}
          target={[-0.08, -0.04, 0]}
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.85}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.52}
        />
      </Canvas>
    </div>
  );
}

export default CanonBjcPrinter;
