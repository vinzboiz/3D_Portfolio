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
    code: '01 / 10 — CORE BENCH · ASUS TX97-E & INTEL PENTIUM MMX',
    titleBold1: 'Nền tảng',
    titleItalic: 'Kỹ thuật',
    titleBold2: 'Vững chắc',
    content:
      'Xin chào, tôi là Nguyễn Xuân Vinh (Vinzboiz) — Kỹ sư Phần mềm tốt nghiệp ĐH Công nghệ TP.HCM (HUTECH) với GPA 3.43/4.0 và danh hiệu Sinh viên Xuất sắc. Giống như bo mạch chủ Socket 7 và vi xử lý Pentium MMX 233MHz kết nối mọi thành phần cốt lõi, tôi xây dựng sản phẩm từ tư duy kiến trúc hệ thống bài bản và hiệu năng cao.',
    tags: ['Full-Stack Architect', 'GPA 3.43 / 4.0', 'C# .NET Core', 'Java Spring Boot'],
  },
  {
    code: '02 / 10 — CHASSIS PREP · INWIN A500 MID-TOWER',
    titleBold1: 'Khung gầm',
    titleItalic: 'Hệ thống',
    titleBold2: 'Chuẩn mực',
    content:
      'Chuẩn bị khung gầm vững chắc cho các dự án phức tạp: Thiết lập kiến trúc modular monorepo, quy chuẩn Clean Architecture, định vị chính xác các điểm neo kỹ thuật và quy trình CI/CD tự động hóa giúp hệ thống sẵn sàng mở rộng bền bỉ.',
    tags: ['System Architecture', 'Modular Monorepo', 'TypeScript Strict', 'CI/CD Pipelines'],
  },
  {
    code: '03 / 10 — POWER SUPPLY · SEASONIC SSG-200G 200W AT',
    titleBold1: 'Trái tim',
    titleItalic: 'Năng lượng',
    titleBold2: 'Backend Bền bỉ',
    content:
      'Đảm bảo nguồn năng lượng ổn định và chịu tải cao cho toàn bộ luồng nghiệp vụ doanh nghiệp bằng Backend hiệu năng cao: RESTful API, Microservices, xử lý đa luồng trên C# .NET Core, Node.js và Java Spring Boot với cơ chế tự bảo vệ quá tải.',
    tags: ['High-Load Backend', 'RESTful API', 'Microservices', 'Node.js / Express'],
  },
  {
    code: '04 / 10 — MOBO MOUNTING · ASUS TX97-E SLIDE-OUT TRAY',
    titleBold1: 'Tích hợp',
    titleItalic: 'Đa tầng',
    titleBold2: 'Chuẩn xác',
    content:
      'Full-Stack Developer tại Pungkook Saigon II — tích hợp liền mạch giữa tầng giao diện người dùng và cơ sở dữ liệu doanh nghiệp trong các hệ thống cốt lõi: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard & Efficiency Summary.',
    tags: ['Pungkook Saigon II', 'Enterprise PLM', 'MES / SCADA UI', 'Full-Stack Integration'],
  },
  {
    code: '05 / 10 — STORAGE DRIVES · CREATIVE 24X, SONY FDD & QUANTUM HDD',
    titleBold1: 'Lưu trữ',
    titleItalic: 'Dữ liệu',
    titleBold2: 'Đa tầng',
    content:
      'Thiết kế kiến trúc lưu trữ và tối ưu hóa truy vấn cơ sở dữ liệu quan hệ lớn trên PostgreSQL, MySQL, SQL Server, Supabase; kết hợp kinh nghiệm xử lý dữ liệu Computer Vision độ chính xác cao và luồng xuất dữ liệu lớn tại Alchera.',
    tags: ['PostgreSQL', 'SQL Server', 'Database Indexing', 'Computer Vision Data'],
  },
  {
    code: '06 / 10 — POWER CABLING · AT P8/P9 & MOLEX 4-PIN',
    titleBold1: 'Hạ tầng',
    titleItalic: 'Phân phối',
    titleBold2: 'An toàn Tuyệt đối',
    content:
      'Tuân thủ nghiêm ngặt quy tắc an toàn hạ tầng và bảo mật hệ thống: Thiết lập Docker container, cơ chế Fail-Safe, phân quyền RBAC chặt chẽ và giám sát liên tục để dịch vụ vận hành thông suốt 99.99% không gián đoạn.',
    tags: ['Docker & DevOps', 'Fail-Safe Pipelines', 'Security & RBAC', 'Cloud Infrastructure'],
  },
  {
    code: '07 / 10 — RIBBON CABLES · 40-PIN IDE & 34-PIN FLOPPY BUS',
    titleBold1: 'Kết nối',
    titleItalic: 'Băng thông',
    titleBold2: 'Truyền dẫn Cao tốc',
    content:
      'Tối ưu hóa luồng truyền tải dữ liệu thời gian thực và giao tiếp đa nền tảng: WebSocket, gRPC, RESTful API và quản lý state mượt mà với Zustand, Redux Toolkit trên nền tảng React 19 và Angular hiện đại.',
    tags: ['Real-Time Streaming', 'WebSockets', 'Zustand State', 'React 19 & Angular'],
  },
  {
    code: '08 / 10 — FRONT PANEL I/O · TWISTED-PAIR LED & SWITCH WIRES',
    titleBold1: 'Giao diện',
    titleItalic: 'Quan sát',
    titleBold2: 'Đồng đội & Phản hồi',
    content:
      'Cầu nối trực quan và mạch lạc giữa thiết kế UI/UX (Figma), đội ngũ phát triển và người dùng cuối. Tinh thần kỷ luật thép thức dậy từ 4:45 sáng mỗi ngày, rèn luyện võ thuật/bóng đá cùng năng lực giao tiếp và phối hợp đa văn hóa.',
    tags: ['UI/UX Consistency', 'Figma to Code', 'High Discipline (4:45 AM)', 'Team Collaboration'],
  },
  {
    code: '09 / 10 — EXPANSION CARDS · 3DFX VOODOO & SOUND BLASTER 16',
    titleBold1: 'Không gian',
    titleItalic: '3D WebGL',
    titleBold2: 'Đồ họa Đỉnh cao',
    content:
      'Đưa nhà máy công nghiệp và sản phẩm sáng tạo lên trình duyệt với Three.js, React Three Fiber, Custom GLSL Shaders và Autodesk Platform Services (APS Forge). Kết hợp kỹ thuật tối ưu hóa Frustum/Occlusion Culling và âm thanh tương tác Howler.',
    tags: ['Three.js / R3F', 'GLSL Shaders', 'Autodesk APS Forge', '3D Digital Twin'],
  },
  {
    code: '10 / 10 — WORKSTATION · SONY TRINITRON CRT & AWARD BIOS',
    titleBold1: 'Hệ thống',
    titleItalic: 'Sẵn sàng',
    titleBold2: 'Khởi chạy Trải nghiệm',
    content:
      'Cỗ máy năm 1997 đã hoàn thành và đáp êm xuống bàn làm việc! Bạn có thể click trực tiếp các nút trên màn hình CRT để tương tác với BIOS/Desktop, tự tay nạp Đĩa CD / Thẻ nhớ trên bàn, hoặc khám phá mục Projects & My CV.',
    tags: ['Ready for Senior Roles', 'Interactive Workstation', 'Explore Projects & CV'],
  },
];

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const currentStep = state.currentStep; // 1 -> 10
      const benchProgress = state.benchProgress; // 0.0 -> 1.0 trong step hiện tại
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
      const isAbout = currentStep >= 1 && portalProgress >= 0.75;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAbout ? '1' : '0';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Mỗi step k (1..10) hiển thị 1 thẻ chữ tương ứng 1:1 với linh kiện đang lắp ráp
      // Trong suốt quá trình lắp ráp step k (benchProgress 0.0 -> 0.78): Card k hiển thị rõ nét 100% (opacity = 1)
      // Ở cuối step k (benchProgress 0.78 -> 1.0): Card k trượt êm lên trên và nhường chỗ cho Card k+1 trượt lên
      for (let i = 0; i < ABOUT_EDITORIAL_STEPS.length; i++) {
        const stepNum = i + 1; // 1..10
        const el = itemRefs.current[i];
        if (!el) continue;

        if (!isAbout) {
          el.style.display = 'none';
          continue;
        }

        let opacity = 0;
        let translateY = 0;

        if (stepNum === currentStep) {
          if (benchProgress > 0.78 && currentStep < 10) {
            // Đang chuyển sang bước kế tiếp: trượt nhẹ lên trên và mờ dần
            const p = (benchProgress - 0.78) / 0.22;
            opacity = 1 - p;
            translateY = -p * 80;
          } else {
            // Giữ cố định ở vị trí trung tâm hoàn hảo
            opacity = 1;
            translateY = 0;
          }
        } else if (stepNum === currentStep + 1 && benchProgress > 0.78 && currentStep < 10) {
          // Thẻ của bước kế tiếp: trượt từ dưới lên
          const p = (benchProgress - 0.78) / 0.22;
          opacity = p;
          translateY = (1 - p) * 80;
        } else if (stepNum === currentStep - 1 && benchProgress < 0.22 && currentStep > 1) {
          // Khi cuộn ngược về bước trước
          const p = (0.22 - benchProgress) / 0.22;
          opacity = p;
          translateY = -p * 80;
        } else {
          opacity = 0;
          translateY = 100;
        }

        if (opacity <= 0.01) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
          el.style.opacity = `${opacity}`;
          el.style.transform = `translate3d(0, ${translateY}px, 0)`;
          el.style.filter = 'none'; // Xóa bỏ hoàn toàn blur, chữ luôn sắc nét 100%
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

