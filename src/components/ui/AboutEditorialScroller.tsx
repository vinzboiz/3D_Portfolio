import { useEffect, useRef } from 'react';
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

const ABOUT_EDITORIAL_STEPS: EditorialStepItem[] = [
  {
    code: '01 / 09 — CORE BENCH · ASUS TX97-E & INTEL PENTIUM MMX',
    titleBold1: 'Nền tảng',
    titleItalic: 'Kỹ thuật',
    titleBold2: 'Vững chắc',
    content:
      'Xin chào, tôi là Nguyễn Xuân Vinh (Vinzboiz) — Kỹ sư Phần mềm tốt nghiệp ĐH Công nghệ TP.HCM (HUTECH) với GPA 3.43/4.0 và danh hiệu Sinh viên Xuất sắc. Giống như bo mạch chủ Socket 7 và vi xử lý Pentium MMX 233MHz kết nối mọi thành phần cốt lõi, tôi xây dựng sản phẩm từ tư duy kiến trúc hệ thống bài bản và hiệu năng cao.',
    tags: ['Full-Stack Architect', 'GPA 3.43 / 4.0', 'C# .NET Core', 'Java Spring Boot'],
  },
  {
    code: '02 / 09 — CHASSIS PREP · INWIN A500 MID-TOWER',
    titleBold1: 'Khung gầm',
    titleItalic: 'Hệ thống',
    titleBold2: 'Chuẩn mực',
    content:
      'Chuẩn bị khung gầm vững chắc cho các dự án phức tạp: Thiết lập kiến trúc modular monorepo, quy chuẩn Clean Architecture, định vị chính xác các điểm neo kỹ thuật và quy trình CI/CD tự động hóa giúp hệ thống sẵn sàng mở rộng bền bỉ.',
    tags: ['System Architecture', 'Modular Monorepo', 'TypeScript Strict', 'CI/CD Pipelines'],
  },
  {
    code: '03 / 09 — POWER SUPPLY · SEASONIC SSG-200G 200W AT',
    titleBold1: 'Trái tim',
    titleItalic: 'Năng lượng',
    titleBold2: 'Backend Bền bỉ',
    content:
      'Đảm bảo nguồn năng lượng ổn định và chịu tải cao cho toàn bộ luồng nghiệp vụ doanh nghiệp bằng Backend hiệu năng cao: RESTful API, Microservices, xử lý đa luồng trên C# .NET Core, Node.js và Java Spring Boot với cơ chế tự bảo vệ quá tải.',
    tags: ['High-Load Backend', 'RESTful API', 'Microservices', 'Node.js / Express'],
  },
  {
    code: '04 / 09 — MOBO MOUNTING · ASUS TX97-E SLIDE-OUT TRAY',
    titleBold1: 'Tích hợp',
    titleItalic: 'Đa tầng',
    titleBold2: 'Chuẩn xác',
    content:
      'Full-Stack Developer tại Pungkook Saigon II — tích hợp liền mạch giữa tầng giao diện người dùng và cơ sở dữ liệu doanh nghiệp trong các hệ thống cốt lõi: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard & Efficiency Summary.',
    tags: ['Pungkook Saigon II', 'Enterprise PLM', 'MES / SCADA UI', 'Full-Stack Integration'],
  },
  {
    code: '05 / 09 — STORAGE DRIVES · CREATIVE 24X, SONY FDD & QUANTUM HDD',
    titleBold1: 'Lưu trữ',
    titleItalic: 'Dữ liệu',
    titleBold2: 'Đa tầng',
    content:
      'Thiết kế kiến trúc lưu trữ và tối ưu hóa truy vấn cơ sở dữ liệu quan hệ lớn trên PostgreSQL, MySQL, SQL Server, Supabase; kết hợp kinh nghiệm xử lý dữ liệu Computer Vision độ chính xác cao và luồng xuất dữ liệu lớn tại Alchera.',
    tags: ['PostgreSQL', 'SQL Server', 'Database Indexing', 'Computer Vision Data'],
  },
  {
    code: '06 / 09 — POWER CABLING · AT P8/P9 & MOLEX 4-PIN',
    titleBold1: 'Hạ tầng',
    titleItalic: 'Phân phối',
    titleBold2: 'An toàn Tuyệt đối',
    content:
      'Tuân thủ nghiêm ngặt quy tắc an toàn hạ tầng và bảo mật hệ thống: Thiết lập Docker container, cơ chế Fail-Safe, phân quyền RBAC chặt chẽ và giám sát liên tục để dịch vụ vận hành thông suốt 99.99% không gián đoạn.',
    tags: ['Docker & DevOps', 'Fail-Safe Pipelines', 'Security & RBAC', 'Cloud Infrastructure'],
  },
  {
    code: '07 / 09 — RIBBON CABLES · 40-PIN IDE & 34-PIN FLOPPY BUS',
    titleBold1: 'Kết nối',
    titleItalic: 'Băng thông',
    titleBold2: 'Truyền dẫn Cao tốc',
    content:
      'Tối ưu hóa luồng truyền tải dữ liệu thời gian thực và giao tiếp đa nền tảng: WebSocket, gRPC, RESTful API và quản lý state mượt mà với Zustand, Redux Toolkit trên nền tảng React 19 và Angular hiện đại.',
    tags: ['Real-Time Streaming', 'WebSockets', 'Zustand State', 'React 19 & Angular'],
  },
  {
    code: '08 / 09 — FRONT PANEL I/O · TWISTED-PAIR LED & SWITCH WIRES',
    titleBold1: 'Giao diện',
    titleItalic: 'Quan sát',
    titleBold2: 'Đồng đội & Phản hồi',
    content:
      'Cầu nối trực quan và mạch lạc giữa thiết kế UI/UX (Figma), đội ngũ phát triển và người dùng cuối. Tinh thần kỷ luật thép thức dậy từ 4:45 sáng mỗi ngày, rèn luyện võ thuật/bóng đá cùng năng lực giao tiếp và phối hợp đa văn hóa.',
    tags: ['UI/UX Consistency', 'Figma to Code', 'High Discipline (4:45 AM)', 'Team Collaboration'],
  },
  {
    code: '09 / 09 — EXPANSION CARDS · 3DFX VOODOO & SOUND BLASTER 16',
    titleBold1: 'Không gian',
    titleItalic: '3D WebGL',
    titleBold2: 'Đồ họa Đỉnh cao',
    content:
      'Đưa nhà máy công nghiệp và sản phẩm sáng tạo lên trình duyệt với Three.js, React Three Fiber, Custom GLSL Shaders và Autodesk Platform Services (APS Forge). Kết hợp kỹ thuật tối ưu hóa Frustum/Occlusion Culling và âm thanh tương tác Howler.',
    tags: ['Three.js / R3F', 'GLSL Shaders', 'Autodesk APS Forge', '3D Digital Twin'],
  },
];

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const currentStep = state.currentStep; // 1 -> 12
      const benchProgress = state.benchProgress; // 0.0 -> 1.0 trong step hiện tại
      const scrollCurrent = state.scrollCurrent; // 0.0 -> 12.0
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);

      // CHỈ hiển thị khối text giới thiệu từ Step 01 -> Step 09.
      // Khi đã hoàn thiện máy (Step 10 trở đi hoặc scrollCurrent >= 9.05): ẩn hoàn toàn 100%!
      const isAboutActive =
        currentStep >= 1 &&
        currentStep <= 9 &&
        scrollCurrent < 9.05 &&
        portalProgress >= 0.75;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAboutActive ? '1' : '0';
        containerRef.current.style.display = isAboutActive ? 'flex' : 'none';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Mỗi step cuộn hiển thị ĐỘC LẬP & DUY NHẤT 1 card giới thiệu tương ứng 1:1.
      // Tuyệt đối không để 2 card cùng hiển thị để chống triệt để lỗi đè text.
      for (let i = 0; i < ABOUT_EDITORIAL_STEPS.length; i++) {
        const stepNum = i + 1; // 1..9
        const el = itemRefs.current[i];
        if (!el) continue;

        if (!isAboutActive || stepNum !== currentStep) {
          el.style.display = 'none';
          el.style.opacity = '0';
          el.style.transform = 'translate3d(0, 30px, 0)';
          continue;
        }

        // Card duy nhất của step hiện tại
        let opacity = 1;
        let translateY = 0;

        if (benchProgress > 0.88 && currentStep < 9) {
          // Khi tiến sát mép cuối step chuẩn bị sang step sau: fade out nhanh êm ái
          const p = (benchProgress - 0.88) / 0.12;
          opacity = Math.max(0, 1 - p);
          translateY = -p * 30;
        } else if (benchProgress < 0.10 && currentStep > 1) {
          // Khi vừa bước vào step mới: fade in nhanh từ dưới lên
          const p = benchProgress / 0.10;
          opacity = Math.min(1, p);
          translateY = (1 - p) * 20;
        }

        if (opacity <= 0.02) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
          el.style.opacity = opacity.toFixed(3);
          el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
          el.style.filter = 'none'; // Chữ luôn sắc nét 100%, không bị blur
        }
      }

      animId = requestAnimationFrame(updateScroller);
    };

    animId = requestAnimationFrame(updateScroller);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: '5.5vw',
        top: '80px',
        width: '38vw',
        maxWidth: '520px',
        height: 'calc(100vh - 80px)',
        pointerEvents: 'none',
        zIndex: 30,
        transition: 'opacity 0.4s ease-out',
      }}
      className="hidden md:flex items-center justify-start select-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
    >
      <div className="relative w-full h-full flex items-center">
        {ABOUT_EDITORIAL_STEPS.map((step, idx) => (
          <div
            key={idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="absolute left-0 right-0 max-w-lg will-change-transform"
            style={{
              display: 'none',
              transformOrigin: 'left center',
            }}
          >
            {/* Nhãn linh kiện tương ứng */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-2 h-2 rounded-full bg-[#e05a47] shadow-[0_0_8px_#e05a47]" />
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#e05a47] font-semibold">
                {step.code}
              </span>
            </div>

            {/* Tiêu đề 2 dòng: Bold Sans trắng + Italic Serif đỏ cam */}
            <h2 className="font-sans font-black text-white text-[clamp(2rem,3.2vw,3.2rem)] tracking-tight leading-[1.04] uppercase mb-4">
              <span>{step.titleBold1} </span>
              <span
                className="italic font-normal text-[#e05a47] lowercase"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {step.titleItalic}{' '}
              </span>
              <span>{step.titleBold2}</span>
            </h2>

            {/* Đoạn văn giới thiệu bản thân */}
            <p className="font-sans text-sm sm:text-[0.96rem] text-[#d1d1d6] leading-relaxed mb-6 font-normal">
              {step.content}
            </p>

            {/* Tags kỹ năng thực tế */}
            <div className="flex flex-wrap gap-2">
              {step.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-white/[0.06] text-[#e5e5ea] border border-white/10 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Đường chỉ vạch kỹ thuật retro nhỏ bên dưới */}
            <div className="mt-8 flex items-center gap-2 opacity-40">
              <span className="w-8 h-[1px] bg-white/40" />
              <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                HARDWARE METAPHOR // STEP 0{idx + 1}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

