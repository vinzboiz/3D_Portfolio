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
const WORKBENCH_FOV = 46.0;

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
 * Dịch chuyển điểm nhìn (lookAt) sang bên trái màn hình camera một khoảng vừa phải
 * (bằng cách trừ vector right của camera) để mô hình 3D luôn tự động định vị ở nửa phải màn hình
 * bất kể camera đang quay ở góc nào, chừa trọn vẹn nửa trái cho cột chữ giới thiệu!
 */
function computeFramedTarget(
  camPos: THREE.Vector3,
  rawTarget: THREE.Vector3,
  frameOffset: number
): THREE.Vector3 {
  const forward = new THREE.Vector3().subVectors(rawTarget, camPos).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(forward, up).normalize();
  return rawTarget.clone().addScaledVector(right, -frameOffset);
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

  useEffect(() => {
    const stepData = ASSEMBLY_STEPS[currentStep] ?? ASSEMBLY_STEPS[0];
    const pos = new THREE.Vector3(...stepData.cameraPos);
    const rawTarget = new THREE.Vector3(...stepData.cameraTarget);

    const landFactor = THREE.MathUtils.smoothstep(currentStep, 9.1, 9.85);
    const floatWeight = 1.0 - landFactor;
    const floatYWorld = (1.25 * floatWeight) * S.DESK_ITEMS_SCALE;

    pos.y += floatYWorld;
    rawTarget.y += floatYWorld;

    desiredPos.current.copy(pos);

    if (currentStep >= 1) {
      const offset = (currentStep >= 10 ? 1.55 : 3.55) * S.DESK_ITEMS_SCALE;
      desiredTarget.current.copy(computeFramedTarget(pos, rawTarget, offset));
    } else {
      desiredTarget.current.copy(rawTarget);
    }

    if (freeCam && currentStep >= 10 && controlsRef.current) {
      controlsRef.current.target.set(
        stepData.cameraTarget[0],
        stepData.cameraTarget[1],
        stepData.cameraTarget[2]
      );
      controlsRef.current.update();
    }
  }, [currentStep, freeCam]);

  useFrame((r3fState, delta) => {
    const state = useBuildStore.getState();
    const safeDelta = Math.min(delta, 0.05);
    const dt = safeDelta;

    // Helper giới hạn camera CHẶT CHẼ trong khuôn khổ căn phòng
    // Ngăn chặn tuyệt đối việc camera lọt vào dàn màn hình CRT phía sau (Z < -0.40m)
    // hoặc đâm xuyên qua sàn / bàn (Y < 0.10m) hoặc vượt qua tường trước / hông
    const clampCameraInRoom = () => {
      const minX = -1.25;  // Cách tường trái 17.5cm (tường = -1.425m)
      const maxX = 1.25;   // Cách tường phải 17.5cm (tường = +1.425m)
      const minY = 0.10;   // Luôn trên mặt bàn làm việc (mặt bàn = 0.00m, sàn = -0.75m)
      const maxY = 1.85;   // Dưới trần 20cm (trần = 2.05m)
      const minZ = -0.40;  // Phía trước dàn màn hình CRT (màn CRT nhô ra z = -0.56m)
      const maxZ = 1.68;   // Cách tường trước 22cm (tường = +1.90m)

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
        const step10 = ASSEMBLY_STEPS[10];
        controlsRef.current.target.set(
          step10.cameraTarget[0],
          step10.cameraTarget[1],
          step10.cameraTarget[2]
        );
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

    // Điều tiết scrollCurrent khi IDLE: Lerp đằm và thư thái (hệ số -3.2 thay vì -8.5)
    // giúp toàn bộ tiến trình lắp ráp linh kiện và chuyển động camera diễn ra chậm rãi (~1.2s), chi tiết và rõ nét
    if (state.stageTransition === 'IDLE') {
      const diff = state.scrollTarget - state.scrollCurrent;
      if (Math.abs(diff) > 0.0002) {
        const alpha = 1 - Math.exp(-3.2 * safeDelta);
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
    // TÍNH TOÁN VỊ TRÍ & GÓC NHÌN THEO TIẾN TRÌNH CUỘN SCROLLVAL (0.0 -> 12.0)
    // =========================================================================
    if (scrollVal < 1.0) {
      // 1. Phân đoạn HOME (0.0) -> ABOUT STEP 1 (1.0):
      const t = THREE.MathUtils.clamp(scrollVal, 0, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // power3.inOut

      const step1 = ASSEMBLY_STEPS[1];
      const step1Pos = new THREE.Vector3(...step1.cameraPos);
      const step1RawTarget = new THREE.Vector3(...step1.cameraTarget);

      // Lùi camera xa thêm 24% để khoảng cách tổng thể vừa vặn, nhìn thấy trọn vẹn bo mạch và linh kiện
      const toCam1 = new THREE.Vector3().subVectors(step1Pos, step1RawTarget);
      step1Pos.addScaledVector(toCam1, 0.24);

      const step1FramedTarget = computeFramedTarget(step1Pos, step1RawTarget, 3.55 * S.DESK_ITEMS_SCALE);

      desiredPos.current.lerpVectors(homePos, step1Pos, ease);
      desiredTarget.current.lerpVectors(homeTarget, step1FramedTarget, ease);

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
      // 2. Các bước lắp ráp Step 01 -> Step 10:
      // Duy trì FOV 40° ổn định
      if (Math.abs(persCam.fov - WORKBENCH_FOV) > 0.05) {
        persCam.fov = WORKBENCH_FOV;
        persCam.updateProjectionMatrix();
      }

      if (scrollVal <= 10.0) {
        // Nội suy mượt mà qua các góc nhìn động của từng bước (Dynamic Step Angles)
        const s = Math.min(9, Math.floor(scrollVal)); // 1..9
        const nextS = Math.min(10, s + 1);
        const frac = THREE.MathUtils.clamp(scrollVal - s, 0, 1);
        const ease = frac * frac * (3 - 2 * frac);

        const stepA = ASSEMBLY_STEPS[s];
        const stepB = ASSEMBLY_STEPS[nextS];

        const posA = new THREE.Vector3(...stepA.cameraPos);
        const posB = new THREE.Vector3(...stepB.cameraPos);
        const targetA = new THREE.Vector3(...stepA.cameraTarget);
        const targetB = new THREE.Vector3(...stepB.cameraTarget);

        const interpPos = new THREE.Vector3().lerpVectors(posA, posB, ease);
        const interpRawTarget = new THREE.Vector3().lerpVectors(targetA, targetB, ease);

        // Theo dõi độ nâng lơ lửng của cụm linh kiện ở Step 00 -> 09
        const landFactor = THREE.MathUtils.smoothstep(scrollVal, 9.1, 9.85);
        const floatWeight = 1.0 - landFactor;
        const floatYWorld = (1.25 * floatWeight) * S.DESK_ITEMS_SCALE;

        interpPos.y += floatYWorld;
        interpRawTarget.y += floatYWorld;

        // Lùi camera xa thêm 28% để bao quát trọn vẹn toàn bộ chiều cao thùng máy từ đỉnh đến đáy, không bị quá to
        const toCam = new THREE.Vector3().subVectors(interpPos, interpRawTarget);
        interpPos.addScaledVector(toCam, 0.28);

        // Đẩy mô hình sang nửa phải màn hình rõ rệt (3.55 -> 1.55) tạo khoảng thở thoáng đãng với khối text bên trái
        const progress1to10 = THREE.MathUtils.clamp((scrollVal - 1) / 9, 0, 1);
        const offsetAmount = THREE.MathUtils.lerp(3.55, 1.55, progress1to10) * S.DESK_ITEMS_SCALE;

        const framedTarget = computeFramedTarget(interpPos, interpRawTarget, offsetAmount);

        desiredPos.current.copy(interpPos);
        desiredTarget.current.copy(framedTarget);
      } else {
        // Step 10, 11, 12 (Projects & CV): Góc bao quát máy tính hoàn chỉnh & CRT
        const step10 = ASSEMBLY_STEPS[10];
        const step10Pos = new THREE.Vector3(...step10.cameraPos);
        const step10RawTarget = new THREE.Vector3(...step10.cameraTarget);

        // Lùi xa thêm 18% ở Step 10 để nhìn trọn vẹn màn hình CRT, bàn phím, chuột và đèn bàn
        const toCam10 = new THREE.Vector3().subVectors(step10Pos, step10RawTarget);
        step10Pos.addScaledVector(toCam10, 0.18);

        const framedTarget = computeFramedTarget(step10Pos, step10RawTarget, 1.55 * S.DESK_ITEMS_SCALE);

        desiredPos.current.copy(step10Pos);
        desiredTarget.current.copy(framedTarget);
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
      const step10 = ASSEMBLY_STEPS[10];
      const step10Pos = new THREE.Vector3(...step10.cameraPos);
      const step10RawTarget = new THREE.Vector3(...step10.cameraTarget);
      desiredPos.current.copy(step10Pos);
      desiredTarget.current.copy(computeFramedTarget(step10Pos, step10RawTarget, 1.25 * S.DESK_ITEMS_SCALE));
      const alpha = 1 - Math.exp(-4.2 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      smoothedTarget.current.lerp(desiredTarget.current, alpha);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
      prevTransitionRef.current = transition;
      return;
    }

    prevTransitionRef.current = transition;

    // Chuyển góc máy: cực kỳ đằm, lướt êm ái thư thái theo safeDelta * 2.2 (chậm lại chuẩn cinematic)
    const isTransitioning = state.stageTransition !== 'IDLE';
    const camAlpha = Math.min(1, safeDelta * (isTransitioning ? 2.8 : 2.2));

    camera.position.lerp(desiredPos.current, camAlpha);
    smoothedTarget.current.lerp(desiredTarget.current, camAlpha);
    camera.lookAt(smoothedTarget.current);
    if (scrollVal >= 0.95) {
      clampCameraInRoom();
    }
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
      minDistance={0.15}
      maxDistance={1.62}
    />
  );
}
