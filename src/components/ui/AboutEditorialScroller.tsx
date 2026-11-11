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
    code: '01 / 09 — CORE BENCH · ASUS TX97-E & PENTIUM MMX',
    titleBold1: 'NỀN TẢNG',
    titleItalic: 'kỹ thuật',
    titleBold2: 'VỮNG CHẮC',
    content:
      'Nguyễn Xuân Vinh (Vinzboiz) — Kỹ sư Phần mềm tốt nghiệp ĐH HUTECH (GPA 3.43/4.0), luôn khởi đầu từ kiến trúc hệ thống bài bản, vi xử lý Pentium MMX 233MHz kết nối mọi thành phần cốt lõi.',
    tags: ['Full-Stack Architect', 'GPA 3.43 / 4.0', 'Clean Architecture'],
  },
  {
    code: '02 / 09 — CHASSIS PREP · INWIN A500 MID-TOWER',
    titleBold1: 'KHUNG GẦM',
    titleItalic: 'hệ thống',
    titleBold2: 'CHUẨN MỰC',
    content:
      'Thiết lập khung gầm vững chắc cho các dự án phức tạp: Thiết lập kiến trúc modular monorepo, định vị chính xác các điểm neo kỹ thuật và quy trình CI/CD tự động hóa giúp hệ thống sẵn sàng mở rộng bền bỉ.',
    tags: ['System Architecture', 'Modular Monorepo', 'CI/CD Pipelines'],
  },
  {
    code: '03 / 09 — POWER SUPPLY · SEASONIC SSG-200G AT',
    titleBold1: 'NĂNG LƯỢNG',
    titleItalic: 'vận hành',
    titleBold2: 'BỀN BỈ',
    content:
      'Tương tự bộ nguồn Seasonic 200W cung cấp dòng điện ổn định với quạt hút 80mm lồng thép đồng tâm, tôi xây dựng tầng Backend chịu tải cao (.NET Core, Spring Boot, Node.js) và cơ chế ngắt mạch an toàn.',
    tags: ['High Availability', 'Backend Services', 'Fault Tolerance'],
  },
  {
    code: '04 / 09 — MOBO MOUNTING · ASUS TX97-E INTO CHASSIS',
    titleBold1: 'TÍCH HỢP',
    titleItalic: 'hệ thống',
    titleBold2: 'CHUẨN XÁC',
    content:
      'Kết hợp hoàn hảo giữa tầng Core Engine và khung vỏ với độ chính xác tuyệt đối: bo mạch chủ được nâng vào lòng case, khớp chuẩn từng milimet với tấm chắn I/O Shield và 6 chân ốc đồng.',
    tags: ['System Integration', 'Precision Engineering', 'Type Safety'],
  },
  {
    code: '05 / 09 — STORAGE DRIVES · CREATIVE 24X CD, FDD & HDD',
    titleBold1: 'LƯU TRỮ',
    titleItalic: 'dữ liệu',
    titleBold2: 'ĐA TẦNG',
    content:
      'Thiết kế kiến trúc lưu trữ đa tầng: từ bộ nhớ đệm tốc độ cao, cơ sở dữ liệu phân tán (PostgreSQL, SQL Server) cho tới phân phối tài nguyên tĩnh và xuất hồ sơ CV trực tiếp qua đĩa mềm 3.5".',
    tags: ['PostgreSQL / SQL Server', 'Data Pipeline', 'Storage Architecture'],
  },
  {
    code: '06 / 09 — POWER HARNESS · AT P8/P9 & MOLEX CABLING',
    titleBold1: 'HẠ TẦNG',
    titleItalic: 'phân phối',
    titleBold2: 'CHẶT CHẼ',
    content:
      'Giống quy tắc sống còn "4 sợi dây Đen của P8 & P9 phải nằm sát nhau ở giữa" khi cấp nguồn cho bo mạch AT, tôi xây dựng hệ thống Infrastructure-as-Code có kiểm thử tĩnh và giám sát hạ tầng đám mây an toàn.',
    tags: ['DevOps / Infrastructure', 'Strict Standards', 'Automated QA'],
  },
  {
    code: '07 / 09 — RIBBON BUS · PRIMARY & SECONDARY IDE CABLES',
    titleBold1: 'BĂNG THÔNG',
    titleItalic: 'truyền tải',
    titleBold2: 'TỐC ĐỘ CAO',
    content:
      'Thiết kế luồng truyền tải dữ liệu băng thông rộng giữa tầng xử lý và thiết bị ngoại vi qua cáp bẹ IDE viền đỏ Pin 1. Tối ưu hóa API, State Management thời gian thực và WebSockets không độ trễ.',
    tags: ['High-Throughput Bus', 'Real-time State', 'WebSockets / REST'],
  },
  {
    code: '08 / 09 — FRONT PANEL · SWITCHES, LEDS & AUDIO HEADER',
    titleBold1: 'GIÁM SÁT',
    titleItalic: 'thời gian thực',
    titleBold2: 'NHẠY BÉN',
    content:
      'Kết nối hệ thống dây xoắn đôi của đèn báo trạng thái (Power LED, HDD LED), nút bấm điều khiển (Turbo/Reset) và loa báo lỗi POST. Telemetry và Observability giúp phát hiện và ứng cứu sự cố tức thời.',
    tags: ['Telemetry & Observability', 'Real-time Metrics', 'Rapid Response'],
  },
  {
    code: '09 / 09 — EXPANSION CARDS · 3DFX VOODOO & SOUND BLASTER 16',
    titleBold1: 'ĐỒ HỌA 3D &',
    titleItalic: 'trải nghiệm',
    titleBold2: 'ĐỈNH CAO',
    content:
      'Đỉnh cao đồ họa 3D với card tăng tốc 3dfx Voodoo và âm thanh Sound Blaster 16. Chuyên sâu đồ họa 3D WebGL / Three.js 60 FPS, mô phỏng Digital Twin công nghiệp và hoàn thiện sản phẩm chỉn chu.',
    tags: ['Three.js / WebGL', '3D Digital Twin', 'Creative Technologist'],
  },
];

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const smoothScrollProgress = state.scrollCurrent; // 0.0 -> 10.0 liên tục
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);

      // CHỈ hiển thị khối text giới thiệu từ Step 01 -> Step 09.
      // Khi ở Step 00 (Home) hoặc hoàn thiện máy (Step 10): ẨN HOÀN TOÀN để không che màn hình CRT và bàn làm việc!
      const isAboutActive =
        portalProgress >= 0.40 &&
        smoothScrollProgress >= 0.40 &&
        smoothScrollProgress <= 9.35 &&
        state.currentStep >= 1 &&
        state.currentStep <= 9;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAboutActive ? '1' : '0';
        containerRef.current.style.display = isAboutActive ? 'flex' : 'none';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Cơ chế Băng chuyền cuộn dọc từ từ (Smooth Vertical Reel Scroll):
      // Duyệt qua 9 phần tử, tính vị trí translateY và opacity liên tục theo smoothScrollProgress
      for (let i = 0; i < ABOUT_EDITORIAL_STEPS.length; i++) {
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
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: '5vw',
        top: '80px',
        width: '34vw',
        maxWidth: '470px',
        height: 'calc(100vh - 80px)',
        pointerEvents: 'none',
        zIndex: 30,
        transition: 'opacity 0.4s ease-out',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
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
            <h2 className="font-sans font-black text-white text-[clamp(2.15rem,3.1vw,3.05rem)] tracking-tight leading-[1.08] uppercase mb-[18px]">
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
            <p className="font-sans text-[1.06rem] text-[#b4b4bb] leading-[1.65] mb-6 font-normal">
              {step.content}
            </p>

            {/* Tags kỹ năng thực tế - 3 thẻ luôn nằm trọn trên 1 hàng ngang */}
            <div className="flex flex-nowrap gap-[10px] items-center">
              {step.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-[14px] py-[7px] rounded-md text-[0.82rem] font-mono font-medium bg-white/[0.06] text-[#e5e5ea] border border-white/10 backdrop-blur-sm whitespace-nowrap shrink-0"
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

