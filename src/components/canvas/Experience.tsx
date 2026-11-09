import { useRef, useEffect } from 'react';
import { ContactShadows } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { Workbench } from './Workbench';
import { RetroLabEnvironment } from '../models/RetroLabEnvironment';
import { useBuildStore } from '../../store/useBuildStore';

export function Experience() {
  const isLampOn = useBuildStore((s) => s.isLampOn);
  const isTurbo = useBuildStore((s) => s.isTurbo);

  const spotLightRef = useRef<THREE.SpotLight | null>(null);
  const spotTargetRef = useRef<THREE.Object3D | null>(null);

  const { spotIntensity, ambientIntensity, lampWarmth } = useControls(
    'Workbench Lighting',
    {
      spotIntensity: { value: 145, min: 10, max: 300, step: 5 },
      ambientIntensity: { value: 0.65, min: 0.1, max: 2.0, step: 0.05 },
      lampWarmth: { value: '#ffdfa8' },
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (spotLightRef.current && spotTargetRef.current) {
      spotLightRef.current.target = spotTargetRef.current;
      spotTargetRef.current.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <color attach="background" args={['#141413']} />
      <fog attach="fog" args={['#141413', 16, 32]} />

      {/* Hệ thống điều khiển góc máy nội suy Step 01 -> 10 & OrbitControls tự do */}
      <CameraRig />

      {/* Ánh sáng môi trường cân bằng: khi tắt đèn bàn, chỉ giữ lại ánh sáng phòng tối nhẹ để tôn vinh CRT & LED */}
      <ambientLight intensity={isLampOn ? ambientIntensity : 0.08} color="#ded8ca" />
      <hemisphereLight
        args={['#f5efe2', '#1c1b18', isLampOn ? 0.55 : 0.05]}
      />

      {/* ĐÍCH NGẮM ÁNH SÁNG CỦA ĐÈN BÀN (Chiếu thẳng vào trung tâm cụm Màn hình CRT, Bàn phím & Thùng máy PC) */}
      <object3D ref={spotTargetRef} position={[0.25, 1.15, 0.55]} />

      {/* NGUỒN SÁNG CHÍNH ĐẶT TRỰC TIẾP TẠI BẦU CHỤP ĐÈN BÀN CRÔM BÊN TRÁI MÁY TÍNH (ĐỘC LẬP HOÀN TOÀN VỚI NGUỒN PC) */}
      <spotLight
        ref={spotLightRef}
        position={[-3.15, 4.58, 0.6]}
        angle={0.95}
        penumbra={0.68}
        distance={26}
        decay={1.2}
        intensity={isLampOn ? spotIntensity : 0}
        color={lampWarmth}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
      />

      {/* Quầng sáng tỏa dịu (Fill Glow) ngay tại bóng đèn bên trong chao đèn crôm */}
      <pointLight
        position={[-3.09, 4.52, 0.62]}
        intensity={isLampOn ? 18 : 0}
        distance={9}
        decay={1.6}
        color="#ffe6b5"
      />

      {/* Ánh sáng phụ (Rim / Blueprint Fill Light) từ phía trước-phải giúp mặt trước Case & CRT rõ nét */}
      <directionalLight
        position={[5.5, 6.5, 7.5]}
        intensity={isLampOn ? 0.95 : 0.05}
        color={isTurbo ? '#fff2d6' : '#dce6ff'}
      />

      {/* Đổ bóng tiếp xúc mềm dưới đáy linh kiện và khung máy */}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.65}
        scale={18}
        blur={1.8}
        far={5}
        resolution={512}
        color="#050505"
      />

      {/* Mặt bàn Cutting Mat, Khay linh kiện & Đèn bàn Crôm */}
      <Workbench />

      {/* Căn phòng Retro Lab 1997 & Chiếc ghế gỗ kỹ sư cổ điển */}
      <RetroLabEnvironment />
    </>
  );
}
