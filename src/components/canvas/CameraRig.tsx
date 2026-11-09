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

export function CameraRig() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);
  const { camera } = useThree();

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredPos = useRef(new THREE.Vector3(0, 0.55, 2.15));
  const desiredTarget = useRef(new THREE.Vector3(0, 0.05, -0.4));
  const smoothedTarget = useRef(new THREE.Vector3(0, 0.05, -0.4));
  const wasInspectRef = useRef(false);
  const prevTransitionRef = useRef<ProjectAppTransition>('IDLE');

  useEffect(() => {
    const stepData = ASSEMBLY_STEPS[currentStep] ?? ASSEMBLY_STEPS[0];
    desiredPos.current.set(...stepData.cameraPos);
    desiredTarget.current.set(...stepData.cameraTarget);

    if (freeCam && controlsRef.current) {
      controlsRef.current.target.copy(desiredTarget.current);
      controlsRef.current.update();
    }
  }, [currentStep, freeCam]);

  useFrame((r3fState, delta) => {
    const state = useBuildStore.getState();
    const safeDelta = Math.min(delta, 0.05);
    const dt = safeDelta;

    const diff = state.scrollTarget - state.scrollCurrent;
    if (Math.abs(diff) > 0.0005) {
      // Giới hạn vận tốc tối đa tuyến tính 0.5 step/s kết hợp di chuyển đều, mượt mà không bị giật
      const maxChange = 0.5 * safeDelta;
      const clampedDiff = THREE.MathUtils.clamp(diff, -maxChange, maxChange);
      const stepChange = clampedDiff;
      const nextScroll = state.scrollCurrent + stepChange;
      state.syncScrollCurrent(nextScroll);
    } else if (state.scrollCurrent !== state.scrollTarget) {
      state.syncScrollCurrent(state.scrollTarget);
    }

    const stepNum = state.currentStep;
    const stepP = state.benchProgress;
    const stepData = ASSEMBLY_STEPS[stepNum] ?? ASSEMBLY_STEPS[0];

    const scrollVal = state.scrollCurrent;

    // HẠNG MỤC 1: TÍNH TOÁN CAMERA GÓC RỘNG Ở HOME THEO HỆ TỈ LỆ S (1 UNIT = 1 MÉT)
    const aspect = r3fState.size.width / Math.max(1, r3fState.size.height);
    const aspectMultiplier = aspect < 1.0 ? Math.max(1.0, 1.18 / aspect) : 1.0;
    const homePos = new THREE.Vector3(
      0,
      0.55 * Math.min(1.25, aspectMultiplier),
      2.15 * aspectMultiplier
    );
    const homeTarget = new THREE.Vector3(0, 0.05, -0.4);

    const persCam = camera as THREE.PerspectiveCamera;

    // YÊU CẦU #1: KHI CHUYỂN TỪ HOME SANG PROJECTS HOẶC MY CV (HOME_TO_PROJECT / HOME_TO_MY_CV):
    if (state.stageTransition === 'HOME_TO_PROJECT' || state.stageTransition === 'HOME_TO_MY_CV') {
      const t = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // power3.inOut
      const destPos = new THREE.Vector3(
        0.15 * S.DESK_ITEMS_SCALE,
        3.25 * S.DESK_ITEMS_SCALE,
        9.45 * S.DESK_ITEMS_SCALE
      );
      const destTarget = new THREE.Vector3(
        0.05 * S.DESK_ITEMS_SCALE,
        1.65 * S.DESK_ITEMS_SCALE,
        0.25 * S.DESK_ITEMS_SCALE
      );

      desiredPos.current.lerpVectors(homePos, destPos, ease);
      desiredTarget.current.lerpVectors(homeTarget, destTarget, ease);

      // Tween đồng thời FOV từ 70° về 40°
      const targetFov = THREE.MathUtils.lerp(HOME_FOV, WORKBENCH_FOV, ease);
      if (Math.abs(persCam.fov - targetFov) > 0.05) {
        persCam.fov = targetFov;
        persCam.updateProjectionMatrix();
      }

      camera.position.lerp(desiredPos.current, safeDelta * 4.8);
      smoothedTarget.current.lerp(desiredTarget.current, safeDelta * 5.2);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // YÊU CẦU #2: KHI TRONG ĐOẠN HOME (0.0) <-> ABOUT STEP 1 (1.0):
    if (
      scrollVal < 1.0 &&
      state.stageTransition !== 'TO_PROJECT' &&
      state.stageTransition !== 'TO_MY_CV'
    ) {
      const t = THREE.MathUtils.clamp(scrollVal, 0, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // power3.inOut
      const step1Pos = new THREE.Vector3(
        -1.55 * S.DESK_ITEMS_SCALE,
        3.65 * S.DESK_ITEMS_SCALE,
        4.35 * S.DESK_ITEMS_SCALE
      );
      const step1Target = new THREE.Vector3(
        -0.35 * S.DESK_ITEMS_SCALE,
        0.22 * S.DESK_ITEMS_SCALE,
        -0.1 * S.DESK_ITEMS_SCALE
      );

      // Nội suy mượt vị trí Camera giữa Home và Step 1
      desiredPos.current.lerpVectors(homePos, step1Pos, ease);
      desiredTarget.current.lerpVectors(homeTarget, step1Target, ease);

      // Tween đồng thời FOV từ 70° về 40°
      const targetFov = THREE.MathUtils.lerp(HOME_FOV, WORKBENCH_FOV, ease);
      if (Math.abs(persCam.fov - targetFov) > 0.05) {
        persCam.fov = targetFov;
        persCam.updateProjectionMatrix();
      }

      // Hiệu ứng chuột nhìn quanh tại Home (giảm dần về 0 khi t -> 1)
      const isTransitioning =
        state.stageTransition === 'TO_HOME' ||
        state.stageTransition === 'TO_HOME_STEP1' ||
        state.stageTransition === 'HOME_TO_ABOUT';
      const mouseWeight = isTransitioning ? 0 : Math.max(0, 1 - t * 1.5);
      const lookOffsetX = mouseWeight * r3fState.pointer.x * 0.35;
      const lookOffsetY = mouseWeight * r3fState.pointer.y * 0.20;
      const lookOffsetZ = mouseWeight * (-r3fState.pointer.x * 0.15);

      desiredTarget.current.x += lookOffsetX;
      desiredTarget.current.y += lookOffsetY;
      desiredTarget.current.z += lookOffsetZ;

      const posSpeed = isTransitioning ? safeDelta * 3.8 : safeDelta * 3.2;
      const targetSpeed = isTransitioning ? safeDelta * 4.2 : safeDelta * 4.5;

      camera.position.lerp(desiredPos.current, posSpeed);
      smoothedTarget.current.lerp(desiredTarget.current, targetSpeed);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // Đảm bảo khi ngồi hẳn vào bàn lắp ráp, FOV được duy trì ở 40°
    if (Math.abs(persCam.fov - WORKBENCH_FOV) > 0.05) {
      persCam.fov = WORKBENCH_FOV;
      persCam.updateProjectionMatrix();
    }

    // Sau khi lắp đủ toàn bộ linh kiện vào thùng máy (cuối Step 09 -> nửa đầu Step 10 khi đóng nắp chữ U):
    // Zoom lùi ra góc nhìn ngang toàn cảnh để thấy trọn vẹn bên phải và toàn bộ lòng thùng máy trước khi đóng nắp,
    // sau đó mới xoay camera sang góc chính diện để hiển thị trọn bộ máy tính.
    if (
      state.stageTransition === 'ABOUT_TO_PROJECT' ||
      state.stageTransition === 'TO_PROJECT' ||
      state.stageTransition === 'TO_MY_CV'
    ) {
      desiredPos.current.set(0.15, 3.25, 9.45);
      desiredTarget.current.set(0.05, 1.65, 0.25);
    } else if (state.stageTransition === 'TO_ABOUT') {
      desiredPos.current.set(-1.55, 3.65, 4.35);
      desiredTarget.current.set(-0.35, 0.22, -0.1);
    } else if (
      !state.isPoweredOn &&
      state.scrollCurrent < 9.9 &&
      ((stepNum === 9 && stepP >= 0.82) || (stepNum === 10 && stepP < 0.52))
    ) {
      desiredPos.current.set(-6.15, 2.25, 0.05);
      desiredTarget.current.set(0.1, 1.85, -0.15);
    } else {
      desiredPos.current.set(...stepData.cameraPos);
      desiredTarget.current.set(...stepData.cameraTarget);
    }

    // =========================================================================
    // CÁC PHA CHUYỂN CẢNH ĐI VÀO / THOÁT RA ỨNG DỤNG "MY PROJECTS" (CRT DIVE)
    // =========================================================================
    const transition = state.projectAppTransition;

    // Pha 1: Khi ứng dụng trên màn CRT đang phóng to từ cửa sổ AUTORUN ra toàn màn hình (EXPANDING_ON_CRT)
    // KHÓA CHẶT cameraTarget vào đúng tâm mặt kính CRT, không nội suy qua điểm trung gian lệch trái!
    if (transition === 'EXPANDING_ON_CRT') {
      smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredPos.current.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 2.5);
      const alpha = 1 - Math.exp(-6.0 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      camera.lookAt(CRT_SCREEN_CENTER_POS);
      prevTransitionRef.current = transition;
      return;
    }

    // Pha 2: Camera lao thẳng một đường trục Z trực diện xuyên qua tâm mặt kính CRT (DIVING_CAMERA)
    // Khóa chặt cameraTarget tại CRT_SCREEN_CENTER_POS, tiến thẳng z+2.5 -> z+0.15
    if (transition === 'DIVING_CAMERA') {
      smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredTarget.current.copy(CRT_SCREEN_CENTER_POS);
      desiredPos.current.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.15);
      const alpha = 1 - Math.exp(-7.8 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      camera.lookAt(CRT_SCREEN_CENTER_POS);
      prevTransitionRef.current = transition;
      return;
    }

    // Pha 4: Thoát khỏi ứng dụng - Kéo lùi camera từ tâm mặt kính CRT trở lại bàn làm việc (EXITING_CAMERA)
    if (transition === 'EXITING_CAMERA') {
      // Khi vừa chuyển từ INSIDE_APP sang EXITING_CAMERA, đặt vị trí camera ngay sát mặt kính CRT
      if (prevTransitionRef.current !== 'EXITING_CAMERA') {
        camera.position.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.15);
        smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      }
      // Rút lui camera từ từ về góc nhìn toàn cảnh toàn bộ máy tính Step 10
      desiredPos.current.set(0.15, 3.25, 9.45);
      desiredTarget.current.set(0.05, 1.65, 0.25);
      const alpha = 1 - Math.exp(-4.2 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      smoothedTarget.current.lerp(desiredTarget.current, alpha);
      camera.lookAt(smoothedTarget.current);
      prevTransitionRef.current = transition;
      return;
    }

    prevTransitionRef.current = transition;

    // Chế độ tương tác tự do / Inspect (Free Cam & Zoom to Cursor) được kích hoạt bởi state.freeCam
    const isInspect = state.freeCam;

    if (isInspect) {
      if (!wasInspectRef.current && controlsRef.current) {
        controlsRef.current.target.copy(smoothedTarget.current);
        controlsRef.current.update();
      }
      wasInspectRef.current = true;
      controlsRef.current?.update();
      return;
    }

    wasInspectRef.current = false;

    // Chuyển góc máy: cực kỳ đằm, lướt chậm như dolly camera điện ảnh theo safeDelta * 1.2
    const camAlpha = Math.min(1, safeDelta * 1.2);

    camera.position.lerp(desiredPos.current, camAlpha);
    smoothedTarget.current.lerp(desiredTarget.current, camAlpha);
    camera.lookAt(smoothedTarget.current);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={freeCam}
      enableDamping
      dampingFactor={0.07}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={1.2}
      maxDistance={12}
      zoomToCursor={true}
    />
  );
}

