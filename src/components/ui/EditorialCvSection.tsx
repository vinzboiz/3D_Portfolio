import { useState, useEffect } from 'react';
import { CanonBjcPrinter } from '../canvas/retro/CanonBjcPrinter';

export function EditorialCvSection() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCvModalOpen(false);
      }
    };

    if (isCvModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCvModalOpen]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@vinzboiz.dev');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleDownloadPdf = () => {
    const link = document.createElement('a');
    link.href = '/NguyenXuanVinh_CV.pdf';
    link.download = 'NguyenXuanVinh_CV.pdf';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <section
      id="cv-section"
      className="relative w-full bg-[#0a0a0c] text-white pt-24 pb-36 px-6 sm:px-12 md:px-16 selection:bg-[#e05a47] selection:text-white"
      style={{ zIndex: 10 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* =======================================================================
            1. HEADER CỦA SECTION MY CV (EDITORIAL HEADLINE)
           ======================================================================= */}
        <div className="mb-14 sm:mb-20">
          {/* Nhãn chỉ mục */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span className="font-mono text-xs sm:text-[0.8rem] uppercase tracking-[0.18em] text-[#6e6e73]">
              03 / RESUME · DOSSIER
            </span>
          </div>

          {/* Tiêu đề khổng lồ 2 dòng kết hợp Máy in 3D Canon BJC-250 lơ lửng */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 lg:pb-16 border-b border-white/10">
            <div className="shrink-0 -translate-y-[50px]">
              <div className="flex items-baseline flex-wrap">
                <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(3.5rem,7.5vw,7rem)] leading-[0.92] uppercase">
                  Curriculum
                </h2>
                <span
                  className="italic font-normal text-[#e05a47] text-[clamp(3.3rem,7.2vw,6.6rem)] leading-[0.92] ml-3 sm:ml-5 select-none"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  &
                </span>
              </div>
              <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(3.5rem,7.5vw,7rem)] leading-[0.92] uppercase mt-1">
                Vitae
              </h2>

              {/* Nút Download CV phong cách Target Reticle Retro kỹ thuật (Chữ xám khói, 4 góc vuông target xám bóng) */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="relative group inline-flex items-center gap-3.5 px-6 py-3.5 bg-black/40 hover:bg-black/70 backdrop-blur-md cursor-pointer transition-all duration-300 select-none shadow-lg"
                >
                  {/* 4 góc target vuông màu xám bóng kim loại */}
                  <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#94a3b8] group-hover:border-white group-hover:w-3 group-hover:h-3 transition-all duration-300" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#94a3b8] group-hover:border-white group-hover:w-3 group-hover:h-3 transition-all duration-300" />
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#94a3b8] group-hover:border-white group-hover:w-3 group-hover:h-3 transition-all duration-300" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#94a3b8] group-hover:border-white group-hover:w-3 group-hover:h-3 transition-all duration-300" />

                  {/* Chấm tâm Target đỏ cam */}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e05a47] group-hover:scale-125 transition-transform" />

                  {/* Chữ xám khói */}
                  <span className="font-mono text-xs sm:text-[13px] uppercase tracking-[0.2em] text-[#a1a1aa] group-hover:text-white transition-colors font-medium">
                    Download CV (PDF)
                  </span>

                  {/* Biểu tượng mũi tên tải xuống */}
                  <span className="font-mono text-xs text-[#71717a] group-hover:text-[#e05a47] group-hover:translate-y-0.5 transition-all">
                    ↓
                  </span>
                </button>
              </div>
            </div>

            {/* Nửa bên phải: Máy in để bàn cổ điển Canon BJC-250 (1997) lơ lửng - Tự động in khi cuộn tới */}
            <div className="flex flex-col items-center lg:items-center w-full lg:w-auto relative overflow-visible min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] lg:-translate-x-6">
              {/* Component 3D Máy in Canon BJC-250 (1997) lơ lửng giữa không trung - Chiều cao rộng rãi không che giấy */}
              <div className="w-full sm:w-[480px] md:w-[520px] lg:w-[540px] h-[480px] sm:h-[520px] md:h-[560px] lg:h-[580px] relative overflow-visible">
                <CanonBjcPrinter onOpenCvModal={() => setIsCvModalOpen(true)} />
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            2. PHẦN LIÊN HỆ KẾT NỐI (CONTACT & CONNECT SECTION)
           ======================================================================= */}
        <div id="contact-section" className="pt-16 sm:pt-24 border-t border-white/10">
          {/* Nhãn chỉ mục */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e05a47] animate-pulse" />
            <span className="font-mono text-xs sm:text-[0.8rem] uppercase tracking-[0.18em] text-[#6e6e73]">
              04 / REACH OUT · COLLABORATION
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Tiêu đề khổng lồ 2 dòng kiểu Image 2 (Bold Sans trắng + Italic Serif & đỏ cam) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-baseline flex-wrap">
                  <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(3.5rem,7.5vw,7rem)] leading-[0.92] uppercase">
                    Contact
                  </h2>
                  <span
                    className="italic font-normal text-[#e05a47] text-[clamp(3.3rem,7.2vw,6.6rem)] leading-[0.92] ml-3 sm:ml-5 select-none"
                    style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                  >
                    &
                  </span>
                </div>
                <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(3.5rem,7.5vw,7rem)] leading-[0.92] uppercase mt-1">
                  Connect
                </h2>
              </div>

              <p className="font-sans text-base sm:text-lg text-[#a1a1aa] leading-relaxed max-w-xl">
  I’m always open to connecting and discussing enterprise software solutions, PLM/MES manufacturing systems, 3D WebGL architectures, or innovative tech projects.
</p>

              {/* Tag trạng thái sẵn sàng hợp tác */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-[#d1d1d6]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping" />
                <span>OPEN TO WORK &amp; COLLABORATION · 2026</span>
              </div>
            </div>

            {/* Khung liên hệ kết nối (Contact Box) */}
            <div className="lg:col-span-5 p-7 sm:p-9 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/15 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#f4a261]">
                  CONTACT &amp; CONNECT
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-black/40 border border-white/10">
                  <span className="text-[#8e8e93]">EMAIL</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-sans font-medium text-sm">
                      hello@vinzboiz.dev
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white transition-colors cursor-pointer"
                    >
                      {copiedEmail ? '✓ ĐÃ CHÉP' : 'CHÉP'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-black/40 border border-white/10">
                  <span className="text-[#8e8e93]">GITHUB</span>
                  <a
                    href="https://github.com/vinzboiz"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-[#38bdf8] font-sans font-medium text-sm transition-colors flex items-center gap-1"
                  >
                    <span>github.com/vinzboiz</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-black/40 border border-white/10">
                  <span className="text-[#8e8e93]">LOCATION</span>
                  <span className="text-white font-sans font-medium text-sm">
                    Ho Chi Minh City, Vietnam (UTC+7)
                  </span>
                </div>
              </div>

              <a
                href="mailto:hello@vinzboiz.dev?subject=Hợp tác dự án với Nguyễn Xuân Vinh"
                className="w-full py-3.5 rounded-xl bg-[#e05a47] hover:bg-[#d04936] text-white font-sans font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 shadow-lg shadow-[#e05a47]/20"
              >
                <span>Send a Direct Collaboration Message</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* =======================================================================
            3. FOOTER TRANG CUỐI CÙNG
           ======================================================================= */}
        <div className="mt-28 pt-10 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-[#6e6e73]">
          <div>
            © 2026 NGUYEN XUAN VINH · DESIGNED IN 1997 RETRO HARDWARE STYLE
          </div>
          <div className="flex items-center gap-6">
            <a href="#home-section" className="hover:text-white transition-colors">
              ↑ BACK TO TOP
            </a>
            <span>·</span>
            <a href="https://github.com/vinzboiz/3D_Portfolio" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GIT CODE PORTFOLIO (GITHUB) ↗
            </a>
          </div>
        </div>
      </div>

      {/* =======================================================================
          4. FULLSCREEN CV MODAL / LIGHTBOX OVERLAY (CANON BJC-250 HIGH-RES OUTPUT)
         ======================================================================= */}
      {isCvModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0a0a0c]/92 backdrop-blur-2xl flex flex-col items-center justify-start p-3 sm:p-8 md:p-12 overflow-y-auto animate-fadeIn cursor-pointer"
          onClick={() => setIsCvModalOpen(false)}
        >
          {/* Tờ Giấy CV Khổ Lớn (Chỉ giữ lại duy nhất phần CV, click ra ngoài nền sẽ đóng modal) */}
          <div
            className="relative w-full max-w-4xl bg-[#faf8f5] text-[#1c1917] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-8 sm:p-14 md:p-16 rounded-sm border border-neutral-300 font-sans my-4 sm:my-8 selection:bg-[#e05a47] selection:text-white cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header CV chuẩn format quốc tế */}
            <div className="border-b-2 border-[#1c1917] pb-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h1 className="font-sans font-black text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#0f172a] uppercase">
                  NGUYỄN XUÂN VINH
                </h1>
                <div className="font-mono text-xs sm:text-sm font-bold text-[#b91c1c] tracking-wider uppercase">
                  GPA: 3.43 / 4.0 · SINH VIÊN XUẤT SẮC
                </div>
              </div>
              <div className="font-mono text-xs sm:text-sm tracking-widest text-[#475569] uppercase mt-1 font-semibold">
                FULL-STACK SOFTWARE ENGINEER · 3D WEBGL & SYSTEMS SPECIALIST
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 font-mono text-xs text-[#64748b]">
                <div>Email: <span className="text-[#0f172a] font-medium">hello@vinzboiz.dev</span></div>
                <div>GitHub: <span className="text-[#0f172a] font-medium">github.com/vinzboiz</span></div>
                <div>Vị trí: <span className="text-[#0f172a] font-medium">TP. Hồ Chí Minh, Việt Nam (Sẵn sàng Relocate)</span></div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#0f172a] uppercase border-b border-neutral-300 pb-1.5 mb-3">
                <span className="w-2 h-2 bg-[#b91c1c]" />
                <span>TÓM TẮT NĂNG LỰC CỐT LÕI (PROFILE SUMMARY)</span>
              </div>
              <p className="text-sm sm:text-[0.95rem] text-[#334155] leading-relaxed">
                Kỹ sư Phần mềm tốt nghiệp Đại học Công nghệ TP.HCM (HUTECH) với GPA 3.43/4.0 và danh hiệu Sinh viên Xuất sắc (2024–2025). Sở hữu kinh nghiệm thực chiến phát triển các hệ thống Enterprise cốt lõi (MES, SCADA, PLM) tại Pungkook Saigon II và xử lý dữ liệu Computer Vision tại Alchera. Chuyên sâu kiến trúc phần mềm Clean Architecture, lập trình Full-Stack (.NET, Angular, React 19) kết hợp đồ họa 3D WebGL (Three.js/R3F) 60 FPS mượt mà.
              </p>
            </div>

            {/* Kinh nghiệm làm việc */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#0f172a] uppercase border-b border-neutral-300 pb-1.5 mb-4">
                <span className="w-2 h-2 bg-[#b91c1c]" />
                <span>KINH NGHIỆM THỰC CHIẾN (WORK EXPERIENCE)</span>
              </div>

              <div className="space-y-6">
                {/* Job 1 */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="font-sans font-bold text-base sm:text-lg text-[#0f172a]">
                      Full-Stack & Frontend Developer · Pungkook Saigon II
                    </h3>
                    <span className="font-mono text-xs font-semibold text-[#b91c1c]">2024 — NAY</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-[#334155]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Trực tiếp tham gia phát triển và vận hành các phân hệ Enterprise trọng yếu: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard & Efficiency Summary.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Thiết kế và tối ưu giao diện giám sát dây chuyền sản xuất công nghiệp theo thời gian thực, xử lý dữ liệu lớn với độ trễ thấp và độ tin cậy cao.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Công nghệ: Angular, React 19, TypeScript, C# .NET Core, SQL Server, RESTful API, Docker.</span>
                    </li>
                  </ul>
                </div>

                {/* Job 2 */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="font-sans font-bold text-base sm:text-lg text-[#0f172a]">
                      AI Data & Computer Vision Specialist · Alchera
                    </h3>
                    <span className="font-mono text-xs font-semibold text-[#b91c1c]">2023 — 2024</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-[#334155]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Khai thác và xử lý dữ liệu Computer Vision độ chính xác cao phục vụ huấn luyện các mô hình AI thị giác máy tính.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Xây dựng pipeline xử lý 360 Media annotation, tự động hóa luồng xuất file và kiểm soát chất lượng dữ liệu đầu vào/ra, tăng 35% năng suất gán nhãn.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Công nghệ: Python, Computer Vision, 360 Media Pipeline, Automation Tools.</span>
                    </li>
                  </ul>
                </div>

                {/* Job 3 */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="font-sans font-bold text-base sm:text-lg text-[#0f172a]">
                      Creative WebGL & 3D Systems Engineer · Freelance & Research
                    </h3>
                    <span className="font-mono text-xs font-semibold text-[#b91c1c]">2022 — 2024</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-[#334155]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Nghiên cứu và triển khai hệ thống 3D Digital Twin, PBR Shaders và kiến trúc Procedural Three.js 60 FPS không dùng file 3D bên ngoài.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#b91c1c] font-mono">▸</span>
                      <span>Đạt giải thưởng tại cuộc thi HDBank Hackathon 2024 với giải pháp công nghệ số và kiến trúc phân tán.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Học vấn & Bằng cấp */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#0f172a] uppercase border-b border-neutral-300 pb-1.5 mb-3">
                <span className="w-2 h-2 bg-[#b91c1c]" />
                <span>HỌC VẤN & GIẢI THƯỞNG (EDUCATION & HONORS)</span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-[#334155]">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <div className="font-bold text-[#0f172a]">
                    Đại Học Công Nghệ TP.HCM (HUTECH) — Kỹ Sư Công Nghệ Thông Tin
                  </div>
                  <span className="font-mono text-xs text-[#64748b]">2021 — 2025</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="font-semibold text-[#15803d]">GPA: 3.43 / 4.0</span>
                  <span>·</span>
                  <span className="font-semibold text-[#0f172a]">Sinh Viên Xuất Sắc Toàn Khóa (2024–2025)</span>
                </div>
                <div className="font-mono text-xs text-[#b91c1c] pt-1">
                  ★ HDBank Hackathon 2024: Giải thưởng sáng tạo & ứng dụng công nghệ ngân hàng số.
                </div>
              </div>
            </div>

            {/* Kỹ năng công nghệ */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#0f172a] uppercase border-b border-neutral-300 pb-1.5 mb-3">
                <span className="w-2 h-2 bg-[#b91c1c]" />
                <span>NĂNG LỰC KỸ THUẬT (TECHNICAL COMPETENCIES)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#334155]">
                <div>
                  <span className="font-mono font-bold text-[#0f172a]">Backend & Systems: </span>
                  C# .NET Core, ASP.NET MVC, Java Spring Boot, Node.js, RESTful API, gRPC.
                </div>
                <div>
                  <span className="font-mono font-bold text-[#0f172a]">Frontend & UI: </span>
                  TypeScript, React 19/18, Angular, Next.js, Tailwind CSS, GSAP, Zustand.
                </div>
                <div>
                  <span className="font-mono font-bold text-[#0f172a]">3D Graphics & Creative: </span>
                  Three.js, WebGL, GLSL Shaders, Procedural Modeling, Web Audio API.
                </div>
                <div>
                  <span className="font-mono font-bold text-[#0f172a]">Database & Cloud: </span>
                  SQL Server, PostgreSQL, MySQL, Supabase, Docker, Redis, Autodesk APS Forge.
                </div>
              </div>
            </div>

            {/* Watermark con dấu máy in Canon BJC-250 */}
            <div className="mt-8 pt-4 border-t border-dashed border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-[#94a3b8]">
              <div>AUTHENTICATED HARDWARE OUTPUT · CANON BUBBLE JET BJC-250 (1997) EMULATOR</div>
              <div className="text-[#b91c1c] font-semibold">VERIFIED CANDIDATE DOSSIER · READY FOR INTERVIEW</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
