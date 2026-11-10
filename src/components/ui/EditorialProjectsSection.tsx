import { useState, useRef, useEffect } from 'react';
import { MOCK_PROJECTS, ProjectItem } from '../../data/mockProjects';
import { useBuildStore } from '../../store/useBuildStore';

// Bảng màu chấm tròn đặc trưng và thanh Accent Bar cho từng dự án
const PROJECT_ACCENT_COLORS: Record<string, string> = {
  '01': '#f4a261', // Cam đào / Peach Orange
  '02': '#ff7eb6', // Hồng Neon / Electric Pink
  '03': '#9b87f5', // Tím hoa cà / Soft Violet
  '04': '#38bdf8', // Xanh lam trời / Sky Blue
  '05': '#4ade80', // Xanh lục lá / Mint Green
};

// Hạng mục chuẩn hóa theo ngôn ngữ thiết kế Editorial
const PROJECT_CATEGORIES: Record<string, string> = {
  '01': 'WEBGL / 3D DIGITAL TWIN',
  '02': 'SERVERLESS / HIGH-CONCURRENCY POS',
  '03': 'CREATIVE WEBGL / PBR ARCHVIZ',
  '04': 'FULL-STACK / STREAMING PLATFORM',
  '05': 'QUANTITATIVE AI / WEBGL VIS',
};

// Số góc nhìn đa chiều
const PROJECT_VIEWS: Record<string, string> = {
  '01': '04 GÓC',
  '02': '06 GÓC',
  '03': '05 GÓC',
  '04': '04 GÓC',
  '05': '06 GÓC',
};

export function EditorialProjectsSection() {
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const enterProjectApp = useBuildStore((s) => s.enterProjectApp);

  // Theo dõi tọa độ chuột khi hover để hiển thị Floating Image Preview mượt mà
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const hoveredProject = MOCK_PROJECTS.find((p) => p.id === hoveredProjectId);

  // Khóa scroll khi mở Modal chi tiết dự án
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedProject]);

  // Click vào hàng dự án: Mở trải nghiệm 3D Tunnel Showcase
  const handleRowClick = (project: ProjectItem) => {
    // Mở Modal chi tiết hoặc kích hoạt trực tiếp 3D Fly-Through Showcase
    setSelectedProject(project);
  };

  return (
    <section
      id="projects-section"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative w-full bg-[#0a0a0c] text-white pt-24 pb-36 px-6 sm:px-12 md:px-16 selection:bg-[#e05a47] selection:text-white"
      style={{ zIndex: 10 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* =======================================================================
            1. PHẦN HEADER CỦA SECTION PROJECTS (EDITORIAL HEADLINE + SUBTITLE)
           ======================================================================= */}
        <div className="mb-14 sm:mb-20">
          {/* Nhãn chỉ mục phía trên */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e05a47] animate-pulse" />
            <span className="font-mono text-xs sm:text-[0.8rem] uppercase tracking-[0.18em] text-[#6e6e73]">
              02 / DANH MỤC DỰ ÁN
            </span>
          </div>

          {/* Tiêu đề khổng lồ 2 dòng kết hợp Bold Sans & Italic Serif đỏ cam */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              {/* Dòng 1: Projects & */}
              <div className="flex items-baseline flex-wrap">
                <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(4rem,8.5vw,7.5rem)] leading-[0.92] uppercase">
                  Projects
                </h2>
                <span
                  className="italic font-normal text-[#e05a47] text-[clamp(3.8rem,8.2vw,7.2rem)] leading-[0.92] ml-3 sm:ml-5 select-none"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  &
                </span>
              </div>
              {/* Dòng 2: Systems */}
              <h2 className="font-sans font-black text-[#f5f5f7] tracking-tight text-[clamp(4rem,8.5vw,7.5rem)] leading-[0.92] uppercase mt-1">
                Systems
              </h2>
            </div>

            {/* Dòng chú thích căn phải ngang hàng với đáy chữ tiêu đề */}
            <div className="lg:text-right pb-2">
              <p className="font-sans text-[0.92rem] sm:text-[1rem] text-[#8e8e93] max-w-md">
                Bấm vào từng dự án để xem toàn bộ góc nhìn.
              </p>
              <div className="mt-2 font-mono text-[0.72rem] tracking-[0.14em] text-[#55555c] uppercase">
                5 SELECTED PRODUCTION RELEASES // 60 FPS
              </div>
            </div>
          </div>
        </div>

        {/* =======================================================================
            2. BẢNG DANH SÁCH DỰ ÁN (PROJECT TABLE LIST)
           ======================================================================= */}
        <div className="w-full">
          {/* Hàng Tiêu đề cột (Table Header) */}
          <div className="grid grid-cols-12 pb-4 text-xs font-mono uppercase tracking-[0.14em] text-[#6e6e73] border-b border-white/10 select-none">
            <div className="col-span-1">#</div>
            <div className="col-span-6 md:col-span-6">DỰ ÁN</div>
            <div className="hidden sm:block col-span-3 md:col-span-3">HẠNG MỤC</div>
            <div className="hidden md:block col-span-1">GÓC NHÌN</div>
            <div className="col-span-5 sm:col-span-2 md:col-span-1 text-right">XEM</div>
          </div>

          {/* 5 Hàng Dự Án (Project Rows) */}
          <div className="divide-y divide-white/[0.08]">
            {MOCK_PROJECTS.map((project) => {
              const accentColor = PROJECT_ACCENT_COLORS[project.id] || '#f4a261';
              const category = PROJECT_CATEGORIES[project.id] || project.category;
              const viewsCount = PROJECT_VIEWS[project.id] || '04 GÓC';
              const isHovered = hoveredProjectId === project.id;

              return (
                <div
                  key={project.id}
                  onClick={() => handleRowClick(project)}
                  onMouseEnter={() => setHoveredProjectId(project.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  className="group relative grid grid-cols-12 items-center py-7 sm:py-9 cursor-pointer transition-colors duration-300 hover:bg-white/[0.02]"
                >
                  {/* Cột 1: # Số thứ tự */}
                  <div className="col-span-1 font-mono text-sm sm:text-base text-[#6e6e73] group-hover:text-white transition-colors duration-300">
                    {project.id}
                  </div>

                  {/* Cột 2: Tên dự án & Chấm tròn màu & Mô tả ngắn */}
                  <div className="col-span-6 md:col-span-6 pr-4">
                    <div className="flex items-center gap-3 sm:gap-4 mb-1.5">
                      {/* Chấm tròn màu đặc trưng 10px x 10px */}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125 shadow-sm"
                        style={{
                          backgroundColor: accentColor,
                          boxShadow: isHovered ? `0 0 10px ${accentColor}` : 'none',
                        }}
                      />
                      {/* Tên dự án lớn */}
                      <h3 className="font-sans font-bold text-white text-[clamp(1.35rem,2.5vw,2.25rem)] tracking-[-0.02em] leading-tight group-hover:text-white transition-colors">
                        {project.title}
                      </h3>
                    </div>
                    {/* Mô tả ngắn bên dưới */}
                    <p className="font-sans text-[0.88rem] sm:text-[0.95rem] text-[#8e8e93] line-clamp-1 pl-6">
                      {project.subtitle}
                    </p>
                  </div>

                  {/* Cột 3: Hạng mục (Category) */}
                  <div className="hidden sm:block col-span-3 md:col-span-3 font-mono text-[0.78rem] sm:text-[0.82rem] tracking-[0.08em] text-[#9a9a9e] uppercase">
                    {category}
                  </div>

                  {/* Cột 4: Góc nhìn (Views) */}
                  <div className="hidden md:block col-span-1 font-mono text-[0.82rem] text-[#9a9a9e]">
                    {viewsCount}
                  </div>

                  {/* Cột 5: Nút Mũi Tên tròn 48px x 48px */}
                  <div className="col-span-5 sm:col-span-2 md:col-span-1 flex justify-end">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center transition-all duration-300 group-hover:border-white group-hover:scale-105 shrink-0"
                      style={{
                        backgroundColor: isHovered ? accentColor : 'transparent',
                        borderColor: isHovered ? accentColor : 'rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isHovered ? '#0a0a0c' : '#ffffff'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>

                  {/* =======================================================================
                      HIỆU ỨNG ACCENT BAR CHẠY NGANG ĐÁY HÀNG (DÀY 4PX ĐỔI MÀU THEO CHẤM TRÒN)
                     ======================================================================= */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[4px] transition-transform duration-300 ease-out origin-left pointer-events-none"
                    style={{
                      backgroundColor: accentColor,
                      transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
                      opacity: isHovered ? 1 : 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer ghi chú của Section */}
        <div className="mt-14 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-[#6e6e73]">
          <div>TẤT CẢ DỰ ÁN ĐỀU ÁP DỤNG KIẾN TRÚC MÃ NGUỒN TIÊU CHUẨN CAO // 100% CLEAN CODE</div>
          <div className="flex items-center gap-4 text-[#8e8e93]">
            <span>STABLE 60 FPS</span>
            <span>·</span>
            <span>THREE.JS & R3F</span>
            <span>·</span>
            <span>GLSL SHADERS</span>
          </div>
        </div>
      </div>

      {/* =======================================================================
          3. FLOATING HOVER IMAGE PREVIEW (CARD NỔI 360x220PX BÁM THEO CHUỘT)
         ======================================================================= */}
      {hoveredProject && (
        <div
          className="fixed pointer-events-none hidden lg:block z-50 rounded-xl overflow-hidden border border-white/20 bg-[#141416] shadow-2xl transition-opacity duration-200"
          style={{
            width: '360px',
            height: '220px',
            left: `${mousePos.x + 24}px`,
            top: `${mousePos.y - 110}px`,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255,255,255,0.05)',
          }}
        >
          <img
            src={hoveredProject.imageUrl}
            alt={hoveredProject.title}
            className="w-full h-full object-cover transform scale-105 transition-transform duration-500"
          />
          {/* Lớp gradient đen bên dưới kèm nhãn dự án */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold text-black"
                style={{
                  backgroundColor: PROJECT_ACCENT_COLORS[hoveredProject.id] || '#f4a261',
                }}
              >
                {PROJECT_CATEGORIES[hoveredProject.id]?.split('/')[0]?.trim() || 'PROJECT'}
              </span>
              <span className="font-mono text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
                {hoveredProject.year}
              </span>
            </div>
            <div>
              <p className="font-sans font-bold text-white text-sm line-clamp-1">
                {hoveredProject.title}
              </p>
              <p className="font-mono text-[11px] text-white/70">
                {hoveredProject.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          4. MODAL CHI TIẾT DỰ ÁN & NÚT KHÁM PHÁ 3D FLY-THROUGH TUNNEL
         ======================================================================= */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedProject(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#141416] border border-white/15 rounded-2xl p-6 sm:p-10 shadow-2xl text-white"
          >
            {/* Nút đóng modal */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:border-white transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: PROJECT_ACCENT_COLORS[selectedProject.id] || '#f4a261',
                }}
              />
              <span className="font-mono text-xs uppercase tracking-wider text-[#8e8e93]">
                {PROJECT_CATEGORIES[selectedProject.id] || selectedProject.category} · {selectedProject.year}
              </span>
            </div>

            <h3 className="font-sans font-black text-2xl sm:text-4xl text-white tracking-tight mb-2">
              {selectedProject.title}
            </h3>
            <p className="font-sans text-sm sm:text-base text-[#9a9a9e] mb-6">
              {selectedProject.subtitle}
            </p>

            {/* Ảnh minh họa dự án */}
            <div className="relative w-full h-56 sm:h-80 rounded-xl overflow-hidden mb-8 border border-white/10">
              <img
                src={selectedProject.imageUrl}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nội dung chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-mono text-xs uppercase tracking-widest text-[#e05a47]">
                  TỔNG QUAN HỆ THỐNG
                </h4>
                <p className="font-sans text-sm sm:text-base text-[#d1d1d6] leading-relaxed">
                  {selectedProject.description}
                </p>

                <h4 className="font-mono text-xs uppercase tracking-widest text-[#e05a47] pt-2">
                  ĐIỂM NHẤN KIẾN TRÚC KỸ THUẬT
                </h4>
                <ul className="space-y-2">
                  {selectedProject.architecture.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#b0b0b8]">
                      <span className="text-[#e05a47] font-mono">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cột thông số & Tech Stack */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-[#e05a47] mb-3">
                    CHỈ SỐ HIỆU NĂNG
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProject.metrics?.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white/[0.04] border border-white/5">
                        <div className="font-mono text-[10px] text-[#8e8e93] uppercase">
                          {m.label}
                        </div>
                        <div className="font-sans font-bold text-sm text-white mt-0.5">
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-[#e05a47] mb-3">
                    TECH STACK
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded text-xs font-mono bg-white/[0.06] text-[#e5e5ea] border border-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="font-mono text-xs text-[#8e8e93]">
                VAI TRÒ: <span className="text-white font-semibold">{selectedProject.role}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Nút vào 3D Fly-Through Tunnel Showcase */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProject(null);
                    enterProjectApp();
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#e05a47] hover:bg-[#d04936] text-white font-sans font-semibold text-xs flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#e05a47]/30 cursor-pointer"
                >
                  <span>Mở 3D Fly-Through Tunnel</span>
                  <span>↗</span>
                </button>

                {selectedProject.githubUrl && (
                  <a
                    href={selectedProject.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-full border border-white/20 hover:border-white text-xs font-mono text-white transition-colors"
                  >
                    GITHUB SOURCE ↗
                  </a>
                )}

                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans font-medium text-xs transition-colors cursor-pointer"
                >
                  ĐÓNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
