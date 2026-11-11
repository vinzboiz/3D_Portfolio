import { S } from '../constants/scale';

export interface AssemblyStepSpec {
  label: string;
  value: string;
}

export interface PortfolioHighlight {
  title: string;
  roleOrTag: string;
  metrics: string;
  summary: string;
  techStack: string[];
}

export interface AssemblyStepData {
  step: number;
  code: string;
  shortName: string;
  title: string;
  partNumber: string;
  manufacturer: string;
  category: string;
  zoneId: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  hardwareSpecs: AssemblyStepSpec[];
  portfolioMapping: PortfolioHighlight;
  manualNote: string;
}

const dScale = (pos: [number, number, number]): [number, number, number] => [
  Number((pos[0] * S.DESK_ITEMS_SCALE).toFixed(4)),
  Number((pos[1] * S.DESK_ITEMS_SCALE).toFixed(4)),
  Number((pos[2] * S.DESK_ITEMS_SCALE).toFixed(4)),
];

export const ASSEMBLY_STEPS: AssemblyStepData[] = [
  {
    step: 0,
    code: '00',
    shortName: 'PORTAL HOME',
    title: 'RETRO 1997 WORKSTATION // SPLIT-TEXT PORTAL',
    partNumber: 'PORTAL-HOME-VIEWFINDER',
    manufacturer: 'VINZBOIZ STUDIO // WEBGL ARCHITECT',
    category: 'STEP 00 // PORTAL VIEWPORT & SLOGAN',
    zoneId: 'ZONE-PORTAL',
    cameraPos: dScale([-6.2, 7.2, 9.2]),
    cameraTarget: dScale([0, 1.4, -0.6]),
    hardwareSpecs: [
      { label: 'ARCHITECTURE', value: '100% PROCEDURAL THREE.JS / R3F' },
      { label: 'VIEWFINDER', value: '28VW CENTER MASK · SPLIT-TEXT' },
      { label: 'TIMELINE', value: '12-STEP HARDWARE STORYLINE' },
      { label: 'ENGINE', value: '60 FPS GSAP + ZUSTAND ENGINE' },
    ],
    portfolioMapping: {
      title: 'KIẾN TẠO KHÔNG GIAN TỪ NHỮNG VI MẠCH SỐNG',
      roleOrTag: 'PRINCIPAL CREATIVE TECHNOLOGIST & ARCHITECT',
      metrics: 'INTERACTIVE 3D PORTFOLIO 1997',
      summary:
        'Trang bìa mở đầu dẫn lối vào không gian xưởng chế tác máy tính năm 1997. Khung cửa sổ trung tâm mở rộng khi cuộn chuột để bước vào quy trình lắp ráp và khám phá các dự án 3D tương tác.',
      techStack: ['Three.js', 'React', 'TypeScript', 'TailwindCSS', 'Zustand'],
    },
    manualNote:
      'FIG 0.00: Chào mừng đến với xưởng chế tác Retro 1997 của vinzboiz. Cuộn chuột để mở rộng khung ngắm và bắt đầu quy trình lắp ráp phần cứng.',
  },
  {
    step: 1,
    code: '01',
    shortName: 'BENCH ASSEMBLY',
    title: 'ASUS TX97-E + PENTIUM MMX 233 + COOLER + SDRAM',
    partNumber: 'PN-TX97E-MMX233-BENCH',
    manufacturer: 'ASUS // INTEL // COOLER MASTER',
    category: 'STEP 01 // CORE BENCHMARK ASSEMBLY',
    zoneId: 'ZONE-A01',
    cameraPos: dScale([-3.6, 5.4, 5.8]),
    cameraTarget: dScale([0.0, 0.15, 0.0]),
    hardwareSpecs: [
      { label: 'MOTHERBOARD', value: 'ASUS TX97-E REV 1.02 (220x280MM)' },
      { label: 'PROCESSOR', value: 'INTEL PENTIUM® MMX™ 233 MHz (SOCKET 7)' },
      { label: 'COOLING UNIT', value: 'COOLER MASTER 40MM + ANODIZED SINK' },
      { label: 'SYSTEM MEMORY', value: '32MB PC100 168-PIN SDRAM DIMM' },
    ],
    portfolioMapping: {
      title: 'CORE ENGINE ARCHITECT // FULL-STACK & 3D WEBGL',
      roleOrTag: 'PRINCIPAL CREATIVE TECHNOLOGIST',
      metrics: '100% PROCEDURAL 3D // 60 FPS INSTANCED RENDERING',
      summary:
        'Lắp ráp tầng hạt nhân của hệ thống: Bo mạch chủ ASUS TX97-E điều phối luồng dữ liệu, vi xử lý Intel Pentium MMX 233MHz thực thi tính toán song song SIMD, tản nhiệt duy trì độ ổn định và thanh SDRAM 168-pin lưu trữ trạng thái tốc độ cao.',
      techStack: ['TypeScript', 'React Three Fiber', 'Three.js', 'GSAP', 'Zustand', 'GLSL'],
    },
    manualNote:
      'FIG 1.1: (1) Nâng cần ZIF Socket 7 90° -> (2) Hạ CPU Pentium MMX khớp góc Pin 1 -> (3) Gập khóa cần ZIF -> (4) Kẹp tản nhiệt Cooler Master -> (5) Ấn thanh SDRAM vào khe DIMM 1 tới khi 2 chốt trắng bật khóa.',
  },
  {
    step: 2,
    code: '02',
    shortName: 'CASE PREPARATION',
    title: 'INWIN A500 VERTICAL MID-TOWER & BRASS STANDOFFS',
    partNumber: 'IW-A500-MIDTOWER-97',
    manufacturer: 'IN WIN DEVELOPMENT INC.',
    category: 'STEP 02 // CHASSIS & MECHANICAL PREP',
    zoneId: 'ZONE-A01',
    cameraPos: dScale([-4.2, 5.2, 5.4]),
    cameraTarget: dScale([0.8, 1.8, -0.35]),
    hardwareSpecs: [
      { label: 'CHASSIS MODEL', value: 'INWIN A500 VERTICAL MID-TOWER' },
      { label: 'DRIVE BAYS', value: '4x 5.25" EXT + 2x 3.5" (60% LEFT BAY)' },
      { label: 'FRONT BEZEL', value: 'ALPHA CONTROL PANEL + INTEL MMX BADGE' },
      { label: 'REAR PANEL', value: 'SLIDE-OUT TRAY + I/O SHIELD + 80MM FAN' },
    ],
    portfolioMapping: {
      title: 'SYSTEM FOUNDATION, TOOLING & DEV ENVIRONMENT',
      roleOrTag: 'PLATFORM ARCHITECTURE & INFRASTRUCTURE',
      metrics: 'MODULAR MONOREPO // ZERO-FRICTION DX',
      summary:
        'Chuẩn bị khung gầm vững chắc cho dự án lớn: Thiết lập kiến trúc module hóa rõ ràng (ChassisFrame, FrontBezel InWin A500, CaseUCover), định vị chính xác các điểm neo (Brass Standoffs) và mở sẵn các khe cắm mở rộng PCI/ISA.',
      techStack: ['Vite', 'TypeScript Strict', 'Tailwind CSS', 'Turborepo', 'CI/CD'],
    },
    manualNote:
      'FIG 1.2: Đưa khung vỏ đứng InWin A500 vào giữa bàn cắt. Xoáy 6 chân đệm đồng (BrassStandoffs) vào tấm khay trượt Motherboard Tray và tháo 2 thanh chắn khe mạ kẽm vàng đồng tại PCI 1 & ISA 1 ở mặt lưng.',
  },
  {
    step: 3,
    code: '03',
    shortName: 'AT POWER SUPPLY',
    title: 'SEASONIC SSG-200G 200W PSU & 80MM GREEN-HUB FAN',
    partNumber: 'SSG-200G-AT200W',
    manufacturer: 'SEA SONIC ELECTRONICS CO.',
    category: 'STEP 03 // POWER DELIVERY & AC SWITCHING',
    zoneId: 'ZONE-C04',
    cameraPos: dScale([-4.2, 6.0, 4.6]),
    cameraTarget: dScale([0.8, 3.0, -0.6]),
    hardwareSpecs: [
      { label: 'MAX OUTPUT', value: '200W (+5V 20A / +12V 8A / -5V / -12V)' },
      { label: 'EXHAUST FAN', value: '80MM BLACK FAN + GREEN HUB + WIRE GRILLE' },
      { label: 'REAR LEFT I/O', value: 'HORIZONTAL IEC AC IN + RED 115V SWITCH' },
      { label: 'POWER SWITCH', value: 'HEAVY-DUTY 4-PIN LATCHING AC CABLE' },
    ],
    portfolioMapping: {
      title: 'HIGH-AVAILABILITY BACKEND & POWERFUL RUNTIME',
      roleOrTag: 'BACKEND & DISTRIBUTED SYSTEMS ENGINEER',
      metrics: '99.99% RELIABILITY // FAULT-TOLERANT PIPELINES',
      summary:
        'Tương tự bộ nguồn Seasonic SSG-200G cung cấp dòng điện ổn định với công tắc chọn áp 115V/230V và quạt hút 80mm lồng thép đồng tâm, tôi xây dựng tầng Backend chịu tải cao và cơ chế ngắt mạch an toàn (Circuit Breaker).',
      techStack: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
    },
    manualNote:
      'FIG 1.3: Trượt hộp nguồn Seasonic 200W vào khoang đỉnh của khung Case InWin A500 (ổ AC IN + nút gạt đỏ 115V bên trái, quạt 80mm tem xanh lá bên phải), siết 4 ốc mặt lưng và đi dây công tắc nguồn lên nút Power mặt trước.',
  },
  {
    step: 4,
    code: '04',
    shortName: 'MOBO MOUNTING',
    title: 'MOUNTING ASUS TX97-E ONTO SLIDE-OUT TRAY & I/O SHIELD',
    partNumber: 'ASSY-MOBO-CHASSIS-04',
    manufacturer: 'ASUS // INWIN INTEGRATION',
    category: 'STEP 04 // SYSTEM INTEGRATION & ALIGNMENT',
    zoneId: 'ZONE-A01',
    cameraPos: dScale([-5.4, 4.2, 3.2]),
    cameraTarget: dScale([0.75, 1.7, -0.35]),
    hardwareSpecs: [
      { label: 'REAR I/O SHIELD', value: 'DUAL PS/2 + 2x USB + 2x COM + LPT1' },
      { label: 'MOUNTING POINTS', value: '6x BRASS STANDOFFS + 6x M3 SCREWS' },
      { label: 'REAR COOLING', value: '80MM AUX FAN + TRAY DIAGRAM STICKER' },
      { label: 'SLOT CLEARANCE', value: '7x HORIZONTAL SLOTS (PCI 1 & ISA 1 OPEN)' },
    ],
    portfolioMapping: {
      title: 'FULL-STACK INTEGRATION & PRECISION ENGINEERING',
      roleOrTag: 'SYSTEM INTEGRATOR & LEAD DEVELOPER',
      metrics: 'SUB-MILLIMETER 3D ALIGNMENT // ZERO CLIPPING',
      summary:
        'Kết hợp hoàn hảo giữa tầng Core Engine (Mainboard + CPU + RAM) và tầng Platform (InWin A500 Slide-out Tray + I/O Shield) với độ chính xác tuyệt đối: mọi cổng giao tiếp (PS/2, USB, COM, LPT, PCI, ISA) và chân ốc đều ăn khớp 100%.',
      techStack: ['Three.js Math', 'Scene Graph', 'End-to-End Type Safety', 'GraphQL', 'gRPC'],
    },
    manualNote:
      'FIG 1.4: Nâng nguyên cụm BenchAssemblyGroup từ mặt bàn, dựng thẳng đứng khớp với tấm chắn I/O Shield và quạt phụ 80mm ở mặt lưng Case, hạ chuẩn xác lên 6 chân ốc đồng và siết chặt 6 ốc vít cố định.',
  },
  {
    step: 5,
    code: '05',
    shortName: 'STORAGE DRIVES',
    title: 'CREATIVE 24X CD-ROM, SONY FDD & QUANTUM 3.2GB HDD',
    partNumber: 'DRV-CD24X-MPF920-QF32',
    manufacturer: 'CREATIVE // SONY // QUANTUM',
    category: 'STEP 05 // DATA STORAGE & MEDIA BAYS',
    zoneId: 'ZONE-C05',
    cameraPos: dScale([-4.4, 4.6, 6.0]),
    cameraTarget: dScale([0.8, 2.0, 0.6]),
    hardwareSpecs: [
      { label: 'OPTICAL 5.25"', value: 'CREATIVE INFRA 24X MX CD-ROM' },
      { label: 'FLOPPY 3.5"', value: 'SONY MPF920 1.44MB + RESUME_CV DISK' },
      { label: 'HARD DRIVE', value: 'QUANTUM FIREBALL ST 3.2GB ULTRA ATA' },
      { label: 'MOUNTING', value: '8x CHASSIS DRIVE CAGE LOCK SCREWS' },
    ],
    portfolioMapping: {
      title: 'FEATURED PROJECT: ENTERPRISE DATA PLATFORM & STORAGE',
      roleOrTag: 'FULL-STACK LEAD // DATA PIPELINES & STORAGE',
      metrics: '100M+ RECORDS INDEXED // ZERO DATA LOSS',
      summary:
        'Thiết kế kiến trúc lưu trữ đa tầng: từ bộ nhớ truy cập tức thời, lưu trữ đĩa cứng cơ sở dữ liệu phân tán (Quantum Fireball 3.2GB) cho tới phân phối tài nguyên tĩnh (CD-ROM 24X) và xuất hồ sơ CV trực tiếp (3.5" Floppy RESUME_CV.PDF).',
      techStack: ['PostgreSQL', 'ClickHouse', 'S3 / MinIO', 'Prisma', 'Next.js'],
    },
    manualNote:
      'FIG 1.5: (1) Ổ quang Creative 24X CD-ROM trượt từ trước xuyên qua hốc 5.25" -> (2) Ổ mềm Sony MPF920 trượt vào hốc 3.5" (kèm đĩa mềm RESUME_CV.PDF trên bàn) -> (3) Ổ cứng Quantum Fireball 3.2GB trượt từ trong lòng Case vào khay 3.5" dưới -> (4) Xoáy 8 ốc cố định.',
  },
  {
    step: 6,
    code: '06',
    shortName: 'POWER CABLING',
    title: 'AT P8/P9 (BLACK-TO-BLACK), MOLEX 4-PIN & CPU FAN',
    partNumber: 'PWR-P8P9-MOLEX8981',
    manufacturer: 'SEASONIC // AMPHENOL',
    category: 'STEP 06 // POWER DISTRIBUTION HARNESS',
    zoneId: 'ZONE-C04',
    cameraPos: dScale([-5.2, 4.8, 3.8]),
    cameraTarget: dScale([0.8, 2.1, -0.2]),
    hardwareSpecs: [
      { label: 'MAIN POWER', value: 'DUAL 6-PIN P8 & P9 (BLACK-TO-BLACK)' },
      { label: 'DRIVE POWER', value: '2x MOLEX 8981 + 1x BERG 4-PIN FDD' },
      { label: 'COOLING PWR', value: '3-PIN CPU_FAN HEADER CONNECTION' },
      { label: 'VOLTAGE RAILS', value: '+12V YELLOW // +5V RED // GND BLACK' },
    ],
    portfolioMapping: {
      title: 'CLOUD INFRASTRUCTURE & FAILSAFE PIPELINES',
      roleOrTag: 'DEVSECOPS & INFRASTRUCTURE ARCHITECT',
      metrics: 'BLACK-TO-BLACK RULE // ZERO MISCONFIGURATION',
      summary:
        'Giống quy tắc sống còn "4 sợi dây Đen của P8 & P9 phải nằm sát nhau ở giữa" khi cấp nguồn cho bo mạch AT, tôi xây dựng hệ thống Infrastructure-as-Code có kiểm tra kiểu tĩnh và cơ chế tự bảo vệ nghiêm ngặt.',
      techStack: ['Terraform', 'AWS / GCP', 'GitHub Actions', 'Docker', 'OpenTelemetry'],
    },
    manualNote:
      'FIG 1.6: (1) Cắm 2 đầu giắc P8 & P9 vào cổng nguồn AT trên Mainboard (4 dây Đen sát nhau ở chính giữa) -> (2) Cắm giắc Molex 4-pin vào đuôi ổ CD-ROM, HDD và giắc Berg vào ổ mềm -> (3) Cắm dây 3-pin quạt CPU vào chân CPU_FAN.',
  },
  {
    step: 7,
    code: '07',
    shortName: 'RIBBON CABLES',
    title: '40-PIN IDE 1/2 & 34-PIN TWISTED FLOPPY RIBBONS',
    partNumber: 'CBL-IDE40-FDD34-RED1',
    manufacturer: 'AMPHENOL // ASUS',
    category: 'STEP 07 // HIGH-SPEED DATA BUS ROUTING',
    zoneId: 'ZONE-C05',
    cameraPos: dScale([-5.0, 4.4, 4.2]),
    cameraTarget: dScale([0.8, 1.9, 0.1]),
    hardwareSpecs: [
      { label: 'PRIMARY IDE', value: '40-PIN S-CURVE TO QUANTUM 3.2GB HDD' },
      { label: 'SECONDARY IDE', value: '40-PIN RIBBON TO CREATIVE 24X CD-ROM' },
      { label: 'FLOPPY BUS', value: '34-PIN TWISTED RIBBON TO SONY MPF920' },
      { label: 'PIN 1 STRIPE', value: 'RED EDGE STRIPE ALIGNED TO PIN 1' },
    ],
    portfolioMapping: {
      title: 'HIGH-THROUGHPUT DATA STREAMING & MESSAGE QUEUES',
      roleOrTag: 'DATA ENGINEERING & STREAMING ARCHITECT',
      metrics: 'ZERO BACKPRESSURE // DETERMINISTIC ORDERING',
      summary:
        'Thiết kế luồng truyền tải dữ liệu băng thông rộng giữa tầng xử lý (Motherboard) và tầng lưu trữ (HDD/CD-ROM/Floppy) với quy chuẩn đánh dấu viền đỏ Pin 1 và xoắn đảo chiều Drive A: chính xác tuyệt đối.',
      techStack: ['Apache Kafka', 'gRPC Streams', 'WebRTC', 'Binary Protocols'],
    },
    manualNote:
      'FIG 1.7: (1) Cắm cáp dẹt Primary IDE 40-pin uốn chữ S từ cổng IDE 1 xanh lên ổ cứng Quantum Fireball -> (2) Cắm cáp Secondary IDE 40-pin lên ổ Creative 24X CD-ROM -> (3) Cắm cáp Floppy 34-pin có đoạn xoắn đảo chiều (Twist) lên ổ mềm Sony.',
  },
  {
    step: 8,
    code: '08',
    shortName: 'FRONT PANEL I/O',
    title: 'TWISTED-PAIR FRONT PANEL LED, SWITCH & SPEAKER WIRES',
    partNumber: 'HDR-FPANEL-TWIST10',
    manufacturer: 'ENLIGHT // ASUS PINOUT',
    category: 'STEP 08 // TELEMETRY & CONTROL BUS',
    zoneId: 'ZONE-A01',
    cameraPos: dScale([-4.6, 3.8, 4.6]),
    cameraTarget: dScale([0.8, 1.2, 0.3]),
    hardwareSpecs: [
      { label: 'LED WIRES', value: 'RED-WHITE (HDD) + GREEN-WHITE (PWR)' },
      { label: 'SWITCH WIRES', value: 'ORANGE-WHITE (RST) + BLK-YLW (TURBO)' },
      { label: 'AUDIO BEEP', value: 'RED-BLACK TWISTED PAIR TO SPEAKER' },
      { label: 'TARGET HEADER', value: 'LOWER-RIGHT ASUS PANEL_HDR PINS' },
    ],
    portfolioMapping: {
      title: 'REAL-TIME TELEMETRY, LOGGING & OBSERVABILITY',
      roleOrTag: 'SRE & REAL-TIME DASHBOARD ARCHITECT',
      metrics: 'SUB-SECOND METRICS // FULL TRACEABILITY',
      summary:
        'Kết nối hệ thống dây xoắn đôi chống nhiễu của đèn báo trạng thái (Power LED, HDD LED), nút bấm điều khiển (Turbo/Reset) và loa báo lỗi POST trực tiếp vào hàng chân cắm Front Panel góc dưới phải bo mạch chủ.',
      techStack: ['Prometheus', 'Grafana', 'WebSockets', 'OpenTelemetry', 'Zustand'],
    },
    manualNote:
      'FIG 1.8: Đi 5 cặp dây xoắn mảnh từ mặt nạ trước dọc theo đáy Case và cắm lần lượt các đầu giắc Dupont (HDD LED, Power LED, Reset SW, Turbo SW, Speaker) vào cụm chân kim góc dưới phải Mainboard.',
  },
  {
    step: 9,
    code: '09',
    shortName: 'EXPANSION CARDS',
    title: '3DFX VOODOO DIAMOND MONSTER 3D + SOUND BLASTER 16',
    partNumber: 'EXP-VOODOO1-SB16-CT2940',
    manufacturer: 'DIAMOND // 3DFX // CREATIVE LABS',
    category: 'STEP 09 // 3D GRAPHICS & WAVETABLE AUDIO',
    zoneId: 'ZONE-B03',
    cameraPos: dScale([-5.4, 4.4, 2.8]),
    cameraTarget: dScale([0.75, 1.35, -0.4]),
    hardwareSpecs: [
      { label: '3D ACCELERATOR', value: '3DFX VOODOO (FBI + TMU + 8x EDO ARC)' },
      { label: 'VGA SLOT', value: 'PCI SLOT 1 + BLUE DB-15 D-SUB BRACKET' },
      { label: 'SOUND CARD', value: 'SOUND BLASTER 16 CT2940 (16-BIT ISA)' },
      { label: 'AUDIO PORTS', value: 'PINK/BLUE/GREEN 3.5MM + GOLD GAMEPORT' },
    ],
    portfolioMapping: {
      title: 'FEATURED PROJECT: 3D WEBGL ENGINE & AUDIO SYNTHESIS',
      roleOrTag: 'CREATIVE TECHNOLOGIST // GRAPHICS & AUDIO LEAD',
      metrics: '60 FPS SHADERS + PROCEDURAL HOWLER SYNTH',
      summary:
        'Đỉnh cao đồ họa và âm thanh năm 1997: Card 3dfx Voodoo Diamond Monster 3D với cặp chip FBI/TMU cùng 8 chip RAM xếp vòng cung xử lý đồ họa 3D phần cứng, kết hợp card Sound Blaster 16 CT2940 khe ISA 16-bit tái tạo âm thanh sống động.',
      techStack: ['Three.js / R3F', 'Custom GLSL Shaders', 'Howler.js', 'Web Audio API', 'Canvas 2D'],
    },
    manualNote:
      'FIG 1.9: (1) Card đồ họa 3dfx Voodoo PCI nâng lên từ mặt bàn, cắm thẳng xuống khe PCI 1 và siết ốc bracket -> (2) Card âm thanh Sound Blaster 16 CT2940 bay vào, cắm thẳng xuống khe ISA 1 màu đen và bắt ốc cố định.',
  },
  {
    step: 10,
    code: '10',
    shortName: 'CRT & BOOT UP',
    title: 'SONY TRINITRON 15" CRT, IBM MODEL M & AWARD BIOS BOOT',
    partNumber: 'CPD-100ES-MODELM-BOOT',
    manufacturer: 'SONY // IBM // LOGITECH // AWARD',
    category: 'STEP 10 // ENCLOSURE, PERIPHERALS & SYSTEM POST',
    zoneId: 'ZONE-A01',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
    hardwareSpecs: [
      { label: 'CRT MONITOR', value: 'SONY TRINITRON MULTISCAN 100ES (15")' },
      { label: 'KEYBOARD', value: 'IBM MODEL M 102-KEY ISO BUCKLING SPRING' },
      { label: 'POINTING DEV', value: 'LOGITECH M-S34 2-BUTTON PS/2 BALL MOUSE' },
      { label: 'CHASSIS', value: 'INWIN A500 VERTICAL MID-TOWER AT' },
    ],
    portfolioMapping: {
      title: 'SYSTEM READY // AVAILABLE FOR SENIOR & LEAD ROLES',
      roleOrTag: 'CONTACT & COLLABORATION TERMINAL',
      metrics: 'ALL 10 STEPS COMPLETE // 60 FPS WORKSTATION',
      summary:
        'Hoàn tất đóng nắp vỏ chữ U, kết nối màn hình CRT Sony Trinitron 100ES, bàn phím cơ IBM Model M (vỏ cong công thái học, logo Blue Oval & phím 2 tông Pearl/Pebble) và chuột bi Logitech. Hãy nhấn nút TURBO hoặc AT POWER ở góc trên phải để tương tác trực tiếp với màn hình BIOS và đèn LED trên vỏ máy!',
      techStack: ['github.com/your-handle', 'linkedin.com/in/your-handle', 'hello@retro97.dev'],
    },
    manualNote:
      'FIG 1.10: (1) Nắp vỏ chữ U trượt đóng kín thùng máy InWin A500 và siết 4 ốc lưng -> (2) Thùng máy dịch sang phải, màn hình CRT Sony Trinitron, bàn phím IBM Model M và chuột Logitech xuất hiện kèm cáp VGA/AC/dây xoắn lò xo -> (3) Khởi động màn hình Award BIOS!',
  },
  {
    step: 11,
    code: '11',
    shortName: 'MY PROJECTS',
    title: 'CREATIVE 24X CD-ROM AUTORUN // 3D PROJECTS TUNNEL',
    partNumber: 'APP-PROJECTS98-AUTORUN',
    manufacturer: 'CREATIVE INFRA // VINZBOIZ 3D STUDIO',
    category: 'STEP 11 // OPTICAL MEDIA & INTERACTIVE PROJECTS',
    zoneId: 'ZONE-C05',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
    hardwareSpecs: [
      { label: 'OPTICAL DISC', value: 'PORTFOLIO SOURCE CODE (650 MB MASTER)' },
      { label: 'DRIVE UNIT', value: 'CREATIVE INFRA 24X MX (ATAPI SECONDARY MASTER)' },
      { label: 'AUTORUN APP', value: 'PROJECTS_98.EXE // 3D FLY-THROUGH TUNNEL' },
      { label: 'GRAPHICS STACK', value: '3DFX GLIDE + CUSTOM GLSL VERTEX SHADERS' },
    ],
    portfolioMapping: {
      title: 'FEATURED WORKS // REAL-TIME 3D SHOWCASE APPS',
      roleOrTag: 'PRINCIPAL CREATIVE TECHNOLOGIST & LEAD',
      metrics: '3 CORE SHOWCASE APPS // 60 FPS GLSL ENGINES',
      summary:
        'Khay ổ quang Creative 24X tự động mở ra, đĩa CD Portfolio 650MB từ mặt bàn bay vào khay và khay đóng lại, kích hoạt Autorun mở ứng dụng My Projects trên màn hình CRT. Bấm nút [ VIEW ] trên cửa sổ để bước vào trải nghiệm đường hầm 3D tương tác!',
      techStack: ['Three.js', 'React Three Fiber', 'GLSL Shaders', 'Howler.js', 'TypeScript'],
    },
    manualNote:
      'FIG 1.11: Đĩa CD Portfolio từ bàn bay vào khay ổ quang Creative 24X CD-ROM, khay đóng lại và hệ thống Retro OS tự động kích hoạt Autorun mở cửa sổ My Projects trên màn hình CRT Sony Trinitron.',
  },
  {
    step: 12,
    code: '12',
    shortName: 'MY CV / RESUME',
    title: 'SONY 1.44MB FLOPPY & VINZBOIZ CURRICULUM VITAE',
    partNumber: 'DOC-WORDPAD-CV-VINZBOIZ',
    manufacturer: 'SONY CORP // MICROSOFT WORDPAD',
    category: 'STEP 12 // REMOVABLE MEDIA & CAREER DOSSIER',
    zoneId: 'ZONE-C05',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
    hardwareSpecs: [
      { label: 'REMOVABLE MEDIA', value: 'SONY 2HD 3.5" DISKETTE (1.44 MB FORMATTED)' },
      { label: 'DRIVE UNIT', value: 'SONY MPF920 DIRECT DRIVE FLOPPY (A:)' },
      { label: 'DOCUMENT FORMAT', value: 'WORDPAD RESUME_CV.DOC / TEXT DOSSIER' },
      { label: 'ONE-CLICK EXPORT', value: 'DIRECT DOWNLOAD TO HOST MACHINE' },
    ],
    portfolioMapping: {
      title: 'CAREER HIGHLIGHTS, CORE SKILLS & CONTACT',
      roleOrTag: 'LEAD CREATIVE TECHNOLOGIST & WEBGL ENGINEER',
      metrics: '10+ YRS EXPERIENCE // PRODUCTION PROVEN',
      summary:
        'Thẻ nhớ đĩa mềm chứa hồ sơ năng lực của vinzboiz từ mặt bàn bay lên cắm thẳng vào khe đọc 3.5", đèn LED xanh sáng và tự động mở trình soạn thảo WordPad CV trên màn hình CRT. Bạn có thể đọc trực tiếp hoặc bấm nút tải file CV về máy thật.',
      techStack: ['TypeScript', 'WebGL 2.0', 'Architecture Design', 'Mentorship', 'Performance'],
    },
    manualNote:
      'FIG 1.12: Đĩa mềm 3.5" RESUME_CV tự động cắm vào ổ Sony MPF920 và hiển thị hồ sơ cá nhân của vinzboiz trong WordPad trên màn hình CRT, sẵn sàng liên hệ và hợp tác.',
  },
];
