import { useRef, useEffect } from 'react';
import { ContactShadows } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { Workbench } from './Workbench';
import { RetroLabEnvironment } from '../models/RetroLabEnvironment';
import { useBuildStore } from '../../store/useBuildStore';
import { S, DESK_Z_OFFSET } from '../../constants/scale';

export function Experience() {
  const isLampOn = useBuildStore((s) => s.isLampOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);

  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const spotTargetRef = useRef<THREE.Object3D | null>(null);

  const { spotIntensity, ambientIntensity, bulbGlowIntensity, lampWarmth } = useControls(
    'Workbench Lighting',
    {
      spotIntensity: { value: 6.8, min: 0.5, max: 25, step: 0.2, label: 'Độ sáng Đèn bàn' },
      bulbGlowIntensity: { value: 1.8, min: 0.1, max: 6.0, step: 0.1, label: 'Quầng bóng đèn' },
      ambientIntensity: { value: 0.65, min: 0.05, max: 2.0, step: 0.05, label: 'Ánh sáng nền (Ambient)' },
      lampWarmth: { value: '#ffdfa8', label: 'Màu đèn vàng ấm' },
    },
    { collapsed: false }
  );

  useEffect(() => {
    if (spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.target = spotTargetRef.current;
      spotTargetRef.current.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <color attach="background" args={['#0e1014']} />
      <fog attach="fog" args={['#0e1014', 12, 28]} />

      {/* Hệ thống điều khiển góc máy nội suy Step 01 -> 10 & OrbitControls tự do */}
      <CameraRig />

      {/* Ánh sáng môi trường cân bằng rõ nét */}
      <ambientLight intensity={ambientIntensity} color="#cdd9e6" />

      {/* ĐÍCH NGẮM ÁNH SÁNG CỦA ĐÈN BÀN (Chiếu thẳng vào trung tâm mặt bàn và bo mạch chủ) */}
      <object3D
        ref={spotTargetRef}
        position={[
          0.25 * S.DESK_ITEMS_SCALE,
          1.15 * S.DESK_ITEMS_SCALE,
          0.55 * S.DESK_ITEMS_SCALE + DESK_Z_OFFSET,
        ]}
      />

      {/* NGUỒN SÁNG CHÍNH 1: ĐÈN BÀN LÒ XO CRÔM (SPOTLIGHT + FILL GLOW TẠI CHAO ĐÈN) */}
      <spotLight
        ref={spotLightRef}
        position={[
          -5.51 * S.DESK_ITEMS_SCALE,
          4.66 * S.DESK_ITEMS_SCALE,
          0.85 * S.DESK_ITEMS_SCALE + DESK_Z_OFFSET,
        ]}
        angle={1.05}
        penumbra={0.65}
        distance={3.8}
        decay={1.5}
        intensity={isLampOn ? spotIntensity : 0}
        color={lampWarmth}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />

      {/* Quầng sáng tỏa dịu (Fill Glow) ngay tại bóng đèn bên trong chao đèn crôm */}
      <pointLight
        position={[
          -5.48 * S.DESK_ITEMS_SCALE,
          4.60 * S.DESK_ITEMS_SCALE,
          0.86 * S.DESK_ITEMS_SCALE + DESK_Z_OFFSET,
        ]}
        intensity={isLampOn ? bulbGlowIntensity : 0}
        distance={1.6}
        decay={1.8}
        color="#ffe6b5"
      />

      {/* Nguồn sáng mềm bổ trợ từ góc trước-phải rọi vào mặt trước Thùng máy, Màn CRT và Bàn phím */}
      <directionalLight
        position={[1.2, 1.8, 1.8 + DESK_Z_OFFSET]}
        intensity={0.42}
        color={isTurbo ? '#fff2d6' : '#e6f0fa'}
      />

      {/* Đổ bóng tiếp xúc mềm dưới đáy linh kiện và khung máy */}
      <ContactShadows
        position={[0, 0.002, DESK_Z_OFFSET]}
        opacity={0.65}
        scale={2.2}
        blur={1.6}
        far={1.5}
        resolution={512}
        color="#040608"
      />

      {/* Mặt bàn Cutting Mat, Khay linh kiện & Đèn bàn Crôm */}
      <Workbench />

      {/* Căn phòng Retro Lab 1997 & Chiếc ghế gỗ kỹ sư cổ điển */}
      <RetroLabEnvironment />
    </>
  );
}
