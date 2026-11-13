import { useState, useEffect } from 'react';
import { CanonBjcPrinter } from '../canvas/retro/CanonBjcPrinter';

const EXPERIENCES = [
  {
    period: '2024 — NAY',
    role: 'Full-Stack & Frontend Developer',
    company: 'Pungkook Saigon II',
    highlights: [
      'Trực tiếp tham gia phát triển và vận hành các hệ thống Enterprise cốt lõi: PLMV2, PK PLM, MES Home, SCADA UI, QA Dashboard & Efficiency Summary.',
      'Thiết kế giao diện thời gian thực giám sát dây chuyền sản xuất công nghiệp, tối ưu hóa hiển thị dữ liệu lớn với độ trễ thấp.',
      'Phối hợp đa phòng ban giữa đội ngũ Backend, QA và khối sản xuất để đảm bảo độ tin cậy và chuẩn hóa quy trình phần mềm.',
    ],
    tech: ['Angular', 'React 19', 'TypeScript', 'C# .NET Core', 'RESTful API', 'SQL Server', 'SCADA / MES'],
  },
  {
    period: '2023 — 2024',
    role: 'AI Data & Computer Vision Specialist',
    company: 'Alchera',
    highlights: [
      'Khai thác và xử lý dữ liệu Computer Vision độ chính xác cao phục vụ huấn luyện các mô hình AI thị giác máy tính.',
      'Xây dựng các phân hệ xử lý 360 Media annotation, tối ưu hóa luồng xuất file ZIP hàng loạt và kiểm soát lỗi dữ liệu lớn tự động.',
      'Thiết lập pipeline kiểm định chất lượng dữ liệu đầu vào và đầu ra, gia tăng 35% hiệu suất gán nhãn dữ liệu hình ảnh.',
    ],
    tech: ['Python', 'Computer Vision', '360 Media Pipeline', 'Data Annotation', 'Automation Tools'],
  },
  {
    period: '2022 — 2024',
    role: 'Creative WebGL & 3D Systems Engineer',
    company: 'Freelance & Research Projects',
    highlights: [
      'Nghiên cứu và triển khai các hệ thống 3D Digital Twin, PBR Shaders và kiến trúc Procedural Three.js 60 FPS trên trình duyệt.',
      'Đạt giải thưởng tại cuộc thi HDBank Hackathon với giải pháp công nghệ sáng tạo và kiến trúc backend phân tán.',
      'Xây dựng Portfolio 3D năm 1997 không sử dụng file 3D bên ngoài, tối ưu hóa 100% bằng InstancedMesh và CanvasTexture.',
    ],
    tech: ['Three.js', 'React Three Fiber', 'GLSL Shaders', 'Web Audio API', 'GSAP', 'Next.js', 'Zustand'],
  },
];

const SKILL_GROUPS = [
  {
    title: 'NGÔN NGỮ & CÔNG NGHỆ CỐT LÕI',
    skills: ['C# .NET Core', 'ASP.NET MVC', 'Java Spring Boot', 'Node.js / Express', 'TypeScript (Strict)', 'Python', 'SQL'],
  },
  {
    title: 'FRONTEND & 3D WEBGL GRAPHICS',
    skills: ['Three.js / WebGL', 'React 19 / 18', 'Angular', 'Next.js 14 / 15', 'GLSL Shaders', 'Tailwind CSS / SCSS', 'GSAP', 'Zustand'],
  },
  {
    title: 'CƠ SỞ DỮ LIỆU & NỀN TẢNG CLOUD',
    skills: ['PostgreSQL', 'SQL Server', 'MySQL', 'Supabase', 'Docker', 'Redis', 'APS Forge (Autodesk)', 'RESTful API / gRPC'],
  },
];

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

  const handleDownloadDocx = () => {
    const link = document.createElement('a');
    link.href = '/NguyenXuanVinh_CV.docx';
    link.download = 'NguyenXuanVinh_CV.docx';
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
            2. NỘI DUNG 2 CỘT: KINH NGHIỆM THỰC CHIẾN & NĂNG LỰC KỸ THUẬT
           ======================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Cột Trái (7 Cột): Lịch sử Kinh nghiệm & Tóm tắt */}
          <div className="lg:col-span-7 space-y-12">
            {/* Tóm tắt năng lực */}
            <div className="p-7 sm:p-9 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#e05a47]">
                  PROFILE SUMMARY
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>
              <p className="font-sans text-base sm:text-lg text-[#d1d1d6] leading-relaxed">
                Kỹ sư Phần mềm tốt nghiệp Đại học Công nghệ TP.HCM (HUTECH) với GPA 3.43/4.0 và danh hiệu Sinh viên Xuất sắc (2024–2025). Sở hữu kinh nghiệm thực chiến phát triển các hệ thống Enterprise cốt lõi (MES, SCADA, PLM) tại Pungkook Saigon II và xử lý dữ liệu Computer Vision tại Alchera. Đam mê kiến trúc Clean Code, đồ họa 3D WebGL và tối ưu hóa hiệu năng hệ thống chịu tải cao.
              </p>
            </div>

            {/* Timeline Kinh nghiệm làm việc */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="font-mono text-xs uppercase tracking-widest text-[#6e6e73]">
                  LỊCH SỬ KINH NGHIỆM THỰC CHIẾN
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="space-y-10 divide-y divide-white/[0.08]">
                {EXPERIENCES.map((exp, idx) => (
                  <div key={idx} className={idx > 0 ? 'pt-10' : ''}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                      <h3 className="font-sans font-bold text-xl sm:text-2xl text-white tracking-tight">
                        {exp.role}
                      </h3>
                      <span className="font-mono text-xs text-[#e05a47] shrink-0 font-semibold tracking-wider">
                        {exp.period}
                      </span>
                    </div>

                    <div className="font-mono text-xs uppercase tracking-wide text-[#8e8e93] mb-4">
                      {exp.company}
                    </div>

                    <ul className="space-y-2.5 mb-5">
                      {exp.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-3 text-sm sm:text-[0.95rem] text-[#b0b0b8] leading-relaxed">
                          <span className="text-[#e05a47] font-mono mt-1">▸</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Tech tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {exp.tech.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded text-[11px] font-mono bg-white/[0.04] text-[#a1a1aa] border border-white/5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột Phải (5 Cột): Kỹ năng, Học vấn & Thông tin liên hệ */}
          <div className="lg:col-span-5 space-y-10">
            {/* Học vấn & Bằng cấp nổi bật */}
            <div className="p-7 sm:p-9 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#4ade80]">
                  HỌC VẤN & GIẢI THƯỞNG
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-sans font-bold text-lg text-white">
                    Đại Học Công Nghệ TP.HCM (HUTECH)
                  </h4>
                  <div className="font-mono text-xs text-[#8e8e93] uppercase mt-0.5">
                    KỸ SƯ CÔNG NGHỆ THÔNG TIN · 2021 — 2025
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-1 rounded bg-[#4ade80]/15 text-[#4ade80] font-mono text-xs font-semibold border border-[#4ade80]/30">
                      GPA: 3.43 / 4.0
                    </span>
                    <span className="px-2.5 py-1 rounded bg-white/10 text-white font-mono text-xs">
                      Sinh Viên Xuất Sắc (2024–2025)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="font-mono text-xs text-[#e05a47] font-semibold">
                    ★ HDBank Hackathon 2024
                  </div>
                  <p className="font-sans text-xs text-[#a1a1aa] mt-1">
                    Đạt thành tích xuất sắc tại cuộc thi phát triển ứng dụng ngân hàng số & giải pháp công nghệ cao.
                  </p>
                </div>
              </div>
            </div>

            {/* Ma trận Kỹ năng cốt lõi */}
            <div className="p-7 sm:p-9 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#38bdf8]">
                  KỸ NĂNG & NĂNG LỰC
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="space-y-6">
                {SKILL_GROUPS.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-2.5">
                    <h4 className="font-mono text-[11px] tracking-wider text-[#8e8e93] uppercase">
                      {group.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-md text-xs font-mono font-medium bg-white/[0.06] text-white border border-white/10 hover:border-[#38bdf8]/50 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hộp Thông tin liên hệ nhanh */}
            <div className="p-7 sm:p-9 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/15 space-y-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#f4a261]">
                  LIÊN HỆ & KẾT NỐI
                </span>
                <span className="h-[1px] flex-1 bg-white/10" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
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

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
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

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/10">
                  <span className="text-[#8e8e93]">LOCATION</span>
                  <span className="text-white font-sans font-medium text-sm">
                    Ho Chi Minh City, Vietnam (UTC+7)
                  </span>
                </div>
              </div>

              <a
                href="mailto:hello@vinzboiz.dev?subject=Hợp tác dự án với Nguyễn Xuân Vinh"
                className="w-full py-3.5 rounded-xl bg-[#e05a47] hover:bg-[#d04936] text-white font-sans font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-[#e05a47]/20"
              >
                <span>Gửi Tin Nhắn Hợp Tác Trực Tiếp</span>
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
            © 2026 NGUYỄN XUÂN VINH · DESIGNED IN 1997 RETRO HARDWARE STYLE
          </div>
          <div className="flex items-center gap-6">
            <a href="#home-section" className="hover:text-white transition-colors">
              ↑ VỀ ĐẦU TRANG
            </a>
            <span>·</span>
            <a href="https://github.com/vinzboiz/3D_Portfolio" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              MÃ NGUỒN PORTFOLIO (GITHUB) ↗
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
          className="fixed inset-0 z-50 bg-[#0a0a0c]/92 backdrop-blur-2xl flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            // Đóng khi click ngoài tờ giấy CV
            if (e.target === e.currentTarget) {
              setIsCvModalOpen(false);
            }
          }}
        >
          {/* Thanh tác vụ trên cùng (Top Navigation & Action Bar) */}
          <div className="sticky top-0 z-20 w-full max-w-4xl py-3 px-4 sm:px-6 mb-6 rounded-2xl bg-[#16161a]/90 border border-white/15 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
            {/* Nhãn máy in Canon BJC-250 */}
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
              <div>
                <div className="font-mono text-xs sm:text-[0.78rem] uppercase tracking-widest text-[#f5f5f7] font-bold">
                  CANON BJC-250 · HIGH-RES PRINTED DOSSIER
                </div>
                <div className="font-mono text-[10px] text-[#8e8e93] tracking-wide">
                  720 x 360 DPI INKJET EMULATION · TOÀN BỘ HỒ SƠ ỨNG VIÊN
                </div>
              </div>
            </div>

            {/* Các nút tải xuống & nút đóng ở góc trên bên phải */}
            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
              {/* Nút tải PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#f2f0ea] hover:bg-white text-black font-sans font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>[ Tải PDF ↗ ]</span>
              </button>

              {/* Nút tải Word */}
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="group flex items-center gap-2 px-4 sm:px-4.5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.18] text-white border border-white/20 font-sans font-semibold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-y-0.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>[ Tải DOCX ]</span>
              </button>

              {/* Nút đóng Lightbox */}
              <button
                type="button"
                onClick={() => setIsCvModalOpen(false)}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-sans font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Đóng cửa sổ xem CV (Phím ESC)"
              >
                <span>✕ Đóng</span>
                <span className="hidden sm:inline font-mono text-[10px] text-red-200 opacity-75">(ESC)</span>
              </button>
            </div>
          </div>

          {/* Tờ Giấy CV Khổ Lớn Phóng Ra Toàn Màn Hình (High-Resolution Paper Document) */}
          <div className="relative w-full max-w-4xl bg-[#faf8f5] text-[#1c1917] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-8 sm:p-14 md:p-16 rounded-sm border border-neutral-300 font-sans mb-12 selection:bg-[#e05a47] selection:text-white">
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
