import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './components/canvas/Experience';
import { RetroHUD } from './components/ui/RetroHUD';
import { HomePortalOverlay } from './components/ui/HomePortalOverlay';
import { ProjectTunnelShowcase } from './components/ui/ProjectTunnelShowcase';
import { useBuildStore } from './store/useBuildStore';

export function App() {
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);

  // Khi đang ở hẳn trong app (INSIDE_APP), ẩn hoàn toàn Canvas 3D thùng máy để không tốn tài nguyên GPU
  const hideWorkbenchCanvas = projectAppTransition === 'INSIDE_APP';
  const isInside3D = currentStep >= 1 && homeTransitionProgress >= 0.5;

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0c] text-white">
      {/* Ẩn bảng Leva để giữ giao diện tối giản hoàn toàn */}
      <Leva hidden />

      {/* Giao diện 2D Retro HUD (Navbar Minimalist + Nút FreeCam) */}
      <RetroHUD />

      {/* Giao diện Trang Đơn Editorial (Tầng 1: Home Split-Portal + Tầng 2: Projects + Tầng 3: My CV) */}
      <HomePortalOverlay />

      {/* Không gian 3D Retro Fly-Through Showcase khi nạp đĩa CD */}
      <ProjectTunnelShowcase />

      {/* Không gian 3D Procedural Workbench (Cố định trong nền Viewport) */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          display: hideWorkbenchCanvas ? 'none' : 'block',
          zIndex: isInside3D ? 5 : 0,
          pointerEvents: isInside3D ? 'auto' : 'none',
        }}
      >
        <Canvas
          frameloop={hideWorkbenchCanvas ? 'demand' : 'always'}
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.55, 4.55], fov: 70, near: 0.05, far: 60 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export default App;
