import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useBuildStore, type ProjectAppTransition } from '../../store/useBuildStore';
import { ASSEMBLY_STEPS } from '../../data/assemblySteps';
import { S } from '../../constants/scale';

const CRT_SCREEN_CENTER_POS = new THREE.Vector3(
  -0.85 * S.DESK_ITEMS_SCALE,
  1.786 * S.DESK_ITEMS_SCALE,
  1.013 * S.DESK_ITEMS_SCALE
);
const HOME_FOV = 70.0;
const WORKBENCH_FOV = 40.0;

// =========================================================================
// TỌA ĐỘ CAMERA HOME & HÀM TÍNH SCREEN-SPACE CAMERA RIGHT OFFSET
// Dịch chuyển camera target và position theo vector -camRight để linh kiện
// đang lắp ráp luôn được định vị tự nhiên ở nửa phải màn hình (52% -> 96%),
// để trống hoàn toàn nửa bên trái (0% -> 48%) cho cột chữ giới thiệu scroller!
// =========================================================================

// Step 00 (HOME): Nhìn bao quát căn phòng và mặt bàn từ góc cao
const HOME_CAM_POS = new THREE.Vector3(
  -6.2 * S.DESK_ITEMS_SCALE,
  7.2 * S.DESK_ITEMS_SCALE,
  9.2 * S.DESK_ITEMS_SCALE
);
const HOME_BASE_TARGET = new THREE.Vector3(
  0.0 * S.DESK_ITEMS_SCALE,
  1.4 * S.DESK_ITEMS_SCALE,
  -0.6 * S.DESK_ITEMS_SCALE
);

/**
 * Tính toán tọa độ Camera và Target theo từng bước lắp ráp với Screen-Space Right Offset
 */
function computeFramedStepTargetAndPos(scrollVal: number) {
  const clamped = THREE.MathUtils.clamp(scrollVal, 1.0, 10.0);
  const s = Math.floor(clamped);
  const frac = clamped - s;

  const stepA = ASSEMBLY_STEPS[s] || ASSEMBLY_STEPS[1];
  const stepB = ASSEMBLY_STEPS[Math.min(10, s + 1)] || stepA;

  const ease = frac * frac * (3 - 2 * frac); // smoothstep

  const posA = new THREE.Vector3(...stepA.cameraPos);
  const posB = new THREE.Vector3(...stepB.cameraPos);
  const targetA = new THREE.Vector3(...stepA.cameraTarget);
  const targetB = new THREE.Vector3(...stepB.cameraTarget);

  const basePos = new THREE.Vector3().lerpVectors(posA, posB, ease);
  const baseTarget = new THREE.Vector3().lerpVectors(targetA, targetB, ease);

  // Vector hướng nhìn từ Camera tới Target
  const forward = new THREE.Vector3().subVectors(baseTarget, basePos).normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  // Vector chỉ hướng Phải (Right) tương đối trong không gian ống kính
  const camRight = new THREE.Vector3().crossVectors(forward, worldUp).normalize();

  // Ở Step 10 (CRT toàn cảnh), giảm nhẹ offset để màn hình và chuột phím cân xứng
  const rightShiftFactor = THREE.MathUtils.lerp(
    1.75,
    1.30,
    THREE.MathUtils.clamp(clamped - 9.0, 0, 1)
  );
  const offsetDist = rightShiftFactor * S.DESK_ITEMS_SCALE;

  // Dịch cả target lẫn pos theo -camRight để linh kiện xuất hiện bên phải khung nhìn
  const finalTarget = baseTarget.clone().addScaledVector(camRight, -offsetDist);
  const finalPos = basePos.clone().addScaledVector(camRight, -offsetDist);

  // Khóa vùng an toàn (Camera Safe Bounding Box Clamp) ngay trên finalPos:
  // Luôn giữ Camera trong khoảng không gian mở phía trước mặt bàn, không bao giờ lùi ra sau tường CRT
  finalPos.x = THREE.MathUtils.clamp(finalPos.x, -3.2 * S.DESK_ITEMS_SCALE, 2.6 * S.DESK_ITEMS_SCALE);
  finalPos.y = THREE.MathUtils.clamp(finalPos.y, 2.3 * S.DESK_ITEMS_SCALE, 5.2 * S.DESK_ITEMS_SCALE);
  finalPos.z = THREE.MathUtils.clamp(finalPos.z, 2.6 * S.DESK_ITEMS_SCALE, 6.2 * S.DESK_ITEMS_SCALE);

  return { finalPos, finalTarget };
}

export function CameraRig() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);
  const { camera } = useThree();

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredPos = useRef(HOME_CAM_POS.clone());
  const desiredTarget = useRef(HOME_BASE_TARGET.clone());
  const smoothedTarget = useRef(HOME_BASE_TARGET.clone());
  const wasInspectRef = useRef(false);
  const prevTransitionRef = useRef<ProjectAppTransition>('IDLE');

  // Stationary Camera Look-Around: Lắng nghe chuột toàn màn hình CHỈ TẠI HOME
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = useBuildStore.getState();
      if (
        state.currentStep !== 0 ||
        state.scrollCurrent > 0.02 ||
        state.stageTransition !== 'IDLE' ||
        state.freeCam
      ) {
        if (mouseRef.current.x !== 0 || mouseRef.current.y !== 0) {
          mouseRef.current.x = 0;
          mouseRef.current.y = 0;
        }
        return;
      }
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((r3fState, delta) => {
    const state = useBuildStore.getState();
    const safeDelta = Math.min(delta, 0.05);
    const dt = safeDelta;

    // Helper giới hạn camera chặt chẽ trong không gian căn phòng
    const clampCameraInRoom = () => {
      // Khi đang trong các bước About (scrollVal >= 0.95) và không ở chế độ Project App / FreeCam:
      // Khóa chặt Z luôn ở phía trước bàn (Z >= 2.5 * S.DESK_ITEMS_SCALE), tuyệt đối không bao giờ lọt ra sau tường CRT
      const minZBound =
        state.scrollCurrent >= 0.95 && !state.isInsideProjectApp && !state.freeCam
          ? 2.5 * S.DESK_ITEMS_SCALE
          : -0.80;

      const minX = -1.30;
      const maxX = 1.30;
      const minY = 0.08;
      const maxY = 1.95;
      const minZ = minZBound;
      const maxZ = 1.75;

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, minY, maxY);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    };

    // =========================================================================
    // CHẾ ĐỘ FREE CAM & INSPECT (CHỈ KHI ĐÃ LẮP XONG STEP 10 VÀ BẬT FREECAM)
    // =========================================================================
    const isInspect = state.freeCam && state.currentStep >= 10;

    if (isInspect) {
      if (!wasInspectRef.current && controlsRef.current) {
        const { finalTarget } = computeFramedStepTargetAndPos(10.0);
        controlsRef.current.target.copy(finalTarget);
        controlsRef.current.update();
      }
      wasInspectRef.current = true;
      controlsRef.current?.update();
      clampCameraInRoom();
      return;
    }

    if (wasInspectRef.current) {
      wasInspectRef.current = false;
      desiredPos.current.copy(camera.position);
      if (controlsRef.current) {
        smoothedTarget.current.copy(controlsRef.current.target);
      }
    }

    // Điều tiết scrollCurrent khi IDLE
    if (state.stageTransition === 'IDLE') {
      const diff = state.scrollTarget - state.scrollCurrent;
      if (Math.abs(diff) > 0.0002) {
        const alpha = 1 - Math.exp(-8.5 * safeDelta);
        const nextScroll = THREE.MathUtils.lerp(state.scrollCurrent, state.scrollTarget, alpha);
        state.syncScrollCurrent(nextScroll);
      } else if (state.scrollCurrent !== state.scrollTarget) {
        state.syncScrollCurrent(state.scrollTarget);
      }
    }

    const scrollVal = state.scrollCurrent;
    const aspect = r3fState.size.width / Math.max(1, r3fState.size.height);
    const homeX = HOME_CAM_POS.x * (aspect < 1.0 ? 0.85 : 1.0);
    const homeY = HOME_CAM_POS.y * Math.min(1.2, aspect < 1.0 ? 1.15 : 1.0);
    const homeZ = HOME_CAM_POS.z * (aspect < 1.0 ? 1.08 : 1.0);
    const homePos = new THREE.Vector3(homeX, homeY, homeZ);
    const homeTarget = HOME_BASE_TARGET.clone();

    const persCam = camera as THREE.PerspectiveCamera;

    // =========================================================================
    // TÍNH TOÁN VỊ TRÍ & GÓC NHÌN THEO TIẾN TRÌNH CUỘN SCROLLVAL (0.0 -> 10.99)
    // =========================================================================
    if (scrollVal < 1.0) {
      // 1. Phân đoạn HOME (0.0) -> ABOUT STEP 1 (1.0):
      const t = THREE.MathUtils.clamp(scrollVal, 0, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // power3.inOut
      const { finalPos: step1Pos, finalTarget: step1Target } = computeFramedStepTargetAndPos(1.0);

      desiredPos.current.lerpVectors(homePos, step1Pos, ease);
      desiredTarget.current.lerpVectors(homeTarget, step1Target, ease);

      const targetFov = THREE.MathUtils.lerp(HOME_FOV, WORKBENCH_FOV, ease);
      if (Math.abs(persCam.fov - targetFov) > 0.05) {
        persCam.fov = targetFov;
        persCam.updateProjectionMatrix();
      }

      // Parallax chuột ở Home thuần túy
      const isPureHome =
        state.currentStep === 0 &&
        scrollVal <= 0.02 &&
        state.stageTransition === 'IDLE' &&
        !state.freeCam;

      if (!isPureHome) {
        smoothedMouse.current.x = 0;
        smoothedMouse.current.y = 0;
      } else {
        const mouseLerpSpeed = safeDelta * 2.2;
        smoothedMouse.current.x = THREE.MathUtils.lerp(
          smoothedMouse.current.x,
          mouseRef.current.x,
          mouseLerpSpeed
        );
        smoothedMouse.current.y = THREE.MathUtils.lerp(
          smoothedMouse.current.y,
          mouseRef.current.y,
          mouseLerpSpeed
        );

        const yawOffset = smoothedMouse.current.x * (1.15 * S.DESK_ITEMS_SCALE);
        const pitchOffset = smoothedMouse.current.y * (0.65 * S.DESK_ITEMS_SCALE);
        const depthOffset = -smoothedMouse.current.x * (0.45 * S.DESK_ITEMS_SCALE);

        desiredTarget.current.x += yawOffset;
        desiredTarget.current.y += pitchOffset;
        desiredTarget.current.z += depthOffset;
      }
    } else {
      // 2. Step 01 -> Step 10: Xoay chuyển đa hướng mượt mà theo từng bước,
      // tự động tính Screen-Space Camera Right Offset để phần cứng luôn nằm bên phải
      const { finalPos, finalTarget } = computeFramedStepTargetAndPos(scrollVal);
      desiredPos.current.copy(finalPos);
      desiredTarget.current.copy(finalTarget);

      // Camera Safe Bounding Box Clamp: Khóa cứng vùng an toàn của Camera luôn nằm ở không gian phía trước mặt bàn
      if (scrollVal >= 1.0 && !state.isInsideProjectApp) {
        desiredPos.current.x = THREE.MathUtils.clamp(
          desiredPos.current.x,
          -3.2 * S.DESK_ITEMS_SCALE,
          2.6 * S.DESK_ITEMS_SCALE
        );
        desiredPos.current.y = THREE.MathUtils.clamp(
          desiredPos.current.y,
          2.3 * S.DESK_ITEMS_SCALE,
          5.2 * S.DESK_ITEMS_SCALE
        );
        desiredPos.current.z = THREE.MathUtils.clamp(
          desiredPos.current.z,
          2.6 * S.DESK_ITEMS_SCALE,
          6.2 * S.DESK_ITEMS_SCALE
        ); // Luôn giữ Z >= 2.6 * S.DESK_ITEMS_SCALE ở phía trước bàn
      }

      if (Math.abs(persCam.fov - WORKBENCH_FOV) > 0.05) {
        persCam.fov = WORKBENCH_FOV;
        persCam.updateProjectionMatrix();
      }
    }

    // =========================================================================
    // CÁC PHA CHUYỂN CẢNH ĐI VÀO / THOÁT RA ỨNG DỤNG "MY PROJECTS" (CRT DIVE)
    // =========================================================================
    const transition = state.projectAppTransition;

    if (transition === 'EXPANDING_ON_CRT') {
      smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredPos.current.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.65);
      const alpha = 1 - Math.exp(-6.0 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      camera.lookAt(CRT_SCREEN_CENTER_POS);
      clampCameraInRoom();
      prevTransitionRef.current = transition;
      return;
    }

    if (transition === 'DIVING_CAMERA') {
      smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredPos.current.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.05);
      const alpha = 1 - Math.exp(-7.8 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      camera.lookAt(CRT_SCREEN_CENTER_POS);
      clampCameraInRoom();
      prevTransitionRef.current = transition;
      return;
    }

    if (transition === 'EXITING_CAMERA') {
      if (prevTransitionRef.current !== 'EXITING_CAMERA') {
        camera.position.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.05);
        smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      }
      const { finalPos: step10Pos, finalTarget: step10Target } = computeFramedStepTargetAndPos(10.0);
      desiredPos.current.copy(step10Pos);
      desiredTarget.current.copy(step10Target);
      const alpha = 1 - Math.exp(-4.2 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      smoothedTarget.current.lerp(desiredTarget.current, alpha);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
      prevTransitionRef.current = transition;
      return;
    }

    prevTransitionRef.current = transition;

    // Chuyển góc máy: cực kỳ đằm, lướt êm ái theo safeDelta * 3.8
    const isTransitioning = state.stageTransition !== 'IDLE';
    const camAlpha = Math.min(1, safeDelta * (isTransitioning ? 4.5 : 3.8));

    camera.position.lerp(desiredPos.current, camAlpha);
    smoothedTarget.current.lerp(desiredTarget.current, camAlpha);
    camera.lookAt(smoothedTarget.current);
    clampCameraInRoom();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={freeCam && currentStep >= 10}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minPolarAngle={Math.PI * 0.08}
      minAzimuthAngle={-Math.PI * 0.65}
      maxAzimuthAngle={Math.PI * 0.65}
      minDistance={0.12}
      maxDistance={1.62}
    />
  );
}
