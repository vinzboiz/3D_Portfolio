import { useEffect, useRef } from 'react';
import { Orbit, Volume2, VolumeX } from 'lucide-react';
import { useBuildStore } from '../../store/useBuildStore';

export function RetroHUD() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const freeCam = useBuildStore((s) => s.freeCam);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const toggleFreeCam = useBuildStore((s) => s.toggleFreeCam);
  const addScrollDelta = useBuildStore((s) => s.addScrollDelta);
  const soundEnabled = useBuildStore((s) => s.soundEnabled);
  const toggleSound = useBuildStore((s) => s.toggleSound);
  const jumpToAbout = useBuildStore((s) => s.jumpToAbout);
  const jumpToProject = useBuildStore((s) => s.jumpToProject);
  const jumpToCv = useBuildStore((s) => s.jumpToCv);

  const touchStartYRef = useRef<number | null>(null);

  // Xác định tab điều hướng nào đang active trên thanh Header:
  // Step 1 -> 10: ABOUT (Lắp ráp phần cứng & Khởi động máy)
  // Step 11: PROJECT (Tự động nạp đĩa CD & mở My Projects)
  // Step 12: MY CV (Tự động cắm thẻ nhớ & mở CV)
  const isAboutActive = currentStep <= 10 && !isInsideProjectApp;
  const isProjectActive = (currentStep === 11 || isInsideProjectApp);
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
        const targetStep = Math.max(1, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
        return;
      }

      // Cuộn xuôi (dir > 0): Cooldown 650ms để nhảy từng bước rõ ràng
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
        const targetStep = Math.max(1, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
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
        state.setStep(Math.max(1, state.currentStep - 1));
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
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* =======================================================================
          1. TOP NAVIGATION HEADER (ABOUT | PROJECT | MY CV)
          Thanh điều hướng 3 nút chuẩn Windows 95 với trạng thái Highlight tự động
         ======================================================================= */}
      <div className="flex w-full items-center justify-end">
        {/* THANH ĐIỀU HƯỚNG CHÍNH [ ABOUT ] / [ PROJECT ] / [ MY CV ] */}
        <div className="pointer-events-auto flex items-center gap-1.5 win95-outset bg-[#c0c0c0] p-1 border-2 border-[#ffffff] shadow-xl">
          <button
            type="button"
            onClick={jumpToAbout}
            title="Phần 1: Giới thiệu & Lắp ráp phần cứng (Step 01 - 10)"
            className={`px-3 py-1 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer ${
              isAboutActive
                ? 'win95-inset bg-[#0000aa] text-white'
                : 'win95-outset bg-[#c0c0c0] text-black hover:bg-[#d8d8d8]'
            }`}
          >
            [ ABOUT ]
          </button>

          <button
            type="button"
            onClick={jumpToProject}
            title="Phần 2: Tự động nạp Đĩa CD & Khởi chạy My Projects 3D (Step 11)"
            className={`px-3 py-1 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              isProjectActive
                ? 'win95-inset bg-[#10223c] text-[#33ff33]'
                : 'win95-outset bg-[#c0c0c0] text-black hover:bg-[#d8d8d8]'
            }`}
          >
            <span className="text-[11px]">💿</span>
            [ PROJECT ]
          </button>

          <button
            type="button"
            onClick={jumpToCv}
            title="Phần 3: Tự động cắm Thẻ nhớ & Mở hồ sơ WordPad CV (Step 12)"
            className={`px-3 py-1 font-mono text-xs font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              isCvActive
                ? 'win95-inset bg-[#1c3822] text-[#ffdd55]'
                : 'win95-outset bg-[#c0c0c0] text-black hover:bg-[#d8d8d8]'
            }`}
          >
            <span className="text-[11px]">💾</span>
            [ MY CV ]
          </button>
        </div>
      </div>

      {/* =======================================================================
          2. BOTTOM BAR: CHUYỂN ĐỔI SCROLL/FREE CAM + ÂM THANH
          Bỏ popup góc dưới bên trái, chỉ giữ cụm điều khiển bên phải
         ======================================================================= */}
      <div className="flex w-full items-center justify-end">
        {/* BÊN PHẢI: NÚT ÂM THANH + CỤM NÚT CHUYỂN ĐỔI CHẾ ĐỘ CON LĂN CHUỘT (SCROLL TIMELINE VS ZOOM) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Nút bật/tắt âm thanh */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh cơ học'}
            className="win95-btn px-2.5 py-2 flex items-center justify-center cursor-pointer text-black hover:bg-[#d8d8d8]"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-[#0000aa]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#808080]" />
            )}
          </button>

          {/* NÚT CHUYỂN ĐỔI CHẾ ĐỘ CON LĂN CHUỘT: SCROLL TIMELINE VS ZOOM TO CURSOR */}
          <button
            type="button"
            onClick={toggleFreeCam}
            title="Bấm để chuyển đổi giữa Cuộn Timeline và Zoom 3D (Phím tắt: F)"
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xl cursor-pointer ${
              freeCam
                ? 'win95-inset bg-[#102010] text-[#33ff33] border-2 border-[#33ff33]'
                : 'win95-outset bg-[#c0c0c0] text-[#000000] border-2 border-[#808080] hover:bg-[#d4d4d4]'
            }`}
          >
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                freeCam
                  ? 'bg-[#33ff33] shadow-[0_0_8px_#33ff33] animate-pulse'
                  : 'bg-[#ffb000] shadow-[0_0_4px_#ffb000]'
              }`}
            />
            <div className="flex flex-col items-start leading-tight text-left">
              <div className="flex items-center gap-1 font-black text-[11px]">
                {freeCam ? (
                  <>
                    <Orbit className="h-3.5 w-3.5 text-[#33ff33]" />
                    <span>ZOOM & 360° INSPECT</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#0000aa]">📜</span>
                    <span>SCROLL TIMELINE</span>
                  </>
                )}
              </div>
              <span
                className={`text-[9px] font-normal tracking-normal ${
                  freeCam ? 'text-[#88ff88]' : 'text-[#555555]'
                }`}
              >
                {freeCam ? 'Wheel: Zoom | Drag: Orbit [F]' : 'Wheel: Step 01-12 [F]'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
