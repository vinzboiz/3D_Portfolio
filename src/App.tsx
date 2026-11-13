import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './components/canvas/Experience';
import { RetroHUD } from './components/ui/RetroHUD';
import { AboutEditorialScroller } from './components/ui/AboutEditorialScroller';
import { HomePortalOverlay } from './components/ui/HomePortalOverlay';
import { ProjectTunnelShowcase } from './components/ui/ProjectTunnelShowcase';
import { useBuildStore } from './store/useBuildStore';

export function App() {
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);

  // Khi đang ở hẳn trong app (INSIDE_APP), ẩn hoàn toàn Canvas 3D thùng máy để không tốn tài nguyên GPU
  const hideWorkbenchCanvas = projectAppTransition === 'INSIDE_APP';
  // Chỉ khi vào chế độ xem chi tiết máy tính (Inspect / FreeCam) thì Canvas mới cần đón sự kiện chuột và nổi lên trên
  const isInspectMode = freeCam && currentStep >= 10;

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0c] text-white">
      {/* Ẩn bảng Leva để giữ giao diện tối giản hoàn toàn */}
      <Leva hidden />

      {/* Giao diện 2D Retro HUD (Navbar Minimalist + Nút FreeCam) */}
      <RetroHUD />

      {/* Cột chữ giới thiệu bản thân About cuộn dọc bên trái (Z-Index 35 luôn nổi rõ bên cạnh linh kiện 3D) */}
      <AboutEditorialScroller />

      {/* Giao diện Trang Đơn Editorial (Tầng 1: Home Split-Portal + Tầng 2: Projects + Tầng 3: My CV) */}
      <HomePortalOverlay />

      {/* Không gian 3D Retro Fly-Through Showcase khi nạp đĩa CD */}
      <ProjectTunnelShowcase />

      {/* Không gian 3D Procedural Workbench (Cố định trong nền Viewport) */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          display: hideWorkbenchCanvas ? 'none' : 'block',
          zIndex: isInspectMode ? 30 : 0,
          pointerEvents: isInspectMode ? 'auto' : 'none',
        }}
      >
        <Canvas
          frameloop={hideWorkbenchCanvas ? 'demand' : 'always'}
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.55, 2.15], fov: 70, near: 0.05, far: 60 }}
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
