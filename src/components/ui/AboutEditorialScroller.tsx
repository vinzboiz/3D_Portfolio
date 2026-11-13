import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

interface EditorialStepItem {
  code: string;
  titleBold1: string;
  titleItalic: string;
  titleBold2: string;
  content: string;
  tags: string[];
}

function getAboutEditorialSteps(): EditorialStepItem[] {
  const hour = new Date().getHours();

  // Xác định câu chào và lời chúc theo buổi (Chuẩn tiếng Anh)
  let greetingCode = 'GOOD MORNING';
  let greetingTitle = 'GOOD MORNING,';
  let greetingEnglish = 'Good Morning';
  let introGreeting = 'Good morning! I am Nguyen Xuan Vinh (Vinzboiz)';
  let closingWish = 'Wishing you an inspiring day filled with creative energy and breakthrough achievements!';

  if (hour >= 12 && hour < 18) {
    greetingCode = 'GOOD AFTERNOON';
    greetingTitle = 'GOOD AFTERNOON,';
    greetingEnglish = 'Good Afternoon';
    introGreeting = 'Good afternoon! I am Nguyen Xuan Vinh (Vinzboiz)';
    closingWish = 'Wishing you a productive and successful afternoon ahead!';
  } else if (hour >= 18 || hour < 5) {
    greetingCode = 'GOOD EVENING';
    greetingTitle = 'GOOD EVENING,';
    greetingEnglish = 'Good Evening';
    introGreeting = 'Good evening! I am Nguyen Xuan Vinh (Vinzboiz)';
    closingWish = 'Wishing you a restful and peaceful evening with great inspiration!';
  }

  return [
    {
  code: ` '01 / 09 — ${greetingCode} · VINH NGUYEN INTRO`,
  titleBold1: greetingTitle,
  titleItalic: "I'm",
  titleBold2: 'VINH',
  content: `I'm Nguyen Xuan Vinh (Vinzboiz), an Enterprise ERP & Creative Frontend Engineer with 10 years of experience building scalable ERP systems. Welcome to my portfolio—let's get to know a little bit about me!`,
  tags: ['Enterprise Software', 'Creative Frontend Engineer'],
},
    {
    code: '02 / 09 — OBJECTIVES · VISION & BUSINESS VALUE',
    titleBold1: 'DRIVING',
    titleItalic: 'practical',
    titleBold2: 'INNOVATION',
    content:
      'My core objective is to deliver the most practical and impactful solutions for businesses—bridging complex operational needs with continuous innovation to modernize workflows, boost efficiency, and drive sustainable growth.',
    tags: ['Practical Solutions', 'Business Value', 'Continuous Innovation'],
  },
    {
    code: '03 / 09 — ROADMAP · EDUCATION & CAREER JOURNEY',
    titleBold1: 'FROM',
    titleItalic: 'academic roots',
    titleBold2: 'TO ENTERPRISE',
    content:
      'My journey began with a Software Engineering degree at HUTECH (2022–2026), building a solid technical foundation before stepping into the corporate world as an ERP Developer at Pungkook Corporation—where I build and scale enterprise-grade systems.',
    tags: ['HUTECH (2022–2026)', 'Pungkook Corporation', 'ERP Developer'],
  },
    {
    code: '04 / 09 — CORE TECH · LANGUAGES & FRAMEWORKS',
    titleBold1: 'MASTERING',
    titleItalic: 'modern',
    titleBold2: 'TECH STACKS',
    content:
      'From pixel-perfect frontends in React, Angular, JavaScript, and TypeScript to high-performance backends powered by C#, Java, Python, and Node.js, I leverage the right technologies to engineer scalable, maintainable enterprise applications.',
    tags: ['Frontend Frameworks', 'Backend Engineering', 'Full-Stack Development'],
  },
    {
    code: '05 / 09 — CREATIVE TECH · 3D WEB & INTERACTIVE UI',
    titleBold1: 'CRAFTING',
    titleItalic: 'immersive',
    titleBold2: 'EXPERIENCES',
    content:
      'Going beyond traditional 2D screens, I bring interfaces to life using Three.js, WebGL, and Blender—transforming complex industrial data into real-time 3D Digital Twins and crafting interactive, tactile web experiences.',
    tags: ['Three.js & WebGL', 'Blender', 'Interactive UI/UX'],
  },
    {
    code: '06 / 09 — WORKFLOW · DATA & SYSTEM ARCHITECTURE',
    titleBold1: 'STRUCTURING',
    titleItalic: 'reliable',
    titleBold2: 'WORKFLOWS',
    content:
      'Great software relies on disciplined execution. I design optimized relational databases (PostgreSQL, MySQL, Oracle, SQL Server) alongside clean, modular architectures, streamlined Git workflows, and automated processes that keep complex teams moving fast.',
    tags: ['SQL & Database Design', 'Clean Architecture', 'Agile & Git Workflows'],
  },
    {
    code: '07 / 09 — PROJECTS · ENTERPRISE & PERSONAL WORKS',
    titleBold1: 'PROVEN',
    titleItalic: 'in',
    titleBold2: 'ACTION',
    content:
      'My portfolio spans across large-scale corporate platforms and creative personal products—combining hands-on experience developing enterprise ERP systems with self-initiated web, mobile, and interactive 3D applications built from the ground up.',
    tags: ['Enterprise ERP Systems', 'Personal Projects', 'Real-World Impact'],
  },
    {
    code: '08 / 09 — CONTACT · LET’S CONNECT',
    titleBold1: 'READY',
    titleItalic: 'to',
    titleBold2: 'COLLABORATE',
    content:
      'Always open to discussing enterprise software solutions, creative frontend projects, or new career opportunities. Feel free to reach out via email or social channels—let’s connect and build something impactful together!',
    tags: ['Get In Touch', 'Open for Opportunities', 'Let’s Talk'],
  },
    {
    code: '09 / 09 — OUTRO · THANK YOU & KEEP EXPLORING',
    titleBold1: 'THANK YOU',
    titleItalic: 'keep',
    titleBold2: 'SCROLLING',
    content:
      'Thank you for taking the time to walk through my introduction! Keep scrolling down to dive deeper into my featured projects and view my full resume below.',
    tags: ['Thank You', 'Keep Scrolling', 'Projects & Resume Below'],
  },
  ];
}

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Tự động cập nhật nội dung động theo thời gian thực khi người dùng truy cập
  const editorialSteps = useMemo(() => getAboutEditorialSteps(), []);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const smoothScrollProgress = state.scrollCurrent; // 0.0 -> 10.0 liên tục
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);

      // Hiển thị khối text giới thiệu từ Step 01 -> Step 09 (Step 10 không còn text)
      const isAboutActive =
        !state.freeCam &&
        portalProgress >= 0.40 &&
        smoothScrollProgress >= 0.35 &&
        smoothScrollProgress <= 9.35 &&
        state.currentStep >= 1 &&
        state.currentStep <= 9;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAboutActive ? '1' : '0';
        containerRef.current.style.display = isAboutActive ? 'flex' : 'none';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Cơ chế Băng chuyền cuộn dọc từ từ (Smooth Vertical Reel Scroll):
      // Duyệt qua các phần tử, tính vị trí translateY và opacity liên tục theo smoothScrollProgress
      for (let i = 0; i < editorialSteps.length; i++) {
        const stepIndex = i + 1; // 1..9
        const el = itemRefs.current[i];
        if (!el) continue;

        if (!isAboutActive) {
          el.style.display = 'none';
          continue;
        }

        // stepDelta = stepIndex - smoothScrollProgress
        // - Step hiện tại có stepDelta ~ 0 => translateY ~ 0px
        // - Khi cuộn sang step sau: Step cũ trôi lên trên (-440px), Step mới trôi từ dưới lên (+440px)
        const stepDelta = stepIndex - smoothScrollProgress;
        const dist = Math.abs(stepDelta);
        const translateY = stepDelta * 440;

        // Băng chuyền cuộn dọc mượt mà:
        // Đặt khoảng cách translateY = 440px đảm bảo khối chữ cũ và mới cách nhau an toàn không va chạm
        // Opacity duy trì sáng rõ, mờ dần theo đường trượt và được cắt mềm tự nhiên bởi CSS Vertical Mask
        const opacity = THREE.MathUtils.clamp(1.2 - dist * 1.3, 0, 1);

        if (dist > 0.88 || opacity <= 0.01) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
          el.style.opacity = opacity.toFixed(3);
          el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
          el.style.filter = 'none';
        }
      }

      animId = requestAnimationFrame(updateScroller);
    };

    animId = requestAnimationFrame(updateScroller);
    return () => cancelAnimationFrame(animId);
  }, [editorialSteps]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: '5vw',
        top: '80px',
        width: '32vw',
        maxWidth: '430px',
        height: 'calc(100vh - 80px)',
        pointerEvents: 'none',
        zIndex: 35,
        transition: 'opacity 0.4s ease-out',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
      }}
      className="hidden md:flex items-center justify-start select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
    >
      <div className="relative w-full h-full flex items-center">
        {editorialSteps.map((step, idx) => (
          <div
            key={idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="absolute left-0 right-0 will-change-transform"
            style={{
              display: 'none',
              transformOrigin: 'left center',
            }}
          >
            {/* Nhãn linh kiện tương ứng */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e05a47] shadow-[0_0_8px_#e05a47]" />
              <span className="font-mono text-[0.82rem] uppercase tracking-[0.15em] text-[#e05a47] font-semibold">
                {step.code}
              </span>
            </div>

            {/* Tiêu đề 2 dòng: Bold Sans trắng + Italic Serif đỏ cam */}
            <h2 className="font-sans font-black text-white text-[clamp(2.15rem,3.1vw,3.05rem)] tracking-tight leading-[1.08] mb-[18px]">
              <span className="uppercase">{step.titleBold1} </span>
              <span
                className="italic font-normal text-[#e05a47] normal-case"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {step.titleItalic}{' '}
              </span>
              <span className="uppercase">{step.titleBold2}</span>
            </h2>

            {/* Đoạn văn giới thiệu bản thân */}
            <p className="font-sans text-[1.06rem] text-[#b4b4bb] leading-[1.65] mb-6 font-normal">
              {step.content}
            </p>

            {/* Tags kỹ năng thực tế - bố cục gọn gàng, không bị tràn viền */}
            <div className="flex flex-wrap gap-[8px] items-center">
              {step.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-[11px] py-[5px] rounded-md text-[0.78rem] font-mono font-medium bg-white/[0.06] text-[#e5e5ea] border border-white/10 backdrop-blur-sm whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Đường chỉ vạch kỹ thuật retro nhỏ bên dưới */}
            <div className="mt-8 flex items-center gap-2 opacity-40">
              <span className="w-8 h-[1px] bg-white/40" />
              <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                {idx === 0
                  ? 'INTRO // STEP 01'
                  : idx === 8
                    ? 'CLOSING // STEP 09'
                    : `HARDWARE METAPHOR // STEP 0${idx + 1}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

