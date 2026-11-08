import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { Experience } from './components/canvas/Experience';
import { RetroHUD } from './components/ui/RetroHUD';
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
          camera={{ position: [0, 8.8, 10.5], fov: 40, near: 0.1, far: 100 }}
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

