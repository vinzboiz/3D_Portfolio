import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useBuildStore, type ProjectAppTransition } from '../../store/useBuildStore';
import { S } from '../../constants/scale';

const CRT_SCREEN_CENTER_POS = new THREE.Vector3(
  -0.85 * S.DESK_ITEMS_SCALE,
  1.786 * S.DESK_ITEMS_SCALE,
  1.013 * S.DESK_ITEMS_SCALE
);
const HOME_FOV = 70.0;
const WORKBENCH_FOV = 48.0;

// =========================================================================
// 1. TỌA ĐỘ CAMERA CHUẨN CỐ ĐỊNH THEO YÊU CẦU RETRO-PC-WEBGL-ARCHITECT
// Đẩy CameraTarget lệch sang trái để đặt mô hình 3D ở nửa phải màn hình (52% -> 96%),
// để trống hoàn toàn nửa bên trái (4% -> 48%) cho cột chữ giới thiệu cuộn dọc!
// Đặt góc nhìn lùi xa bao quát trọn vẹn toàn bộ linh kiện trên bàn, khay linh kiện,
// đèn bàn và thùng máy đứng.
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

// Step 01 -> Step 04 (Lắp Mainboard, CPU, Quạt, RAM trên mặt thảm):
// Góc nhìn xa Isometric bao quát trọn vẹn thảm lắp, khay linh kiện bên trái và lòng case bên phải
const POS_STEP1_4 = new THREE.Vector3(
  -4.4 * S.DESK_ITEMS_SCALE,
  5.4 * S.DESK_ITEMS_SCALE,
  7.2 * S.DESK_ITEMS_SCALE
);
const TARGET_STEP1_4 = new THREE.Vector3(
  -1.8 * S.DESK_ITEMS_SCALE,
  0.45 * S.DESK_ITEMS_SCALE,
  -0.15 * S.DESK_ITEMS_SCALE
);

// Step 05 -> Step 09 (Lắp Nguồn, Ổ đĩa, Card, Cáp vào thùng máy đứng):
// Góc nhìn xa Isometric nâng cao nhẹ để nhìn trọn vẹn lòng thùng máy và khay ổ đĩa
const POS_STEP5_9 = new THREE.Vector3(
  -4.6 * S.DESK_ITEMS_SCALE,
  5.8 * S.DESK_ITEMS_SCALE,
  8.2 * S.DESK_ITEMS_SCALE
);
const TARGET_STEP5_9 = new THREE.Vector3(
  -1.8 * S.DESK_ITEMS_SCALE,
  1.35 * S.DESK_ITEMS_SCALE,
  -0.25 * S.DESK_ITEMS_SCALE
);

// Step 10 (Hoàn tất lắp máy, CRT & Thiết bị ngoại vi):
// Góc chính diện lùi xa vừa phải, bao quát toàn cảnh màn CRT, thùng máy, bàn phím và chuột
const POS_STEP10 = new THREE.Vector3(
  -2.2 * S.DESK_ITEMS_SCALE,
  3.8 * S.DESK_ITEMS_SCALE,
  7.8 * S.DESK_ITEMS_SCALE
);
const TARGET_STEP10 = new THREE.Vector3(
  -1.0 * S.DESK_ITEMS_SCALE,
  1.15 * S.DESK_ITEMS_SCALE,
  0.10 * S.DESK_ITEMS_SCALE
);

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

    // Helper giới hạn camera chặt chẽ trong căn phòng
    const clampCameraInRoom = () => {
      // Khi đang chuyển cảnh vào CRT hoặc trong Project App: cho phép camera tự do tiến sát vào mặt kính
      if (state.isInsideProjectApp || state.projectAppTransition !== 'IDLE') {
        return;
      }

      const minX = -1.25;
      const maxX = 1.25;
      const minY = 0.15; // Camera luôn ở trên mặt bàn (mặt bàn ở y = 0.0), tuyệt đối không chui xuống gầm bàn
      const maxY = 1.95;
      const minZ = 0.10; // Giữ camera ở phía trước bàn, không lọt ra sau tường CRT
      const maxZ = 1.68; // Không vượt quá vách tường trước của phòng (FRONT_Z = 1.90m)

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
        controlsRef.current.target.copy(TARGET_STEP10);
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

      desiredPos.current.lerpVectors(homePos, POS_STEP1_4, ease);
      desiredTarget.current.lerpVectors(homeTarget, TARGET_STEP1_4, ease);

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
    } else if (scrollVal <= 4.0) {
      // 2. Step 01 -> Step 04: Cố định góc Studio Isometric nhìn Mainboard trên thảm (Mô hình lệch phải)
      desiredPos.current.copy(POS_STEP1_4);
      desiredTarget.current.copy(TARGET_STEP1_4);
      if (Math.abs(persCam.fov - WORKBENCH_FOV) > 0.05) {
        persCam.fov = WORKBENCH_FOV;
        persCam.updateProjectionMatrix();
      }
    } else if (scrollVal < 5.0) {
      // 3. Chuyển tiếp mượt mà giữa Step 04 và Step 05:
      const t = scrollVal - 4.0;
      const ease = t * t * (3 - 2 * t);
      desiredPos.current.lerpVectors(POS_STEP1_4, POS_STEP5_9, ease);
      desiredTarget.current.lerpVectors(TARGET_STEP1_4, TARGET_STEP5_9, ease);
    } else if (scrollVal <= 9.0) {
      // 4. Step 05 -> Step 09: Cố định góc Studio Isometric nhìn Thùng máy (Mô hình lệch phải)
      desiredPos.current.copy(POS_STEP5_9);
      desiredTarget.current.copy(TARGET_STEP5_9);
    } else if (scrollVal < 10.0) {
      // 5. Chuyển tiếp mượt mà giữa Step 09 và Step 10:
      const t = scrollVal - 9.0;
      const ease = t * t * (3 - 2 * t);
      desiredPos.current.lerpVectors(POS_STEP5_9, POS_STEP10, ease);
      desiredTarget.current.lerpVectors(TARGET_STEP5_9, TARGET_STEP10, ease);
    } else {
      // 6. Step 10: Góc nhìn chính diện bao quát máy tính hoàn chỉnh & CRT
      desiredPos.current.copy(POS_STEP10);
      desiredTarget.current.copy(TARGET_STEP10);
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
      desiredPos.current.copy(POS_STEP10);
      desiredTarget.current.copy(TARGET_STEP10);
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
    clampCameraInRoom();
    smoothedTarget.current.lerp(desiredTarget.current, camAlpha);
    camera.lookAt(smoothedTarget.current);
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
