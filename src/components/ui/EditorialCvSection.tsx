import { useState } from 'react';

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

          {/* Tiêu đề khổng lồ 2 dòng */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-baseline flex-wrap">
                <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(4rem,8.5vw,7.5rem)] leading-[0.92] uppercase">
                  Curriculum
                </h2>
                <span
                  className="italic font-normal text-[#e05a47] text-[clamp(3.8rem,8.2vw,7.2rem)] leading-[0.92] ml-3 sm:ml-5 select-none"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  &
                </span>
              </div>
              <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(4rem,8.5vw,7.5rem)] leading-[0.92] uppercase mt-1">
                Vitae
              </h2>
            </div>

            {/* Nút tải CV lớn */}
            <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end gap-3 pb-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="group flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#f2f0ea] hover:bg-white text-black font-sans font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
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
                <span>[ Tải xuống CV (PDF) ↗ ]</span>
              </button>
              <div className="font-mono text-[0.72rem] tracking-[0.14em] text-[#6e6e73] uppercase">
                NGUYỄN XUÂN VINH · GPA 3.43 / 4.0 · READY TO RELOCATE
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
            <div id="contact-section" className="p-7 sm:p-9 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/15 space-y-5">
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
    </section>
  );
}
