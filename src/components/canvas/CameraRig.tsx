import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useBuildStore, type ProjectAppTransition } from '../../store/useBuildStore';
import { ASSEMBLY_STEPS } from '../../data/assemblySteps';

const CRT_SCREEN_CENTER_POS = new THREE.Vector3(-0.85, 1.786, 1.013);

export function CameraRig() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);
  const { camera } = useThree();

  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredPos = useRef(new THREE.Vector3(0, 8.8, 10.5));
  const desiredTarget = useRef(new THREE.Vector3(0, 0.4, 0));
  const smoothedTarget = useRef(new THREE.Vector3(0, 0.4, 0));
  const wasInspectRef = useRef(false);
  const prevTransitionRef = useRef<ProjectAppTransition>('IDLE');

  useEffect(() => {
    const stepData = ASSEMBLY_STEPS[currentStep - 1] ?? ASSEMBLY_STEPS[0];
    desiredPos.current.set(...stepData.cameraPos);
    desiredTarget.current.set(...stepData.cameraTarget);

    if (freeCam && controlsRef.current) {
      controlsRef.current.target.copy(desiredTarget.current);
      controlsRef.current.update();
    }
  }, [currentStep, freeCam]);

  useFrame((_, delta) => {
    const state = useBuildStore.getState();
    const dt = Math.min(delta, 0.1);

    if (Math.abs(state.scrollTarget - state.scrollCurrent) > 0.0001) {
      const nextScroll = THREE.MathUtils.damp(
        state.scrollCurrent,
        state.scrollTarget,
        3.2,
        dt
      );
      state.syncScrollCurrent(nextScroll);
    } else if (state.scrollCurrent !== state.scrollTarget) {
      state.syncScrollCurrent(state.scrollTarget);
    }

    const stepNum = state.currentStep;
    const stepP = state.benchProgress;
    const stepData = ASSEMBLY_STEPS[stepNum - 1] ?? ASSEMBLY_STEPS[0];

    // Sau khi lắp đủ toàn bộ linh kiện vào thùng máy (cuối Step 09 -> nửa đầu Step 10 khi đóng nắp chữ U):
    // Zoom lùi ra góc nhìn ngang toàn cảnh để thấy trọn vẹn bên phải và toàn bộ lòng thùng máy trước khi đóng nắp,
    // sau đó mới xoay camera sang góc chính diện để hiển thị trọn bộ máy tính.
    if (state.stageTransition === 'ABOUT_TO_PROJECT') {
      desiredPos.current.set(0.15, 3.25, 9.45);
      desiredTarget.current.set(0.05, 1.65, 0.25);
    } else if ((stepNum === 9 && stepP >= 0.82) || (stepNum === 10 && stepP < 0.52)) {
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

    // Chuyển góc máy: mượt mà hài hòa, tăng tốc khi chuyển cảnh ABOUT -> PROJECT
    const speed = state.stageTransition === 'ABOUT_TO_PROJECT' ? 3.4 : 1.85;
    const alpha = 1 - Math.exp(-speed * dt);

    camera.position.lerp(desiredPos.current, alpha);
    smoothedTarget.current.lerp(desiredTarget.current, alpha);
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

