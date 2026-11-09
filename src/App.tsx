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

  // Khi đang ở hẳn trong app (INSIDE_APP), ẩn hoàn toàn Canvas 3D thùng máy để không tốn tài nguyên GPU
  const hideWorkbenchCanvas = projectAppTransition === 'INSIDE_APP';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#141413]">
      {/* Ẩn bảng Leva để giữ giao diện tối giản hoàn toàn */}
      <Leva hidden />

      {/* Giao diện 2D Retro HUD (Hardware Manual + Windows 95 Bevel) */}
      <RetroHUD />

      {/* Giao diện 2D Split-Text Portal Mask khi ở Step 00 (HOME) */}
      <HomePortalOverlay />

      {/* Không gian 3D Retro Fly-Through Showcase khi nạp đĩa CD */}
      <ProjectTunnelShowcase />

      {/* Không gian 3D Procedural Workbench (Ẩn khi đang bay trong ứng dụng để đảm bảo 60 FPS) */}
      <div
        className="w-full h-full"
        style={{ display: hideWorkbenchCanvas ? 'none' : 'block' }}
      >
        <Canvas
          frameloop={hideWorkbenchCanvas ? 'demand' : 'always'}
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 0.95, 3.2], fov: 70, near: 0.05, far: 60 }}
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

