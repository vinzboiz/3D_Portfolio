import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';
import { EditorialProjectsSection } from './EditorialProjectsSection';
import { EditorialCvSection } from './EditorialCvSection';

export function HomePortalOverlay() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const stageTransition = useBuildStore((s) => s.stageTransition);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const hasCompletedAssembly = useBuildStore((s) => s.hasCompletedAssembly);
  const postAssemblyHomeScrollCount = useBuildStore((s) => s.postAssemblyHomeScrollCount);
  const jumpToAbout = useBuildStore((s) => s.jumpToAbout);
  const replayAbout = useBuildStore((s) => s.replayAbout);
  const enterCompletedWorkstationInspect = useBuildStore((s) => s.enterCompletedWorkstationInspect);
  const transitionPostAboutToHome = useBuildStore((s) => s.transitionPostAboutToHome);

  // Timecode động định dạng HH:MM:SS:FF chuẩn màn hình Viewfinder máy quay
  const [timecode, setTimecode] = useState('00:00:00:00');

  // Cập nhật Timecode chạy thời gian thực
  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const totalSeconds = Math.floor(elapsed / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      const frames = String(Math.floor((elapsed % 1000) / (1000 / 30))).padStart(2, '0');
      setTimecode(`${hours}:${minutes}:${seconds}:${frames}`);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // portalProgress liên tục trong [0.0, 1.0] điều khiển 100% độ mở và slogan
  const portalProgress = THREE.MathUtils.clamp(homeTransitionProgress, 0, 1);
  const isTransitioningToHome =
    stageTransition === 'POST_ABOUT_TO_HOME' ||
    stageTransition === 'TO_HOME' ||
    stageTransition === 'TO_HOME_STEP1';
  const isInside3D =
    currentStep >= 1 && portalProgress >= 0.5 && !isTransitioningToHome;

  // Khóa cuộn trang dọc CHỈ KHI đang ở trong không gian 3D About hoặc khi đang chuyển cảnh
  const isScrollLocked = isInside3D || stageTransition !== 'IDLE';

  useEffect(() => {
    if (isScrollLocked) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [isScrollLocked]);

  // Click vào ô cửa sổ trung tâm hoặc nút CTA:
  // - Nếu chưa lắp máy: vào quy trình lắp máy About (Step 01)
  // - Nếu đã lắp máy xong: vào xem chi tiết toàn bộ máy & bật OrbitControls xoay zoom tương tác tự do!
  const handleEnterWorkbench = () => {
    if (portalProgress < 0.1) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (hasCompletedAssembly) {
        enterCompletedWorkstationInspect();
      } else {
        jumpToAbout();
      }
    }
  };

  const progressPercent = Math.round(portalProgress * 100);

  // Kích thước và bo góc cửa sổ nội suy liên tục 100% theo portalProgress (0.0 <-> 1.0)
  const widthStr = portalProgress >= 0.99 ? '100vw' : `calc(28vw + ${portalProgress * 72}vw)`;
  const maxWidthStr = portalProgress >= 0.99 ? 'none' : `calc(380px + ${portalProgress * 1400}px)`;
  const heightStr = portalProgress >= 0.99 ? '100vh' : `calc(62vh + ${portalProgress * 38}vh)`;
  const borderRadiusStr = `${(1 - portalProgress) * 28}px`;

  // Độ mờ và độ dịch chuyển của 2 cụm chữ Slogan
  const sloganOpacity = Math.max(0, 1 - portalProgress * 1.5);
  const sloganTranslateX = portalProgress * 160;

  // Độ mờ và scale của khung Viewfinder đỏ cam
  const viewfinderOpacity = Math.max(0, 1 - portalProgress * 1.6);
  const viewfinderScale = 1 - portalProgress * 0.04;

  const isTransitioningHome =
    stageTransition === 'TO_HOME' ||
    stageTransition === 'TO_HOME_STEP1' ||
    stageTransition === 'POST_ABOUT_TO_HOME';

  return (
    <div
      className="relative w-full text-white selection:bg-[#e05a47] selection:text-white"
      style={{ zIndex: 10, pointerEvents: isInside3D ? 'none' : 'auto' }}
    >
      {/* =======================================================================
          TẦNG 1: #home-section (100vh) - SPLIT-TEXT PORTAL MASK & RETRO LAB VIEW
          - Cửa sổ trung tâm nhìn xuyên xuống căn phòng 3D bên dưới
          - Chữ Slogan 2 bên trượt ra khi mở portal
          - Lăn chuột xuống ngay tại Home hoặc nhấp nút CTA để mở rộng vào 3D About
         ======================================================================= */}
      <section
        id="home-section"
        className={`relative w-full h-screen overflow-hidden select-none ${
          portalProgress > 0.05 ? 'fixed top-0 left-0 right-0 z-20' : 'relative'
        }`}
        style={{
          pointerEvents: portalProgress <= 0.15 ? 'auto' : 'none',
        }}
      >
        {/* =======================================================================
            1. KỸ THUẬT MASK WINDOW CHÍNH GIỮA (BOX-SHADOW CUTOUT 9999PX)
           ======================================================================= */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-[80px]">
          <div
            onClick={handleEnterWorkbench}
            className={`relative ${portalProgress <= 0.15 ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'} group`}
            style={{
              width: widthStr,
              maxWidth: maxWidthStr,
              minWidth: portalProgress >= 0.99 ? 'none' : '260px',
              height: heightStr,
              borderRadius: borderRadiusStr,
              boxShadow: '0 0 0 9999px #0a0a0c',
              border:
                portalProgress >= 0.96
                  ? 'none'
                  : `1px solid rgba(255, 255, 255, ${(1 - portalProgress) * 0.22})`,
              willChange: 'width, height, border-radius',
            }}
            title={
              hasCompletedAssembly
                ? 'Nhấp để vào xem chi tiết toàn bộ dàn máy 3D (Orbit Inspect)'
                : 'Nhấp để bước vào phòng Lab 3D (About)'
            }
          >
            {/* Badge hover tinh tế ở tâm khung cửa sổ */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ display: portalProgress > 0.1 ? 'none' : 'flex' }}
            >
              <div className="px-4 py-2 rounded-full bg-black/85 border border-white/20 backdrop-blur-md shadow-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e05a47] animate-ping" />
                <span className="font-mono text-xs font-semibold tracking-wider text-white uppercase">
                  {hasCompletedAssembly ? 'XEM CHI TIẾT DÀN MÁY 3D ↗' : 'ENTER 3D LAB ↗'}
                </span>
              </div>
            </div>

            {/* Nút tròn xem Replay quy trình lắp ráp ở góc dưới bên phải trong khung portal */}
            {hasCompletedAssembly && portalProgress < 0.15 && (
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    replayAbout();
                  }}
                  title="Nhấn để xem lại quy trình lắp ráp máy tính (Replay About)"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-black/95 text-white/80 hover:text-white border border-white/20 hover:border-white/50 backdrop-blur-md flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group/btn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-500 group-hover/btn:-rotate-180 text-white"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================
            2. KHUNG NGẮM KỸ THUẬT (RETRO VIEWFINDER FRAME)
           ======================================================================= */}
        <div
          className="pointer-events-none absolute top-24 bottom-12 left-6 right-6 sm:top-28 sm:bottom-16 sm:left-12 sm:right-12"
          style={{
            opacity: viewfinderOpacity,
            transform: `scale(${viewfinderScale})`,
            willChange: 'opacity, transform',
          }}
        >
          <div className="relative w-full h-full border border-[#e05a47]/35">
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-[#e05a47]" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-[#e05a47]" />
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-[#e05a47]" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-[#e05a47]" />

            <div className="absolute -top-6 left-0 text-[10px] font-mono tracking-widest text-[#e05a47]/80 uppercase">
              PORTFOLIO 2026 — HARDWARE / WEBGL / FULL-STACK ARCHITECT
            </div>

            <div className="absolute -top-6 right-0 text-[10px] font-mono tracking-wider text-[#e05a47]/80 uppercase">
              CAM 01 · 60 FPS · ISO 400
            </div>

            <div className="absolute -bottom-6 left-0 flex items-center gap-2 text-[10px] font-mono tracking-wider text-[#e05a47]/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3333] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2a2a]" />
              </span>
              <span>{timecode}</span>
            </div>

            <div className="absolute -bottom-6 right-0 text-[10px] font-mono tracking-wider text-[#e05a47]/80 uppercase">
              PROGRESS {String(progressPercent).padStart(3, '0')}%
            </div>
          </div>
        </div>

        {/* =======================================================================
            3. TYPOGRAPHY SLOGAN CHIA ĐÔI (SPLIT-TEXT SLOGAN)
           ======================================================================= */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-[80px]">
          <div className="relative w-full max-w-6xl h-full flex items-center justify-between px-4 sm:px-12 md:px-20">
            {/* Cụm trái: "Kiến tạo không gian" */}
            <div
              className="flex-1 flex flex-col items-end pr-6 sm:pr-10 md:pr-16 text-right"
              style={{
                transform: `translateX(-${sloganTranslateX}px)`,
                opacity: sloganOpacity,
                marginTop: '-8vh',
                willChange: 'transform, opacity',
              }}
            >
              <h1 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(2.6rem,5.6vw,6.4rem)] leading-[0.92] uppercase drop-shadow-md">
                Kiến tạo
              </h1>
              <h1 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(2.6rem,5.6vw,6.4rem)] leading-[0.92] uppercase drop-shadow-md">
                không gian
              </h1>
            </div>

            {/* Khoảng trống dành cho khung cửa sổ trung tâm */}
            <div
              className="shrink-0"
              style={{
                width: portalProgress >= 0.99 ? '100vw' : `calc(28vw + ${portalProgress * 72}vw)`,
                maxWidth: portalProgress >= 0.99 ? 'none' : `calc(380px + ${portalProgress * 1400}px)`,
                minWidth: portalProgress >= 0.99 ? 'none' : '260px',
                height: heightStr,
              }}
            />

            {/* Cụm phải: "từ những vi mạch sống" */}
            <div
              className="flex-1 flex flex-col items-start pl-6 sm:pr-0 sm:pl-10 md:pl-16 text-left"
              style={{
                transform: `translateX(${sloganTranslateX}px)`,
                opacity: sloganOpacity,
                marginTop: '10vh',
                willChange: 'transform, opacity',
              }}
            >
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="font-sans font-extrabold text-xs sm:text-sm text-white/70 tracking-widest uppercase pb-1">
                  từ
                </span>
                <span
                  className="italic font-normal text-[#e05a47] text-[clamp(2.4rem,5.0vw,5.8rem)] leading-[0.92] drop-shadow-md"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  những
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 sm:gap-3.5">
                <span
                  className="italic font-normal text-[#e05a47] text-[clamp(2.4rem,5.0vw,5.8rem)] leading-[0.92] drop-shadow-md"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  vi mạch
                </span>
                <span className="font-sans font-black text-[#f5f5f7] text-[clamp(2.6rem,5.6vw,6.4rem)] leading-[0.92] uppercase tracking-tight drop-shadow-md">
                  sống
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            4. FOOTER CALL-TO-ACTION & CUỘN XUỐNG XEM DỰ ÁN
           ======================================================================= */}
        <div
          className={`absolute bottom-8 inset-x-0 flex flex-col items-center justify-center gap-2 ${
            portalProgress <= 0.15 ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{
            opacity: Math.max(0, 1 - portalProgress * 2.5),
            transform: `translateY(${portalProgress * 24}px)`,
            willChange: 'opacity, transform',
          }}
        >
          {/* Nút bấm vào phòng lab khi chưa lắp ráp */}
          {!hasCompletedAssembly && (
            <button
              type="button"
              onClick={handleEnterWorkbench}
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-black/60 hover:bg-black/90 backdrop-blur-md shadow-2xl cursor-pointer transition-transform hover:scale-105 active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#e05a47] animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-widest text-[#d8d2c5] uppercase">
                Bấm để bước vào phòng Lab 3D (About)
              </span>
              <span className="font-mono text-xs text-[#e05a47]">↗</span>
            </button>
          )}

          {/* Khi đã lắp ráp xong: gợi ý cuộn xuống xem Projects & CV */}
          {hasCompletedAssembly && (
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs text-white/60 tracking-wider">
                Cuộn xuống xem Projects & My CV ↓
              </span>
            </div>
          )}
        </div>
      </section>

      {/* =======================================================================
          TẦNG 2: #projects-section (SELECTED PROJECTS - EDITORIAL TABLE LIST)
          Chỉ hiển thị đầy đủ khi ở ngoài không gian 3D
         ======================================================================= */}
      {(!isInside3D || isTransitioningHome) && <EditorialProjectsSection />}

      {/* =======================================================================
          TẦNG 3: #cv-section (MY CV / RESUME - EDITORIAL PROFILE & TIMELINE)
          Chỉ hiển thị đầy đủ khi ở ngoài không gian 3D
         ======================================================================= */}
      {(!isInside3D || isTransitioningHome) && <EditorialCvSection />}
    </div>
  );
}
