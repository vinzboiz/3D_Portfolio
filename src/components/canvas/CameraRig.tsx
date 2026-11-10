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

  // Stationary Camera Look-Around: Lắng nghe chuột toàn màn hình (Window Level)
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Chuẩn hóa về khoảng [-1, 1] (Trái -> Phải: -1 -> 1, Dưới -> Trên: -1 -> 1)
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

    // Chỉ tự động điều tiết scrollCurrent khi đang ở trạng thái IDLE
    // Khi đang có stageTransition (như HOME_TO_ABOUT, TO_HOME, v.v.), transition đó sẽ tự điều phối tiến trình
    if (state.stageTransition === 'IDLE') {
      const diff = state.scrollTarget - state.scrollCurrent;
      if (Math.abs(diff) > 0.0002) {
        // Damping mượt mà theo hàm mũ (exponential ease-out), loại bỏ hoàn toàn hiện tượng khựng tuyến tính
        const alpha = 1 - Math.exp(-8.5 * safeDelta);
        const nextScroll = THREE.MathUtils.lerp(state.scrollCurrent, state.scrollTarget, alpha);
        state.syncScrollCurrent(nextScroll);
      } else if (state.scrollCurrent !== state.scrollTarget) {
        state.syncScrollCurrent(state.scrollTarget);
      }
    }

    const stepNum = state.currentStep;
    const stepP = state.benchProgress;
    const stepData = ASSEMBLY_STEPS[stepNum] ?? ASSEMBLY_STEPS[0];

    const scrollVal = state.scrollCurrent;

    // HẠNG MỤC 1: TÍNH TOÁN CAMERA GÓC RỘNG XÉO TỪ GÓC TRÊN BÊN TRÁI PHÒNG Ở HOME
    const aspect = r3fState.size.width / Math.max(1, r3fState.size.height);
    const homeX = HOME_CAM_POS.x * (aspect < 1.0 ? 0.85 : 1.0);
    const homeY = HOME_CAM_POS.y * Math.min(1.2, aspect < 1.0 ? 1.15 : 1.0);
    const homeZ = HOME_CAM_POS.z * (aspect < 1.0 ? 1.08 : 1.0);
    const homePos = new THREE.Vector3(homeX, homeY, homeZ);
    const homeTarget = HOME_BASE_TARGET.clone();

    const persCam = camera as THREE.PerspectiveCamera;

    // Helper giới hạn camera trong khuôn khổ phòng vuông 6 mặt
    const clampCameraInRoom = () => {
      const minX = -S.ROOM.SIZE / 2 + 0.15; // -1.275m
      const maxX = S.ROOM.SIZE / 2 - 0.15;  // +1.275m
      const minY = S.FLOOR_Y + 0.12;        // -0.63m (trên sàn 12cm)
      const maxY = S.FLOOR_Y + S.ROOM.HEIGHT - 0.15; // +1.90m (dưới trần 15cm)
      const minZ = S.ROOM.WALL_Z + 0.18;    // -0.57m (ở phía trước bức tường CRT)
      const maxZ = S.ROOM.FRONT_Z - 0.15;   // +1.75m (ở phía trong bức tường trước)

      camera.position.x = THREE.MathUtils.clamp(camera.position.x, minX, maxX);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, minY, maxY);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, minZ, maxZ);
    };

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
      clampCameraInRoom();
      return;
    }

    // YÊU CẦU #2: KHI TRONG ĐOẠN HOME (0.0) <-> ABOUT STEP 1 (1.0):
    if (
      scrollVal <= 1.0 &&
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

      // Stationary Camera Look-Around:
      // Tọa độ đứng camera đứng yên tuyệt đối tại homePos.
      // Chỉ xoay góc nhìn (Target) bao quát mặt bàn và căn phòng theo vị trí chuột.
      // CHỈ kích hoạt khi đang ở Home (Step 00, scrollVal <= 0.05, IDLE).
      const isPureHome =
        state.currentStep === 0 &&
        scrollVal <= 0.05 &&
        state.stageTransition === 'IDLE';

      // Nội suy mượt mà (Damping) tọa độ chuột
      const mouseLerpSpeed = safeDelta * 5.0;
      smoothedMouse.current.x = THREE.MathUtils.lerp(
        smoothedMouse.current.x,
        isPureHome ? mouseRef.current.x : 0,
        mouseLerpSpeed
      );
      smoothedMouse.current.y = THREE.MathUtils.lerp(
        smoothedMouse.current.y,
        isPureHome ? mouseRef.current.y : 0,
        mouseLerpSpeed
      );

      // Trọng số fade mượt theo độ mở portalProgress
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
      const homeWeight = isPureHome ? THREE.MathUtils.clamp(1 - portalProgress, 0, 1) : 0.0;

      // Giảm mạnh biên độ xoay theo chuột để góc nhìn đằm và tinh tế
      const yawOffset = smoothedMouse.current.x * (1.15 * S.DESK_ITEMS_SCALE) * homeWeight;
      const pitchOffset = smoothedMouse.current.y * (0.65 * S.DESK_ITEMS_SCALE) * homeWeight;
      const depthOffset = -smoothedMouse.current.x * (0.45 * S.DESK_ITEMS_SCALE) * homeWeight;

      desiredTarget.current.x += yawOffset;
      desiredTarget.current.y += pitchOffset;
      desiredTarget.current.z += depthOffset;

      const isTransitioning = state.stageTransition !== 'IDLE';

      const posSpeed = isTransitioning ? safeDelta * 4.2 : safeDelta * 3.8;
      const targetSpeed = isTransitioning ? safeDelta * 4.6 : safeDelta * 4.5;

      camera.position.lerp(desiredPos.current, posSpeed);
      smoothedTarget.current.lerp(desiredTarget.current, targetSpeed);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
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
      desiredPos.current.set(
        0.15 * S.DESK_ITEMS_SCALE,
        3.25 * S.DESK_ITEMS_SCALE,
        9.45 * S.DESK_ITEMS_SCALE
      );
      desiredTarget.current.set(
        0.05 * S.DESK_ITEMS_SCALE,
        1.65 * S.DESK_ITEMS_SCALE,
        0.25 * S.DESK_ITEMS_SCALE
      );
    } else if (state.stageTransition === 'TO_ABOUT') {
      desiredPos.current.set(
        -1.55 * S.DESK_ITEMS_SCALE,
        3.65 * S.DESK_ITEMS_SCALE,
        4.35 * S.DESK_ITEMS_SCALE
      );
      desiredTarget.current.set(
        -0.35 * S.DESK_ITEMS_SCALE,
        0.22 * S.DESK_ITEMS_SCALE,
        -0.1 * S.DESK_ITEMS_SCALE
      );
    } else if (
      !state.isPoweredOn &&
      state.scrollCurrent < 10.95 &&
      ((stepNum === 9 && stepP >= 0.82) || (stepNum === 10 && stepP < 0.40))
    ) {
      desiredPos.current.set(
        -6.15 * S.DESK_ITEMS_SCALE,
        2.25 * S.DESK_ITEMS_SCALE,
        0.05 * S.DESK_ITEMS_SCALE
      );
      desiredTarget.current.set(
        0.1 * S.DESK_ITEMS_SCALE,
        1.85 * S.DESK_ITEMS_SCALE,
        -0.15 * S.DESK_ITEMS_SCALE
      );
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
      desiredPos.current.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.65);
      const alpha = 1 - Math.exp(-6.0 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      camera.lookAt(CRT_SCREEN_CENTER_POS);
      clampCameraInRoom();
      prevTransitionRef.current = transition;
      return;
    }

    // Pha 2: Camera lao thẳng một đường trục Z trực diện xuyên qua tâm mặt kính CRT (DIVING_CAMERA)
    // Khóa chặt cameraTarget tại CRT_SCREEN_CENTER_POS, tiến thẳng z+0.65 -> z+0.05
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

    // Pha 4: Thoát khỏi ứng dụng - Kéo lùi camera từ tâm mặt kính CRT trở lại bàn làm việc (EXITING_CAMERA)
    if (transition === 'EXITING_CAMERA') {
      // Khi vừa chuyển từ INSIDE_APP sang EXITING_CAMERA, đặt vị trí camera ngay sát mặt kính CRT
      if (prevTransitionRef.current !== 'EXITING_CAMERA') {
        camera.position.set(CRT_SCREEN_CENTER_POS.x, CRT_SCREEN_CENTER_POS.y, CRT_SCREEN_CENTER_POS.z + 0.05);
        smoothedTarget.current.copy(CRT_SCREEN_CENTER_POS);
      }
      // Rút lui camera từ từ về góc nhìn toàn cảnh toàn bộ máy tính Step 10
      desiredPos.current.set(
        0.15 * S.DESK_ITEMS_SCALE,
        3.25 * S.DESK_ITEMS_SCALE,
        9.45 * S.DESK_ITEMS_SCALE
      );
      desiredTarget.current.set(
        0.05 * S.DESK_ITEMS_SCALE,
        1.65 * S.DESK_ITEMS_SCALE,
        0.25 * S.DESK_ITEMS_SCALE
      );
      const alpha = 1 - Math.exp(-4.2 * dt);
      camera.position.lerp(desiredPos.current, alpha);
      smoothedTarget.current.lerp(desiredTarget.current, alpha);
      camera.lookAt(smoothedTarget.current);
      clampCameraInRoom();
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
      clampCameraInRoom();
      return;
    }

    wasInspectRef.current = false;

    // Chuyển góc máy: cực kỳ đằm, lướt êm ái theo safeDelta * 3.5
    const camAlpha = Math.min(1, safeDelta * 3.5);

    camera.position.lerp(desiredPos.current, camAlpha);
    smoothedTarget.current.lerp(desiredTarget.current, camAlpha);
    camera.lookAt(smoothedTarget.current);
    clampCameraInRoom();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={freeCam}
      enableDamping
      dampingFactor={0.07}
      maxPolarAngle={Math.PI / 2 + 0.04}
      minPolarAngle={Math.PI * 0.12}
      minDistance={0.35}
      maxDistance={2.1}
      zoomToCursor={true}
    />
  );
}

