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
    code: '01 / 10 — MOTHERBOARD · ASUS TX97-E',
    titleBold1: 'NỀN TẢNG',
    titleItalic: 'kỹ thuật',
    titleBold2: 'VỮNG CHẮC',
    content:
      'Nguyễn Xuân Vinh (Vinzboiz) — Kỹ sư Phần mềm tốt nghiệp ĐH HUTECH (GPA 3.43/4.0, Sinh viên Xuất sắc), luôn khởi đầu sản phẩm từ kiến trúc hệ thống bài bản.',
    tags: ['Software Engineering', 'GPA 3.43 / 4.0', 'System Design'],
  },
  {
    code: '02 / 10 — PROCESSOR · PENTIUM MMX 233MHz',
    titleBold1: 'TRÁI TIM',
    titleItalic: 'xử lý',
    titleBold2: 'FULL-STACK',
    content:
      'Phát triển hệ thống Backend & RESTful API hiệu năng cao với C# .NET Core, Java Spring Boot và Node.js, đảm bảo luồng nghiệp vụ vận hành chuẩn xác.',
    tags: ['C# .NET Core', 'Spring Boot', 'Node.js'],
  },
  {
    code: '03 / 10 — COOLING · COOLER MASTER FAN',
    titleBold1: 'KỶ LUẬT &',
    titleItalic: 'bền bỉ',
    titleBold2: 'DƯỚI ÁP LỰC',
    content:
      'Rèn luyện kỷ luật từ 4:45 sáng cùng bóng đá và võ thuật — giữ sự ổn định tuyệt đối khi xử lý sự cố production và chinh chiến tại HDBank Hackathon.',
    tags: ['High Endurance', 'Hackathon', 'Problem Solver'],
  },
  {
    code: '04 / 10 — MEMORY · 32MB SDRAM DIMM',
    titleBold1: 'TRUY XUẤT',
    titleItalic: 'phản hồi',
    titleBold2: 'TỨC THỜI',
    content:
      'Quản lý State thời gian thực mượt mà trên Frontend với Angular, React 19 và TypeScript, mang lại trải nghiệm tương tác không độ trễ.',
    tags: ['Angular', 'React 19', 'TypeScript'],
  },
  {
    code: '05 / 10 — CHASSIS & PSU · ENLIGHT AT TOWER',
    titleBold1: 'HỆ THỐNG',
    titleItalic: 'doanh nghiệp',
    titleBold2: 'THỰC CHIẾN',
    content:
      'Full-Stack Developer tại Pungkook Saigon II — trực tiếp xây dựng và tối ưu các phân hệ cốt lõi: PLMV2, MES Home, SCADA UI & QA Dashboard.',
    tags: ['Pungkook Saigon II', 'MES / SCADA', 'Enterprise PLM'],
  },
  {
    code: '06 / 10 — STORAGE · CREATIVE CD, FDD & QUANTUM HDD',
    titleBold1: 'LƯU TRỮ',
    titleItalic: 'dữ liệu',
    titleBold2: 'ĐA TẦNG',
    content:
      'Tối ưu hóa cơ sở dữ liệu PostgreSQL, SQL Server, Supabase kết hợp kinh nghiệm xử lý dữ liệu Computer Vision độ chính xác cao tại Alchera.',
    tags: ['PostgreSQL', 'SQL Server', 'Computer Vision'],
  },
  {
    code: '07 / 10 — GRAPHICS · 3DFX VOODOO & SOUND BLASTER',
    titleBold1: 'KHÔNG GIAN',
    titleItalic: '3D WebGL',
    titleBold2: 'SỐNG ĐỘNG',
    content:
      'Trực quan hóa nhà máy 3D Digital Twin trên trình duyệt bằng Three.js, WebGL, APS Forge và Blender — tối ưu thuật toán Culling đạt chuẩn 60 FPS.',
    tags: ['Three.js / WebGL', 'APS Forge', '3D Digital Twin'],
  },
  {
    code: '08 / 10 — INTERCONNECT · IDE RIBBON CABLES',
    titleBold1: 'KẾT NỐI',
    titleItalic: 'đa chiều',
    titleBold2: 'MẠCH LẠC',
    content:
      'Cầu nối chặt chẽ giữa thiết kế UI/UX (Figma), kiến trúc Backend và nghiệp vụ thực tế thông qua kỹ năng giao tiếp và phối hợp nhóm hiệu quả.',
    tags: ['UI/UX to Code', 'Figma', 'Teamwork'],
  },
  {
    code: '09 / 10 — ENCLOSURE · STEEL U-COVER',
    titleBold1: 'CHỈN CHU',
    titleItalic: 'từng',
    titleBold2: 'ĐIỂM CHẠM',
    content:
      'Đề cao Clean Code, hiệu năng tải trang và trau chuốt từng micro-interaction từ giao diện điều khiển công nghiệp đến ứng dụng nội bộ.',
    tags: ['Clean Code', 'Tailwind / SCSS', 'Optimization'],
  },
  {
    code: '10 / 10 — WORKSTATION · SONY TRINITRON CRT',
    titleBold1: 'HỆ THỐNG',
    titleItalic: 'sẵn sàng',
    titleBold2: 'KHỞI CHẠY',
    content:
      'Bộ máy 1997 đã hạ cánh xuống bàn làm việc và bật nguồn! Hãy tương tác trực tiếp với màn hình CRT bên phải hoặc khám phá danh mục Projects & CV.',
    tags: ['Interactive OS', 'Explore Projects', 'View CV'],
  },
];

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const smoothScrollProgress = state.scrollCurrent; // 0.0 -> 12.0 liên tục
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);

      // CHỈ hiển thị khối text giới thiệu trong phân đoạn ABOUT (Step 01 -> Step 10)
      // Khi ở Step 00 (Home) hoặc mở hẳn Projects/CV: ẩn hoàn toàn
      const isAboutActive =
        portalProgress >= 0.75 &&
        smoothScrollProgress >= 0.85 &&
        smoothScrollProgress <= 10.6;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAboutActive ? '1' : '0';
        containerRef.current.style.display = isAboutActive ? 'flex' : 'none';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Cơ chế Băng chuyền cuộn dọc từ từ (Smooth Vertical Reel Scroll):
      // Duyệt qua 10 phần tử, tính vị trí translateY và opacity liên tục theo smoothScrollProgress
      for (let i = 0; i < ABOUT_EDITORIAL_STEPS.length; i++) {
        const stepIndex = i + 1; // 1..10
        const el = itemRefs.current[i];
        if (!el) continue;

        if (!isAboutActive) {
          el.style.display = 'none';
          continue;
        }

        // stepDelta = stepIndex - smoothScrollProgress
        // - Step hiện tại có stepDelta ~ 0 => translateY ~ 0px
        // - Khi cuộn sang step sau: Step cũ có stepDelta đi từ 0 -> -1 => translateY đi lên -340px
        // - Step mới có stepDelta đi từ +1 -> 0 => translateY từ +340px trôi lên 0px
        const stepDelta = stepIndex - smoothScrollProgress;
        const translateY = stepDelta * 340;

        // Giữ opacity hiển thị lâu hơn trên đường trượt để mắt nhìn rõ hiệu ứng cuộn lên/xuống
        const opacity = THREE.MathUtils.clamp(1.15 - Math.abs(stepDelta) * 1.15, 0, 1);

        if (Math.abs(stepDelta) > 1.05 || opacity <= 0.01) {
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

