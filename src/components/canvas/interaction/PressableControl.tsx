import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../../store/useBuildStore';

/**
 * Bộ nhớ đệm vật liệu "sáng nhẹ" dùng khi rê chuột: mỗi vật liệu gốc chỉ clone đúng 1 lần,
 * tránh sửa trực tiếp vật liệu dùng chung (retroMaterials) làm sáng lây sang các chi tiết khác.
 */
const highlightCache = new WeakMap<THREE.Material, THREE.Material>();

function getHighlightMaterial(src: THREE.Material): THREE.Material {
  const cached = highlightCache.get(src);
  if (cached) return cached;

  const clone = src.clone();
  if (clone instanceof THREE.MeshStandardMaterial) {
    clone.emissive = new THREE.Color('#fff1cc');
    clone.emissiveIntensity = Math.max(clone.emissiveIntensity, 0.28);
  } else if (clone instanceof THREE.MeshBasicMaterial) {
    clone.color = clone.color.clone().multiplyScalar(1.35);
  }
  highlightCache.set(src, clone);
  return clone;
}

function applyHighlight(root: THREE.Object3D, on: boolean) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || mesh.userData.noHighlight) return;
    if (on) {
      if (mesh.userData.__baseMaterial) return;
      if (Array.isArray(mesh.material)) return;
      mesh.userData.__baseMaterial = mesh.material;
      mesh.material = getHighlightMaterial(mesh.material);
    } else if (mesh.userData.__baseMaterial) {
      mesh.material = mesh.userData.__baseMaterial as THREE.Material;
      delete mesh.userData.__baseMaterial;
    }
  });
}

export interface PressableControlProps {
  /** Nhãn tooltip hiển thị trên HUD khi rê chuột, ví dụ "[CLICK] POWER SWITCH (AT LATCH)" */
  label: string;
  onPress: () => void;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Hướng lún vào (local) của nút khi nhấn, mặc định -X (ép vào mặt nạ) */
  pressAxis?: [number, number, number];
  /** Quãng đường lún tối đa (đơn vị local) */
  travel?: number;
  /**
   * Nút chốt giữ (Latching): true = giữ trạng thái lún sâu.
   * Bỏ trống = nút nhấn nhả (Momentary) tự nảy ra sau `momentaryMs`.
   */
  latched?: boolean;
  momentaryMs?: number;
  /** Tốc độ nội suy chuyển động cơ học */
  stiffness?: number;
  disabled?: boolean;
}

/**
 * NÚT BẤM VẬT LÝ 3D DÙNG CHUNG (3D RAYCAST PRESSABLE CONTROL)
 * - Bắt sự kiện click/hover của R3F, chặn xuyên tia raycast bằng stopPropagation()
 * - Đổi con trỏ chuột (useCursor) + làm sáng nhẹ vật liệu khi rê chuột
 * - Diễn hoạt hành trình cơ học (Mechanical Travel) bằng THREE.MathUtils.damp trong useFrame
 */
export function PressableControl({
  label,
  onPress,
  children,
  position,
  rotation,
  pressAxis = [-1, 0, 0],
  travel = 0.01,
  latched,
  momentaryMs = 150,
  stiffness = 22,
  disabled = false,
}: PressableControlProps) {
  const [hovered, setHovered] = useState(false);
  const travelGroupRef = useRef<THREE.Group>(null);
  const pressedUntilRef = useRef(0);
  const depthRef = useRef(0);
  const axis = useRef(new THREE.Vector3()).current;

  useCursor(hovered && !disabled);

  // Dọn tooltip HUD nếu nút bị gỡ khỏi cảnh (ví dụ khi cuộn lùi bước lắp ráp) trong lúc đang rê chuột
  useEffect(() => {
    return () => {
      if (useBuildStore.getState().hoveredControl === label) {
        useBuildStore.getState().setHoveredControl(null);
      }
    };
  }, [label]);

  useFrame((_, delta) => {
    const group = travelGroupRef.current;
    if (!group) return;
    const momentaryDown = performance.now() < pressedUntilRef.current;
    const target = latched || momentaryDown ? 1 : 0;
    // Lún nhanh, nảy ra mềm hơn
    const k = target > depthRef.current ? stiffness * 1.6 : stiffness * 0.75;
    depthRef.current = THREE.MathUtils.damp(depthRef.current, target, k, Math.min(delta, 0.05));
    axis.set(...pressAxis).normalize().multiplyScalar(travel * depthRef.current);
    group.position.copy(axis);
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (disabled) return;
    setHovered(true);
    if (travelGroupRef.current) applyHighlight(travelGroupRef.current, true);
    useBuildStore.getState().setHoveredControl(label);
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    if (travelGroupRef.current) applyHighlight(travelGroupRef.current, false);
    if (useBuildStore.getState().hoveredControl === label) {
      useBuildStore.getState().setHoveredControl(null);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Bỏ qua cú click thực chất là thao tác kéo xoay camera (Free Cam)
    if (disabled || e.delta > 6) return;
    if (latched === undefined) {
      pressedUntilRef.current = performance.now() + momentaryMs;
    }
    onPress();
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      <group ref={travelGroupRef}>{children}</group>
    </group>
  );
}
