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
    titleBold1: 'Nền tảng',
    titleItalic: 'Kỹ thuật',
    titleBold2: 'Vững chắc',
    content:
      'Xin chào, tôi là Nguyễn Xuân Vinh (Vinzboiz) — Kỹ sư Phần mềm tốt nghiệp tại ĐH Công nghệ TP.HCM (HUTECH) với GPA 3.43/4.0 và danh hiệu Sinh viên Xuất sắc (2024–2025). Giống như bo mạch chủ kết nối mọi thành phần, tôi xây dựng sản phẩm từ tư duy kiến trúc hệ thống bài bản.',
    tags: ['Software Engineering', 'GPA 3.43 / 4.0', 'System Architecture'],
  },
  {
    code: '02 / 10 — PROCESSOR · PENTIUM MMX 233MHz',
    titleBold1: 'Trái tim',
    titleItalic: 'Xử lý',
    titleBold2: 'Full-Stack',
    content:
      'Đảm nhận vai trò xử lý trung tâm với năng lực phát triển Backend & API hiệu năng cao bằng C# .NET Core, ASP.NET MVC, Java Spring Boot và Node.js/Express — đảm bảo luồng nghiệp vụ phức tạp vận hành chính xác.',
    tags: ['C# .NET Core', 'Java Spring Boot', 'Node.js', 'RESTful API'],
  },
  {
    code: '03 / 10 — COOLING · COOLER MASTER FAN',
    titleBold1: 'Kỷ luật &',
    titleItalic: 'Bền bỉ',
    titleBold2: 'Dưới Áp lực',
    content:
      'Duy trì nhịp sinh học kỷ luật từ 4:45 sáng mỗi ngày cùng đam mê bóng đá và võ thuật. Tinh thần thép giúp tôi luôn giữ sự ổn định khi xử lý sự cố production hay chinh chiến tại HDBank Hackathon.',
    tags: ['High Endurance', 'HDBank Hackathon', 'Problem Solving'],
  },
  {
    code: '04 / 10 — MEMORY · 32MB SDRAM DIMM',
    titleBold1: 'Truy xuất',
    titleItalic: 'Dữ liệu',
    titleBold2: 'Tức thời',
    content:
      'Tối ưu hóa truy vấn và thiết kế cơ sở dữ liệu quan hệ trên PostgreSQL, MySQL, SQL Server, Supabase kết hợp quản lý State mượt mà trên Frontend với Angular và React 19 TypeScript.',
    tags: ['PostgreSQL', 'SQL Server', 'Angular', 'React 19'],
  },
  {
    code: '05 / 10 — CHASSIS & PSU · ENLIGHT AT TOWER',
    titleBold1: 'Hệ thống',
    titleItalic: 'Doanh nghiệp',
    titleBold2: 'Thực chiến',
    content:
      'Full-Stack & Frontend Developer tại Pungkook Saigon II — trực tiếp tham gia phát triển và vận hành các hệ thống Enterprise cốt lõi: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard & Efficiency Summary.',
    tags: ['Pungkook Saigon II', 'MES / SCADA', 'Enterprise PLM'],
  },
  {
    code: '06 / 10 — STORAGE · QUANTUM FIREBALL & CD-ROM',
    titleBold1: 'Chuẩn hóa',
    titleItalic: 'Dữ liệu AI',
    titleBold2: '& Media',
    content:
      'Kinh nghiệm thực chiến với dữ liệu Computer Vision độ chính xác cao tại Alchera, kết hợp xây dựng các phân hệ xử lý 360 Media annotation, luồng xuất file ZIP và kiểm soát lỗi dữ liệu lớn.',
    tags: ['Computer Vision', '360 Media', 'Data Pipeline'],
  },
  {
    code: '07 / 10 — GRAPHICS · 3DFX VOODOO ACCELERATOR',
    titleBold1: 'Không gian',
    titleItalic: '3D WebGL',
    titleBold2: '& Digital Twin',
    content:
      'Đưa nhà máy công nghiệp lên trình duyệt với Three.js, WebGL và Autodesk Platform Services (Forge). Kết hợp modeling trên Blender, Tripo3D cùng kỹ thuật Frustum/Occlusion Culling để giữ vững 60 FPS.',
    tags: ['Three.js / WebGL', 'APS Forge', '3D Digital Twin', 'Blender'],
  },
  {
    code: '08 / 10 — INTERCONNECT · IDE RIBBON CABLES',
    titleBold1: 'Kết nối',
    titleItalic: 'Đa chiều',
    titleBold2: '& Teamwork',
    content:
      'Cầu nối mạch lạc giữa thiết kế UI/UX (Figma), đội ngũ Backend và người dùng cuối. Sở hữu chứng chỉ Communication & Teamwork Skills cùng khả năng phối hợp đa quốc gia trong môi trường doanh nghiệp.',
    tags: ['UI/UX Consistency', 'Figma', 'Team Collaboration'],
  },
  {
    code: '09 / 10 — ENCLOSURE · STEEL U-COVER',
    titleBold1: 'Sự Chỉn chu',
    titleItalic: 'Trong từng',
    titleBold2: 'Chi tiết',
    content:
      'Đề cao Clean Architecture, tối ưu rendering pipeline và trau chuốt từng micro-interaction — từ giao diện bảng điều khiển nhà máy cho đến từng chiếc vé in nhiệt trên ứng dụng nội bộ.',
    tags: ['Clean Code', 'Tailwind / SCSS', 'Performance Tuning'],
  },
  {
    code: '10 / 10 — WORKSTATION · SONY TRINITRON CRT',
    titleBold1: 'Hệ thống',
    titleItalic: 'Sẵn sàng',
    titleBold2: 'Khởi chạy',
    content:
      'Bộ máy năm 1997 đã lắp ráp hoàn tất và khởi động! Bạn có thể bấm Login trực tiếp trên màn hình CRT bên phải, tự tay click nhét Đĩa CD / Thẻ nhớ trên mặt bàn, hoặc chuyển sang mục Projects & My CV.',
    tags: ['Interactive Workstation', 'Ready to Explore'],
  },
];

export function AboutEditorialScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let animId: number;

    const updateScroller = () => {
      const state = useBuildStore.getState();
      const smoothScrollProgress = state.scrollCurrent; // Chạy liên tục từ 1.0 đến 10.0
      const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
      const isAbout = state.currentStep >= 1 && portalProgress >= 0.75;

      if (containerRef.current) {
        containerRef.current.style.opacity = isAbout ? '1' : '0';
        containerRef.current.style.pointerEvents = 'none';
      }

      // Cập nhật trực tiếp 10 thẻ chữ qua Direct DOM transform trong 1 draw frame duy nhất
      for (let i = 0; i < ABOUT_EDITORIAL_STEPS.length; i++) {
        const stepIndex = i + 1; // 1 -> 10
        const stepDelta = stepIndex - smoothScrollProgress;

        // delta < 0 khi đã cuộn qua (chữ trôi lên trên), delta > 0 khi bước sắp tới (chữ ở phía dưới)
        const translateY = stepDelta * 160; // Khoảng dịch chuyển dọc êm ái, chậm rãi
        const opacity = THREE.MathUtils.clamp(1 - Math.abs(stepDelta) * 1.25, 0, 1);
        const scale = THREE.MathUtils.lerp(0.96, 1.0, opacity);
        const blur = Math.max(0, (1 - opacity) * 3);

        const el = itemRefs.current[i];
        if (el) {
          if (opacity <= 0.005 || !isAbout) {
            el.style.display = 'none';
          } else {
            el.style.display = 'block';
            el.style.opacity = `${opacity}`;
            el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
            el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
          }
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
        left: '6vw',
        top: '80px',
        width: '42vw',
        height: 'calc(100vh - 80px)',
        pointerEvents: 'none',
        zIndex: 30,
        transition: 'opacity 0.4s ease-out',
      }}
      className="hidden md:flex items-center justify-start select-none"
    >
      <div className="relative w-full h-full flex items-center">
        {ABOUT_EDITORIAL_STEPS.map((step, idx) => (
          <div
            key={idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className="absolute left-0 right-0 max-w-xl will-change-transform"
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

            {/* Nút điều hướng sang Projects & CV khi đã hoàn tất máy tính ở Step 10 */}
            {idx === 9 && (
              <div className="mt-7 flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => {
                    const state = useBuildStore.getState();
                    state.setEditorialPageMode('EDITORIAL_2D');
                    state.jumpToHome();
                    setTimeout(() => {
                      document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 800);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#e05a47] hover:bg-[#ff6b57] text-white font-mono text-xs font-semibold tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer uppercase flex items-center gap-2"
                >
                  <span>Xem Projects</span>
                  <span>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const state = useBuildStore.getState();
                    state.setEditorialPageMode('EDITORIAL_2D');
                    state.jumpToHome();
                    setTimeout(() => {
                      document.getElementById('cv-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 800);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 font-mono text-xs font-semibold tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer uppercase flex items-center gap-2"
                >
                  <span>Xem My CV</span>
                  <span>↗</span>
                </button>
              </div>
            )}

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

