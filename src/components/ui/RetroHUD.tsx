import { useEffect, useRef } from 'react';
import { useBuildStore } from '../../store/useBuildStore';

export function RetroHUD() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const toggleFreeCam = useBuildStore((s) => s.toggleFreeCam);
  const addScrollDelta = useBuildStore((s) => s.addScrollDelta);
  const jumpToHome = useBuildStore((s) => s.jumpToHome);
  const jumpToAbout = useBuildStore((s) => s.jumpToAbout);
  const jumpToProject = useBuildStore((s) => s.jumpToProject);
  const jumpToCv = useBuildStore((s) => s.jumpToCv);

  const touchStartYRef = useRef<number | null>(null);

  // Xác định tab điều hướng nào đang active trên thanh Header:
  // Step 00: HOME
  // Step 01 -> 10: ABOUT
  // Step 11: PROJECT
  // Step 12: MY CV
  const isHomeActive = currentStep === 0 && !isInsideProjectApp;
  const isAboutActive = currentStep >= 1 && currentStep <= 10 && !isInsideProjectApp;
  const isProjectActive = currentStep === 11 || isInsideProjectApp;
  const isCvActive = currentStep === 12 && !isInsideProjectApp;

  useEffect(() => {
    let lastScrollTime = 0;
    let lastDir = 0;

    const handleWheel = (e: WheelEvent) => {
      const state = useBuildStore.getState();
      // Khi bật Free Cam hoặc đang trong quá trình chuyển cảnh / 3D Project Tunnel: không can thiệp cuộn timeline
      if (
        state.freeCam ||
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE'
      ) {
        return;
      }
      if (Math.abs(e.deltaY) <= 15) return;

      const dir = e.deltaY > 0 ? 1 : -1;
      const now = performance.now();

      // Cuộn ngược (dir < 0): Phản hồi tức thì 0ms delay, không bị chặn bởi cooldown
      if (dir < 0) {
        lastScrollTime = now;
        lastDir = dir;
        const targetStep = Math.max(0, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
        return;
      }

      // Cuộn xuôi từ Step 0 sang Step 1: Phản hồi tức thì không bị cooldown cản trở!
      if (state.currentStep === 0) {
        lastScrollTime = now;
        lastDir = dir;
        state.setStep(1);
        return;
      }

      // Cuộn xuôi các bước tiếp theo (Step 1 -> 12): Cooldown 650ms để nhảy từng bước rõ ràng
      if (now - lastScrollTime < 650) return;
      lastScrollTime = now;
      lastDir = dir;

      if (state.currentStep === 10 && state.osState !== 'DESKTOP') {
        state.showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
        return;
      }
      const targetStep = Math.min(12, state.currentStep + 1);
      if (targetStep !== state.currentStep) {
        state.setStep(targetStep);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = useBuildStore.getState();
      if (
        state.freeCam ||
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE' ||
        touchStartYRef.current === null ||
        e.touches.length === 0
      ) {
        return;
      }
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      if (Math.abs(deltaY) < 30) return;

      const dir = deltaY > 0 ? 1 : -1;
      const now = performance.now();

      // Vuốt cuộn ngược: Phản hồi tức thì 0ms delay
      if (dir < 0) {
        lastScrollTime = now;
        lastDir = dir;
        touchStartYRef.current = currentY;
        const targetStep = Math.max(0, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
        return;
      }

      // Vuốt cuộn xuôi từ Step 0 sang Step 1: Phản hồi tức thì
      if (state.currentStep === 0) {
        lastScrollTime = now;
        lastDir = dir;
        touchStartYRef.current = currentY;
        state.setStep(1);
        return;
      }

      if (now - lastScrollTime < 650) return;
      lastScrollTime = now;
      lastDir = dir;
      touchStartYRef.current = currentY;

      if (state.currentStep === 10 && state.osState !== 'DESKTOP') {
        state.showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
        return;
      }
      const targetStep = Math.min(12, state.currentStep + 1);
      if (targetStep !== state.currentStep) {
        state.setStep(targetStep);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useBuildStore.getState();
      if (
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE'
      ) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (state.currentStep === 10 && state.osState !== 'DESKTOP') {
          state.showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
          return;
        }
        state.setStep(Math.min(12, state.currentStep + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        state.setStep(Math.max(0, state.currentStep - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFreeCam();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [freeCam, isInsideProjectApp, projectAppTransition, addScrollDelta, toggleFreeCam]);

  if (isInsideProjectApp || projectAppTransition !== 'IDLE') return null;

  return (
    <>
      {/* =======================================================================
          1. FIXED TOP NAVBAR (EDITORIAL MINIMALIST STYLE - TRANSPARENT BACKGROUND)
          fixed top-0 left-0 right-0 h-[80px] z-[100], background hoàn toàn trong suốt
         ======================================================================= */}
      <header className="fixed top-0 left-0 right-0 h-[80px] z-[100] px-6 sm:px-12 flex items-center justify-between select-none bg-transparent pointer-events-none">
        {/* Cụm Bên Trái (Brand Identity) */}
        <div
          onClick={jumpToHome}
          className="pointer-events-auto flex items-center gap-3 cursor-pointer group"
          title="Về trang chủ (Step 00)"
        >
          {/* Icon khối 3D Wireframe (SVG) 28x28px */}
          <div className="w-7 h-7 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          {/* Tên & Chức danh 2 dòng */}
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold text-white text-[1.05rem] tracking-[-0.02em] leading-tight group-hover:text-[#f2f0ea] transition-colors">
              Nguyễn Xuân Vinh
            </span>
            <span className="font-mono text-[0.68rem] tracking-[0.16em] uppercase text-[#8a8a8e] leading-tight">
              FULL-STACK & 3D DEVELOPER
            </span>
          </div>
        </div>

        {/* Cụm Bên Phải (Menu Links & Language & Pill CTA) */}
        <div className="pointer-events-auto flex items-center gap-5 sm:gap-7">
          {/* Text Links dạng thuần (không đóng khung viền hộp) */}
          <nav className="flex items-center gap-5 sm:gap-7 text-[0.92rem] font-sans">
            <button
              type="button"
              onClick={jumpToHome}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isHomeActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={jumpToAbout}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isAboutActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={jumpToProject}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isProjectActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={jumpToCv}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isCvActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              My CV
            </button>
          </nav>

          {/* Cụm chọn ngôn ngữ (VI / EN) */}
          <div className="flex items-center gap-2">
            <div className="w-[34px] h-[34px] nav-circle border border-white/35 flex items-center justify-center text-xs font-semibold text-white shrink-0 select-none">
              VI
            </div>
            <span className="text-xs font-medium text-[#8e8e93] hover:text-white cursor-pointer transition-colors">
              EN
            </span>
          </div>

          {/* Nút Pill Button [ Liên hệ ] nổi bật ngoài cùng bên phải */}
          <button
            type="button"
            onClick={jumpToCv}
            className="nav-pill bg-[#f2f0ea] text-[#111111] hover:bg-white text-xs sm:text-sm font-medium px-[22px] py-[9px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 select-none"
          >
            Liên hệ
          </button>
        </div>
      </header>

      {/* =======================================================================
          2. NÚT TRÒN ĐIỀU KHIỂN SCROLL / FREE ZOOM DƯỚI GÓC PHẢI (YÊU CẦU #2)
          - Đã xóa hoàn toàn nút âm thanh
          - Ẩn hoàn toàn khi ở Step 00 (HOME)
          - Chỉ hiện mượt mà khi vào Step 01 (ABOUT) trở đi
          - Nút tròn 44px x 44px kèm SVG Icon và Tooltip
         ======================================================================= */}
      <div
        className={`fixed bottom-6 right-6 sm:right-10 z-30 transition-all duration-500 ${
          currentStep === 0
            ? 'opacity-0 pointer-events-none translate-y-4'
            : 'opacity-100 pointer-events-auto translate-y-0'
        }`}
      >
        <div className="relative flex items-center justify-end group">
          {/* Tooltip khi hover */}
          <span className="absolute right-14 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[11px] font-sans font-medium px-3 py-1 rounded-md bg-black/80 text-white backdrop-blur border border-white/15 whitespace-nowrap shadow-xl">
            {freeCam ? 'Free Zoom & Inspect' : 'Scroll Mode'}
          </span>

          {/* Nút tròn 44px x 44px */}
          <button
            type="button"
            onClick={toggleFreeCam}
            title={freeCam ? 'Free Zoom & Inspect (Phím tắt: F)' : 'Scroll Mode (Phím tắt: F)'}
            className={`w-[44px] h-[44px] nav-circle flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer active:scale-90 ${
              freeCam
                ? 'bg-[#f2f0ea] text-[#111111] hover:bg-white ring-2 ring-white/50'
                : 'bg-white/[0.08] text-white hover:bg-white/[0.16] border border-white/[0.22] backdrop-blur-md'
            }`}
          >
            {freeCam ? (
              /* SVG Icon 3D Orbit / Inspect */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111111"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-30 12 12)" />
                <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" />
              </svg>
            ) : (
              /* SVG Icon Mouse / Vertical Scroll */
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="3" width="12" height="18" rx="6" />
                <line x1="12" y1="7" x2="12" y2="11" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
