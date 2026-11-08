import { useState, useEffect, useRef, useCallback } from 'react';
import { useBuildStore } from '../../store/useBuildStore';
import { MOCK_PROJECTS, type ProjectItem } from '../../data/mockProjects';
import { retroSound } from '../../utils/retroSound';

// Thông số độ sâu không gian Z-Axis Tunnel (đơn vị pixel)
const START_Z = 0;
const INTRO_Z = 0;
const STATION_SPACING = 950;
const STATIONS = MOCK_PROJECTS.map((proj, idx) => ({
  ...proj,
  targetZ: -(1050 + idx * STATION_SPACING),
  isLeft: proj.alignment === 'left',
}));
// Trạm kết thúc: THE END PORTAL (Đặt sau Station 5 đúng 1 khoảng cách)
const END_STATION_Z = -(1050 + MOCK_PROJECTS.length * STATION_SPACING); // -5800
// Điểm kích hoạt tự động thoát app khi người dùng cuộn xuyên qua THE END
const EXIT_DEPTH_Z = END_STATION_Z - 380; // -6180
// Chiều sâu tối đa cho phép cuộn con lăn
const MAX_DEPTH = END_STATION_Z - 520; // -6320

export function ProjectTunnelShowcase() {
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const exitProjectApp = useBuildStore((s) => s.exitProjectApp);
  const soundEnabled = useBuildStore((s) => s.soundEnabled);

  // Chỉ dùng useState cho việc mở/đóng Modal chi tiết (không dùng useState cho tọa độ cuộn Z)
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const targetZRef = useRef(START_Z);
  const currentZRef = useRef(START_Z);
  const isExitingRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(757);

  // DOM Refs để cập nhật trực tiếp tại 60 FPS không qua React Re-render
  const tunnelContainerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const stationRefs = useRef<(HTMLDivElement | null)[]>([]);
  const endPortalRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const timecodeRef = useRef<HTMLSpanElement | null>(null);

  // Khởi tạo lại trạng thái khi vừa bước vào ứng dụng
  useEffect(() => {
    if (isInsideProjectApp) {
      isExitingRef.current = false;
      targetZRef.current = START_Z;
      currentZRef.current = START_Z;
    }
  }, [isInsideProjectApp]);

  // 1. Vòng lặp vật lý nội suy quán tính mượt mà (Smooth Inertia Physics lerp: 0.085)
  // Cập nhật TRỰC TIẾP lên DOM styles, TUYỆT ĐỐI KHÔNG DÙNG CSS BLUR và KHÔNG GỌI ÂM THANH KHI CUỘN
  useEffect(() => {
    if (!isInsideProjectApp) return;

    const loop = () => {
      // Lerp quán tính mượt mà
      const diff = targetZRef.current - currentZRef.current;
      currentZRef.current += diff * 0.085;

      // Khi người dùng cuộn ngược vượt qua điểm bắt đầu (Z > 36px) -> tự động kích hoạt thoát ứng dụng
      if (currentZRef.current > 36 && !isExitingRef.current) {
        isExitingRef.current = true;
        exitProjectApp();
        return;
      }

      // Khi người dùng cuộn hết 100% và lướt xuyên qua màn hình THE END (Z < EXIT_DEPTH_Z) -> tự động thoát ứng dụng
      if (currentZRef.current < EXIT_DEPTH_Z && !isExitingRef.current) {
        isExitingRef.current = true;
        exitProjectApp();
        return;
      }

      const curZ = currentZRef.current;

      // A. Cập nhật vị trí Container Camera Z-Axis (100% GPU Hardware Accelerated)
      if (tunnelContainerRef.current) {
        tunnelContainerRef.current.style.transform = `translate3d(0, 0, ${-curZ}px)`;
      }

      // B. Cập nhật Hero Intro (Cổng chữ mở đầu)
      if (heroRef.current) {
        const introDist = curZ - INTRO_Z;
        const introScale = Math.max(0.2, 1 + Math.abs(introDist) / 320);
        const introOpacity = Math.max(0, 1 - Math.abs(introDist) / 680);
        heroRef.current.style.transform = `translate3d(0, 0, ${INTRO_Z}px) scale(${introScale})`;
        heroRef.current.style.opacity = String(introOpacity);
        heroRef.current.style.visibility = introOpacity > 0.01 ? 'visible' : 'hidden';
      }

      // C. Cập nhật 5 trạm dự án (Chỉ dùng translate3d, scale và opacity - LOẠI BỎ HOÀN TOÀN CSS BLUR)
      for (let i = 0; i < STATIONS.length; i++) {
        const el = stationRefs.current[i];
        if (!el) continue;
        const project = STATIONS[i];
        const relZ = project.targetZ - curZ;
        let opacity = 1;
        let scaleMultiplier = 1;
        let flyOutX = 0;

        if (relZ < -200) {
          const distFar = Math.abs(relZ + 200);
          opacity = Math.max(0.12, 1 - distFar / 1800);
        } else if (relZ > 150) {
          const distNear = relZ - 150;
          opacity = Math.max(0, 1 - distNear / 450);
          scaleMultiplier = 1 + distNear / 400;
          flyOutX = (project.isLeft ? -1 : 1) * (distNear * 0.9);
        }

        el.style.opacity = String(opacity);
        el.style.visibility = opacity > 0.02 ? 'visible' : 'hidden';
        const baseX = project.isLeft ? '-15vw' : '15vw';
        el.style.transform = `translate3d(calc(${baseX} + ${flyOutX}px), 0, ${project.targetZ}px) scale(${scaleMultiplier})`;
      }

      // D. Cập nhật Outro Portal (Màn hình THE END ở 100%)
      if (endPortalRef.current) {
        const relZ = END_STATION_Z - curZ;
        let opacity = 1;
        let scaleMultiplier = 1;

        if (relZ < -200) {
          const distFar = Math.abs(relZ + 200);
          opacity = Math.max(0.08, 1 - distFar / 1500);
        } else if (relZ > 80) {
          const distNear = relZ - 80;
          opacity = Math.max(0, 1 - distNear / 300);
          scaleMultiplier = 1 + distNear / 250;
        }

        endPortalRef.current.style.opacity = String(opacity);
        endPortalRef.current.style.visibility = opacity > 0.02 ? 'visible' : 'hidden';
        endPortalRef.current.style.transform = `translate3d(0, 0, ${END_STATION_Z}px) scale(${scaleMultiplier})`;
      }

      // E. Cập nhật thanh % Progress và Timecode trực tiếp lên innerText / style.width
      const prog = Math.min(1, Math.max(0, -curZ / Math.abs(END_STATION_Z)));
      const percent = Math.round(prog * 100);

      if (progressTextRef.current) {
        progressTextRef.current.innerText = `${String(percent).padStart(3, '0')}%`;
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${percent}%`;
      }

      // E. Bộ đếm Timecode nhảy frame thời gian thực
      frameCountRef.current += Math.abs(diff) > 5 ? 3 : 1;
      const totalFrames = frameCountRef.current;
      const f = totalFrames % 60;
      const totalSec = Math.floor(totalFrames / 60);
      const s = totalSec % 60;
      const m = Math.floor(totalSec / 60) % 60;
      const h = Math.floor(totalSec / 3600);
      const pad = (n: number) => String(n).padStart(2, '0');
      if (timecodeRef.current) {
        timecodeRef.current.innerText = `● ${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isInsideProjectApp, exitProjectApp]);

  // 2. Lắng nghe sự kiện con lăn chuột (Wheel) xuyên trục Z (HOÀN TOÀN YÊN TĨNH, KHÔNG ÂM THANH)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (selectedProject) return;
    const delta = e.deltaY * 1.35;
    // Cho phép targetZ vượt lên dương (đến +140) khi cuộn ngược lại để kích hoạt thoát app
    targetZRef.current = Math.min(
      140,
      Math.max(MAX_DEPTH, targetZRef.current - delta)
    );
  }, [selectedProject]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (selectedProject || touchStartYRef.current === null || e.touches.length === 0) return;
    const currentY = e.touches[0].clientY;
    const deltaY = touchStartYRef.current - currentY;
    touchStartYRef.current = currentY;
    targetZRef.current = Math.min(
      140,
      Math.max(MAX_DEPTH, targetZRef.current - deltaY * 2.2)
    );
  }, [selectedProject]);

  useEffect(() => {
    if (!isInsideProjectApp) return;

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isInsideProjectApp, handleWheel, handleTouchStart, handleTouchMove]);

  // 3. Phím bấm điều hướng bàn phím (Đóng modal hoặc cuộn qua các trạm)
  useEffect(() => {
    if (!isInsideProjectApp) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProject) {
          retroSound.playButtonClick(soundEnabled);
          setSelectedProject(null);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        targetZRef.current = Math.max(MAX_DEPTH, targetZRef.current - 450);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        targetZRef.current = Math.min(140, targetZRef.current + 450);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInsideProjectApp, selectedProject, soundEnabled]);

  if (!isInsideProjectApp) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0c] text-white select-none">
      {/* =====================================================================
          1. LỚP PHỦ KHÔNG GIAN RETRO CRT (SCANLINES & FILM GRAIN)
         ===================================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-40 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.04))',
          backgroundSize: '100% 3px, 4px 100%',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-40 opacity-25"
        style={{
          boxShadow: 'inset 0 0 140px rgba(0, 0, 0, 0.95), inset 0 0 60px rgba(0, 20, 40, 0.4)',
        }}
      />

      {/* =====================================================================
          2. KHÔNG GIAN PHỐI CẢNH 3D TUNNEL (CSS3D PERSPECTIVE VIEWPORT)
         ===================================================================== */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: '1100px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Container Z-Camera di chuyển dọc trục Z */}
        <div
          ref={tunnelContainerRef}
          className="relative h-full w-full"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* -----------------------------------------------------------------
              A. TRẠM 0: CỔNG CHỮ MỞ ĐẦU (HERO INTRO TEXT) — BAY XUYÊN QUA CHỮ
             ----------------------------------------------------------------- */}
          <div
            ref={heroRef}
            className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
            style={{
              transform: `translate3d(0, 0, ${INTRO_Z}px)`,
              willChange: 'transform, opacity',
            }}
          >
            <div className="mb-3 font-mono text-xs tracking-widest text-[#ff6b4a] uppercase">
              [ D:\ARCHIVE\1997_2026.EXE // HIGH-SPEED CD-ROM ]
            </div>
            <h1
              className="font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.45)]"
              style={{
                fontFamily: '"JetBrains Mono", sans-serif',
              }}
            >
              PROJECTS OF VINZBOIZ
            </h1>
            <p className="mt-4 max-w-xl font-serif italic text-sm sm:text-base text-[#a0a6b0] tracking-wide">
              5 Production Systems · WebGL 3D Procedural Engines · High-Concurrency Platforms
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-2 border border-white/20 px-5 py-2.5 bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="animate-bounce font-mono text-sm text-[#33ff33]">↓</span>
                <span className="font-mono text-xs tracking-widest text-white/90">
                  SCROLL DOWN TO DIVE INTO ARCHIVE
                </span>
              </div>
              <span className="hidden sm:inline text-white/40">·</span>
              <div className="flex items-center gap-2">
                <span className="animate-pulse font-mono text-sm text-[#ffdf66]">↑</span>
                <span className="font-mono text-xs tracking-widest text-[#ffdf66]/90">
                  SCROLL BACK UP TO RETURN TO PC
                </span>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              B. TRẠM 1 -> 5: 5 KHUNG DỰ ÁN XẾP SO LE (STAGGERED 3D FRAMES)
             ----------------------------------------------------------------- */}
          {STATIONS.map((project, idx) => {
            const baseX = project.isLeft ? '-15vw' : '15vw';

            return (
              <div
                key={project.id}
                ref={(el) => {
                  stationRefs.current[idx] = el;
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                style={{
                  transform: `translate3d(${baseX}, 0, ${project.targetZ}px)`,
                  willChange: 'transform, opacity',
                }}
              >
                {/* KHUNG BẢN VẼ KỸ THUẬT NGOÀI (OUTER WIREFRAME GUIDE) */}
                <div
                  onClick={() => {
                    retroSound.playWindowClick(soundEnabled);
                    setSelectedProject(project);
                  }}
                  className="group relative cursor-pointer border border-[#d26e6e]/40 bg-[#101014]/90 p-3 sm:p-4 backdrop-blur-md transition-all duration-300 hover:border-[#33ff33] hover:shadow-[0_0_30px_rgba(51,255,51,0.25)]"
                  style={{
                    width: 'min(92vw, 560px)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
                  }}
                >
                  {/* Dấu chữ thập Crosshair ở 4 góc khung ngoài */}
                  <span className="absolute -top-1.5 -left-1.5 font-mono text-[10px] text-[#ff6b4a]">+</span>
                  <span className="absolute -top-1.5 -right-1.5 font-mono text-[10px] text-[#ff6b4a]">+</span>
                  <span className="absolute -bottom-1.5 -left-1.5 font-mono text-[10px] text-[#ff6b4a]">+</span>
                  <span className="absolute -bottom-1.5 -right-1.5 font-mono text-[10px] text-[#ff6b4a]">+</span>

                  {/* KHUNG ẢNH 16:9 */}
                  <div className="relative aspect-video w-full overflow-hidden border border-white/20 bg-black">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                    {/* Lớp scanlines mỏng trên ảnh */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 2px, transparent 4px)',
                      }}
                    />

                    {/* Badge xem chi tiết khi rê chuột */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="border border-[#33ff33] bg-black/90 px-3 py-1.5 font-mono text-xs font-bold text-[#33ff33] tracking-widest shadow-[0_0_12px_rgba(51,255,51,0.4)]">
                        [ CLICK TO OPEN FULL SPEC ]
                      </span>
                    </div>

                    {/* Số hiệu Project góc trên phải ảnh */}
                    <div className="absolute top-2 right-2 border border-white/30 bg-black/80 px-2 py-0.5 font-mono text-xs font-bold text-white">
                      #{project.id}
                    </div>
                  </div>

                  {/* METADATA & TYPOGRAPHY DƯỚI KHUNG ẢNH */}
                  <div className="mt-3 sm:mt-4 text-left">
                    <div className="font-mono text-[11px] font-bold tracking-widest text-[#ff6b4a] uppercase">
                      {project.category}
                    </div>
                    <h3 className="mt-1 font-bold text-lg sm:text-xl text-white tracking-tight group-hover:text-[#33ff33] transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-1 font-serif italic text-xs sm:text-sm text-[#b0b8c4]">
                      {project.subtitle}
                    </p>
                    <p className="mt-2 text-xs text-[#8c94a0] line-clamp-2 leading-relaxed">
                      {project.summary}
                    </p>

                    {/* Tech Stack Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/80"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 4 && (
                        <span className="px-1 font-mono text-[10px] text-white/50">
                          +{project.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* -----------------------------------------------------------------
              C. TRẠM 6: CỔNG KẾT THÚC (THE END // ARCHIVE COMPLETED - 100%)
             ----------------------------------------------------------------- */}
          <div
            ref={endPortalRef}
            className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-auto"
            style={{
              transform: `translate3d(0, 0, ${END_STATION_Z}px)`,
              willChange: 'transform, opacity',
            }}
          >
            <div
              className="relative border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#101016]/95 p-6 sm:p-8 backdrop-blur-md"
              style={{
                width: 'min(92vw, 620px)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(51, 255, 51, 0.15)',
              }}
            >
              {/* Dấu chữ thập Crosshair ở 4 góc */}
              <span className="absolute -top-1.5 -left-1.5 font-mono text-[10px] text-[#33ff33]">+</span>
              <span className="absolute -top-1.5 -right-1.5 font-mono text-[10px] text-[#33ff33]">+</span>
              <span className="absolute -bottom-1.5 -left-1.5 font-mono text-[10px] text-[#33ff33]">+</span>
              <span className="absolute -bottom-1.5 -right-1.5 font-mono text-[10px] text-[#33ff33]">+</span>

              <div className="mb-2 font-mono text-[11px] font-bold tracking-widest text-[#33ff33] uppercase">
                [ ARCHIVE TERMINATION · 05 / 05 COMPLETE ]
              </div>

              <h2
                className="font-black text-4xl sm:text-6xl tracking-tight text-white drop-shadow-[0_0_20px_rgba(51,255,51,0.5)]"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                — THE END —
              </h2>

              <p className="mt-2 font-serif italic text-sm sm:text-base text-[#ffdf66]">
                Thank you for exploring the portfolio of Vinzboiz
              </p>

              {/* Bảng chẩn đoán phần cứng Retro */}
              <div className="mt-4 border border-white/20 bg-black/70 p-3 text-left font-mono text-xs text-[#a0a8b4] space-y-1">
                <div className="flex justify-between">
                  <span>SHOWCASE STATUS:</span>
                  <span className="text-[#33ff33] font-bold">100% DATA SCANNED</span>
                </div>
                <div className="flex justify-between">
                  <span>TOTAL ARCHIVES:</span>
                  <span className="text-white">5 PRODUCTION SYSTEMS</span>
                </div>
                <div className="flex justify-between">
                  <span>DISC ENGINE:</span>
                  <span className="text-white">CREATIVE 24X INFRA (D:\)</span>
                </div>
              </div>

              {/* Nút bấm và chỉ dẫn cuộn để thoát */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2 border border-[#33ff33] bg-[#33ff33]/10 px-4 py-2 font-mono text-xs font-bold text-[#33ff33] shadow-[0_0_15px_rgba(51,255,51,0.2)]">
                  <span className="animate-bounce">↓</span>
                  <span>SCROLL DOWN TO EXIT BACK TO RETRO PC</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    retroSound.playButtonClick(soundEnabled);
                    exitProjectApp();
                  }}
                  className="cursor-pointer border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] bg-[#c0c0c0] px-4 py-2 font-mono text-xs font-bold text-black hover:bg-white active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white transition-all shadow-md"
                >
                  [ EXIT NOW ]
                </button>
              </div>

              <div className="mt-4 font-mono text-[10px] text-white/40 tracking-wider">
                OR SCROLL BACK UP TO RE-INSPECT PREVIOUS PROJECTS ↑
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. RETRO VIEWFINDER HUD (GIAO DIỆN 4 GÓC MÀN HÌNH CHUẨN THẬP NIÊN 90)
         ===================================================================== */}
      {/* 4 Dấu ngoặc vuông chữ L (Corner Brackets) */}
      <div className="pointer-events-none absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-white/70" />
      <div className="pointer-events-none absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-white/70" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-white/70" />
      <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-white/70" />

      {/* CHÍNH GIỮA CẠNH TRÊN: CHỈ DẪN NHẤP CHUỘT */}
      <div className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 border border-white/20 bg-black/80 px-4 py-1 backdrop-blur-sm">
        <span className="font-mono text-[11px] tracking-widest text-[#ffdf66]">
          CLICK A FRAME TO VIEW THE PROJECT
        </span>
      </div>

      {/* GÓC TRÊN BÊN PHẢI: THÔNG SỐ RETRO + CHỈ DẪN CUỘN LÊN ĐỂ THOÁT */}
      <div className="pointer-events-none absolute top-5 right-6 flex items-center gap-3">
        <div className="hidden sm:block font-mono text-xs text-white/60 tracking-wider">
          CAM 04 · 60 FPS · 3DFX GLIDE
        </div>
        <div className="border border-[#33ff33]/40 bg-black/75 px-3 py-1 backdrop-blur-sm flex items-center gap-1.5 font-mono text-xs text-[#33ff33] tracking-wider">
          <span className="animate-pulse">↕</span> SCROLL UP / DOWN PAST END TO EXIT
        </div>
      </div>

      {/* GÓC DƯỚI BÊN TRÁI: ĐÈN CHẤM ĐỎ & BỘ ĐẾM TIMECODE TRỰC TIẾP */}
      <div className="pointer-events-none absolute bottom-5 left-6 flex items-center gap-3 font-mono text-xs">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff2a2a] animate-pulse" />
        <span ref={timecodeRef} className="font-bold tracking-widest text-white/90">
          ● 00:00:25:07
        </span>
        <span className="hidden sm:inline border-l border-white/20 pl-3 text-white/50 text-[11px]">
          OPTICAL DISC D:\ · 650MB
        </span>
      </div>

      {/* GÓC DƯỚI BÊN PHẢI: THANH TIẾN TRÌNH % ĐỒNG BỘ 5 DỰ ÁN */}
      <div className="pointer-events-none absolute bottom-5 right-6 flex items-center gap-3 font-mono text-xs">
        <span className="text-white/60 tracking-wider">PROGRESS</span>
        <div className="h-2 w-28 sm:w-40 border border-white/30 bg-black/60 p-0.5">
          <div
            ref={progressBarRef}
            className="h-full bg-[#33ff33]"
            style={{ width: '0%' }}
          />
        </div>
        <span ref={progressTextRef} className="font-bold text-[#33ff33] w-12 text-right">
          000%
        </span>
      </div>

      {/* =====================================================================
          4. RETRO SPEC MODAL (BẢNG THÔNG TIN KỸ THUẬT CHI TIẾT KHI CLICK KHUNG)
         ===================================================================== */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto win95-outset bg-[#c0c0c0] p-1 text-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thanh tiêu đề Windows 95 */}
            <div className="flex items-center justify-between bg-[#000080] px-3 py-1.5 text-white">
              <div className="flex items-center gap-2 font-mono text-xs font-bold tracking-wider">
                <span>📁</span>
                <span>PROJECT_{selectedProject.id}.EXE - HARDWARE SPEC SHEET</span>
              </div>
              <button
                onClick={() => {
                  retroSound.playButtonClick(soundEnabled);
                  setSelectedProject(null);
                }}
                className="win95-btn px-2 font-mono text-xs font-bold text-black"
                title="Đóng [ESC]"
              >
                ✕
              </button>
            </div>

            {/* Nội dung bên trong bảng thông số */}
            <div className="p-4 sm:p-6 bg-[#d8d2c5] font-mono text-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/20 pb-3 gap-2">
                <div>
                  <span className="text-[10px] text-[#800000] font-bold">PART NO. // {selectedProject.id}</span>
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">{selectedProject.title}</h2>
                  <p className="font-serif italic text-xs text-black/70">{selectedProject.subtitle}</p>
                </div>
                <div className="border border-black/40 bg-white px-3 py-1 text-right">
                  <div className="text-[10px] text-black/60">ROLE / YEAR</div>
                  <div className="font-bold text-[#000080]">{selectedProject.role} · {selectedProject.year}</div>
                </div>
              </div>

              {/* Ảnh dự án */}
              <div className="relative aspect-video w-full overflow-hidden border-2 border-black/40 bg-black">
                <img
                  src={selectedProject.imageUrl}
                  alt={selectedProject.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Bảng thông số đo đạc thời gian thực (Telemetry Matrix) */}
              {selectedProject.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-black/30 bg-white p-3">
                  {selectedProject.metrics.map((m, mIdx) => (
                    <div key={mIdx}>
                      <div className="text-[10px] text-black/50">{m.label}</div>
                      <div className="font-bold text-[#000080]">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mô tả kỹ thuật */}
              <div className="border border-black/30 bg-white p-3 space-y-2">
                <div className="font-bold text-[11px] text-[#000080] uppercase tracking-wider">
                  [ ENGINEERING HIGHLIGHTS & ARCHITECTURE ]
                </div>
                <p className="leading-relaxed text-black/90">
                  {selectedProject.description}
                </p>
                <ul className="list-disc list-inside space-y-1 text-black/80 pt-2 border-t border-black/10">
                  {selectedProject.architecture.map((point: string, i: number) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack Badges */}
              <div>
                <div className="font-bold text-[10px] text-black/60 uppercase mb-1.5">TECH STACK MATRIX:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.techStack.map((tech) => (
                    <span key={tech} className="border border-black/30 bg-[#e0ded6] px-2 py-0.5 text-[11px] font-bold text-black">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Thanh nút bấm hành động cuối Modal */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-black/20 gap-2">
                <div className="text-[11px] text-black/60">
                  STATUS: <span className="font-bold text-[#008000]">ONLINE IN PRODUCTION</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="win95-btn px-4 py-1.5 font-bold text-xs text-[#000080] hover:bg-white flex items-center gap-1.5"
                    >
                      <span>▶</span>
                      <span>OPEN LIVE SYSTEM ↗</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      retroSound.playButtonClick(soundEnabled);
                      setSelectedProject(null);
                    }}
                    className="win95-btn px-4 py-1.5 font-bold text-xs text-black"
                  >
                    CLOSE [ESC]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
