import { useEffect, useRef, useState } from 'react';
import { useBuildStore } from '../../store/useBuildStore';

export function RetroHUD() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const freeCam = useBuildStore((s) => s.freeCam);
  const isInsideProjectApp = useBuildStore((s) => s.isInsideProjectApp);
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);

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
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.05 || state.freeCam;

    if (inside) {
      if (state.freeCam) {
        state.setFreeCam(false);
      }
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
      setTimeout(() => {
        state.jumpToAbout();
      }, 50);
    } else {
      if (state.hasCompletedAssembly) {
        state.enterCompletedWorkstationInspect();
      } else if (state.currentStep !== 1) {
        state.setStep(1);
      }
    }
  };

  // Luồng điều hướng thông minh khi nhấn nút Projects
  const handleNavProjects = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.1 || state.freeCam;

    if (!inside) {
      // Trường hợp 1 — Đang ở ngoài 3D (Home/Projects/CV):
      // Tuyệt đối KHÔNG chuyển qua About, KHÔNG lắp máy 3D. Cuộn mượt xuống mục #projects-section!
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Trường hợp 2 — Đang ở trong không gian 3D About hoặc Inspect:
      if (state.freeCam) {
        state.setFreeCam(false);
      }
      state.jumpToHome();
      setTimeout(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  // Luồng điều hướng thông minh khi nhấn nút My CV
  const handleNavCv = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.1 || state.freeCam;

    if (!inside) {
      // Trường hợp 1 — Đang ở ngoài 3D: Cuộn mượt xuống mục #cv-section!
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.getElementById('cv-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Trường hợp 2 — Đang ở trong 3D:
      if (state.freeCam) {
        state.setFreeCam(false);
      }
      state.jumpToHome();
      setTimeout(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        document.getElementById('cv-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  const handleNavContact = () => {
    const state = useBuildStore.getState();
    if (state.stageTransition !== 'IDLE') return;
    const inside = state.currentStep > 0 || state.homeTransitionProgress > 0.1 || state.freeCam;

    const targetEl = document.getElementById('contact-section') || document.getElementById('cv-section');
    if (!inside) {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      targetEl?.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (state.freeCam) {
        state.setFreeCam(false);
      }
      state.jumpToHome();
      setTimeout(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
        targetEl?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  };

  // Điều phối sự kiện lăn chuột, vuốt chạm và phím tắt
  useEffect(() => {
    let lastScrollTime = 0;

    const handleWheel = (e: WheelEvent) => {
      // Nếu trang web đang ở trạng thái cuộn nội dung bên dưới (Projects / CV, window.scrollY > 10):
      // Tuyệt đối KHÔNG can thiệp hoặc chặn lăn chuột, để trình duyệt cuộn tự nhiên 100%!
      if (window.scrollY > 10) {
        return;
      }

      const state = useBuildStore.getState();
      if (
        state.freeCam ||
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE'
      ) {
        return;
      }
      if (Math.abs(e.deltaY) < 12) return; // Bỏ qua nhiễu cực nhỏ

      const now = performance.now();
      // Cooldown 420ms: Đồng bộ với tốc độ animation lắp ráp đằm thắm (~750ms),
      // mỗi lần lăn chuột chuyển đúng 1 step mượt mà và triệt tiêu quán tính tự do của con lăn.
      if (now - lastScrollTime < 420) return;
      lastScrollTime = now;

      const direction = e.deltaY > 0 ? 1 : -1;

      // 1. KHI ĐANG Ở HOME (currentStep === 0):
      if (state.currentStep === 0) {
        if (state.hasCompletedAssembly) {
          // Khi đã hoàn tất lắp ráp: cho phép lăn chuột cuộn trang tự nhiên xuống #projects-section!
          return;
        }
        // Khi chưa lắp ráp: cuộn xuống sẽ bước vào Step 01
        if (direction > 0) {
          e.preventDefault();
          state.setStep(1);
        }
        return;
      }

      // 2. KHI ĐÃ LẮP XONG (Step 10): Cuộn xuống sẽ kích hoạt zoom out về lại Home
      if (state.currentStep === 10) {
        if (direction > 0) {
          e.preventDefault();
          e.stopPropagation();
          state.transitionPostAboutToHome();
          return;
        }
      }

      // 3. KHI ĐANG Ở CÁC BƯỚC LẮP RÁP 3D (Step 01 -> Step 09):
      e.preventDefault();
      const nextStep = Math.max(0, Math.min(10, state.currentStep + direction));
      if (nextStep !== state.currentStep) {
        state.setStep(nextStep);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 10) return;

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
      if (Math.abs(deltaY) < 25) return;

      const now = performance.now();
      if (now - lastScrollTime < 420) return;
      lastScrollTime = now;
      touchStartYRef.current = currentY;

      const direction = deltaY > 0 ? 1 : -1;

      if (state.currentStep === 0) {
        if (state.hasCompletedAssembly) {
          return; // Cho phép vuốt cuộn trang tự nhiên xuống Projects
        }
        if (direction > 0) {
          state.setStep(1);
        }
        return;
      }

      if (state.currentStep === 10) {
        if (direction > 0) {
          state.transitionPostAboutToHome();
        }
        return;
      }

      const nextStep = Math.max(0, Math.min(10, state.currentStep + direction));
      if (nextStep !== state.currentStep) {
        state.setStep(nextStep);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.scrollY > 10) return;

      const state = useBuildStore.getState();
      if (
        state.isInsideProjectApp ||
        state.projectAppTransition !== 'IDLE' ||
        state.stageTransition !== 'IDLE'
      ) {
        return;
      }
      if (e.key === 'Escape') {
        if (state.freeCam || state.currentStep >= 10) {
          state.transitionPostAboutToHome();
          return;
        }
      }
      if (state.currentStep === 0) {
        if (state.hasCompletedAssembly) {
          return; // Phím mũi tên cuộn trang bình thường
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          state.setStep(1);
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (state.currentStep >= 10) {
          state.transitionPostAboutToHome();
          return;
        }
        state.setStep(Math.min(10, state.currentStep + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (state.currentStep >= 10) {
          state.transitionPostAboutToHome();
          return;
        }
        state.setStep(Math.max(1, state.currentStep - 1));
      } else if (e.key === 'f' || e.key === 'F') {
        if (state.currentStep < 10) return;
        state.toggleFreeCam();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [freeCam, isInsideProjectApp, projectAppTransition]);

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
          title="Back to Home"
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
              NGUYEN XUAN VINH
            </span>
            <span className="hidden sm:block font-mono text-[0.8rem] tracking-[0.16em] uppercase text-[#8a8a8e] leading-tight">
              ENTERPRISE SOFTWARE & CREATIVE FRONTEND ENGINEER
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
              HOME
            </button>
            <button
              type="button"
              onClick={handleNavAbout}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isAboutActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              ABOUT
            </button>
            <button
              type="button"
              onClick={handleNavProjects}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isProjectActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              PROJECTS
            </button>
            <button
              type="button"
              onClick={handleNavCv}
              className={`transition-colors duration-250 cursor-pointer font-medium ${
                isCvActive ? 'text-white font-semibold' : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              MY CV
            </button>
          </nav>

          {/* Nút Pill Button [ Contact ] */}
          <button
            type="button"
            onClick={handleNavContact}
            className="nav-pill bg-[#f2f0ea] text-[#111111] hover:bg-white text-xs sm:text-sm font-medium px-4 sm:px-[22px] py-1.5 sm:py-[9px] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 select-none whitespace-nowrap"
          >
            CONTACT
          </button>
        </div>
      </header>
    </>
  );
}
