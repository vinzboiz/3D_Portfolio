import type {
  RetroOsState,
  DesktopWindowId,
  CrtOsdFlash,
  ProjectAppTransition,
} from '../../../store/useBuildStore';

export interface CrtOsRenderState {
  isPoweredOn: boolean;
  isCrtPowered: boolean;
  osState: RetroOsState;
  bootElapsedTime: number;
  isResetting: boolean;
  cdLocation: 'DESK' | 'TRAY' | 'INSIDE';
  cardLocation: 'DESK' | 'INSERTED';
  isCdInserted: boolean;
  floppyInserted: boolean;
  osDialogAlert: string | null;
  activeWindow: DesktopWindowId | null;
  openWindows: DesktopWindowId[];
  crtOsdOpen: boolean;
  crtOsdFlash: CrtOsdFlash | null;
  crtBrightness: number;
  crtContrast: number;
  crtScale: number;
  crtHOffset: number;
  crtVOffset: number;
  hoveredCanvasPos: { x: number; y: number } | null;
  projectAppTransition?: ProjectAppTransition;
  crtExpandProgress?: number;
}

export interface CrtOsActions {
  loginDesktop: () => void;
  openWindow: (id: DesktopWindowId) => void;
  closeWindow: (id: DesktopWindowId) => void;
  bringWindowToFront: (id: DesktopWindowId) => void;
  insertCdAndCloseTray: () => void;
  toggleFloppyInsert: () => void;
  showHudWarning: (msg: string) => void;
  showOsDialogAlert: (msg: string) => void;
  dismissOsDialogAlert: () => void;
  handleCdClickOnDesk: () => void;
  handleCdTrayEjectClick: () => void;
  handleCardClick: () => void;
  enterProjectApp?: () => void;
}

/** Tải file CV trực tiếp về máy thật của người dùng */
export function triggerCvDownload() {
  const cvText = `================================================================================
VINZBOIZ - CURRICULUM VITAE
Creative Technologist & Senior WebGL / 3D Graphics Engineer
Portfolio: https://github.com/vinzboiz
================================================================================

[PROFESSIONAL SUMMARY]
Senior Creative Technologist specialized in real-time computer graphics, procedural
3D WebGL architectures, and high-performance interactive web experiences.
Proven expertise in building complex Three.js / React Three Fiber engines with zero
external 3D model dependencies, custom GLSL shaders, procedural audio synthesis,
and rigorous 60 FPS performance engineering.

[CORE COMPETENCIES & TECHNICAL PROFICIENCY]
- 3D & Creative Coding: Three.js, React Three Fiber (R3F), WebGL 2.0, GLSL Shaders,
  Procedural Geometries, PBR Materials, Post-processing, Three-stdlib.
- Audio Synthesis: Web Audio API, Howler.js, Procedural WAV synthesis, Sound design.
- Frontend Architecture: TypeScript (Strict), React 18, Zustand, Next.js, Vite, Tailwind CSS.
- Motion & Animation: GSAP 3 (ScrollTrigger, Flip), MathUtils, Matrix Transformations.
- System Design: State machines, 3D Raycasting, Spatial Audio, Memory Profiling.

[FEATURED WORKS & ENGINEERING HIGHLIGHTS]
1. Retro 1997 Procedural PC & OS Simulation (Portfolio 3D):
   - 100% Procedural Three.js hardware assembly of a Socket 7 Pentium MMX workstation.
   - Dual-environment simulation: Award Modular BIOS v4.51PG POST & Retro OS 98 Desktop.
   - Realistic physical separation: Independent PC Power timeline and CRT Monitor power.
   - Direct 3D Raycasting & UV interaction on the curved CRT glass surface.
   - Web Audio API procedural synthesis for mechanical switches, relays, floppy seeks, and CD spin.

2. GLSL Aperture Grille & Degauss Magnetic Shader Engine:
   - Custom Trinitron aperture grille phosphor vertical lines, scanline rasterization.
   - Exponential decaying magnetic wave distortion with chromatic aberration.
   - Power-off cathode ray collapse effect.

3. High-Throughput Distributed Web Platform:
   - Micro-frontend architecture, sub-millisecond state updates, 60 FPS animations.

[HARDWARE & SYSTEM ARCHITECTURE]
- Architecture: ASUS TX97-E Socket 7, Intel Pentium MMX 233MHz, 32MB SDRAM.
- Storage: Quantum Fireball ST 3.2GB, Creative 24X CD-ROM, Sony MPF920 1.44MB Floppy.
- Display: Sony Trinitron Multiscan 100ES 15" CRT Monitor (0.25mm Aperture Grille).

[EDUCATION & CONTACT]
- Degree: B.S. in Computer Science / Software Engineering
- GitHub: github.com/vinzboiz
- Generated directly from Retro OS 98 running on Sony Trinitron CRT 3D.
================================================================================
`;

  const blob = new Blob([cvText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'VINZBOIZ_RESUME_CV.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================================================
// CÁC HÀM VẼ BEVEL 3D CHUẨN WINDOWS 95 (ZERO BORDER-RADIUS)
// =============================================================================

export function drawBevelBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  inset = false,
  fillColor = '#c0c0c0',
  borderThickness = 2
) {
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);

  const light = inset ? '#808080' : '#ffffff';
  const dark = inset ? '#ffffff' : '#808080';
  const outerDark = inset ? '#000000' : '#000000';

  ctx.lineWidth = borderThickness;

  // Cạnh trên & trái sáng
  ctx.fillStyle = light;
  ctx.fillRect(x, y, w, borderThickness);
  ctx.fillRect(x, y, borderThickness, h);

  // Cạnh dưới & phải tối
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + h - borderThickness, w, borderThickness);
  ctx.fillRect(x + w - borderThickness, y, borderThickness, h);

  if (!inset) {
    ctx.fillStyle = outerDark;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h);
  }
}

export function drawTitleBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  title: string,
  active = true,
  iconChar = '🗔'
) {
  const h = 24;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  if (active) {
    grad.addColorStop(0, '#000080');
    grad.addColorStop(1, '#1084d0');
  } else {
    grad.addColorStop(0, '#808080');
    grad.addColorStop(1, '#a0a0a0');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Chữ tiêu đề
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${iconChar} ${title}`, x + 6, y + 17);

  // Nút [X] đóng cửa sổ ở góc phải
  const btnSize = 18;
  const btnX = x + w - btnSize - 3;
  const btnY = y + 3;
  drawBevelBox(ctx, btnX, btnY, btnSize, btnSize, false, '#c0c0c0', 1);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('×', btnX + btnSize / 2, btnY + 13);
}

// =============================================================================
// PIXEL ART ICONS & AVATAR CHO WINDOWS 95/98
// =============================================================================

/** Vẽ chân dung Pixel Art 32x32 trắng đen của vinzboiz */
export function drawVinzboizPixelAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 2.4
) {
  // Bảng màu 4 cấp độ trắng đen cổ điển
  const colors = ['#ffffff', '#c0c0c0', '#505050', '#000000'];
  // Ma trận chân dung hacker/developer 16x16 với kính và headphone
  const matrix = [
    '0000333333330000',
    '0003333333333000',
    '0033111111113300',
    '0331000000001330',
    '0310222222220130',
    '3312000000002133',
    '3120333003330213', // Kính gọng đen
    '3120303003030213',
    '3120333003330213',
    '3120000220000213', // Miệng & cằm
    '0312000220002130',
    '0031200000021300',
    '0003322222233000',
    '0033333333333300', // Cổ áo hoodie
    '0332233333322330',
    '3322223333222233',
  ];

  ctx.save();
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      const char = matrix[r][c];
      const colIdx = parseInt(char, 10);
      ctx.fillStyle = colors[colIdx] || '#000000';
      ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
    }
  }
  ctx.restore();
}

/** Vẽ icon Desktop pixel art */
export function drawDesktopIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: 'COMPUTER' | 'RECYCLE' | 'PORTFOLIO' | 'DOS' | 'README' | 'FLOPPY' | 'CD',
  label: string,
  selected = false
) {
  const iconW = 72;
  const iconH = 76;

  if (selected) {
    ctx.fillStyle = 'rgba(0, 0, 128, 0.4)';
    ctx.fillRect(x - 4, y - 4, iconW + 8, iconH + 8);
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 4, y - 4, iconW + 8, iconH + 8);
  }

  // Khối hình icon 36x36 ở trên
  const ix = x + 18;
  const iy = y + 4;

  if (kind === 'COMPUTER') {
    // Màn hình CRT beige + Thùng case mini
    drawBevelBox(ctx, ix, iy, 36, 26, false, '#d8d2c5', 1);
    ctx.fillStyle = '#008080';
    ctx.fillRect(ix + 4, iy + 4, 28, 18);
    ctx.fillStyle = '#808080';
    ctx.fillRect(ix + 12, iy + 26, 12, 4);
    ctx.fillRect(ix + 6, iy + 30, 24, 4);
  } else if (kind === 'RECYCLE') {
    // Thùng rác xám với viền giấy trắng
    drawBevelBox(ctx, ix + 4, iy + 4, 28, 30, false, '#9ea3a8', 1);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(ix + 8, iy + 10, 5, 20);
    ctx.fillRect(ix + 16, iy + 10, 5, 20);
    ctx.fillRect(ix + 24, iy + 10, 5, 20);
  } else if (kind === 'PORTFOLIO') {
    // Viên kim cương / Khối 3D tím hồng đặc trưng đồ họa 3D
    ctx.fillStyle = '#6b3ba7';
    ctx.fillRect(ix + 4, iy + 4, 28, 28);
    drawBevelBox(ctx, ix + 4, iy + 4, 28, 28, false, '#8e4cd4', 1);
    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('3D', ix + 18, iy + 23);
  } else if (kind === 'DOS') {
    // Cửa sổ đen chữ C:\>
    ctx.fillStyle = '#000000';
    ctx.fillRect(ix + 2, iy + 4, 32, 28);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix + 2, iy + 4, 32, 28);
    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('C:\\>', ix + 5, iy + 20);
  } else if (kind === 'README') {
    // Trang giấy gấp góc + bút chì vàng
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix + 6, iy + 2, 24, 32);
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1;
    ctx.strokeRect(ix + 6, iy + 2, 24, 32);
    ctx.fillStyle = '#333333';
    ctx.fillRect(ix + 9, iy + 8, 14, 2);
    ctx.fillRect(ix + 9, iy + 14, 18, 2);
    ctx.fillRect(ix + 9, iy + 20, 16, 2);
    ctx.fillRect(ix + 9, iy + 26, 10, 2);
  } else if (kind === 'FLOPPY') {
    // Đĩa mềm xanh dương 3.5"
    ctx.fillStyle = '#1b3b72';
    ctx.fillRect(ix + 4, iy + 2, 28, 30);
    ctx.fillStyle = '#dfe6ec';
    ctx.fillRect(ix + 8, iy + 2, 14, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ix + 8, iy + 16, 20, 14);
  } else if (kind === 'CD') {
    // Đĩa CD tròn bạc óng ánh
    ctx.fillStyle = '#d0d8e0';
    ctx.beginPath();
    ctx.arc(ix + 18, iy + 18, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#008080';
    ctx.beginPath();
    ctx.arc(ix + 18, iy + 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nhãn chữ trắng bên dưới có bóng chữ đen
  ctx.font = '12px "IBM Plex Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText(label, x + iconW / 2 + 1, y + 54);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, x + iconW / 2, y + 53);
}

// =============================================================================
// CÁC MÀN HÌNH TRẠNG THÁI CHÍNH CỦA RETRO OS
// =============================================================================

/** 1. Màn hình tắt: Graphite Phosphor */
export function renderOffScreen(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#060809';
  ctx.fillRect(0, 0, 1024, 768);
}

/** 2. Màn hình Award Modular BIOS v4.51PG POST (0.0s -> 2.5s) */
export function renderBiosPostScreen(
  ctx: CanvasRenderingContext2D,
  bootElapsedTime: number,
  isResetting: boolean
) {
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, 1024, 768);

  // Logo Energy Star góc phải
  ctx.strokeStyle = '#ffb000';
  ctx.lineWidth = 3;
  ctx.strokeRect(700, 36, 280, 108);
  ctx.fillStyle = '#0000aa';
  ctx.fillRect(702, 38, 276, 104);
  ctx.fillStyle = '#ffdf66';
  ctx.font = 'italic bold 28px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('energy', 718, 76);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText('★ EPA POLLUTION', 718, 106);
  ctx.fillText('  PREVENTER', 718, 126);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText('Award Modular BIOS v4.51PG, An Energy Star Ally', 48, 64);
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#9ea3a8';
  ctx.fillText('Copyright (C) 1984-97, Award Software, Inc.', 48, 92);

  ctx.fillStyle = '#33ff33';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('ASUS TX97-E ACPI BIOS Revision 0112', 48, 142);

  ctx.fillStyle = '#ffffff';
  ctx.fillText('Main Processor : Intel Pentium(R) MMX(TM) 233MHz', 48, 196);

  // Đếm RAM tăng dần từ 0 đến 32768K trong 1.2s đầu
  const ramCount = Math.min(32768, Math.floor((bootElapsedTime / 1.2) * 32768));
  ctx.fillStyle = '#33ff33';
  ctx.fillText(`Memory Testing : ${ramCount}K ${ramCount >= 32768 ? 'OK' : '...'}`, 48, 232);

  if (bootElapsedTime > 0.8) {
    ctx.fillStyle = '#d8d2c5';
    ctx.font = '19px "IBM Plex Mono", monospace';
    ctx.fillText('Award Plug and Play BIOS Extension v1.0A', 48, 280);
    ctx.fillText('Detecting IDE Primary Master   ... QUANTUM FIREBALL ST 3.2A', 48, 316);
    ctx.fillText('Detecting IDE Primary Slave    ... None', 48, 344);
    ctx.fillText('Detecting IDE Secondary Master ... CREATIVE CD2420E 24X MX', 48, 372);
    ctx.fillText('Floppy Disk(s) Found           ... 1.44M, 3.5 in.', 48, 400);
  }

  if (bootElapsedTime > 1.4) {
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 436, 930, 92);
    ctx.fillStyle = '#121416';
    ctx.fillRect(48, 438, 926, 88);

    ctx.fillStyle = '#ffb000';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText('PCI SLOT 1 : 3DFX VOODOO GRAPHICS 4MB EDO 3D ACCELERATOR [IRQ 11]', 64, 472);
    ctx.fillText('ISA SLOT 1 : CREATIVE SOUND BLASTER 16 PnP CT2940        [PORT 220/IRQ 5]', 64, 504);
  }

  ctx.fillStyle = '#33ff33';
  ctx.font = 'bold 22px "VT323", "JetBrains Mono", monospace';
  ctx.fillText(
    isResetting ? 'HARDWARE RESET IN PROGRESS...' : 'C:\\> STARTING RETRO OS 98 (MMX EDITION)...',
    48,
    600
  );
  ctx.fillStyle = '#9ea3a8';
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText('Press [DEL] to enter BIOS Setup // Click CRT screen or buttons to interact', 48, 640);
}

/** 3. Màn hình Boot Logo Retro OS 98 (2.5s -> 4.0s) kèm thanh loading cuộn ngang */
export function renderBootLogoScreen(ctx: CanvasRenderingContext2D, bootElapsedTime: number) {
  // Nền đen phông nền Windows 98
  ctx.fillStyle = '#020305';
  ctx.fillRect(0, 0, 1024, 768);

  // Logo Windows 4 màu pixel ở giữa
  const cx = 512;
  const cy = 290;

  // Khối cờ uốn lượn 4 ô màu
  const fSize = 42;
  ctx.fillStyle = '#ff3333'; // Đỏ
  ctx.fillRect(cx - fSize - 4, cy - fSize - 4, fSize, fSize);
  ctx.fillStyle = '#33bb33'; // Xanh lá
  ctx.fillRect(cx + 4, cy - fSize - 4, fSize, fSize);
  ctx.fillStyle = '#0066cc'; // Xanh dương
  ctx.fillRect(cx - fSize - 4, cy + 4, fSize, fSize);
  ctx.fillStyle = '#ffcc00'; // Vàng
  ctx.fillRect(cx + 4, cy + 4, fSize, fSize);

  // Chữ Microsoft Windows 98
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 26px "IBM Plex Mono", sans-serif';
  ctx.fillText('Microsoft', cx, cy + 86);
  ctx.font = 'bold 54px "JetBrains Mono", sans-serif';
  ctx.fillText('Windows 98', cx, cy + 144);

  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#00d4ff';
  ctx.fillText('RETRO HARDWARE PORTFOLIO EDITION', cx, cy + 182);

  // Thanh Loading Bar chạy ngang đặc trưng của Windows 98 ở đáy
  const trackW = 420;
  const trackH = 20;
  const trackX = cx - trackW / 2;
  const trackY = 640;

  drawBevelBox(ctx, trackX, trackY, trackW, trackH, true, '#101418', 2);

  // 3 khối màu xanh dương chạy trượt liên tục từ trái sang phải
  const loadProg = ((bootElapsedTime - 2.5) * 1.8) % 1.0;
  const blockW = 28;
  const blockGap = 8;
  const totalGroupW = blockW * 3 + blockGap * 2;
  const startX = trackX + 3 + loadProg * (trackW - 6);

  ctx.save();
  ctx.beginPath();
  ctx.rect(trackX + 2, trackY + 2, trackW - 4, trackH - 4);
  ctx.clip();

  for (let i = 0; i < 3; i++) {
    const bx = startX + i * (blockW + blockGap);
    const grad = ctx.createLinearGradient(bx, trackY, bx, trackY + trackH);
    grad.addColorStop(0, '#58a4ff');
    grad.addColorStop(0.5, '#0055d4');
    grad.addColorStop(1, '#00266b');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, trackY + 3, blockW, trackH - 6);

    // Bọc lại nếu trôi ra ngoài
    const bxWrapped = bx - (trackW - 6 + totalGroupW);
    ctx.fillRect(bxWrapped, trackY + 3, blockW, trackH - 6);
  }
  ctx.restore();
}

/** 4. Màn hình Đăng nhập (LOGIN_SCREEN - USER: vinzboiz) */
export function renderLoginScreen(
  ctx: CanvasRenderingContext2D,
  hoveredPos: { x: number; y: number } | null
) {
  // Nền xanh cổ vịt huyền thoại Windows 95
  ctx.fillStyle = '#008080';
  ctx.fillRect(0, 0, 1024, 768);

  // Hộp thoại Windows 95 Welcome Dialog
  const dlgX = 240;
  const dlgY = 190;
  const dlgW = 544;
  const dlgH = 320;

  drawBevelBox(ctx, dlgX, dlgY, dlgW, dlgH, false, '#c0c0c0', 3);
  drawTitleBar(ctx, dlgX + 3, dlgY + 3, dlgW - 6, 'Welcome to Windows', true, '🔑');

  // Avatar pixel art của vinzboiz bên trái
  const avaX = dlgX + 28;
  const avaY = dlgY + 54;
  const avaSize = 100;
  drawBevelBox(ctx, avaX, avaY, avaSize, avaSize, true, '#1a1a1a', 2);
  drawVinzboizPixelAvatar(ctx, avaX + 11, avaY + 11, 4.8);

  // Dòng chữ hướng dẫn
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
  ctx.fillText('Type a user name and password to log on to Windows.', dlgX + 144, dlgY + 68);

  // Ô nhập User name: vinzboiz
  ctx.font = 'bold 14px "IBM Plex Mono", sans-serif';
  ctx.fillText('User name:', dlgX + 144, dlgY + 118);
  drawBevelBox(ctx, dlgX + 248, dlgY + 100, 170, 28, true, '#ffffff', 2);
  ctx.fillStyle = '#000080';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.fillText('vinzboiz', dlgX + 256, dlgY + 119);

  // Ô nhập Password: ********
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px "IBM Plex Mono", sans-serif';
  ctx.fillText('Password:', dlgX + 144, dlgY + 164);
  drawBevelBox(ctx, dlgX + 248, dlgY + 146, 170, 28, true, '#ffffff', 2);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.fillText('●●●●●●●●', dlgX + 256, dlgY + 166);

  // Nút bấm [ OK / LOGIN ]
  const okBtnX = dlgX + 434;
  const okBtnY = dlgY + 100;
  const okBtnW = 92;
  const okBtnH = 32;

  const isOkHovered = Boolean(
    hoveredPos &&
      hoveredPos.x >= okBtnX &&
      hoveredPos.x <= okBtnX + okBtnW &&
      hoveredPos.y >= okBtnY &&
      hoveredPos.y <= okBtnY + okBtnH
  );

  drawBevelBox(ctx, okBtnX, okBtnY, okBtnW, okBtnH, isOkHovered, isOkHovered ? '#d8d8d8' : '#c0c0c0', 2);
  // Khung đen nổi bật của nút mặc định
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(okBtnX + 1, okBtnY + 1, okBtnW - 2, okBtnH - 2);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OK', okBtnX + okBtnW / 2, okBtnY + 21);

  // Nút [ Cancel ]
  const cancelBtnX = dlgX + 434;
  const cancelBtnY = dlgY + 146;
  drawBevelBox(ctx, cancelBtnX, cancelBtnY, okBtnW, okBtnH, false, '#c0c0c0', 2);
  ctx.fillText('Cancel', cancelBtnX + okBtnW / 2, cancelBtnY + 21);

  // Dòng gợi ý click ở đáy hộp thoại
  ctx.fillStyle = '#555555';
  ctx.font = 'italic 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    '👉 Click directly on [ OK ] button on the CRT screen to start session',
    dlgX + dlgW / 2,
    dlgY + dlgH - 24
  );
}

/** 5. Màn hình Desktop chính & Cửa sổ ứng dụng (DESKTOP) */
export function renderDesktopScreen(
  ctx: CanvasRenderingContext2D,
  state: CrtOsRenderState,
  hoveredPos: { x: number; y: number } | null
) {
  // Hình nền xanh cổ vịt Teal (#008080)
  ctx.fillStyle = '#008080';
  ctx.fillRect(0, 0, 1024, 768);

  // ===========================================================================
  // CÁC ICON TRÊN MÀN HÌNH DESKTOP (TUÂN THỦ QUY TẮC HIỂN THỊ PHẦN CỨNG 1997)
  // ===========================================================================
  // 4 Icon hệ thống mặc định (luôn hiển thị)
  drawDesktopIcon(ctx, 24, 24, 'COMPUTER', 'My Computer');
  drawDesktopIcon(ctx, 24, 116, 'RECYCLE', 'Recycle Bin');
  drawDesktopIcon(ctx, 24, 208, 'DOS', 'MS-DOS Prompt');
  drawDesktopIcon(ctx, 24, 300, 'README', 'Readme.txt');

  // Khi ĐÃ cắm Thẻ nhớ vào máy (cardLocation === 'INSERTED'):
  // Lập tức xuất hiện icon VINZBOIZ_CV.DOC trên Desktop
  if (state.cardLocation === 'INSERTED') {
    drawDesktopIcon(ctx, 24, 392, 'FLOPPY', 'VINZBOIZ_CV.DOC');
  }

  // Khi ĐÃ nạp Đĩa CD vào trong ổ (cdLocation === 'INSIDE'):
  // Lập tức xuất hiện icon PROJECTS_98.EXE trên Desktop
  if (state.cdLocation === 'INSIDE') {
    drawDesktopIcon(ctx, 24, 484, 'CD', 'PROJECTS_98.EXE');
  }

  // ===========================================================================
  // VẼ CÁC CỬA SỔ ĐANG MỞ (WINDOWS SYSTEM)
  // ===========================================================================
  // Vẽ các cửa sổ theo thứ tự; activeWindow vẽ cuối cùng (ở trên cùng)
  const sortedWindows = [...state.openWindows].sort((a, b) => {
    if (a === state.activeWindow) return 1;
    if (b === state.activeWindow) return -1;
    return 0;
  });

  for (const winId of sortedWindows) {
    const isActive = winId === state.activeWindow;

    if (winId === 'WORDPAD_CV') {
      // Cửa sổ WordPad đọc CV từ đĩa mềm (A:)
      const wx = 160;
      const wy = 56;
      const ww = 700;
      const wh = 620;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(ctx, wx + 3, wy + 3, ww - 6, 'A:\\VINZBOIZ_CV.DOC - WordPad', isActive, '📄');

      // Thanh Menu chuẩn WordPad
      ctx.fillStyle = '#000000';
      ctx.font = '13px "IBM Plex Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('File   Edit   View   Insert   Format   Help', wx + 12, wy + 42);

      // Nút Download PDF to Host PC nổi bật
      const dlBtnX = wx + 380;
      const dlBtnY = wy + 32;
      const dlBtnW = 280;
      const dlBtnH = 28;
      const isDlHovered = Boolean(
        hoveredPos &&
          hoveredPos.x >= dlBtnX &&
          hoveredPos.x <= dlBtnX + dlBtnW &&
          hoveredPos.y >= dlBtnY &&
          hoveredPos.y <= dlBtnY + dlBtnH
      );

      drawBevelBox(ctx, dlBtnX, dlBtnY, dlBtnW, dlBtnH, isDlHovered, isDlHovered ? '#c8eec8' : '#e0f4e0', 2);
      ctx.fillStyle = '#005500';
      ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💾 [ DOWNLOAD CV TO HOST PC ]', dlBtnX + dlBtnW / 2, dlBtnY + 18);

      // Thước căn lề WordPad
      drawBevelBox(ctx, wx + 8, wy + 68, ww - 16, 18, true, '#e8e8e8', 1);
      ctx.fillStyle = '#555555';
      ctx.font = '10px monospace';
      ctx.fillText('···|···1···|···2···|···3···|···4···|···5···|···6···|···7···|···8', wx + 16, wy + 81);

      // Khung tài liệu trắng bên trong
      const docX = wx + 8;
      const docY = wy + 90;
      const docW = ww - 16;
      const docH = wh - 98;
      drawBevelBox(ctx, docX, docY, docW, docH, true, '#ffffff', 2);

      // Nội dung CV / Resume của vinzboiz
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 20px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('VINZBOIZ - SENIOR CREATIVE TECHNOLOGIST & WEBGL ENGINEER', docX + 20, docY + 34);

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 13px "IBM Plex Mono", sans-serif';
      ctx.fillText('Role: Lead 3D Web Graphics Architect // Spec: 100% Procedural Three.js', docX + 20, docY + 58);

      ctx.strokeStyle = '#000080';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(docX + 20, docY + 68);
      ctx.lineTo(docX + docW - 20, docY + 68);
      ctx.stroke();

      const lines = [
        '★ CORE CAPABILITIES:',
        '  • 100% Procedural 3D WebGL (Three.js / React Three Fiber / No External Models).',
        '  • Custom GLSL CRT Shaders, Aperture Grille, Scanlines, Degauss Magnetic Wobble.',
        '  • Real-time Procedural Audio Engine (Web Audio API / Howler mechanical synthesis).',
        '  • Performance Mastery: Zero allocations in render loops, Instancing, 60 FPS strict.',
        '',
        '★ NOTABLE SYSTEMS ARCHITECTURE:',
        '  • Retro 1997 PC Workstation (ASUS TX97-E / Pentium MMX / Trinitron CPD-100ES).',
        '  • Direct 3D Screen Raycasting & UV Interaction Engine.',
        '  • Decoupled PC State Timeline & CRT Monitor Power Physics.',
        '',
        '★ CONTACT & REPOSITORY:',
        '  • GitHub: https://github.com/vinzboiz',
        '  • Location: Ho Chi Minh City, Vietnam // Status: Ready for High-Impact Roles.',
      ];

      ctx.fillStyle = '#111111';
      ctx.font = '13px "JetBrains Mono", monospace';
      lines.forEach((l, i) => {
        if (l.startsWith('★')) {
          ctx.fillStyle = '#000080';
          ctx.font = 'bold 13px "JetBrains Mono", monospace';
        } else {
          ctx.fillStyle = '#222222';
          ctx.font = '12px "JetBrains Mono", monospace';
        }
        ctx.fillText(l, docX + 20, docY + 98 + i * 22);
      });
    } else if (winId === 'AUTORUN') {
      // Cửa sổ ứng dụng My Projects (D:\) từ đĩa CD Creative 24X
      const wx = 130;
      const wy = 42;
      const ww = 764;
      const wh = 650;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(
        ctx,
        wx + 3,
        wy + 3,
        ww - 6,
        'My Projects (D:\\) - VINZBOIZ INTERACTIVE ARCHIVE',
        isActive,
        '💿'
      );

      // Thân cửa sổ đa phương tiện màu xanh thẫm
      const bodyX = wx + 8;
      const bodyY = wy + 32;
      const bodyW = ww - 16;
      const bodyH = wh - 40;
      drawBevelBox(ctx, bodyX, bodyY, bodyW, bodyH, true, '#0b1320', 2);

      // Banner tiêu đề CD-ROM Multimedia
      const grad = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyW, bodyY);
      grad.addColorStop(0, '#10223c');
      grad.addColorStop(0.5, '#224472');
      grad.addColorStop(1, '#10223c');
      ctx.fillStyle = grad;
      ctx.fillRect(bodyX + 4, bodyY + 4, bodyW - 8, 72);

      // Icon đĩa CD xoay nhẹ phong cách Retro
      const cdCenterX = bodyX + 44;
      const cdCenterY = bodyY + 40;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cdCenterX, cdCenterY, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#c5ccd4';
      ctx.fill();
      ctx.strokeStyle = '#3a5070';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cdCenterX, cdCenterY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#10223c';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffdf66';
      ctx.font = 'bold 20px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('VINZBOIZ INTERACTIVE ARCHIVE DISC (650MB)', bodyX + 82, bodyY + 34);

      ctx.fillStyle = '#a0bce0';
      ctx.font = 'bold 12px "IBM Plex Mono", monospace';
      ctx.fillText('5 PRODUCTION SYSTEMS · GLSL 3D ENGINES · HIGH-CONCURRENCY ARCHITECTURES', bodyX + 82, bodyY + 56);

      // 5 Dòng dự án tóm tắt
      const projects = [
        { id: '01', title: '3D DIGITAL TWIN · MES FACTORY', stack: 'WebGL 2.0 · MQTT · Three.js · SCADA Telemetry' },
        { id: '02', title: 'SERVERLESS OFFICE · ORDER HUB', stack: 'Next.js 14 · Cloudflare Workers · ESC/POS Print' },
        { id: '03', title: 'MINIMALIST 3D · ROASTERY SHOWCASE', stack: 'PBR Shaders · Spatial ASMR Audio · ArchViz' },
        { id: '04', title: 'THUNGPHIM · STREAMING ARCHITECTURE', stack: 'HLS Adaptive Playback · OAuth2 · Redis Cache' },
        { id: '05', title: 'NEURAL QUANT · SIGNAL ENGINE', stack: 'XGBoost · Rust PyO3 · Vectorized Backtesting' },
      ];

      projects.forEach((proj, idx) => {
        const ry = bodyY + 86 + idx * 80;
        const rw = bodyW - 24;
        const rh = 70;
        drawBevelBox(ctx, bodyX + 12, ry, rw, rh, false, '#141e2e', 1);

        // Số thứ tự
        ctx.fillStyle = '#ff6b4a';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText(`[${proj.id}]`, bodyX + 24, ry + 28);

        // Tên dự án
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
        ctx.fillText(proj.title, bodyX + 70, ry + 28);

        // Tech stack
        ctx.fillStyle = '#33ff33';
        ctx.font = '12px "IBM Plex Mono", monospace';
        ctx.fillText(`STACK: ${proj.stack}`, bodyX + 70, ry + 52);
      });

      // Nút bấm lớn nổi bật [ VIEW ] ở dưới cùng
      const btnW = 440;
      const btnH = 50;
      const btnX = bodyX + Math.round((bodyW - btnW) / 2);
      const btnY = bodyY + bodyH - 66;

      const hx = state.hoveredCanvasPos?.x ?? -1;
      const hy = state.hoveredCanvasPos?.y ?? -1;
      const isViewHovered = hx >= btnX && hx <= btnX + btnW && hy >= btnY && hy <= btnY + btnH;

      drawBevelBox(
        ctx,
        btnX,
        btnY,
        btnW,
        btnH,
        isViewHovered,
        isViewHovered ? '#0040aa' : '#002674',
        3
      );

      ctx.fillStyle = isViewHovered ? '#33ff33' : '#ffffff';
      ctx.font = 'bold 18px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▶ [ VIEW ] ENTER 3D FLY-THROUGH SHOWCASE', btnX + btnW / 2, btnY + 31);
    } else if (winId === 'THIS_PC') {
      // Cửa sổ My Computer
      const wx = 210;
      const wy = 110;
      const ww = 600;
      const wh = 440;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(ctx, wx + 3, wy + 3, ww - 6, 'My Computer', isActive, '💻');

      // Vùng ổ đĩa trắng bên trong
      const bodyX = wx + 8;
      const bodyY = wy + 32;
      const bodyW = ww - 16;
      const bodyH = wh - 40;
      drawBevelBox(ctx, bodyX, bodyY, bodyW, bodyH, true, '#ffffff', 2);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px "IBM Plex Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Select an item to view its description and contents:', bodyX + 16, bodyY + 30);

      // 3 Ổ đĩa: A:, C:, D:
      drawDesktopIcon(
        ctx,
        bodyX + 36,
        bodyY + 60,
        'FLOPPY',
        state.cardLocation === 'INSERTED' ? '3½ Card (A:) [1.44 MB Ready]' : '3½ Card (A:) [Empty]'
      );
      drawDesktopIcon(ctx, bodyX + 220, bodyY + 60, 'COMPUTER', 'Quantum 3.2GB (C:)');
      drawDesktopIcon(
        ctx,
        bodyX + 400,
        bodyY + 60,
        'CD',
        state.cdLocation === 'INSIDE' ? 'PORTFOLIO_CD (D:) [650MB]' : 'Creative 24X (D:) [Empty]'
      );

      ctx.fillStyle = '#555555';
      ctx.font = 'italic 13px "JetBrains Mono", monospace';
      ctx.fillText('💡 Double click/click on (A:) or (D:) to open drive contents directly', bodyX + 16, bodyY + 360);
    } else if (winId === 'RECYCLE_BIN') {
      // Cửa sổ Thùng rác
      const wx = 230;
      const wy = 120;
      const ww = 560;
      const wh = 420;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(ctx, wx + 3, wy + 3, ww - 6, 'Recycle Bin', isActive, '🗑');

      const bodyX = wx + 8;
      const bodyY = wy + 32;
      const bodyW = ww - 16;
      const bodyH = wh - 40;
      drawBevelBox(ctx, bodyX, bodyY, bodyW, bodyH, true, '#ffffff', 2);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('NAME                           ORIGINAL LOCATION   DELETED DATE', bodyX + 16, bodyY + 28);
      ctx.fillRect(bodyX + 16, bodyY + 34, bodyW - 32, 1);

      const items = [
        'old_angular_project_1998.zip    C:\\PROJECTS\\PETS   Yesterday 11:20 PM',
        'broken_threejs_experiment.js    C:\\TEMP\\TESTS      Today 02:15 AM',
        'coffee_mug_overflow.log         C:\\WINDOWS\\SYSTEM   Just now',
        'unused_external_3d_model.glb    C:\\DOWNLOADS\\TRASH  11-08-97 (BANNED)',
      ];

      items.forEach((it, i) => {
        ctx.fillStyle = '#333333';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(it, bodyX + 16, bodyY + 62 + i * 26);
      });
    } else if (winId === 'MSDOS') {
      // Cửa sổ MS-DOS Prompt
      const wx = 180;
      const wy = 80;
      const ww = 660;
      const wh = 500;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(ctx, wx + 3, wy + 3, ww - 6, 'MS-DOS Prompt - C:\\VINZBOIZ>', isActive, '⬛');

      const bodyX = wx + 8;
      const bodyY = wy + 32;
      const bodyW = ww - 16;
      const bodyH = wh - 40;
      ctx.fillStyle = '#000000';
      ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

      const dosLines = [
        'Microsoft(R) Windows 98',
        '  (C)Copyright Microsoft Corp 1981-1998.',
        '',
        'C:\\VINZBOIZ> dir',
        ' Volume in drive C is QUANTUM_HD',
        ' Directory of C:\\VINZBOIZ',
        '',
        'RESUME   DOC         1,440  11-08-97  3:24p',
        'PORTFOL  EXE       650,000  11-08-97  4:12p',
        'SKILLS   TXT         4,096  11-08-97  1:05p',
        'README   TXT         2,048  11-08-97  9:00a',
        '        4 file(s)        657,584 bytes',
        '        2 dir(s)   2,148,000,000 bytes free',
        '',
        'C:\\VINZBOIZ> type SKILLS.TXT',
        '[CORE]: TypeScript, React, Three.js, R3F, WebGL, GLSL, Node.js',
        '[ARCH]: Procedural Generation, Performance Optimization, 60 FPS',
        'C:\\VINZBOIZ> _',
      ];

      ctx.fillStyle = '#33ff33';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      dosLines.forEach((l, i) => {
        ctx.fillText(l, bodyX + 16, bodyY + 28 + i * 22);
      });
    } else if (winId === 'README') {
      // Cửa sổ Readme.txt Notepad
      const wx = 240;
      const wy = 100;
      const ww = 560;
      const wh = 460;

      drawBevelBox(ctx, wx, wy, ww, wh, false, '#c0c0c0', 3);
      drawTitleBar(ctx, wx + 3, wy + 3, ww - 6, 'README.TXT - Notepad', isActive, '📝');

      ctx.fillStyle = '#000000';
      ctx.font = '13px "IBM Plex Mono", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('File   Edit   Search   Help', wx + 12, wy + 42);

      const bodyX = wx + 8;
      const bodyY = wy + 48;
      const bodyW = ww - 16;
      const bodyH = wh - 56;
      drawBevelBox(ctx, bodyX, bodyY, bodyW, bodyH, true, '#ffffff', 2);

      const readmeLines = [
        '========================================================',
        'VINZBOIZ - CREATIVE TECHNOLOGIST & SENIOR WEBGL ENGINEER',
        '========================================================',
        '',
        'Passionate about handcrafted 3D procedural experiences,',
        'real-time computer graphics, and retro computing aesthetics.',
        '',
        '• Portfolio: 100% Procedural Three.js (No External GLB)',
        '• Philosophy: Pure Code, Maximum Performance, Rich Storytelling',
        '• GitHub: https://github.com/vinzboiz',
        '',
        'Feel free to explore the computer, insert floppy disks,',
        'eject the CD-ROM tray, or switch the 115V/230V PSU selector!',
        '========================================================',
      ];

      ctx.fillStyle = '#111111';
      ctx.font = '12px "JetBrains Mono", monospace';
      readmeLines.forEach((l, i) => {
        ctx.fillText(l, bodyX + 16, bodyY + 26 + i * 22);
      });
    }
  }

  // ===========================================================================
  // THANH TASKBAR DƯỚI ĐÁY MÀN HÌNH (WINDOWS 95/98 TASKBAR)
  // ===========================================================================
  const tbY = 730;
  const tbH = 38;
  drawBevelBox(ctx, 0, tbY, 1024, tbH, false, '#c0c0c0', 2);

  // Nút [Start] ở góc trái
  const startBtnX = 4;
  const startBtnY = tbY + 4;
  const startBtnW = 86;
  const startBtnH = 30;
  drawBevelBox(ctx, startBtnX, startBtnY, startBtnW, startBtnH, false, '#c0c0c0', 2);

  // Cờ Windows 4 màu mini trên nút Start
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(startBtnX + 8, startBtnY + 8, 6, 6);
  ctx.fillStyle = '#33bb33';
  ctx.fillRect(startBtnX + 15, startBtnY + 8, 6, 6);
  ctx.fillStyle = '#0066cc';
  ctx.fillRect(startBtnX + 8, startBtnY + 15, 6, 6);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(startBtnX + 15, startBtnY + 15, 6, 6);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px "JetBrains Mono", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Start', startBtnX + 26, startBtnY + 20);

  // Các nút Taskbar đại diện cho các cửa sổ đang mở
  let taskX = startBtnX + startBtnW + 8;
  for (const winId of state.openWindows) {
    const isAct = winId === state.activeWindow;
    const itemW = 160;
    drawBevelBox(ctx, taskX, tbY + 4, itemW, startBtnH, isAct, isAct ? '#d8d8d8' : '#c0c0c0', 2);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'left';
    const label =
      winId === 'WORDPAD_CV'
        ? '📄 WordPad - CV'
        : winId === 'AUTORUN'
          ? '💿 My Projects (D:)'
          : winId === 'THIS_PC'
            ? '💻 My Computer'
            : winId === 'RECYCLE_BIN'
              ? '🗑 Recycle Bin'
              : winId === 'MSDOS'
                ? '⬛ MS-DOS'
                : '📝 Readme';
    ctx.fillText(label, taskX + 8, tbY + 23);
    taskX += itemW + 4;
  }

  // Khay đồng hồ hệ thống (System Tray) bên phải
  const trayW = 110;
  const trayX = 1024 - trayW - 6;
  drawBevelBox(ctx, trayX, tbY + 4, trayW, startBtnH, true, '#c0c0c0', 2);

  // Icon loa mini
  ctx.fillStyle = '#000000';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🔊', trayX + 8, tbY + 23);

  // Đồng hồ thực tế
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.fillText(timeStr, trayX + 34, tbY + 23);
}

// =============================================================================
// THANH MỨC OSD XANH LÁ & BẢNG SONY TRINITRON OSD MENU
// =============================================================================

export function renderSonyOsdOverlays(ctx: CanvasRenderingContext2D, state: CrtOsRenderState) {
  // 1. BẢNG HỘP THOẠI SONY TRINITRON OSD MENU (KHI BẤM NÚT MENU TRÊN CỤM OSD)
  if (state.crtOsdOpen) {
    ctx.save();
    ctx.fillStyle = '#0000aa';
    ctx.fillRect(262, 160, 500, 390);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(260, 158, 504, 394);
    ctx.strokeStyle = '#000055';
    ctx.lineWidth = 3;
    ctx.strokeRect(264, 162, 496, 386);

    ctx.fillStyle = '#ffdf66';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SONY TRINITRON MULTISCAN 100ES', 512, 204);

    ctx.strokeStyle = '#ffdf66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(280, 222);
    ctx.lineTo(744, 222);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = 'bold 19px "JetBrains Mono", monospace';

    const menuItems = [
      { label: 'BRIGHTNESS', val: `${Math.round(state.crtBrightness * 100)}%` },
      { label: 'CONTRAST', val: `${Math.round(state.crtContrast * 100)}%` },
      { label: 'H-SIZE (GEOMETRY)', val: `${Math.round(state.crtScale * 100)}%` },
      {
        label: 'H-CENTER (POSITION)',
        val: `${state.crtHOffset >= 0 ? '+' : ''}${Math.round(state.crtHOffset * 100)} mm`,
      },
      {
        label: 'V-CENTER (POSITION)',
        val: `${state.crtVOffset >= 0 ? '+' : ''}${Math.round(state.crtVOffset * 100)} mm`,
      },
      { label: 'DEGAUSS COIL', val: 'STANDBY (PRESS DEGAUSS)' },
      { label: 'PRESET COLOR', val: '9300K / D65 BROADCAST' },
    ];

    menuItems.forEach((item, idx) => {
      const y = 260 + idx * 36;
      ctx.fillStyle = '#d8d2c5';
      ctx.fillText(item.label, 290, y);
      ctx.fillStyle = '#33ff33';
      ctx.fillText(item.val, 550, y);
    });

    ctx.fillStyle = '#ffb000';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS [MENU] BUTTON TO CLOSE', 512, 526);
    ctx.restore();
  }

  // 2. THANH MỨC ĐỘ OSD MÀU XANH LÁ (HIỆN TRONG 2 GIÂY KHI BẤM PHÍM ĐIỀU CHỈNH)
  if (state.crtOsdFlash && performance.now() - state.crtOsdFlash.at < 2000) {
    ctx.save();
    const flashKind = state.crtOsdFlash.kind;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(280, 608, 464, 72);
    ctx.strokeStyle = '#33ff33';
    ctx.lineWidth = 3;
    ctx.strokeRect(280, 608, 464, 72);

    ctx.fillStyle = '#33ff33';
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    if (flashKind === 'BRIGHTNESS') {
      const bars = Math.round(((state.crtBrightness - 0.5) / 1.0) * 20);
      ctx.fillText(
        `BRIGHTNESS: [${'|'.repeat(bars)}${'·'.repeat(Math.max(0, 20 - bars))}] ${Math.round(state.crtBrightness * 100)}%`,
        512,
        652
      );
    } else if (flashKind === 'CONTRAST') {
      const bars = Math.round(((state.crtContrast - 0.5) / 1.0) * 20);
      ctx.fillText(
        `CONTRAST:   [${'|'.repeat(bars)}${'·'.repeat(Math.max(0, 20 - bars))}] ${Math.round(state.crtContrast * 100)}%`,
        512,
        652
      );
    } else if (flashKind === 'SIZE') {
      ctx.fillText(`GEOMETRY H-SIZE: ${Math.round(state.crtScale * 100)}%`, 512, 652);
    } else if (flashKind === 'CENTER') {
      ctx.fillText(
        `CENTER H:${state.crtHOffset >= 0 ? '+' : ''}${Math.round(state.crtHOffset * 100)} / V:${state.crtVOffset >= 0 ? '+' : ''}${Math.round(state.crtVOffset * 100)}`,
        512,
        652
      );
    } else if (flashKind === 'DEGAUSS') {
      ctx.fillText('★ DEGAUSSING COIL ACTIVE ★', 512, 652);
    }
    ctx.restore();
  }

  // ===========================================================================
  // HỘP THOẠI CẢNH BÁO LỖI MODAL CHUẨN WINDOWS 95 (state.osDialogAlert)
  // ===========================================================================
  if (state.osDialogAlert) {
    const dw = 450;
    const dh = 180;
    const dx = Math.round((1024 - dw) / 2);
    const dy = Math.round((768 - dh) / 2);

    // Nền xám Bevel 3D nhô lên
    drawBevelBox(ctx, dx, dy, dw, dh, false, '#c0c0c0', 3);
    drawTitleBar(ctx, dx + 3, dy + 3, dw - 6, 'Drive Error', true, '⚠️');

    // Icon lỗi hình tròn đỏ với chữ X trắng
    const iconX = dx + 26;
    const iconY = dy + 52;
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(iconX + 18, iconY + 18, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', iconX + 18, iconY + 26);

    // Nội dung cảnh báo lỗi
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const lines = state.osDialogAlert.split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, dx + 76, dy + 62 + idx * 22);
    });

    // Nút [ OK ]
    const btnW = 90;
    const btnH = 28;
    const btnX = dx + Math.round((dw - btnW) / 2);
    const btnY = dy + dh - 42;
    const isBtnHovered = Boolean(
      state.hoveredCanvasPos &&
        state.hoveredCanvasPos.x >= btnX &&
        state.hoveredCanvasPos.x <= btnX + btnW &&
        state.hoveredCanvasPos.y >= btnY &&
        state.hoveredCanvasPos.y <= btnY + btnH
    );
    drawBevelBox(ctx, btnX, btnY, btnW, btnH, isBtnHovered, '#c0c0c0', 2);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 13px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OK', btnX + btnW / 2, btnY + 19);
  }
}

// =============================================================================
// ĐIỀU HƯỚNG TƯƠNG TÁC CHUỘT (CLICK & HOVER RAYCASTING TRÊN MẶT KÍNH CRT)
// =============================================================================

export function getCrtScreenHoverInfo(
  x: number,
  y: number,
  state: CrtOsRenderState
): { isPointer: boolean; label: string | null } {
  if (
    !state.isPoweredOn ||
    !state.isCrtPowered ||
    (state.projectAppTransition && state.projectAppTransition !== 'IDLE')
  ) {
    return { isPointer: false, label: null };
  }

  // 0. Khi có hộp thoại cảnh báo lỗi Modal Windows 95
  if (state.osDialogAlert) {
    const dw = 450;
    const dh = 180;
    const dx = Math.round((1024 - dw) / 2);
    const dy = Math.round((768 - dh) / 2);
    if (x >= dx && x <= dx + dw && y >= dy && y <= dy + dh) {
      return { isPointer: true, label: '[CRT OS] DISMISS DRIVE ERROR [OK]' };
    }
  }

  // 1. Khi ở Login Screen
  if (state.osState === 'LOGIN_SCREEN') {
    const okBtnX = 240 + 434;
    const okBtnY = 190 + 100;
    if (x >= okBtnX && x <= okBtnX + 92 && y >= okBtnY && y <= okBtnY + 32) {
      return { isPointer: true, label: '[CRT OS] CLICK TO LOG IN AS vinzboiz' };
    }
    if (x >= 240 && x <= 240 + 544 && y >= 190 && y <= 190 + 320) {
      return { isPointer: true, label: '[CRT OS] WELCOME TO WINDOWS (CLICK TO LOG IN)' };
    }
  }

  // 2. Khi ở Desktop
  if (state.osState === 'DESKTOP') {
    // A. Kiểm tra nút [X] của cửa sổ active
    if (state.activeWindow) {
      const winId = state.activeWindow;
      let closeX = 0;
      let closeY = 0;

      if (winId === 'WORDPAD_CV') {
        closeX = 160 + 700 - 24;
        closeY = 56 + 3;
      } else if (winId === 'AUTORUN') {
        closeX = 130 + 764 - 24;
        closeY = 42 + 3;
      } else if (winId === 'THIS_PC') {
        closeX = 210 + 600 - 24;
        closeY = 110 + 3;
      } else if (winId === 'RECYCLE_BIN') {
        closeX = 230 + 560 - 24;
        closeY = 120 + 3;
      } else if (winId === 'MSDOS') {
        closeX = 180 + 660 - 24;
        closeY = 80 + 3;
      } else if (winId === 'README') {
        closeX = 240 + 560 - 24;
        closeY = 100 + 3;
      }

      if (x >= closeX && x <= closeX + 20 && y >= closeY && y <= closeY + 20) {
        return { isPointer: true, label: '[CRT OS] CLOSE WINDOW [X]' };
      }

      // Nút Download trong WordPad
      if (winId === 'WORDPAD_CV') {
        const dlX = 160 + 380;
        const dlY = 56 + 32;
        if (x >= dlX && x <= dlX + 280 && y >= dlY && y <= dlY + 28) {
          return { isPointer: true, label: '[CRT OS] 💾 DOWNLOAD VINZBOIZ CV TO HOST PC' };
        }
      }

      // Nút [ VIEW ] trong My Projects (AUTORUN)
      if (winId === 'AUTORUN') {
        const btnX = 292;
        const btnY = 618;
        const btnW = 440;
        const btnH = 50;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          return { isPointer: true, label: '[CRT OS] ▶ [ VIEW ] ENTER 3D FLY-THROUGH SHOWCASE' };
        }
      }

      // Các ổ đĩa trong My Computer
      if (winId === 'THIS_PC') {
        const bodyX = 210 + 8;
        const bodyY = 110 + 32;
        if (x >= bodyX + 36 && x <= bodyX + 116 && y >= bodyY + 60 && y <= bodyY + 140) {
          return {
            isPointer: true,
            label:
              state.cardLocation === 'INSERTED'
                ? '[CRT OS] OPEN DRIVE (A:) CARD [1.44 MB READY]'
                : '[CRT OS] DRIVE (A:) CARD [EMPTY - CLICK TO INSPECT]',
          };
        }
        if (x >= bodyX + 220 && x <= bodyX + 300 && y >= bodyY + 60 && y <= bodyY + 140) {
          return { isPointer: true, label: '[CRT OS] OPEN DRIVE (C:) QUANTUM 3.2GB' };
        }
        if (x >= bodyX + 400 && x <= bodyX + 480 && y >= bodyY + 60 && y <= bodyY + 140) {
          return {
            isPointer: true,
            label:
              state.cdLocation === 'INSIDE'
                ? '[CRT OS] OPEN PORTFOLIO_CD (D:) [650MB]'
                : '[CRT OS] DRIVE (D:) CD-ROM [EMPTY - CLICK TO INSPECT]',
          };
        }
      }
    }

    // B. Kiểm tra Desktop Icons (chỉ những icon được phép hiển thị)
    if (x >= 24 && x <= 96) {
      if (y >= 24 && y <= 100) return { isPointer: true, label: '[CRT OS] OPEN MY COMPUTER' };
      if (y >= 116 && y <= 192) return { isPointer: true, label: '[CRT OS] OPEN RECYCLE BIN' };
      if (y >= 208 && y <= 284) return { isPointer: true, label: '[CRT OS] OPEN MS-DOS PROMPT' };
      if (y >= 300 && y <= 376) return { isPointer: true, label: '[CRT OS] OPEN README.TXT' };
      if (state.cardLocation === 'INSERTED' && y >= 392 && y <= 468) {
        return { isPointer: true, label: '[CRT OS] OPEN VINZBOIZ_CV.DOC' };
      }
      if (state.cdLocation === 'INSIDE' && y >= 484 && y <= 560) {
        return { isPointer: true, label: '[CRT OS] RUN PROJECTS_98.EXE (AUTORUN)' };
      }
    }

    // C. Taskbar
    if (y >= 730) {
      if (x >= 4 && x <= 90) return { isPointer: true, label: '[CRT OS] WINDOWS START MENU' };
      return { isPointer: true, label: '[CRT OS] TASKBAR & SYSTEM TRAY' };
    }
  }

  return { isPointer: false, label: null };
}

export function handleCrtScreenClick(
  x: number,
  y: number,
  state: CrtOsRenderState,
  actions: CrtOsActions
) {
  if (
    !state.isPoweredOn ||
    !state.isCrtPowered ||
    (state.projectAppTransition && state.projectAppTransition !== 'IDLE')
  ) {
    return;
  }

  // 0. Nếu đang có hộp thoại cảnh báo lỗi Windows 95: click bất kỳ đâu để đóng
  if (state.osDialogAlert) {
    actions.dismissOsDialogAlert();
    return;
  }

  // 1. Nếu đang ở màn hình đăng nhập: click [ OK ] -> Đăng nhập vào Desktop
  if (state.osState === 'LOGIN_SCREEN') {
    actions.loginDesktop();
    return;
  }

  // 2. Nếu đang ở Desktop
  if (state.osState === 'DESKTOP') {
    // A. Kiểm tra nút [X] đóng cửa sổ active
    if (state.activeWindow) {
      const winId = state.activeWindow;
      let closeX = 0;
      let closeY = 0;

      if (winId === 'WORDPAD_CV') {
        closeX = 160 + 700 - 24;
        closeY = 56 + 3;
      } else if (winId === 'AUTORUN') {
        closeX = 130 + 764 - 24;
        closeY = 42 + 3;
      } else if (winId === 'THIS_PC') {
        closeX = 210 + 600 - 24;
        closeY = 110 + 3;
      } else if (winId === 'RECYCLE_BIN') {
        closeX = 230 + 560 - 24;
        closeY = 120 + 3;
      } else if (winId === 'MSDOS') {
        closeX = 180 + 660 - 24;
        closeY = 80 + 3;
      } else if (winId === 'README') {
        closeX = 240 + 560 - 24;
        closeY = 100 + 3;
      }

      if (x >= closeX && x <= closeX + 22 && y >= closeY && y <= closeY + 22) {
        actions.closeWindow(winId);
        return;
      }

      // Nút Download PDF to Host PC
      if (winId === 'WORDPAD_CV') {
        const dlX = 160 + 380;
        const dlY = 56 + 32;
        if (x >= dlX && x <= dlX + 280 && y >= dlY && y <= dlY + 28) {
          triggerCvDownload();
          return;
        }
      }

      // Nút [ VIEW ] trong My Projects (AUTORUN)
      if (winId === 'AUTORUN') {
        const btnX = 292;
        const btnY = 618;
        const btnW = 440;
        const btnH = 50;
        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          actions.enterProjectApp?.();
          return;
        }
      }

      // Các ổ đĩa trong My Computer
      if (winId === 'THIS_PC') {
        const bodyX = 210 + 8;
        const bodyY = 110 + 32;
        // Ổ (A:)
        if (x >= bodyX + 36 && x <= bodyX + 116 && y >= bodyY + 60 && y <= bodyY + 140) {
          if (state.cardLocation !== 'INSERTED') {
            actions.showOsDialogAlert('A:\\ is not accessible.\n\nPlease insert a disk/card into drive.');
          } else {
            actions.openWindow('WORDPAD_CV');
          }
          return;
        }
        // Ổ (C:)
        if (x >= bodyX + 220 && x <= bodyX + 300 && y >= bodyY + 60 && y <= bodyY + 140) {
          actions.openWindow('README');
          return;
        }
        // Ổ (D:)
        if (x >= bodyX + 400 && x <= bodyX + 480 && y >= bodyY + 60 && y <= bodyY + 140) {
          if (state.cdLocation !== 'INSIDE') {
            actions.showOsDialogAlert('D:\\ is not accessible.\n\nPlease insert a disk/card into drive.');
          } else {
            actions.openWindow('AUTORUN');
          }
          return;
        }
      }
    }

    // B. Kiểm tra click vào các Desktop Icons
    if (x >= 24 && x <= 96) {
      if (y >= 24 && y <= 100) {
        actions.openWindow('THIS_PC');
        return;
      }
      if (y >= 116 && y <= 192) {
        actions.openWindow('RECYCLE_BIN');
        return;
      }
      if (y >= 208 && y <= 284) {
        actions.openWindow('MSDOS');
        return;
      }
      if (y >= 300 && y <= 376) {
        actions.openWindow('README');
        return;
      }
      if (state.cardLocation === 'INSERTED' && y >= 392 && y <= 468) {
        actions.openWindow('WORDPAD_CV');
        return;
      }
      if (state.cdLocation === 'INSIDE' && y >= 484 && y <= 560) {
        actions.openWindow('AUTORUN');
        return;
      }
    }

    // C. Taskbar
    if (y >= 730) {
      if (x >= 4 && x <= 90) {
        // Nút Start
        actions.openWindow('THIS_PC');
        return;
      }

      // Taskbar items
      let taskX = 4 + 86 + 8;
      for (const winId of state.openWindows) {
        if (x >= taskX && x <= taskX + 160) {
          actions.bringWindowToFront(winId);
          return;
        }
        taskX += 164;
      }
    }
  }
}

/**
 * Vẽ hiệu ứng mở rộng phóng to toàn màn hình ứng dụng "PROJECTS OF VINZBOIZ"
 * khi người dùng bấm nút [ VIEW ] trên cửa sổ AUTORUN đĩa CD.
 * Hiệu ứng này tạo bước đệm thị giác liền mạch trước khi camera lao thẳng vào tâm kính CRT.
 */
function renderExpandingCyberspaceIntro(ctx: CanvasRenderingContext2D, state: CrtOsRenderState) {
  const p = Math.max(0, Math.min(1, state.crtExpandProgress ?? 1.0));
  const isDiving = state.projectAppTransition === 'DIVING_CAMERA';

  // 1. Tọa độ mở rộng từ khung cửa sổ AUTORUN ra toàn bộ màn hình 1024x768
  const wx = 130;
  const wy = 42;
  const ww = 764;
  const wh = 650;

  const curX = Math.round(wx * (1 - p));
  const curY = Math.round(wy * (1 - p));
  const curW = Math.round(ww + (1024 - ww) * p);
  const curH = Math.round(wh + (768 - wh) * p);

  // Nền ngoài (nếu chưa full màn hình): vẽ mờ nhẹ giao diện desktop bên dưới
  if (p < 0.98) {
    renderDesktopScreen(ctx, state, null);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * p})`;
    ctx.fillRect(0, 0, 1024, 768);
  }

  ctx.save();

  // Tạo vùng clipping cho khối đang mở rộng
  ctx.beginPath();
  ctx.rect(curX, curY, curW, curH);
  ctx.clip();

  // Nền Cyberspace tối sẫm ánh xanh phosphor CRT
  const grad = ctx.createRadialGradient(512, 384, 20, 512, 384, 620);
  grad.addColorStop(0, '#0a1c14');
  grad.addColorStop(0.55, '#040d09');
  grad.addColorStop(1, '#010403');
  ctx.fillStyle = grad;
  ctx.fillRect(curX, curY, curW, curH);

  // Lưới kỹ thuật Perspective Grid tỏa ra từ điểm tụ tâm (512, 384)
  const gridAlpha = 0.12 + 0.32 * p;
  ctx.strokeStyle = `rgba(51, 255, 51, ${gridAlpha})`;
  ctx.lineWidth = 1;

  // Các đường tụ hướng tâm
  const rays = 18;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(512, 384);
    ctx.lineTo(512 + Math.cos(angle) * 800, 384 + Math.sin(angle) * 800);
    ctx.stroke();
  }

  // Các vòng tròn đồng tâm mở rộng (Concentric Cyber Rings)
  const nowMs = performance.now() * 0.002;
  for (let r = 0; r < 4; r++) {
    const ringP = (nowMs + r * 0.25) % 1;
    const radius = 60 + ringP * (360 + p * 120);
    ctx.beginPath();
    ctx.ellipse(512, 384, radius, radius * 0.68, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(51, 255, 51, ${(1 - ringP) * (0.35 + 0.45 * p)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Khung viền công nghệ Retro Bevel viền kép
  ctx.strokeStyle = '#33ff33';
  ctx.lineWidth = 2;
  ctx.strokeRect(curX + 2, curY + 2, curW - 4, curH - 4);
  ctx.strokeStyle = 'rgba(51, 255, 51, 0.4)';
  ctx.strokeRect(curX + 8, curY + 8, curW - 16, curH - 16);

  // 4 Góc ngắm kỹ thuật (Targeting Reticles)
  const cornerLen = 28 + 14 * p;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  // Góc trên trái
  ctx.beginPath();
  ctx.moveTo(curX + 16, curY + 16 + cornerLen);
  ctx.lineTo(curX + 16, curY + 16);
  ctx.lineTo(curX + 16 + cornerLen, curY + 16);
  ctx.stroke();
  // Góc trên phải
  ctx.beginPath();
  ctx.moveTo(curX + curW - 16 - cornerLen, curY + 16);
  ctx.lineTo(curX + curW - 16, curY + 16);
  ctx.lineTo(curX + curW - 16, curY + 16 + cornerLen);
  ctx.stroke();
  // Góc dưới trái
  ctx.beginPath();
  ctx.moveTo(curX + 16, curY + curH - 16 - cornerLen);
  ctx.lineTo(curX + 16, curY + curH - 16);
  ctx.lineTo(curX + 16 + cornerLen, curY + curH - 16);
  ctx.stroke();
  // Góc dưới phải
  ctx.beginPath();
  ctx.moveTo(curX + curW - 16 - cornerLen, curY + curH - 16);
  ctx.lineTo(curX + curW - 16, curY + curH - 16);
  ctx.lineTo(curX + curW - 16, curY + curH - 16 - cornerLen);
  ctx.stroke();

  // Tiêu đề chính mở rộng: PROJECTS OF VINZBOIZ
  const titleSize = Math.round(24 + 32 * p);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Hiệu ứng phát quang tia phosphor CRT (Phosphor Glow)
  ctx.shadowColor = '#33ff33';
  ctx.shadowBlur = 10 + 24 * p;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${titleSize}px "JetBrains Mono", sans-serif`;
  ctx.fillText('PROJECTS OF VINZBOIZ', 512, 335 - 15 * p);

  // Tắt bóng đổ để vẽ thông số kỹ thuật sắc nét
  ctx.shadowBlur = 0;

  // Dòng phụ 1: Nhãn đĩa quang học & Chế độ tăng tốc đồ họa
  ctx.fillStyle = '#ffdf66';
  ctx.font = 'bold 13px "IBM Plex Mono", monospace';
  ctx.fillText('DISC D:\\ · 650MB OPTICAL ARCHIVE · CREATIVE 24X CD-ROM', 512, 385);

  // Dòng phụ 2: Trạng thái nạp dữ liệu và đồng bộ đường hầm
  ctx.fillStyle = '#33ff33';
  ctx.font = '12px "IBM Plex Mono", monospace';
  const statusText = isDiving
    ? '▶ DOCKING INTO 3D CYBERSPACE PERSPECTIVE TUNNEL...'
    : `INITIALIZING 3D PERSPECTIVE TUNNEL ENGINE... ${Math.round(p * 100)}%`;
  ctx.fillText(statusText, 512, 416);

  // Thanh tiến trình Retro nạp quang học
  const barW = 440;
  const barH = 8;
  const barX = 512 - barW / 2;
  const barY = 440;
  ctx.strokeStyle = '#33ff33';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = 'rgba(51, 255, 51, 0.2)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = isDiving ? '#ffffff' : '#33ff33';
  ctx.fillRect(barX + 2, barY + 2, Math.max(0, (barW - 4) * p), barH - 4);

  // Thông số viền 4 phía
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 11px "IBM Plex Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('[ SECTOR: 0xFD42 // DMA-2 ]', curX + 24, curY + 36);
  ctx.fillText('[ BUFFER: 100% READY ]', curX + 24, curY + curH - 28);
  ctx.textAlign = 'right';
  ctx.fillText('[ 60 FPS // 3DFX GLIDE ]', curX + curW - 24, curY + 36);
  ctx.fillText('[ ARCHIVE: 1997-2026 ]', curX + curW - 24, curY + curH - 28);

  ctx.restore();
}

/** HÀM VẼ TỔNG HỢP TOÀN BỘ MÀN HÌNH CRT OS */
export function drawCrtScreen(ctx: CanvasRenderingContext2D, state: CrtOsRenderState) {
  if (!state.isPoweredOn || !state.isCrtPowered) {
    renderOffScreen(ctx);
    return;
  }

  // Nếu đang trong tiến trình phóng to ứng dụng hoặc camera đang lao vào
  if (
    state.projectAppTransition === 'EXPANDING_ON_CRT' ||
    state.projectAppTransition === 'DIVING_CAMERA'
  ) {
    renderExpandingCyberspaceIntro(ctx, state);
    renderSonyOsdOverlays(ctx, state);
    return;
  }

  if (state.osState === 'OFF') {
    renderOffScreen(ctx);
  } else if (state.osState === 'BIOS_POST') {
    renderBiosPostScreen(ctx, state.bootElapsedTime, state.isResetting);
  } else if (state.osState === 'BOOT_LOGO') {
    renderBootLogoScreen(ctx, state.bootElapsedTime);
  } else if (state.osState === 'LOGIN_SCREEN') {
    renderLoginScreen(ctx, state.hoveredCanvasPos);
  } else if (state.osState === 'DESKTOP') {
    renderDesktopScreen(ctx, state, state.hoveredCanvasPos);
  }

  // Luôn vẽ đè lớp OSD Menu & OSD Flash thanh xanh lá (nếu có)
  renderSonyOsdOverlays(ctx, state);
}
