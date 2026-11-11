import { useEffect, useRef, useState } from 'react';
import { useBuildStore } from '../../store/useBuildStore';

export function RetroHUD() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const freeCam = useBuildStore((s) => s.freeCam);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const toggleFreeCam = useBuildStore((s) => s.toggleFreeCam);

  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'projects' | 'cv'>('home');
  const touchStartYRef = useRef<number | null>(null);

  const portalProgress = Math.max(0, Math.min(1, homeTransitionProgress));
  const isInside3D = currentStep >= 1 && portalProgress >= 0.5;

  // Theo dõi vị trí cuộn trang để highlight tab tương ứng khi đang ở ngoài 3D
  useEffect(() => {
    if (isInside3D) {
      setActiveSection('about');
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const projElem = document.getElementById('projects-section');
      const cvElem = document.getElementById('cv-section');

      const projTop = projElem ? projElem.offsetTop - 250 : 600;
      const cvTop = cvElem ? cvElem.offsetTop - 250 : 1500;

      if (scrollY >= cvTop) {
        setActiveSection('cv');
      } else if (scrollY >= projTop) {
        setActiveSection('projects');
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInside3D]);

  // Luồng điều hướng thông minh khi nhấn nút Home
  const handleNavHome = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.05;

    if (inside) {
      state.jumpToHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Luồng điều hướng thông minh khi nhấn nút About
  const handleNavAbout = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 && state.homeTransitionProgress > 0.5;

    if (!inside) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      state.jumpToAbout();
    } else {
      if (state.currentStep !== 1) {
        state.setStep(1);
      }
    }
  };

  // Luồng điều hướng thông minh khi nhấn nút Projects
  const handleNavProjects = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.1;

    if (!inside) {
      // Trường hợp 1 — Đang ở ngoài 3D (Home/Projects/CV):
      // Tuyệt đối KHÔNG chuyển qua About, KHÔNG lắp máy 3D. Cuộn mượt xuống mục #projects-section!
      document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Trường hợp 2 — Đang ở trong không gian 3D About:
      // Pha 1 (0.0s -> 0.9s): Zoom out trả về Home
      state.jumpToHome();
      // Pha 2 (0.9s -> 1.6s): Cuộn mượt xuống #projects-section
      setTimeout(() => {
        document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 900);
    }
  };

  // Luồng điều hướng thông minh khi nhấn nút My CV
  const handleNavCv = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.1;

    if (!inside) {
      // Trường hợp 1 — Đang ở ngoài 3D: Cuộn mượt xuống mục #cv-section!
      document.getElementById('cv-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Trường hợp 2 — Đang ở trong 3D:
      // Pha 1: Zoom out về Home
      state.jumpToHome();
      // Pha 2: Cuộn mượt xuống #cv-section
      setTimeout(() => {
        document.getElementById('cv-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 900);
    }
  };

  // Điều phối sự kiện lăn chuột, vuốt chạm và phím tắt
  useEffect(() => {
    let lastScrollTime = 0;

    const handleWheel = (e: WheelEvent) => {
      const state = useBuildStore.getState();
      if (
        state.freeCam ||
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE'
      ) {
        return;
      }
      if (Math.abs(e.deltaY) <= 15) return;

      // Khi đang ở ngoài 3D (currentStep === 0): Cho phép trang cuộn dọc tự nhiên xuống Projects và CV
      if (state.currentStep === 0) {
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      const now = performance.now();

      // Cuộn ngược (dir < 0): Phản hồi tức thì 0ms delay trong 3D
      if (dir < 0) {
        lastScrollTime = now;
        const targetStep = Math.max(1, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
        return;
      }

      // Cuộn xuôi (dir > 0): GIỚI HẠN TỐI ĐA STEP 10
      // Tăng cooldown lên 1050ms để đồng bộ với animation lắp ráp linh kiện chậm rãi, thư thái
      if (now - lastScrollTime < 1050) return;
      lastScrollTime = now;

      if (state.currentStep >= 10) {
        // Dừng tại Step 10, không tự động nhét CD hay thẻ khi lăn chuột tiếp!
        return;
      }
      const targetStep = Math.min(10, state.currentStep + 1);
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
      if (state.currentStep === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      if (Math.abs(deltaY) < 30) return;

      const dir = deltaY > 0 ? 1 : -1;
      const now = performance.now();

      if (dir < 0) {
        lastScrollTime = now;
        touchStartYRef.current = currentY;
        const targetStep = Math.max(1, state.currentStep - 1);
        if (targetStep !== state.currentStep) {
          state.setStep(targetStep);
        }
        return;
      }

      if (now - lastScrollTime < 1050) return;
      lastScrollTime = now;
      touchStartYRef.current = currentY;

      if (state.currentStep >= 10) return;
      const targetStep = Math.min(10, state.currentStep + 1);
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
      if (state.currentStep === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (state.currentStep >= 10) return;
        state.setStep(Math.min(10, state.currentStep + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        state.setStep(Math.max(1, state.currentStep - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        if (state.currentStep < 10) return;
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
  }, [freeCam, isInsideProjectApp, projectAppTransition, toggleFreeCam]);

  if (isInsideProjectApp || projectAppTransition !== 'IDLE') return null;

  const isHomeActive = activeSection === 'home';
  const isAboutActive = activeSection === 'about';
  const isProjectActive = activeSection === 'projects';
  const isCvActive = activeSection === 'cv';

  // Độ mờ nền đen của Navbar:
  // - Khi ở trong 3D: trong suốt để không chắn phòng Lab
  // - Khi ở ngoài: đen đặc #0a0a0c kèm blur để chữ luôn sắc nét khi cuộn
  const bgAlpha = isInside3D ? 0 : 0.92;

  return (
    <>
      {/* =======================================================================
          1. FIXED TOP NAVBAR (EDITORIAL MINIMALIST STYLE)
         ======================================================================= */}
      <header
        style={{
          backgroundColor: `rgba(10, 10, 12, ${bgAlpha})`,
          borderBottom: bgAlpha > 0.01 ? `1px solid rgba(255, 255, 255, ${bgAlpha * 0.08})` : 'none',
          boxShadow: bgAlpha > 0.01 ? `0 4px 24px rgba(0, 0, 0, ${bgAlpha * 0.6})` : 'none',
          backdropFilter: bgAlpha > 0.01 ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: bgAlpha > 0.01 ? 'blur(12px)' : 'none',
          willChange: 'background-color, border-color, box-shadow',
        }}
        className="fixed top-0 left-0 right-0 h-[80px] z-[100] px-6 sm:px-12 flex items-center justify-between select-none pointer-events-none"
      >
        {/* Cụm Bên Trái (Brand Identity) */}
        <div
          onClick={handleNavHome}
          className="pointer-events-auto flex items-center gap-3 cursor-pointer group"
          title="Về trang chủ"
        >
          {/* Icon khối 3D Wireframe (SVG) */}
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

          {/* Tên & Chức danh */}
          <div className="flex flex-col text-left">
            <span className="font-sans font-bold text-white text-[0.95rem] sm:text-[1.05rem] tracking-[-0.02em] leading-tight group-hover:text-[#f2f0ea] transition-colors whitespace-nowrap">
              Nguyễn Xuân Vinh
            </span>
            <span className="hidden sm:block font-mono text-[0.68rem] tracking-[0.16em] uppercase text-[#8a8a8e] leading-tight">
              FULL-STACK & 3D DEVELOPER
            </span>
          </div>
        </div>

        {/* Cụm Bên Phải (Menu Links & Language & CTA) */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-7">
          <nav className="hidden sm:flex items-center gap-4 md:gap-7 text-[0.88rem] md:text-[0.92rem] font-sans">
            <button
              type="button"
              onClick={handleNavHome}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isHomeActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleNavAbout}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isAboutActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={handleNavProjects}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isProjectActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              Projects
            </button>
            <button
              type="button"
              onClick={handleNavCv}
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

          {/* Nút Pill Button [ Liên hệ ] */}
          <button
            type="button"
            onClick={handleNavCv}
            className="nav-pill bg-[#f2f0ea] text-[#111111] hover:bg-white text-xs sm:text-sm font-medium px-4 sm:px-[22px] py-1.5 sm:py-[9px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 select-none whitespace-nowrap"
          >
            Liên hệ
          </button>
        </div>
      </header>

      {/* =======================================================================
          2. NÚT TRÒN ĐIỀU KHIỂN SCROLL / FREE ZOOM DƯỚI GÓC PHẢI (CHỈ Ở STEP 10 TRONG 3D)
         ======================================================================= */}
      <div
        className={`fixed bottom-6 right-6 sm:right-10 z-30 transition-all duration-500 ${
          currentStep >= 10 && isInside3D && !isInsideProjectApp && projectAppTransition === 'IDLE'
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-4'
        }`}
      >
        <div className="relative flex items-center justify-end group">
          <span className="absolute right-14 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 text-[11px] font-sans font-medium px-3 py-1 rounded-md bg-black/80 text-white backdrop-blur border border-white/15 whitespace-nowrap shadow-xl">
            {freeCam ? 'Free Zoom & Inspect' : 'Scroll Mode'}
          </span>

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
