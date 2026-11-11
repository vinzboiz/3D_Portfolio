import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';
import { S } from '../../constants/scale';

// =============================================================================
// HẰNG SỐ KÍCH THƯỚC CHUẨN MÀN HÌNH CRT 17" (HUMAN SCALE: 1 UNIT = 1 MÉT)
// =============================================================================
const MAIN_MONITOR_W = 0.40;
const MAIN_MONITOR_H = 0.36;
const MAIN_MONITOR_DEPTH = 0.30;
const SCREEN_GLASS_W = 0.308;
const SCREEN_GLASS_H = 0.222;

/**
 * Tạo khung viền mặt trước bo tròn có hốc khoét âm cho màn hình CRT (Sony Trinitron Style)
 * 100% Procedural ExtrudeGeometry có lỗ hổng (Shape with Hole cutout)
 */
function createBezelGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w = MAIN_MONITOR_W;
  const h = MAIN_MONITOR_H;
  const r = 0.012; // Bo tròn góc ngoài
  const x = -w / 2;
  const y = -h / 2;

  // Đường viền bo ngoài
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  // Hốc khoét âm cho mặt kính CRT (Screen Aperture Hole)
  const hole = new THREE.Path();
  const sw = 0.304;
  const sh = 0.218;
  const sy = 0.032; // Tâm hốc kính CRT hơi nâng lên để chừa chỗ cho cằm điều khiển & logo
  const sr = 0.008; // Bo nhẹ góc kính
  const hx = -sw / 2;
  const hy = sy - sh / 2;

  hole.moveTo(hx + sr, hy);
  hole.lineTo(hx + sw - sr, hy);
  hole.quadraticCurveTo(hx + sw, hy, hx + sw, hy + sr);
  hole.lineTo(hx + sw, hy + sh - sr);
  hole.quadraticCurveTo(hx + sw, hy + sh, hx + sw - sr, hy + sh);
  hole.lineTo(hx + sr, hy + sh);
  hole.quadraticCurveTo(hx, hy + sh, hx, hy + sh - sr);
  hole.lineTo(hx, hy + sr);
  hole.quadraticCurveTo(hx, hy, hx + sr, hy);

  shape.holes.push(hole);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelOffset: 0,
    bevelSegments: 2,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tạo Decal CanvasTexture sắc nét chuẩn Sony Trinitron Multiscan 100ES:
 * - Góc trên trái: Trinitron
 * - Góc trên phải: Multiscan 100ES
 * - Dưới màn hình: Logo SONY ánh bạc dập nổi
 * - Rãnh phân cách cằm điều khiển
 * - Ký hiệu các nút OSD cân chỉnh
 * - Ký hiệu nút nguồn POWER ( | )
 */
function createCrtFrontDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 922; // Khớp tỉ lệ 0.40m x 0.36m
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 1024, 922);

  // 1. TOP BEZEL BRANDING
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  // "Trinitron" (góc trên bên trái)
  ctx.fillStyle = '#2d2b28';
  ctx.font = 'bold 30px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.fillText('Trinitron', 132, 60);

  // "Multiscan 100ES" (góc trên bên phải)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4a4640';
  ctx.font = 'italic bold 21px "IBM Plex Mono", monospace, sans-serif';
  ctx.fillText('Multiscan ', 825, 60);
  ctx.fillStyle = '#22201d';
  ctx.font = 'bold 28px "JetBrains Mono", monospace, sans-serif';
  ctx.fillText('100ES', 900, 60);

  // 2. LOGO "SONY" CHỮ NỔI ÁNH BẠC Ở CHÍNH GIỮA DƯỚI MÀN HÌNH
  ctx.textAlign = 'center';
  const silverGrad = ctx.createLinearGradient(0, 680, 0, 715);
  silverGrad.addColorStop(0, '#f4f2ee');
  silverGrad.addColorStop(0.5, '#a4a8ac');
  silverGrad.addColorStop(1, '#505458');
  ctx.fillStyle = silverGrad;
  ctx.font = 'bold 40px Georgia, "Times New Roman", serif';
  ctx.fillText('SONY', 512, 710);
  ctx.restore();

  // 3. RÃNH PHÂN CÁCH NGANG (HORIZONTAL CHIN DIVIDER GROOVE)
  ctx.strokeStyle = 'rgba(60, 56, 52, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, 758);
  ctx.lineTo(954, 758);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, 760);
  ctx.lineTo(954, 760);
  ctx.stroke();

  // 4. KÝ HIỆU CÁC NÚT OSD CÂN CHỈNH MẶT TRƯỚC
  ctx.fillStyle = '#3c3834';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[ - ]', 243, 782);
  ctx.fillText('[ + ]', 333, 782);
  ctx.fillText('☼', 422, 782);
  ctx.fillText('◐', 512, 782);

  // 5. CHỈ BÁO STANDBY & NÚT POWER
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#48443e';
  ctx.fillText('STANDBY', 737, 782);

  ctx.fillText('POWER', 858, 782);

  // Biểu tượng nút nguồn (|) trên mặt nút vuông
  ctx.strokeStyle = '#322f2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(858, 825, 12, 0.35 * Math.PI, 0.65 * Math.PI, true);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(858, 810);
  ctx.lineTo(858, 825);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// =============================================================================
// GLSL SHADER: "MẤT TÍN HIỆU RETRO 90S" (100% PROCEDURAL - 1 DRAW CALL CHO CẢ BỨC TƯỜNG)
// =============================================================================
const crtWallVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aMode;
  attribute float aBrightness;

  varying vec2 vUv;
  varying float vSeed;
  varying float vMode;
  varying float vBrightness;

  void main() {
    vUv = uv;
    vSeed = aSeed;
    vMode = aMode;
    vBrightness = aBrightness;

    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const crtWallFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uPower;

  varying vec2 vUv;
  varying float vSeed;
  varying float vMode;
  varying float vBrightness;

  // Hàm tạo số ngẫu nhiên giả lập nhiễu hạt
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Chữ pixel "NO SIGNAL" phong cách màn hình xanh VCR 1997
  float drawPixelText(vec2 uv) {
    // Tọa độ vùng chữ ở giữa màn hình
    vec2 p = (uv - vec2(0.5, 0.5)) * vec2(20.0, 10.0);
    if (abs(p.x) > 6.0 || abs(p.y) > 1.2) return 0.0;

    // Chữ dạng các vạch pixel khối
    float x = p.x + 5.5;
    float y = p.y + 0.9;
    if (x < 0.0 || x > 11.0 || y < 0.0 || y > 1.8) return 0.0;

    float charIndex = floor(x);
    vec2 cUv = vec2(fract(x), y / 1.8);

    // Ký tự giả lập khối chữ số cổ điển
    float glyph = 0.0;
    if (charIndex == 0.0 || charIndex == 6.0) { // N
      if (cUv.x < 0.25 || cUv.x > 0.75 || abs(cUv.x - cUv.y) < 0.2) glyph = 1.0;
    } else if (charIndex == 1.0 || charIndex == 7.0) { // O
      if (cUv.x < 0.25 || cUv.x > 0.75 || cUv.y < 0.25 || cUv.y > 0.75) glyph = 1.0;
    } else if (charIndex == 3.0) { // S
      if (cUv.y > 0.75 || cUv.y < 0.25 || abs(cUv.y - 0.5) < 0.15 || (cUv.x < 0.3 && cUv.y > 0.5) || (cUv.x > 0.7 && cUv.y < 0.5)) glyph = 1.0;
    } else if (charIndex == 4.0) { // I
      if (abs(cUv.x - 0.5) < 0.18 || cUv.y > 0.8 || cUv.y < 0.2) glyph = 1.0;
    } else if (charIndex == 5.0) { // G
      if (cUv.x < 0.25 || cUv.y > 0.75 || cUv.y < 0.25 || (cUv.x > 0.75 && cUv.y < 0.5) || (abs(cUv.y - 0.5) < 0.15 && cUv.x > 0.4)) glyph = 1.0;
    } else if (charIndex == 8.0) { // A
      if (cUv.x < 0.25 || cUv.x > 0.75 || cUv.y > 0.75 || abs(cUv.y - 0.5) < 0.15) glyph = 1.0;
    } else if (charIndex == 9.0) { // L
      if (cUv.x < 0.25 || cUv.y < 0.25) glyph = 1.0;
    }
    return glyph;
  }

  void main() {
    // Nếu màn hình bị tắt (vBrightness = 0), chỉ hiển thị kính đen tối bóng mờ
    if (vBrightness < 0.05) {
      vec2 c = vUv * 2.0 - 1.0;
      float vig = clamp(1.0 - dot(c * c, c * c) * 0.7, 0.0, 1.0);
      gl_FragColor = vec4(vec3(0.015, 0.018, 0.02) * vig, 1.0);
      return;
    }

    vec2 pUv = vUv * vec2(320.0, 240.0);

    // Chuyển đổi ngẫu nhiên pattern mỗi vài giây (lệch pha giữa các màn hình)
    float timeShift = floor(mod(uTime * 0.25 + vSeed * 13.0, 6.0));
    float modeGlitchTrigger = step(0.92, sin(uTime * 0.4 + vSeed * 29.0));
    float currentMode = mod(vMode + modeGlitchTrigger * timeShift, 6.0);

    vec3 col = vec3(0.0);

    // -------------------------------------------------------------------------
    // PATTERN 0: SMPTE COLOR BARS
    // -------------------------------------------------------------------------
    if (currentMode < 0.8) {
      if (vUv.y > 0.28) {
        float bar = floor(vUv.x * 7.0);
        if (bar == 0.0) col = vec3(0.75, 0.75, 0.75); // Trắng
        else if (bar == 1.0) col = vec3(0.75, 0.75, 0.0); // Vàng
        else if (bar == 2.0) col = vec3(0.0, 0.75, 0.75); // Cyan
        else if (bar == 3.0) col = vec3(0.0, 0.75, 0.0); // Lục
        else if (bar == 4.0) col = vec3(0.75, 0.0, 0.75); // Magenta
        else if (bar == 5.0) col = vec3(0.75, 0.0, 0.0); // Đỏ
        else col = vec3(0.0, 0.0, 0.75); // Lam
      } else if (vUv.y > 0.18) {
        float bar = floor(vUv.x * 7.0);
        if (bar == 0.0) col = vec3(0.0, 0.0, 0.75);
        else if (bar == 1.0) col = vec3(0.08, 0.08, 0.08);
        else if (bar == 2.0) col = vec3(0.75, 0.0, 0.75);
        else if (bar == 3.0) col = vec3(0.08, 0.08, 0.08);
        else if (bar == 4.0) col = vec3(0.0, 0.75, 0.75);
        else if (bar == 5.0) col = vec3(0.08, 0.08, 0.08);
        else col = vec3(0.75, 0.75, 0.75);
      } else {
        float x = vUv.x;
        if (x < 0.2) col = vec3(0.08, 0.18, 0.32);
        else if (x < 0.4) col = vec3(1.0);
        else if (x < 0.6) col = vec3(0.12, 0.04, 0.22);
        else if (x < 0.75) col = vec3(0.04);
        else if (x < 0.85) col = vec3(0.08);
        else col = vec3(0.04);
      }
    }
    // -------------------------------------------------------------------------
    // PATTERN 1: RAINBOW VERTICAL STRIPES
    // -------------------------------------------------------------------------
    else if (currentMode < 1.8) {
      float phase = vUv.x * 14.0 + uTime * 0.7 + vSeed * 5.0;
      col.r = 0.5 + 0.5 * sin(phase);
      col.g = 0.5 + 0.5 * sin(phase + 2.094);
      col.b = 0.5 + 0.5 * sin(phase + 4.188);
      col *= 0.85;
    }
    // -------------------------------------------------------------------------
    // PATTERN 2: STATIC NOISE (NHIỄU TUYẾT TRẮNG ĐEN)
    // -------------------------------------------------------------------------
    else if (currentMode < 2.8) {
      float n = hash21(floor(pUv) + floor(uTime * 35.0) * vec2(17.3, 71.9));
      col = vec3(n * 0.95 + 0.05);
    }
    // -------------------------------------------------------------------------
    // PATTERN 3: ROLLING BAR (MẤT ĐỒNG BỘ V-HOLD)
    // -------------------------------------------------------------------------
    else if (currentMode < 3.8) {
      float rollY = fract(vUv.y - uTime * 0.95 + vSeed * 2.0);
      float bar = smoothstep(0.0, 0.18, rollY) * smoothstep(0.38, 0.18, rollY);
      float n = hash21(floor(pUv * 0.5) + floor(uTime * 24.0));
      col = mix(vec3(0.12, 0.14, 0.16) + n * 0.15, vec3(0.85, 0.9, 0.98), bar);
    }
    // -------------------------------------------------------------------------
    // PATTERN 4: MÀN HÌNH XANH "NO SIGNAL" KIỂU VCR
    // -------------------------------------------------------------------------
    else if (currentMode < 4.8) {
      col = vec3(0.0, 0.02, 0.72); // Nền xanh cobalt VCR
      float blink = step(0.45, fract(uTime * 0.9 + vSeed * 3.0));
      float text = drawPixelText(vUv);
      col = mix(col, vec3(1.0, 1.0, 0.95), text * blink);
    }
    // -------------------------------------------------------------------------
    // PATTERN 5: GLITCH BARS & CHROMATIC ABERRATION
    // -------------------------------------------------------------------------
    else {
      float band = floor(vUv.y * 14.0);
      float shift = (hash21(vec2(band, floor(uTime * 14.0))) - 0.5) * 0.22;
      float rPattern = step(0.5, fract((vUv.x + shift) * 8.0));
      float gPattern = step(0.5, fract(vUv.x * 8.0));
      float bPattern = step(0.5, fract((vUv.x - shift) * 8.0));
      col = vec3(rPattern, gPattern, bPattern) * 0.85;
    }

    // -------------------------------------------------------------------------
    // HIỆU ỨNG CHUNG CỦA BÓNG ĐÈN HÌNH CRT: SCANLINES + SHADOW MASK + VIGNETTE
    // -------------------------------------------------------------------------
    // 1. Scanlines ngang
    float scanline = sin(pUv.y * 3.14159) * 0.5 + 0.5;
    col *= 0.82 + 0.18 * scanline;

    // 2. RGB Shadow-mask (Aperture grille sub-pixels)
    float maskCol = mod(floor(pUv.x), 3.0);
    vec3 mask = maskCol < 1.0 ? vec3(1.12, 0.88, 0.88) : (maskCol < 2.0 ? vec3(0.88, 1.12, 0.88) : vec3(0.88, 0.88, 1.12));
    col *= mask;

    // 3. Vignette viền cong vát đen góc kính CRT
    vec2 c = vUv * 2.0 - 1.0;
    float vig = clamp(1.0 - dot(c * c, c * c) * 0.48, 0.0, 1.0);
    col *= vig;

    // 4. Flicker nhẹ tần số lưới điện 60Hz
    float flicker = 0.97 + 0.03 * sin(uTime * 75.0 + vSeed * 40.0);
    col *= flicker;

    // 5. Cường độ phát sáng tổng & uPower
    col *= vBrightness * uPower;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// =============================================================================
// 1. BỨC TƯỜNG MÀN HÌNH CRT PHẲNG (CRTVideowall - ĐIỂM NHẤN CHÍNH)
// =============================================================================
function CRTVideoWall() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  const bodyInstancedRef = useRef<THREE.InstancedMesh>(null);
  const bezelInstancedRef = useRef<THREE.InstancedMesh>(null);
  const screenInstancedRef = useRef<THREE.InstancedMesh>(null);
  const decalInstancedRef = useRef<THREE.InstancedMesh>(null);
  const adjustBtnInstancedRef = useRef<THREE.InstancedMesh>(null);
  const powerBtnInstancedRef = useRef<THREE.InstancedMesh>(null);
  const powerLedInstancedRef = useRef<THREE.InstancedMesh>(null);
  const lastUpdateRef = useRef(0);

  // Khởi tạo ShaderMaterial chuyên dụng 1 draw call duy nhất cho mặt kính CRT
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: crtWallVertexShader,
      fragmentShader: crtWallFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPower: { value: 0.85 }, // Ngưỡng sàn ban đầu tại Home
      },
      toneMapped: false,
      side: THREE.FrontSide,
    });
  }, []);

  // Decal CanvasTexture chuẩn Sony Trinitron (Logo SONY, Trinitron, Multiscan 100ES, nút nguồn, OSD)
  const decalTexture = useMemo(() => createCrtFrontDecalTexture(), []);
  const decalMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: decalTexture,
      transparent: true,
      depthWrite: false,
    });
  }, [decalTexture]);

  // Vật liệu LED phát sáng không qua ToneMapping để đạt độ sáng rực của bóng bán dẫn
  const ledMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      toneMapped: false,
    });
  }, []);

  // Bố cục ma trận màn hình phẳng tại z = S.ROOM.WALL_Z:
  // 6 Cột x 4 Hàng = 24 Màn hình chuẩn Human-Scale (0.40m x 0.36m)
  const wallConfig = useMemo(() => {
    const cols = 6;
    const rows = 4;
    const stepX = 0.44; // 0.40 + 0.04 khoảng cách
    const stepY = 0.40; // 0.36 + 0.04 khoảng cách
    const startX = -((cols - 1) * stepX) / 2; // -1.10m
    const startY = -0.15; // Hàng dưới cùng ở y = -0.15m (cách sàn 0.60m)
    const totalCount = cols * rows;

    const positions: [number, number, number][] = [];
    const rotations: [number, number, number][] = [];
    const scales: [number, number, number][] = [];
    const seeds = new Float32Array(totalCount);
    const modes = new Float32Array(totalCount);
    const brightnesses = new Float32Array(totalCount);
    const bodyColors: THREE.Color[] = [];
    const adjustBtnColors: THREE.Color[] = [];
    const powerBtnColors: THREE.Color[] = [];
    const ledColors: THREE.Color[] = [];

    const beigeColor = new THREE.Color('#cfc8b8');
    const darkColor = new THREE.Color('#2a2c30');
    const beigeBtnColor = new THREE.Color('#b0a898');
    const darkBtnColor = new THREE.Color('#1c1e22');
    const ledGreen = new THREE.Color('#33ff33');
    const ledAmber = new THREE.Color('#ffb000');
    const ledOff = new THREE.Color('#181816');

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Độ thủ công ngẫu nhiên nhẹ: lệch vài mm và xoay nhẹ quanh trục Z (±1°)
        const seedVal = Math.sin(c * 17.1 + r * 29.3);
        const seed2 = Math.cos(c * 23.7 + r * 37.1);
        const jitterX = seedVal * 0.004;
        const jitterY = seed2 * 0.004;
        const rotZ = seedVal * 0.016; // ±1° quanh trục Z, giữ phẳng không chĩa vào camera

        // Biến thể nhỏ ±5% kích thước
        const sizeVar = 1.0 + seedVal * 0.05;

        const posX = startX + c * stepX + jitterX;
        const posY = startY + r * stepY + jitterY;
        const posZ = S.ROOM.WALL_Z;

        positions.push([posX, posY, posZ]);
        rotations.push([0, 0, rotZ]);
        scales.push([sizeVar, sizeVar, sizeVar]);

        seeds[idx] = (seedVal + 1.0) * 0.5;

        // Phân bổ các mode: 0 (SMPTE), 1 (Rainbow), 2 (Noise), 3 (Rolling), 4 (VCR Blue), 5 (Glitch)
        const modeChoice = Math.floor(Math.abs(seedVal * 100)) % 6;
        modes[idx] = modeChoice;

        // Khoảng 12% màn hình tắt đen hoặc vỡ tín hiệu tối
        const isOff = Math.abs(seed2) > 0.88;
        brightnesses[idx] = isOff ? 0.0 : 0.85 + Math.abs(seedVal) * 0.35;

        // Xen kẽ màu vỏ nhựa kem retro và xám đen kỹ thuật
        const isBeige = (c + r) % 2 === 0;
        bodyColors.push(isBeige ? beigeColor : darkColor);
        powerBtnColors.push(isBeige ? beigeBtnColor : darkBtnColor);
        for (let b = 0; b < 4; b++) {
          adjustBtnColors.push(isBeige ? beigeBtnColor : darkBtnColor);
        }

        // Màu đèn LED chỉ báo nguồn (Xanh lá bật, Cam chờ/vcr, Đen tắt)
        if (isOff) {
          ledColors.push(ledOff);
        } else if (modeChoice === 4 || modeChoice === 3) {
          ledColors.push(ledAmber);
        } else {
          ledColors.push(ledGreen);
        }

        idx++;
      }
    }

    return {
      totalCount,
      positions,
      rotations,
      scales,
      seeds,
      modes,
      brightnesses,
      bodyColors,
      adjustBtnColors,
      powerBtnColors,
      ledColors,
    };
  }, []);

  // Geometry mặt kính màn hình phẳng lõm bên trong hốc
  const screenGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SCREEN_GLASS_W, SCREEN_GLASS_H, 2, 2);
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(wallConfig.seeds, 1));
    geo.setAttribute('aMode', new THREE.InstancedBufferAttribute(wallConfig.modes, 1));
    geo.setAttribute('aBrightness', new THREE.InstancedBufferAttribute(wallConfig.brightnesses, 1));
    return geo;
  }, [wallConfig]);

  // Geometry thân vỏ hộp CRT
  const bodyGeometry = useMemo(() => {
    return new THREE.BoxGeometry(MAIN_MONITOR_W * 0.98, MAIN_MONITOR_H * 0.98, MAIN_MONITOR_DEPTH);
  }, []);

  // Geometry khung viền mặt trước bo góc có hốc khoét âm (Sony Trinitron)
  const bezelGeometry = useMemo(() => createBezelGeometry(), []);

  // Geometry tấm decal mặt trước (chứa SONY, Trinitron, Multiscan 100ES, icon Power)
  const decalGeometry = useMemo(() => new THREE.PlaneGeometry(MAIN_MONITOR_W, MAIN_MONITOR_H), []);

  // Geometry 4 nút bấm cân chỉnh OSD (View Only)
  const adjustBtnGeo = useMemo(() => new THREE.BoxGeometry(0.022, 0.010, 0.008), []);

  // Geometry nút nguồn chính hình vuông (View Only)
  const powerBtnGeo = useMemo(() => new THREE.BoxGeometry(0.028, 0.028, 0.008), []);

  // Geometry đèn LED báo nguồn
  const powerLedGeo = useMemo(() => new THREE.CylinderGeometry(0.0035, 0.0035, 0.006, 12), []);

  // Thiết lập ma trận cho toàn bộ 7 InstancedMesh ngay khi mount
  useEffect(() => {
    if (
      !bodyInstancedRef.current ||
      !bezelInstancedRef.current ||
      !screenInstancedRef.current ||
      !decalInstancedRef.current ||
      !adjustBtnInstancedRef.current ||
      !powerBtnInstancedRef.current ||
      !powerLedInstancedRef.current
    )
      return;

    const monitorMat = new THREE.Matrix4();
    const localMat = new THREE.Matrix4();
    const partMat = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const ledRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));

    const depthHalf = MAIN_MONITOR_DEPTH * 0.5;
    const btnX = [-0.105, -0.070, -0.035, 0.000];

    for (let i = 0; i < wallConfig.totalCount; i++) {
      pos.set(...wallConfig.positions[i]);
      quat.setFromEuler(new THREE.Euler(...wallConfig.rotations[i]));
      scale.set(...wallConfig.scales[i]);
      monitorMat.compose(pos, quat, scale);

      // 1. Thân vỏ hộp (Body Housing)
      localMat.makeTranslation(0, 0, 0);
      partMat.multiplyMatrices(monitorMat, localMat);
      bodyInstancedRef.current.setMatrixAt(i, partMat);
      bodyInstancedRef.current.setColorAt(i, wallConfig.bodyColors[i]);

      // 2. Khung viền mặt trước bo góc có hốc khoét âm (Front Bezel with Cutout Aperture)
      localMat.makeTranslation(0, 0, depthHalf);
      partMat.multiplyMatrices(monitorMat, localMat);
      bezelInstancedRef.current.setMatrixAt(i, partMat);
      bezelInstancedRef.current.setColorAt(i, wallConfig.bodyColors[i]);

      // 3. Mặt kính màn hình CRT lõm sâu bên trong hốc (Recessed Screen Glass)
      localMat.makeTranslation(0, 0.032, depthHalf + 0.005);
      partMat.multiplyMatrices(monitorMat, localMat);
      screenInstancedRef.current.setMatrixAt(i, partMat);

      // 4. Decal mặt trước (Logo SONY, Trinitron, Multiscan 100ES, vạch phân tách)
      localMat.makeTranslation(0, 0, depthHalf + 0.0275);
      partMat.multiplyMatrices(monitorMat, localMat);
      decalInstancedRef.current.setMatrixAt(i, partMat);

      // 5. 4 Phím OSD / Cân chỉnh mặt trước (Adjust Buttons)
      for (let b = 0; b < 4; b++) {
        localMat.makeTranslation(btnX[b], -0.142, depthHalf + 0.030);
        partMat.multiplyMatrices(monitorMat, localMat);
        const btnIdx = i * 4 + b;
        adjustBtnInstancedRef.current.setMatrixAt(btnIdx, partMat);
        adjustBtnInstancedRef.current.setColorAt(btnIdx, wallConfig.adjustBtnColors[btnIdx]);
      }

      // 6. Phím Nguồn chính vuông (Power Switch)
      localMat.makeTranslation(0.135, -0.142, depthHalf + 0.030);
      partMat.multiplyMatrices(monitorMat, localMat);
      powerBtnInstancedRef.current.setMatrixAt(i, partMat);
      powerBtnInstancedRef.current.setColorAt(i, wallConfig.powerBtnColors[i]);

      // 7. Đèn LED chỉ báo nguồn (Power LED)
      localMat.compose(new THREE.Vector3(0.088, -0.142, depthHalf + 0.030), ledRot, new THREE.Vector3(1, 1, 1));
      partMat.multiplyMatrices(monitorMat, localMat);
      powerLedInstancedRef.current.setMatrixAt(i, partMat);
      powerLedInstancedRef.current.setColorAt(i, wallConfig.ledColors[i]);
    }

    const meshes = [
      bodyInstancedRef.current,
      bezelInstancedRef.current,
      screenInstancedRef.current,
      decalInstancedRef.current,
      adjustBtnInstancedRef.current,
      powerBtnInstancedRef.current,
      powerLedInstancedRef.current,
    ];

    meshes.forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.frustumCulled = false;
    });
  }, [wallConfig]);

  // Vòng lặp useFrame tối ưu:
  // - Ở Home hoặc đang zoom (portalProgress < 0.999): cập nhật 60 FPS
  // - Khi ngồi hẳn vào bàn (Step >= 1, portalProgress = 1): giảm xuống ~15 FPS để tiết kiệm triệt để GPU
  useFrame((state) => {
    const isHomeOrZooming =
      currentStep === 0 || homeTransitionProgress < 0.999 || stageTransition !== 'IDLE';
    const targetInterval = isHomeOrZooming ? 0 : 0.066; // 15 FPS khi ngồi bàn
    const now = state.clock.getElapsedTime();

    if (now - lastUpdateRef.current >= targetInterval) {
      lastUpdateRef.current = now;
      if (shaderMat) {
        shaderMat.uniforms.uTime.value = now;
        const p = THREE.MathUtils.clamp(homeTransitionProgress, 0, 1);
        // uPower có ngưỡng sàn: mix(0.85, 1.0, p) khi ở Home/zoom, và không bao giờ xuống dưới 0.65
        const power = isHomeOrZooming ? THREE.MathUtils.lerp(0.85, 1.0, p) : 0.65;
        shaderMat.uniforms.uPower.value = power;
      }
    }
  });

  useEffect(() => {
    return () => {
      shaderMat.dispose();
      screenGeometry.dispose();
      bodyGeometry.dispose();
      bezelGeometry.dispose();
      decalGeometry.dispose();
      adjustBtnGeo.dispose();
      powerBtnGeo.dispose();
      powerLedGeo.dispose();
      decalTexture.dispose();
      decalMat.dispose();
      ledMat.dispose();
    };
  }, [
    shaderMat,
    screenGeometry,
    bodyGeometry,
    bezelGeometry,
    decalGeometry,
    adjustBtnGeo,
    powerBtnGeo,
    powerLedGeo,
    decalTexture,
    decalMat,
    ledMat,
  ]);

  return (
    <group>
      {/* 1. GIÁ ĐỠ THÉP CÔNG NGHIỆP BẮT VÀO TƯỜNG PHÍA SAU MÀN HÌNH (SÁT TƯỜNG SAU S.ROOM.BACK_WALL_Z) */}
      <group position={[0, 0, S.ROOM.WALL_Z - 0.15]}>
        {/* Các cột thép hộp thẳng đứng */}
        {[-1.1, -0.66, -0.22, 0.22, 0.66, 1.1].map((cx, idx) => (
          <mesh key={`rack-column-${idx}`} position={[cx, 0.45, 0]}>
            <boxGeometry args={[0.035, 1.8, 0.035]} />
            <meshStandardMaterial color="#1a1c22" roughness={0.45} metalness={0.8} />
          </mesh>
        ))}
        {/* Các thanh giằng ngang đỡ từng hàng màn hình */}
        {[-0.33, 0.07, 0.47, 0.87].map((ry, idx) => (
          <mesh key={`rack-beam-${idx}`} position={[0, ry, 0]}>
            <boxGeometry args={[2.7, 0.025, 0.15]} />
            <meshStandardMaterial color="#181a20" roughness={0.5} metalness={0.75} />
          </mesh>
        ))}
        {/* Các bó cáp tín hiệu đen rủ giữa các tầng */}
        {[-0.9, -0.45, 0, 0.45, 0.9].map((cabX, idx) => (
          <mesh key={`wall-cable-${idx}`} position={[cabX, 0.4, 0.04]}>
            <cylinderGeometry args={[0.008, 0.008, 1.6, 8]} />
            <meshStandardMaterial color="#111114" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* 2. INSTANCED MESH #1: THÂN VỎ CRT (1 DRAW CALL DUY NHẤT) */}
      <instancedMesh
        ref={bodyInstancedRef}
        args={[bodyGeometry, undefined, wallConfig.totalCount]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.65} metalness={0.05} />
      </instancedMesh>

      {/* 3. INSTANCED MESH #2: KHUNG VIỀN MẶT TRƯỚC SONY TRINITRON CÓ HỐC ÂM */}
      <instancedMesh
        ref={bezelInstancedRef}
        args={[bezelGeometry, undefined, wallConfig.totalCount]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.60} metalness={0.05} />
      </instancedMesh>

      {/* 4. INSTANCED MESH #3: MẶT KÍNH SHADER MẤT TÍN HIỆU 90S (1 DRAW CALL DUY NHẤT) */}
      <instancedMesh
        ref={screenInstancedRef}
        args={[screenGeometry, shaderMat, wallConfig.totalCount]}
        frustumCulled={false}
      />

      {/* 5. INSTANCED MESH #4: DECAL TEM TRINITRON, MULTISCAN 100ES & LOGO SONY */}
      <instancedMesh
        ref={decalInstancedRef}
        args={[decalGeometry, decalMat, wallConfig.totalCount]}
        frustumCulled={false}
      />

      {/* 6. INSTANCED MESH #5: 4 NÚT BẤM OSD CÂN CHỈNH MẶT TRƯỚC (VIEW ONLY) */}
      <instancedMesh
        ref={adjustBtnInstancedRef}
        args={[adjustBtnGeo, undefined, wallConfig.totalCount * 4]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.70} metalness={0.05} />
      </instancedMesh>

      {/* 7. INSTANCED MESH #6: NÚT NGUỒN CHÍNH POWER SWITCH (VIEW ONLY) */}
      <instancedMesh
        ref={powerBtnInstancedRef}
        args={[powerBtnGeo, undefined, wallConfig.totalCount]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={0.65} metalness={0.05} />
      </instancedMesh>

      {/* 8. INSTANCED MESH #7: ĐÈN LED CHỈ BÁO NGUỒN CỦA MÀN HÌNH */}
      <instancedMesh
        ref={powerLedInstancedRef}
        args={[powerLedGeo, ledMat, wallConfig.totalCount]}
        frustumCulled={false}
      />

      {/* 4. FAKE LIGHT SPILL: ÁNH SÁNG LAN TỎA DỊU TỪ DÀN MÀN HÌNH LÊN BÀN */}
      <pointLight position={[0, 0.45, S.ROOM.WALL_Z + 0.4]} intensity={0.65} distance={3.0} decay={2} color="#60a5fa" />
      <pointLight position={[-0.8, 0.35, S.ROOM.WALL_Z + 0.4]} intensity={0.5} distance={2.4} decay={2} color="#34d399" />
      <pointLight position={[0.8, 0.35, S.ROOM.WALL_Z + 0.4]} intensity={0.5} distance={2.4} decay={2} color="#f59e0b" />
    </group>
  );
}

// =============================================================================
// 2. TOÀN CẢNH PHÒNG RETRO LAB VUÔNG 1997 (SQUARE LAB ENVIRONMENT)
// =============================================================================
export function RetroLabEnvironment() {
  const { floorMat, wallMat, ceilingMat } = useMemo(() => {
    return {
      floorMat: new THREE.MeshStandardMaterial({
        color: '#131519',
        roughness: 0.82,
        metalness: 0.04,
        side: THREE.DoubleSide,
      }),
      wallMat: new THREE.MeshStandardMaterial({
        color: '#0a0c10',
        roughness: 0.92,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
      ceilingMat: new THREE.MeshStandardMaterial({
        color: '#080a0e',
        roughness: 0.96,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      floorMat.dispose();
      wallMat.dispose();
      ceilingMat.dispose();
    };
  }, [floorMat, wallMat, ceilingMat]);

  // Tâm Z của phòng hình vuông: giữa tường sau (BACK_WALL_Z = -0.95m) và rìa trước (FRONT_Z = 1.90m)
  const roomCenterZ = (S.ROOM.BACK_WALL_Z + S.ROOM.FRONT_Z) / 2; // 0.475m
  const halfWall = S.ROOM.SIZE / 2; // 1.425m
  const wallCenterY = S.FLOOR_Y + S.ROOM.HEIGHT / 2; // -0.75 + 1.4 = 0.65m
  const ceilingY = S.FLOOR_Y + S.ROOM.HEIGHT; // 2.05m

  return (
    <group>
      {/* =======================================================================
          A. BỨC TƯỜNG MÀN HÌNH CRT PHẲNG (CRTVideowall - KÊ SÁT TƯỜNG SAU & BÀN GẦN HƠN)
          - Luôn mounted và luôn visible = true ở mọi thời điểm
          - frustumCulled = false trên cả 2 InstancedMesh
         ======================================================================= */}
      <CRTVideoWall />

      {/* =======================================================================
          B. PHÒNG RETRO LAB HÌNH VUÔNG KÍN 6 MẶT (CHỐNG BUNG VIEW / CHỐNG LỌT CAMERA)
          - Rộng 2.85m x Cao 2.80m x Sâu 2.85m
          - Gồm đầy đủ 6 mặt: Sàn, Trần, Tường Sau, Tường Trước, Tường Trái, Tường Phải
          - Kèm hộp bao bảo vệ (Enclosing Shell) BackSide chống hở góc
         ======================================================================= */}

      {/* 0. HỘP BAO BẢO VỆ TOÀN PHÒNG (INVERTED ENCLOSING SHELL - CHỐNG LỘ VOID TỪ MỌI GÓC) */}
      <mesh position={[0, wallCenterY, roomCenterZ]}>
        <boxGeometry args={[S.ROOM.SIZE + 0.04, S.ROOM.HEIGHT + 0.04, S.ROOM.SIZE + 0.04]} />
        <meshBasicMaterial color="#040608" side={THREE.BackSide} />
      </mesh>

      {/* 1. Sàn xưởng hình vuông (Y = S.FLOOR_Y = -0.75m) */}
      <mesh
        position={[0, S.FLOOR_Y, roomCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={floorMat}
      >
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.SIZE]} />
      </mesh>

      {/* 2. Tường sau (Z = S.ROOM.BACK_WALL_Z = -0.95m, ngay sát sau dãy màn hình) */}
      <mesh position={[0, wallCenterY, S.ROOM.BACK_WALL_Z]} receiveShadow material={wallMat}>
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.HEIGHT]} />
      </mesh>

      {/* 4. Tường trước (Z = S.ROOM.FRONT_Z = 1.90m, khép kín hoàn toàn phòng phía trước) */}
      <mesh
        position={[0, wallCenterY, S.ROOM.FRONT_Z]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
        material={wallMat}
      >
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.HEIGHT]} />
      </mesh>

      {/* 5. Tường trái (X = -1.425m, vừa sát mép ngoài dãy màn hình) */}
      <mesh
        position={[-halfWall, wallCenterY, roomCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.HEIGHT]} />
      </mesh>

      {/* 6. Tường phải (X = +1.425m, vừa sát mép ngoài dãy màn hình) */}
      <mesh
        position={[halfWall, wallCenterY, roomCenterZ]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.HEIGHT]} />
      </mesh>

      {/* 7. Trần xưởng kín (Y = 2.05m) */}
      <mesh
        position={[0, ceilingY, roomCenterZ]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
        material={ceilingMat}
      >
        <planeGeometry args={[S.ROOM.SIZE, S.ROOM.SIZE]} />
      </mesh>

      {/* 8. ĐÈN TUÝP HUỲNH QUANG TRẦN PHÒNG LAB (OVERHEAD RETRO FLUORESCENT FIXTURE) */}
      <group position={[0, ceilingY - 0.03, roomCenterZ]}>
        {/* Máng đèn kim loại trắng ngà */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[1.4, 0.035, 0.22]} />
          <meshStandardMaterial color="#c8c2b5" roughness={0.6} metalness={0.4} />
        </mesh>
        {/* 2 Bóng tuýp huỳnh quang T8 phát sáng dịu nâng sáng không gian phòng */}
        {[-0.055, 0.055].map((zOffset, i) => (
          <mesh key={`tube-${i}`} position={[0, -0.01, zOffset]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 1.25, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#e2f1fe"
              emissiveIntensity={1.8}
              roughness={0.25}
            />
          </mesh>
        ))}
        {/* Nguồn sáng từ trần rọi từ trên xuống chiếu sáng toàn bộ căn phòng (loại bỏ hoàn toàn lỗi vệt bóng sáng hình chữ nhật trên sàn) */}
        <pointLight
          position={[0, -0.15, 0]}
          intensity={3.2}
          distance={6.5}
          decay={1.4}
          color="#f0f6ff"
        />
        <directionalLight
          position={[0, -0.05, 0]}
          intensity={1.3}
          color="#f5f8ff"
          castShadow={false}
        />
      </group>
    </group>
  );
}
