export interface ProjectItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  architecture: string[];
  techStack: string[];
  imageUrl: string;
  liveUrl?: string;
  githubUrl?: string;
  alignment: 'left' | 'right';
  year: string;
  role: string;
  metrics?: { label: string; value: string }[];
}

export const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: '01',
    category: '01 / INDUSTRIAL 3D · 04 VIEWS',
    title: '3D Digital Twin · MES Factory',
    subtitle: 'Real-time WebGL industrial telemetry & SCADA layout visualization',
    summary:
      'Engineered an interactive 3D digital twin of a 12,000 m² electronics manufacturing plant. Aggregates live MQTT telemetry across 48 CNC workcells with spatial heatmaps, robotic arm IK simulations, and sub-second machine failure alerts.',
    description:
      'A mission-critical Manufacturing Execution System (MES) client featuring a fully interactive 3D floor plan. Replaced static 2D SCADA schematics with a spatial digital twin built on Three.js and custom GLSL vertex shaders, allowing plant supervisors to diagnose sensor bottlenecks in 3D space.',
    architecture: [
      'Procedural factory floor layout with LOD (Level of Detail) instancing for 1,200+ sensors and pallets',
      'MQTT over WebSockets delivering sub-50ms telemetry to 3D spatial billboard overlays',
      'Custom Heatmap Shader projecting real-time temperature gradients on machine surfaces',
      'Inverse Kinematics solver animating 6-axis robotic assembly cycles at 60 FPS',
    ],
    techStack: ['Three.js', 'WebGL 2.0', 'GLSL', 'React', 'Zustand', 'TypeScript', 'MQTT / WebSocket', 'TailwindCSS'],
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/vinzboiz',
    githubUrl: 'https://github.com/vinzboiz/mes-digital-twin-3d',
    alignment: 'left',
    year: '2025',
    role: 'Lead WebGL Architect',
    metrics: [
      { label: 'FRAME RATE', value: '60 FPS STABLE' },
      { label: 'WORKCELLS', value: '48 MONITORED' },
      { label: 'LATENCY', value: '< 45 MS' },
      { label: 'DRAW CALLS', value: '14 BATCHED' },
    ],
  },
  {
    id: '02',
    category: '02 / FINTECH & POS · SERVERLESS',
    title: 'Serverless Office · Order Hub',
    subtitle: 'High-concurrency internal ordering platform with thermal receipt engine',
    summary:
      'Architected a lightning-fast enterprise cafeteria and pantry ordering system handling 3,500 daily active transactions. Features hardware ESC/POS network thermal printing, automated balance debiting, and zero cold-start microservices.',
    description:
      'Designed to eliminate lunch-hour congestion across corporate campuses. Combines an atomic transactional state machine on Cloudflare Workers with real-time socket broadcasting to multi-tenant kitchen display units (KDS) and direct hardware thermal printer gateways.',
    architecture: [
      'Edge-deployed transactional handlers executing with p99 latency under 22ms',
      'WebUSB & Raw TCP ESC/POS driver parsing thermal barcodes and Japanese/Vietnamese glyphs',
      'Optimistic offline-first client cache with auto-sync conflict resolution',
      'Zustand-powered reactive kitchen dashboard with drag-and-drop order tickets',
    ],
    techStack: ['TypeScript', 'Next.js 14', 'Cloudflare Workers', 'D1 SQLite', 'Prisma', 'TailwindCSS', 'WebUSB'],
    imageUrl:
      'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/vinzboiz',
    githubUrl: 'https://github.com/vinzboiz/serverless-order-hub',
    alignment: 'right',
    year: '2024',
    role: 'Full-Stack Systems Engineer',
    metrics: [
      { label: 'DAILY ORDERS', value: '3,500+' },
      { label: 'EDGE P99', value: '18 MS' },
      { label: 'PRINT TIME', value: '320 MS' },
      { label: 'UPTIME', value: '99.98%' },
    ],
  },
  {
    id: '03',
    category: '03 / CREATIVE WEBGL · ARCHVIZ',
    title: 'Minimalist 3D · Roastery Showcase',
    subtitle: 'Interactive PBR architectural walkthrough & custom GLSL lighting',
    summary:
      'Crafted an artisanal virtual showroom for a boutique specialty coffee roastery. Implements physical camera exposure, dynamic daylight cycles, ray-traced ambient occlusion approximation, and interactive coffee brewing stations.',
    description:
      'An award-winning interactive brand experience simulating the morning atmosphere of a modern concrete-and-wood coffee house. Utilizes physical-based materials, custom bloom and depth-of-field post-processing, and spatial ASMR audio designed to immerse connoisseurs.',
    architecture: [
      'Physically Accurate PBR material pipeline featuring micro-surface concrete and anisotropic wood grains',
      'Custom post-processing pipeline: Bokeh depth of field, filmic tone mapping, and chromatic aberration',
      'Dynamic sun angle simulator computing solar irradiance and interior shadow casting in real time',
      'Spatial Web Audio engine with distance attenuation and binaural steam/grinder soundscapes',
    ],
    techStack: ['React Three Fiber', 'Three.js', 'GLSL Shaders', 'GSAP', 'Howler.js', 'TypeScript', 'Blender Baking'],
    imageUrl:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/vinzboiz',
    githubUrl: 'https://github.com/vinzboiz/minimal-roastery-3d',
    alignment: 'left',
    year: '2024',
    role: 'Creative Technologist',
    metrics: [
      { label: 'LIGHTING', value: 'REALTIME PBR' },
      { label: 'TEXTURES', value: '4K PACKED' },
      { label: 'ASMR AUDIO', value: 'SPATIAL 3D' },
      { label: 'PERFORMANCE', value: '60 FPS WEB' },
    ],
  },
  {
    id: '04',
    category: '04 / MEDIA PLATFORM · STREAMING',
    title: 'ThungPhim · Streaming Architecture',
    subtitle: 'Full-stack OAuth2 media platform with adaptive low-latency playback',
    summary:
      'Built an end-to-end video streaming and discovery platform with adaptive HLS bitrate switching, multi-provider OAuth2 authentication, real-time comment synchronization, and automated video transcoding pipeline.',
    description:
      'A high-performance cinematic streaming web application engineered for silky-smooth content consumption across desktop and mobile browsers. Integrates server-side rendered movie indexes with low-latency segment caching and resilient token security.',
    architecture: [
      'HLS.js player integration featuring predictive segment prefetching and auto-resolution fallback',
      'Distributed Redis caching layer minimizing database queries for trending catalogs by 85%',
      'OAuth2 token rotation flow with biometric Passkey support and strict HTTP-only cookie isolation',
      'FFmpeg automated transcode worker slicing raw MP4 masters into 1080p/720p/480p multi-bitrate streams',
    ],
    techStack: ['React 18', 'Node.js', 'HLS.js', 'Redis', 'FFmpeg', 'PostgreSQL', 'Docker', 'TailwindCSS'],
    imageUrl:
      'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/vinzboiz',
    githubUrl: 'https://github.com/vinzboiz/thungphim-streaming-core',
    alignment: 'right',
    year: '2023',
    role: 'Lead Full-Stack Developer',
    metrics: [
      { label: 'BITRATE RANGE', value: '480P - 4K' },
      { label: 'BUFFER TIME', value: '< 180 MS' },
      { label: 'CATALOG SIZE', value: '1,500+ TITLES' },
      { label: 'CACHE HIT', value: '92.4%' },
    ],
  },
  {
    id: '05',
    category: '05 / QUANTITATIVE AI · TRADING',
    title: 'Neural Quant · Signal Engine',
    subtitle: 'Automated technical indicator pipeline & XGBoost market prediction',
    summary:
      'Constructed a quantitative trading research workbench analyzing high-frequency order book dynamics. Computes 120+ rolling technical indicators in Rust/Python with machine-learning directional alpha scoring and automated backtesting.',
    description:
      'Engineered for algorithmic crypto and equity intraday traders. Connects directly to Binance and Interactive Brokers tick feeds, stores billions of time-series data points, and surfaces real-time probability cones via high-density WebGL candlestick visualizations.',
    architecture: [
      'High-throughput vector calculation engine written in Rust with Python PyO3 bindings',
      'XGBoost gradient boosting classifier trained on order flow imbalance and volume weighted averages',
      'Vectorized backtesting framework running 10-year tick simulations in under 8 seconds',
      'High-speed WebGL canvas charting library rendering 100,000 candles with zero GC pressure',
    ],
    techStack: ['Python', 'Rust', 'XGBoost', 'TimescaleDB', 'FastAPI', 'WebGL 2.0', 'Docker', 'TypeScript'],
    imageUrl:
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
    liveUrl: 'https://github.com/vinzboiz',
    githubUrl: 'https://github.com/vinzboiz/neural-quant-engine',
    alignment: 'left',
    year: '2024',
    role: 'Quant Systems Developer',
    metrics: [
      { label: 'SHARPE RATIO', value: '2.42 BACKTEST' },
      { label: 'TICK LATENCY', value: '< 8 MS' },
      { label: 'INDICATORS', value: '120+ SIGNALS' },
      { label: 'BACKTEST SPEED', value: '12M TICKS/S' },
    ],
  },
];

