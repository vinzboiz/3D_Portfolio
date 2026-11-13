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

// Góc nhìn HOME khi đã hoàn tất lắp ráp máy tính (Full Workstation Overview):
// Canh chuẩn chính diện trung tâm bao trọn Đèn bàn bên trái, Màn CRT ở giữa, Thùng máy InWin A500 bên phải, Bàn phím & Chuột
const HOME_COMPLETED_CAM_POS = new THREE.Vector3(
  0.25 * S.DESK_ITEMS_SCALE,
  4.6 * S.DESK_ITEMS_SCALE,
  13.2 * S.DESK_ITEMS_SCALE
);
const HOME_COMPLETED_TARGET = new THREE.Vector3(
  0.20 * S.DESK_ITEMS_SCALE,
  1.65 * S.DESK_ITEMS_SCALE,
  0.15 * S.DESK_ITEMS_SCALE
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
  const { camera, gl } = useThree();

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
      const isAtHome = state.currentStep === 0 && state.scrollCurrent <= 0.05;
      const isAtStep10 = state.currentStep >= 10;

      if ((!isAtHome && !isAtStep10) || state.stageTransition !== 'IDLE') {
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

    if (currentStep >= 10) {
      // Lùi camera xa thêm 46% ở Step 10 để nhìn trọn vẹn toàn bộ máy tính, đèn bàn, CRT, phím chuột
      const toCam10Init = new THREE.Vector3().subVectors(pos, rawTarget);
      pos.addScaledVector(toCam10Init, 0.46);
    }

    desiredPos.current.copy(pos);

    if (currentStep >= 1) {
      const stepOffset = currentStep >= 10 ? 0.08 : currentStep === 9 ? 1.85 : 2.85;
      const offset = stepOffset * S.DESK_ITEMS_SCALE;
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

    // Helper giới hạn camera CHẶT CHẼ trong khuôn khổ căn phòng Retro Lab
    // Ngăn chặn tuyệt đối việc camera lọt vào dàn màn hình CRT phía sau (Z < -0.45m)
    // hoặc đâm xuyên qua sàn / bàn (Y < 0.10m) hoặc vượt qua tường trước / hông
    const clampCameraInRoom = () => {
      const minX = -1.25;  // Cách tường trái 17.5cm (tường = -1.425m)
      const maxX = 1.25;   // Cách tường phải 17.5cm (tường = +1.425m)
      const minY = 0.10;   // Luôn trên mặt bàn làm việc (mặt bàn = 0.00m, sàn = -0.75m)
      const maxY = 1.85;   // Dưới trần 20cm (trần = 2.05m)
      const minZ = -0.45;  // Phía trước dàn màn hình CRT (màn CRT nhô ra z = -0.56m)
      const maxZ = 1.70;   // Cách rìa trước phòng 20cm (tường = +1.90m)

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

      // Giữ tâm ngắm (target) luôn quanh cụm máy tính trên bàn, không bị pan trôi ra xa
      if (controlsRef.current) {
        controlsRef.current.target.x = THREE.MathUtils.clamp(controlsRef.current.target.x, -0.60, 0.60);
        controlsRef.current.target.y = THREE.MathUtils.clamp(controlsRef.current.target.y, 0.08, 0.45);
        controlsRef.current.target.z = THREE.MathUtils.clamp(controlsRef.current.target.z, -0.25, 0.35);
      }

      // KHÓA CHẶT CAMERA TRONG KHÔNG GIAN CĂN PHÒNG RETRO LAB (YÊU CẦU NGƯỜI DÙNG)
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

    // Điều tiết scrollCurrent khi IDLE: Lerp mượt mà và dứt khoát (-6.5)
    // giúp phản hồi 1 nhịp cuộn = chuyển ngay 1 step (~380ms), camera và text cập nhật nhịp nhàng đồng bộ
    if (state.stageTransition === 'IDLE') {
      const diff = state.scrollTarget - state.scrollCurrent;
      if (Math.abs(diff) > 0.0002) {
        const alpha = 1 - Math.exp(-6.5 * safeDelta);
        const nextScroll = THREE.MathUtils.lerp(state.scrollCurrent, state.scrollTarget, alpha);
        state.syncScrollCurrent(nextScroll);
      } else if (state.scrollCurrent !== state.scrollTarget) {
        state.syncScrollCurrent(state.scrollTarget);
      }
    } else {
      // Điều tiết chuyển cảnh mượt mà qua cổng Portal khi stageTransition !== 'IDLE'
      const trans = state.stageTransition;
      if (trans === 'POST_ABOUT_TO_HOME' || trans === 'TO_HOME' || trans === 'TO_HOME_STEP1') {
        const currentP = state.homeTransitionProgress;
        const speed = safeDelta * 2.0; // ~500ms zoom out mượt về Home
        const nextP = Math.max(0, currentP - speed);
        state.setHomeTransitionProgress(nextP);
        state.syncScrollCurrent(nextP);

        if (nextP <= 0.005) {
          state.setHomeTransitionProgress(0);
          state.syncScrollCurrent(0);
          state.setStep(0);
          state.setStageTransition('IDLE');
        }
      } else if (trans === 'HOME_TO_ABOUT' || trans === 'HOME_TO_POST_ABOUT_INSPECT') {
        const currentP = state.homeTransitionProgress;
        const speed = safeDelta * 2.0;
        const targetStep = trans === 'HOME_TO_POST_ABOUT_INSPECT' ? 10 : (state.savedAssemblyStep || 1);
        const nextP = Math.min(1.0, currentP + speed);
        state.setHomeTransitionProgress(nextP);
        state.syncScrollCurrent(nextP * targetStep);

        if (nextP >= 0.995) {
          state.setHomeTransitionProgress(1.0);
          state.syncScrollCurrent(targetStep);
          state.setStep(targetStep);
          if (trans === 'HOME_TO_POST_ABOUT_INSPECT') {
            state.setFreeCam(true);
          }
          state.setStageTransition('IDLE');
        }
      } else if (trans === 'HOME_TO_PROJECT' || trans === 'TO_PROJECT') {
        state.setHomeTransitionProgress(0);
        state.syncScrollCurrent(0);
        state.setStep(0);
        state.setStageTransition('IDLE');
        const el = document.getElementById('projects-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (trans === 'HOME_TO_MY_CV' || trans === 'TO_MY_CV') {
        state.setHomeTransitionProgress(0);
        state.syncScrollCurrent(0);
        state.setStep(0);
        state.setStageTransition('IDLE');
        const el = document.getElementById('cv-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }

    const scrollVal = state.scrollCurrent;
    const aspect = r3fState.size.width / Math.max(1, r3fState.size.height);
    const baseHomePos = state.hasCompletedAssembly ? HOME_COMPLETED_CAM_POS : HOME_CAM_POS;
    const baseHomeTarget = state.hasCompletedAssembly ? HOME_COMPLETED_TARGET : HOME_BASE_TARGET;

    const homeX = baseHomePos.x * (aspect < 1.0 ? 0.85 : 1.0);
    const homeY = baseHomePos.y * Math.min(1.2, aspect < 1.0 ? 1.15 : 1.0);
    const homeZ = baseHomePos.z * (aspect < 1.0 ? 1.08 : 1.0);
    const homePos = new THREE.Vector3(homeX, homeY, homeZ);
    const homeTarget = baseHomeTarget.clone();

    const persCam = camera as THREE.PerspectiveCamera;

    // =========================================================================
    // XỬ LÝ CHUYỂN CẢNH ĐẶC BIỆT QUA CỔNG PORTAL (stageTransition !== 'IDLE')
    // Camera nội suy trực tiếp theo homeTransitionProgress (0.0 <-> 1.0)
    // Triệt tiêu 100% việc xoay ngược góc nhìn hoặc giật lag qua các bước trung gian!
    // =========================================================================
    const stageTransition = state.stageTransition;
    const homeP = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);

    if (stageTransition === 'POST_ABOUT_TO_HOME' || stageTransition === 'HOME_TO_POST_ABOUT_INSPECT') {
      const step10 = ASSEMBLY_STEPS[10];
      const step10Pos = new THREE.Vector3(...step10.cameraPos);
      const step10RawTarget = new THREE.Vector3(...step10.cameraTarget);
      const toCam10 = new THREE.Vector3().subVectors(step10Pos, step10RawTarget);
      step10Pos.addScaledVector(toCam10, 0.46);
      const step10FramedTarget = computeFramedTarget(step10Pos, step10RawTarget, 0.08 * S.DESK_ITEMS_SCALE);

      desiredPos.current.lerpVectors(homePos, step10Pos, homeP);
      desiredTarget.current.lerpVectors(homeTarget, step10FramedTarget, homeP);

      const targetFov = THREE.MathUtils.lerp(HOME_FOV, WORKBENCH_FOV, homeP);
      if (Math.abs(persCam.fov - targetFov) > 0.05) {
        persCam.fov = targetFov;
        persCam.updateProjectionMatrix();
      }

      camera.position.copy(desiredPos.current);
      smoothedTarget.current.copy(desiredTarget.current);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
      return;
    }

    if (
      stageTransition === 'TO_HOME' ||
      stageTransition === 'TO_HOME_STEP1' ||
      stageTransition === 'HOME_TO_ABOUT'
    ) {
      const stepIdx = Math.max(1, Math.min(10, state.savedAssemblyStep || state.currentStep || 1));
      const stepData = ASSEMBLY_STEPS[stepIdx];
      const stepPos = new THREE.Vector3(...stepData.cameraPos);
      const stepRawTarget = new THREE.Vector3(...stepData.cameraTarget);

      const landFactor = THREE.MathUtils.smoothstep(stepIdx, 9.65, 9.98);
      const floatWeight = 1.0 - landFactor;
      const floatYWorld = (1.25 * floatWeight) * S.DESK_ITEMS_SCALE;
      stepPos.y += floatYWorld;
      stepRawTarget.y += floatYWorld;

      const progress1to10 = THREE.MathUtils.clamp((stepIdx - 1) / 9, 0, 1);
      const camPullBack = THREE.MathUtils.lerp(0.28, 0.46, progress1to10);
      const toCam = new THREE.Vector3().subVectors(stepPos, stepRawTarget);
      stepPos.addScaledVector(toCam, camPullBack);

      const baseOffset = stepIdx >= 10 ? 0.08 : stepIdx === 9 ? 1.85 : 2.85;
      const stepFramedTarget = computeFramedTarget(stepPos, stepRawTarget, baseOffset * S.DESK_ITEMS_SCALE);

      desiredPos.current.lerpVectors(homePos, stepPos, homeP);
      desiredTarget.current.lerpVectors(homeTarget, stepFramedTarget, homeP);

      const targetFov = THREE.MathUtils.lerp(HOME_FOV, WORKBENCH_FOV, homeP);
      if (Math.abs(persCam.fov - targetFov) > 0.05) {
        persCam.fov = targetFov;
        persCam.updateProjectionMatrix();
      }

      camera.position.copy(desiredPos.current);
      smoothedTarget.current.copy(desiredTarget.current);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
      return;
    }

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

      const step1FramedTarget = computeFramedTarget(step1Pos, step1RawTarget, 2.85 * S.DESK_ITEMS_SCALE);

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
        scrollVal <= 0.05 &&
        state.stageTransition === 'IDLE' &&
        !state.freeCam;

      if (!isPureHome) {
        smoothedMouse.current.x = 0;
        smoothedMouse.current.y = 0;
      } else {
        const mouseLerpSpeed = safeDelta * 2.8;
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

        if (state.hasCompletedAssembly) {
          // CHẾ ĐỘ DI CHUỘT XEM CÁC VỊ TRÍ KHI ĐÃ LẮP XONG MÁY:
          // Xoay nhẹ góc nhìn parallax đa chiều (yaw/pitch) để thấy rõ chiều sâu của cả 3 vật thể:
          // Đèn bàn Anglepoise bên trái, Màn CRT Sony & phím chuột ở giữa, Thùng máy InWin A500 bên phải
          const panX = smoothedMouse.current.x * 0.38;
          const panY = smoothedMouse.current.y * 0.22;

          desiredPos.current.x += panX * 1.35;
          desiredPos.current.y += panY * 1.15;
          desiredPos.current.z += smoothedMouse.current.y * 0.18;

          desiredTarget.current.x -= panX * 0.45;
          desiredTarget.current.y += panY * 0.55;
        } else {
          const yawOffset = smoothedMouse.current.x * 0.25;
          const pitchOffset = smoothedMouse.current.y * 0.16;

          desiredPos.current.x += yawOffset * 1.1;
          desiredPos.current.y += pitchOffset * 0.9;
          desiredTarget.current.x -= yawOffset * 0.35;
          desiredTarget.current.y += pitchOffset * 0.45;
        }
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

        // Theo dõi độ nâng lơ lửng của cụm linh kiện ở Step 00 -> 09 (hạ cánh ở Step 10)
        const landFactor = THREE.MathUtils.smoothstep(scrollVal, 9.65, 9.98);
        const floatWeight = 1.0 - landFactor;
        const floatYWorld = (1.25 * floatWeight) * S.DESK_ITEMS_SCALE;

        interpPos.y += floatYWorld;
        interpRawTarget.y += floatYWorld;

        // Tiến trình tổng thể từ Step 01 -> Step 10 (0.0 -> 1.0)
        const progress1to10 = THREE.MathUtils.clamp((scrollVal - 1) / 9, 0, 1);

        // Lùi camera xa (0.28 -> 0.46) nội suy mượt mà, triệt tiêu hoàn toàn cú giật góc nhìn khi chạm ngưỡng Step 10
        // Thu nhỏ linh kiện lại vừa vặn tầm mắt theo đúng yêu cầu người dùng
        const camPullBack = THREE.MathUtils.lerp(0.28, 0.46, progress1to10);
        const toCam = new THREE.Vector3().subVectors(interpPos, interpRawTarget);
        interpPos.addScaledVector(toCam, camPullBack);

        // Đẩy toàn bộ cụm linh kiện 3D sang nửa phải màn hình bắt đầu từ mép ~60% chiều rộng màn hình
        let baseOffset = 2.85;
        if (scrollVal > 8.0 && scrollVal <= 9.0) {
          const t = scrollVal - 8.0;
          baseOffset = THREE.MathUtils.lerp(2.85, 1.85, t);
        } else if (scrollVal > 9.0) {
          const t = THREE.MathUtils.clamp(scrollVal - 9.0, 0, 1);
          baseOffset = THREE.MathUtils.lerp(1.85, 0.08, t);
        }
        const offsetAmount = baseOffset * S.DESK_ITEMS_SCALE;

        const framedTarget = computeFramedTarget(interpPos, interpRawTarget, offsetAmount);

        desiredPos.current.copy(interpPos);
        desiredTarget.current.copy(framedTarget);
      } else {
        // Step 10, 11, 12 (Projects & CV): Góc bao quát máy tính hoàn chỉnh & CRT
        const step10 = ASSEMBLY_STEPS[10];
        const step10Pos = new THREE.Vector3(...step10.cameraPos);
        const step10RawTarget = new THREE.Vector3(...step10.cameraTarget);

        // Lùi xa thêm 46% ở Step 10 để nhìn trọn vẹn màn hình CRT, bàn phím, chuột và đèn bàn
        const toCam10 = new THREE.Vector3().subVectors(step10Pos, step10RawTarget);
        step10Pos.addScaledVector(toCam10, 0.46);

        const framedTarget = computeFramedTarget(step10Pos, step10RawTarget, 0.08 * S.DESK_ITEMS_SCALE);

        // Ở Step 10: Tự động kích hoạt chế độ di chuột xem các vị trí trên bàn làm việc
        const mouseLerpSpeed = safeDelta * 2.8;
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

        const mousePanX = smoothedMouse.current.x * (1.65 * S.DESK_ITEMS_SCALE);
        const mousePanY = smoothedMouse.current.y * (1.15 * S.DESK_ITEMS_SCALE);
        framedTarget.x += mousePanX;
        framedTarget.y += mousePanY;
        step10Pos.x += smoothedMouse.current.x * (0.85 * S.DESK_ITEMS_SCALE);
        step10Pos.y += smoothedMouse.current.y * (0.55 * S.DESK_ITEMS_SCALE);

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
  });

  return (
    <OrbitControls
      ref={controlsRef}
      domElement={gl.domElement}
      makeDefault
      enabled={freeCam && currentStep >= 10}
      enableRotate
      enableZoom
      enablePan
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.9}
      zoomSpeed={1.0}
      panSpeed={0.8}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minPolarAngle={Math.PI * 0.04}
      minDistance={0.28}
      maxDistance={1.72}
    />
  );
}
