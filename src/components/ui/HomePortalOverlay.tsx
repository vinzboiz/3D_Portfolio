import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

export function HomePortalOverlay() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const stageTransition = useBuildStore((s) => s.stageTransition);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const setStep = useBuildStore((s) => s.setStep);

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

  // YÊU CẦU #1: portalProgress liên tục trong [0.0, 1.0] điều khiển 100% độ mở và slogan
  const portalProgress = THREE.MathUtils.clamp(homeTransitionProgress, 0, 1);

  // HomePortalOverlay phải được hiển thị ngay khi portalProgress < 0.999
  // Chỉ unmount khi đã vào sâu trong các bước lắp ráp (portalProgress >= 0.999) và không trong chuỗi chuyển cảnh về Home
  const isTransitioningHome = stageTransition === 'TO_HOME' || stageTransition === 'TO_HOME_STEP1';
  if (portalProgress >= 0.999 && currentStep > 0 && !isTransitioningHome) {
    return null;
  }

  const handleEnterWorkbench = () => {
    if (portalProgress < 0.1) {
      setStep(1);
    }
  };

  const handleOverlayWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && portalProgress < 0.1) {
      setStep(1);
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

  return (
    <div
      onClick={handleEnterWorkbench}
      onWheel={handleOverlayWheel}
      style={{
        top: '80px',
        height: 'calc(100vh - 80px)',
        pointerEvents: portalProgress < 0.1 ? 'auto' : 'none',
        cursor: portalProgress < 0.1 ? 'pointer' : 'default',
      }}
      className="fixed left-0 right-0 z-20 overflow-hidden select-none"
    >
      {/* =======================================================================
          1. KỸ THUẬT MASK WINDOW CHÍNH GIỮA (BOX-SHADOW CUTOUT 9999PX HOẶC CSS MASK)
          - Phủ nền đen sâu #0a0a0c bao quanh
          - Thu hẹp / mở rộng liên tục 100% theo portalProgress (0.0 <-> 1.0)
         ======================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative"
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
        >
          {/* Nút tròn nhỏ `||` (Pause / Status icon) ở góc dưới bên phải khung cửa sổ */}
          <div
            className="absolute bottom-4 right-4 w-8 h-8 rounded-full border border-white/30 bg-black/50 backdrop-blur-md flex items-center justify-center shadow-lg"
            style={{
              opacity: Math.max(0, 1 - portalProgress * 2.5),
              transform: `scale(${1 - portalProgress * 0.3})`,
            }}
            title="Cuộn chuột hoặc nhấp để bước vào bàn lắp ráp"
          >
            <div className="flex gap-[3.5px] items-center justify-center">
              <span className="w-[2px] h-3 bg-white/90 rounded-sm" />
              <span className="w-[2px] h-3 bg-white/90 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          2. KHUNG NGẮM KỸ THUẬT (RETRO VIEWFINDER FRAME)
          - Viền mảnh màu đỏ cam trầm: 1px solid rgba(224, 90, 71, 0.35)
          - Hiện rõ dần khi portalProgress -> 0 và mờ dần khi mở portal
         ======================================================================= */}
      <div
        className="pointer-events-none absolute top-12 bottom-8 left-6 right-6 sm:top-14 sm:bottom-10 sm:left-12 sm:right-12"
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
          - Cụm trái: trượt từ trái vào khi portalProgress giảm về 0
          - Cụm phải: trượt từ phải vào khi portalProgress giảm về 0
         ======================================================================= */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-6xl h-full flex items-center justify-between px-4 sm:px-12 md:px-20">
          {/* Cụm trái: "Kiến tạo không gian" */}
          <div
            className="flex-1 flex flex-col items-end pr-6 sm:pr-10 md:pr-16 text-right"
            style={{
              transform: `translateX(-${sloganTranslateX}px)`,
              opacity: sloganOpacity,
              marginTop: '-10vh',
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
          4. FOOTER CALL-TO-ACTION
         ======================================================================= */}
      <div
        className="pointer-events-none absolute bottom-8 inset-x-0 flex flex-col items-center justify-center"
        style={{
          opacity: Math.max(0, 1 - portalProgress * 2.5),
          transform: `translateY(${portalProgress * 24}px)`,
          willChange: 'opacity, transform',
        }}
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e05a47] animate-pulse" />
          <span className="font-mono text-[11px] font-bold tracking-widest text-[#d8d2c5] uppercase">
            Cuộn chuột hoặc nhấp để bước vào bàn lắp ráp
          </span>
          <span className="font-mono text-xs text-[#e05a47] animate-bounce">↓</span>
        </div>
      </div>
    </div>
  );
}

