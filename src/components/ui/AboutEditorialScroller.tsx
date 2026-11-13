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

/**
 * Tạo danh sách nội dung 10 bước About, tự động nhận diện thời gian trong ngày
 * (Sáng: Good Morning, Chiều: Good Afternoon, Tối/Đêm: Good Evening) cho Step 01 và Step 09.
 */
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
      code: `01 / 10 — ${greetingCode} · VINZBOIZ RETRO WORKBENCH`,
      titleBold1: greetingTitle,
      titleItalic: "I'm",
      titleBold2: 'XUAN VINH',
      content: `${introGreeting} — Software Engineer specializing in scalable distributed architecture and real-time 3D WebGL experiences. Welcome to my 1997 vintage PC workshop. Scroll to explore my engineering journey through each hardware component.`,
      tags: ['Full-Stack Engineer', 'WebGL / Three.js', greetingEnglish, 'Clean Architecture'],
    },
    {
      code: '02 / 10 — CHASSIS PREP · INWIN A500 MID-TOWER',
      titleBold1: 'KHUNG GẦM',
      titleItalic: 'hệ thống',
      titleBold2: 'CHUẨN MỰC',
      content:
        'Thiết lập khung gầm vững chắc cho các dự án phức tạp: Kiến trúc modular monorepo, định vị chính xác các điểm neo kỹ thuật và quy trình CI/CD tự động hóa giúp hệ thống sẵn sàng mở rộng bền bỉ.',
      tags: ['System Architecture', 'Modular Monorepo', 'CI/CD Pipelines'],
    },
    {
      code: '03 / 10 — POWER SUPPLY · SEASONIC SSG-200G AT',
      titleBold1: 'NĂNG LƯỢNG',
      titleItalic: 'vận hành',
      titleBold2: 'BỀN BỈ',
      content:
        'Tương tự bộ nguồn Seasonic 200W cung cấp dòng điện ổn định với quạt hút 80mm lồng thép đồng tâm, tôi xây dựng tầng Backend chịu tải cao (.NET Core, Spring Boot, Node.js) và cơ chế ngắt mạch an toàn.',
      tags: ['High Availability', 'Backend Services', 'Fault Tolerance'],
    },
    {
      code: '04 / 10 — MOBO MOUNTING · ASUS TX97-E INTO CHASSIS',
      titleBold1: 'TÍCH HỢP',
      titleItalic: 'hệ thống',
      titleBold2: 'CHUẨN XÁC',
      content:
        'Kết hợp hoàn hảo giữa tầng Core Engine và khung vỏ với độ chính xác tuyệt đối: bo mạch chủ được nâng vào lòng case, khớp chuẩn từng milimet với tấm chắn I/O Shield và 6 chân ốc đồng.',
      tags: ['System Integration', 'Precision Engineering', 'Type Safety'],
    },
    {
      code: '05 / 10 — STORAGE DRIVES · CREATIVE 24X CD, FDD & HDD',
      titleBold1: 'LƯU TRỮ',
      titleItalic: 'dữ liệu',
      titleBold2: 'ĐA TẦNG',
      content:
        'Thiết kế kiến trúc lưu trữ đa tầng: từ bộ nhớ đệm tốc độ cao, cơ sở dữ liệu phân tán (PostgreSQL, SQL Server) cho tới phân phối tài nguyên tĩnh và xuất hồ sơ CV trực tiếp qua đĩa mềm 3.5".',
      tags: ['PostgreSQL / SQL Server', 'Data Pipeline', 'Storage Architecture'],
    },
    {
      code: '06 / 10 — POWER HARNESS · AT P8/P9 & MOLEX CABLING',
      titleBold1: 'HẠ TẦNG',
      titleItalic: 'phân phối',
      titleBold2: 'CHẶT CHẼ',
      content:
        'Giống quy tắc sống còn "4 sợi dây Đen của P8 & P9 phải nằm sát nhau ở giữa" khi cấp nguồn cho bo mạch AT, tôi xây dựng hệ thống Infrastructure-as-Code có kiểm thử tĩnh và giám sát hạ tầng đám mây an toàn.',
      tags: ['DevOps / Infrastructure', 'Strict Standards', 'Automated QA'],
    },
    {
      code: '07 / 10 — RIBBON BUS · PRIMARY & SECONDARY IDE CABLES',
      titleBold1: 'BĂNG THÔNG',
      titleItalic: 'truyền tải',
      titleBold2: 'TỐC ĐỘ CAO',
      content:
        'Thiết kế luồng truyền tải dữ liệu băng thông rộng giữa tầng xử lý và thiết bị ngoại vi qua cáp bẹ IDE viền đỏ Pin 1. Tối ưu hóa API, State Management thời gian thực và WebSockets không độ trễ.',
      tags: ['High-Throughput Bus', 'Real-time State', 'WebSockets / REST'],
    },
    {
      code: '08 / 10 — FRONT PANEL · SWITCHES, LEDS & AUDIO HEADER',
      titleBold1: 'GIÁM SÁT',
      titleItalic: 'thời gian thực',
      titleBold2: 'NHẠY BÉN',
      content:
        'Kết nối hệ thống dây xoắn đôi của đèn báo trạng thái (Power LED, HDD LED), nút bấm điều khiển (Turbo/Reset) và loa báo lỗi POST. Telemetry và Observability giúp phát hiện và ứng cứu sự cố tức thời.',
      tags: ['Telemetry & Observability', 'Real-time Metrics', 'Rapid Response'],
    },
    {
      code: `09 / 10 — LỜI CẢM ƠN · SINCERE THANKS & ${greetingEnglish.toUpperCase()}`,
      titleBold1: 'CHÂN THÀNH',
      titleItalic: 'cảm ơn',
      titleBold2: 'BẠN',
      content: `Cảm ơn bạn đã đồng hành theo dõi từng bước lắp ráp cỗ máy năm 1997. Sự tỉ mỉ, kiên định và tinh thần kỹ sư nghiêm túc là những giá trị tôi luôn mang vào mọi dự án thực tế. ${closingWish} Hãy cuộn chuột để cỗ máy hạ cánh, sẵn sàng khởi động và khám phá các dự án tiếp theo.`,
      tags: ['Thank You', 'Available for Hire', greetingEnglish, 'Contact & Connect'],
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

