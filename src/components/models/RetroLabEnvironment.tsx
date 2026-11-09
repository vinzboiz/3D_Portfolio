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
const MAIN_MONITOR_DEPTH = 0.38;
const SCREEN_GLASS_W = 0.32;
const SCREEN_GLASS_H = 0.24;

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
  const screenInstancedRef = useRef<THREE.InstancedMesh>(null);
  const lastUpdateRef = useRef(0);

  // Khởi tạo ShaderMaterial chuyên dụng 1 draw call duy nhất
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

  // Bố cục ma trận màn hình phẳng tại z = S.ROOM.WALL_Z (-2.4m):
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

    const beigeColor = new THREE.Color('#cfc8b8');
    const darkColor = new THREE.Color('#2a2c30');

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Độ thủ công ngẫu nhiên nhẹ: lệch vài mm và xoay nhẹ quanh trục Z (±1°)
        const seedVal = Math.sin(c * 17.1 + r * 29.3);
        const seed2 = Math.cos(c * 23.7 + r * 37.1);
        const jitterX = seedVal * 0.004;
        const jitterY = seed2 * 0.004;
        const rotZ = seedVal * 0.016; // ±1° quanh trục Z, KHÔNG xoay hướng camera, giữ phẳng

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

        // Xen kẽ màu vỏ nhựa kem và xám đen
        bodyColors.push((c + r) % 2 === 0 ? beigeColor : darkColor);

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
    };
  }, []);

  // Geometry mặt kính màn hình phẳng hơi vát mép
  const screenGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SCREEN_GLASS_W, SCREEN_GLASS_H, 2, 2);
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(wallConfig.seeds, 1));
    geo.setAttribute('aMode', new THREE.InstancedBufferAttribute(wallConfig.modes, 1));
    geo.setAttribute('aBrightness', new THREE.InstancedBufferAttribute(wallConfig.brightnesses, 1));
    return geo;
  }, [wallConfig]);

  // Geometry vỏ thân máy CRT
  const bodyGeometry = useMemo(() => {
    // Khối thân vỏ màn hình CRT bo viền
    return new THREE.BoxGeometry(MAIN_MONITOR_W, MAIN_MONITOR_H, MAIN_MONITOR_DEPTH);
  }, []);

  // Thiết lập ma trận cho cả 2 InstancedMesh ngay khi mount
  useEffect(() => {
    if (!bodyInstancedRef.current || !screenInstancedRef.current) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < wallConfig.totalCount; i++) {
      dummy.position.set(...wallConfig.positions[i]);
      dummy.rotation.set(...wallConfig.rotations[i]);
      dummy.scale.set(...wallConfig.scales[i]);
      dummy.updateMatrix();

      // InstancedMesh #1: Thân vỏ
      bodyInstancedRef.current.setMatrixAt(i, dummy.matrix);
      bodyInstancedRef.current.setColorAt(i, wallConfig.bodyColors[i]);

      // InstancedMesh #2: Mặt kính màn hình (dịch phía trước mặt vỏ)
      dummy.position.z += MAIN_MONITOR_DEPTH * 0.5 * wallConfig.scales[i][2] + 0.015;
      dummy.updateMatrix();
      screenInstancedRef.current.setMatrixAt(i, dummy.matrix);
    }

    bodyInstancedRef.current.instanceMatrix.needsUpdate = true;
    if (bodyInstancedRef.current.instanceColor) {
      bodyInstancedRef.current.instanceColor.needsUpdate = true;
    }
    screenInstancedRef.current.instanceMatrix.needsUpdate = true;

    // BẮT BUỘC: Đặt frustumCulled = false để bức tường không bao giờ bị biến mất
    bodyInstancedRef.current.frustumCulled = false;
    screenInstancedRef.current.frustumCulled = false;
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
    };
  }, [shaderMat, screenGeometry, bodyGeometry]);

  return (
    <group>
      {/* 1. GIÁ ĐỠ THÉP CÔNG NGHIỆP BẮT VÀO TƯỜNG PHÍA SAU MÀN HÌNH (CHUẨN S.ROOM.WALL_Z) */}
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
            <boxGeometry args={[2.7, 0.025, 0.2]} />
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

      {/* 3. INSTANCED MESH #2: MẶT KÍNH SHADER MẤT TÍN HIỆU 90S (1 DRAW CALL DUY NHẤT) */}
      <instancedMesh
        ref={screenInstancedRef}
        args={[screenGeometry, shaderMat, wallConfig.totalCount]}
        frustumCulled={false}
      />

      {/* 4. FAKE LIGHT SPILL: ÁNH SÁNG LAN TỎA DỊU TỪ DÀN MÀN HÌNH LÊN SÀN VÀ BÀN */}
      <pointLight position={[0, 0.45, S.ROOM.WALL_Z + 0.6]} intensity={1.5} distance={3.8} decay={2} color="#60a5fa" />
      <pointLight position={[-0.8, 0.35, S.ROOM.WALL_Z + 0.6]} intensity={1.1} distance={3.0} decay={2} color="#34d399" />
      <pointLight position={[0.8, 0.35, S.ROOM.WALL_Z + 0.6]} intensity={1.1} distance={3.0} decay={2} color="#f59e0b" />

      {/* 5. PLANE GLOW ADDITIVE SÁT MẶT KÍNH TẠO QUẦNG SÁNG KHUẾCH TÁN */}
      <mesh position={[0, 0.45, S.ROOM.WALL_Z + 0.2]}>
        <planeGeometry args={[2.7, 1.65]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.065}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// =============================================================================
// 2. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (WOODEN ENGINEER CHAIR)
// =============================================================================
function WoodenEngineerChair() {
  const chairRef = useRef<THREE.Group>(null);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);

  const { oakMat, darkSteelMat, chromeMat, casterMat } = useMemo(() => {
    return {
      oakMat: new THREE.MeshStandardMaterial({
        color: '#6e472b',
        roughness: 0.65,
        metalness: 0.05,
      }),
      darkSteelMat: new THREE.MeshStandardMaterial({
        color: '#222225',
        roughness: 0.35,
        metalness: 0.85,
      }),
      chromeMat: new THREE.MeshStandardMaterial({
        color: '#c8d0d8',
        roughness: 0.15,
        metalness: 0.95,
      }),
      casterMat: new THREE.MeshStandardMaterial({
        color: '#141414',
        roughness: 0.8,
        metalness: 0.1,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      oakMat.dispose();
      darkSteelMat.dispose();
      chromeMat.dispose();
      casterMat.dispose();
    };
  }, [oakMat, darkSteelMat, chromeMat, casterMat]);

  useFrame(() => {
    if (!chairRef.current) return;
    const p = THREE.MathUtils.clamp(homeTransitionProgress, 0, 1);

    // Khi người dùng tiến vào bàn: ghế trượt lùi từ HOME_POS sang RETRACT_POS theo chuẩn S.CHAIR
    const targetX = THREE.MathUtils.lerp(S.CHAIR.HOME_POS[0], S.CHAIR.RETRACT_POS[0], p);
    const targetY = S.FLOOR_Y;
    const targetZ = THREE.MathUtils.lerp(S.CHAIR.HOME_POS[2], S.CHAIR.RETRACT_POS[2], p);
    const targetRotY = THREE.MathUtils.lerp(S.CHAIR.HOME_ROT_Y, S.CHAIR.RETRACT_ROT_Y, p);

    chairRef.current.position.set(targetX, targetY, targetZ);
    chairRef.current.rotation.y = targetRotY;
  });

  return (
    <group ref={chairRef} position={S.CHAIR.HOME_POS} rotation={[0, S.CHAIR.HOME_ROT_Y, 0]}>
      {/* A. Chân đế sao 5 nhánh & Bánh xe chạm sàn (y = 0 local = S.FLOOR_Y world) */}
      <group position={[0, 0, 0]}>
        <mesh material={darkSteelMat} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.04, 16]} />
        </mesh>

        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * 2 * Math.PI) / 5;
          const legLen = S.CHAIR.BASE_R; // 0.28m
          const lx = Math.sin(angle) * (legLen / 2);
          const lz = Math.cos(angle) * (legLen / 2);
          const wx = Math.sin(angle) * legLen;
          const wz = Math.cos(angle) * legLen;

          return (
            <group key={`chair-leg-${i}`}>
              <mesh
                position={[lx, 0.045, lz]}
                rotation={[0, angle, 0.04]}
                material={darkSteelMat}
                castShadow
              >
                <boxGeometry args={[0.028, 0.02, legLen]} />
              </mesh>

              <group position={[wx, S.CHAIR.CASTER_R, wz]} rotation={[0, angle, 0]}>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[0.012, 0, 0]}>
                  <cylinderGeometry args={[S.CHAIR.CASTER_R, S.CHAIR.CASTER_R, 0.014, 12]} />
                </mesh>
                <mesh material={casterMat} rotation={[0, 0, Math.PI / 2]} position={[-0.012, 0, 0]}>
                  <cylinderGeometry args={[S.CHAIR.CASTER_R, S.CHAIR.CASTER_R, 0.014, 12]} />
                </mesh>
                <mesh material={chromeMat} position={[0, 0.015, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.025, 8]} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* B. Trụ nâng hạ thủy lực */}
      <mesh material={darkSteelMat} position={[0, 0.18, 0]}>
        <cylinderGeometry args={[S.CHAIR.COLUMN_R, S.CHAIR.COLUMN_R + 0.005, 0.24, 16]} />
      </mesh>
      <mesh material={chromeMat} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[S.CHAIR.COLUMN_R - 0.004, S.CHAIR.COLUMN_R - 0.004, 0.16, 16]} />
      </mesh>

      {/* C. Mặt đệm ngồi bằng Gỗ sồi (SEAT_H = 0.45m so với sàn, y = -0.30m world) */}
      <group position={[0, S.CHAIR.SEAT_H - 0.02, 0]}>
        <mesh material={darkSteelMat} position={[0, -0.02, 0]}>
          <boxGeometry args={[S.CHAIR.SEAT_W * 0.7, 0.015, S.CHAIR.SEAT_D * 0.7]} />
        </mesh>
        <RoundedBox
          args={[S.CHAIR.SEAT_W, 0.035, S.CHAIR.SEAT_D]}
          radius={0.012}
          smoothness={3}
          castShadow
          receiveShadow
          material={oakMat}
        />
      </group>

      {/* D. Tựa lưng Gỗ sồi (BACK_H = 0.40m, đỉnh tựa lưng chạm y = 0.85m local = +0.10m trên mặt bàn) */}
      <group position={[0, S.CHAIR.SEAT_H + S.CHAIR.BACK_H - 0.12, -S.CHAIR.SEAT_D / 2 + 0.02]} rotation={[0.06, 0, 0]}>
        <mesh material={darkSteelMat} position={[-0.12, -0.14, 0.03]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.018, 0.28, 0.012]} />
        </mesh>
        <mesh material={darkSteelMat} position={[0.12, -0.14, 0.03]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.018, 0.28, 0.012]} />
        </mesh>
        <mesh material={chromeMat} position={[0, -0.01, 0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.26, 12]} />
        </mesh>
        <RoundedBox
          args={[S.CHAIR.BACK_W, 0.22, 0.03]}
          radius={0.012}
          smoothness={3}
          castShadow
          material={oakMat}
        />
      </group>

      {/* E. Hai bên tay vịn */}
      {[-S.CHAIR.SEAT_W / 2 - 0.03, S.CHAIR.SEAT_W / 2 + 0.03].map((sideX, idx) => (
        <group key={`chair-arm-${idx}`} position={[sideX, S.CHAIR.SEAT_H + 0.10, 0]}>
          <mesh material={darkSteelMat} position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.18, 12]} />
          </mesh>
          <RoundedBox
            args={[0.045, 0.016, 0.24]}
            radius={0.006}
            smoothness={2}
            position={[0, 0.04, 0.01]}
            castShadow
            material={oakMat}
          />
        </group>
      ))}
    </group>
  );
}

// =============================================================================
// 3. TOÀN CẢNH PHÒNG RETRO LAB 1997 & KỆ SẮT HAI BÊN HÔNG (RETRO LAB ENVIRONMENT)
// =============================================================================
export function RetroLabEnvironment() {
  const currentStep = useBuildStore((s) => s.currentStep);
  const homeTransitionProgress = useBuildStore((s) => s.homeTransitionProgress);
  const stageTransition = useBuildStore((s) => s.stageTransition);

  // HẠNG MỤC 5: TỐI ƯU HIỆU NĂNG (STATE CULLING - KHÔNG ĐỘNG VÀO TƯỜNG MÀN HÌNH)
  // - Khi người dùng đã ngồi hẳn vào bàn (currentStep >= 1 và homeTransitionProgress === 1):
  //   CHỈ kệ sắt hai bên và thiết bị phụ được ẩn (visible = false).
  // - CRTVideoWall LUÔN LUÔN HIỂN THỊ Ở MỌI THỜI ĐIỂM!
  const isTransitioning = stageTransition !== 'IDLE';
  const shouldShowSideProps =
    currentStep === 0 || homeTransitionProgress < 0.999 || isTransitioning;

  const { floorMat, wallMat, shelfSteelMat, caseBeigeMat, darkChassisMat } = useMemo(() => {
    return {
      floorMat: new THREE.MeshStandardMaterial({
        color: '#111318',
        roughness: 0.52,
        metalness: 0.12,
      }),
      wallMat: new THREE.MeshStandardMaterial({
        color: '#0a0c10',
        roughness: 0.92,
        metalness: 0.05,
      }),
      shelfSteelMat: new THREE.MeshStandardMaterial({
        color: '#1e2229',
        roughness: 0.45,
        metalness: 0.8,
      }),
      caseBeigeMat: new THREE.MeshStandardMaterial({
        color: '#d6d0c4',
        roughness: 0.65,
        metalness: 0.06,
      }),
      darkChassisMat: new THREE.MeshStandardMaterial({
        color: '#22262e',
        roughness: 0.5,
        metalness: 0.35,
      }),
    };
  }, []);

  useEffect(() => {
    return () => {
      floorMat.dispose();
      wallMat.dispose();
      shelfSteelMat.dispose();
      caseBeigeMat.dispose();
      darkChassisMat.dispose();
    };
  }, [floorMat, wallMat, shelfSteelMat, caseBeigeMat, darkChassisMat]);

  return (
    <group>
      {/* =======================================================================
          A. CHIẾC GHẾ GỖ KỸ SƯ CỔ ĐIỂN (Đặt trước bàn, tự động lùi sang trái khi zoom vào bàn)
         ======================================================================= */}
      <WoodenEngineerChair />

      {/* =======================================================================
          B. BỨC TƯỜNG MÀN HÌNH CRT PHẲNG (CRTVideowall - BẮT BUỘC LUÔN HIỂN THỊ)
          - Luôn mounted và luôn visible = true ở mọi currentStep và mọi portalProgress
          - frustumCulled = false trên cả 2 InstancedMesh
         ======================================================================= */}
      <CRTVideoWall />

      {/* =======================================================================
          C. VỎ PHÒNG XƯỞNG & PHẢN CHIẾU ÁNH SÁNG MÀN HÌNH XUỐNG SÀN (CHUẨN S.FLOOR_Y)
         ======================================================================= */}
      {/* 1. Sàn xưởng xám than tối bóng nhẹ (Y = S.FLOOR_Y = -0.75m) */}
      <mesh
        position={[0, S.FLOOR_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={floorMat}
      >
        <planeGeometry args={S.ROOM.FLOOR_SIZE} />
      </mesh>

      {/* 2. Plane phản chiếu mờ ánh sáng sọc màu từ tường màn hình lên mặt sàn bê tông */}
      <mesh position={[0, S.FLOOR_Y + 0.002, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 1.8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Tường sau (Z = -2.65m) */}
      <mesh position={[0, 0.85, -2.65]} receiveShadow material={wallMat}>
        <planeGeometry args={[S.ROOM.FLOOR_SIZE[0], 3.2]} />
      </mesh>
      {/* 4. Tường trái (X = -S.ROOM.FLOOR_SIZE[0] / 2) */}
      <mesh
        position={[-S.ROOM.FLOOR_SIZE[0] / 2, 0.85, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <planeGeometry args={[S.ROOM.FLOOR_SIZE[1], 3.2]} />
      </mesh>
      {/* 5. Tường phải (X = S.ROOM.FLOOR_SIZE[0] / 2) */}
      <mesh
        position={[S.ROOM.FLOOR_SIZE[0] / 2, 0.85, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
        material={wallMat}
      >
        <planeGeometry args={[S.ROOM.FLOOR_SIZE[1], 3.2]} />
      </mesh>

      {/* =======================================================================
          D. HỆ THỐNG KỆ SẮT HAI BÊN HÔNG (CHỈ ĐẶT Ở X = ±2.2m, KHÔNG CHE TƯỜNG & CHÂN BÀN)
          - Tự động culling ẩn đi khi người dùng đã ngồi hẳn vào bàn để giữ 60 FPS
         ======================================================================= */}
      {shouldShowSideProps && (
        <group>
          {/* Kệ sắt bên trái (X = -S.ROOM.SIDE_RACK_X = -2.2m, Z = -0.4m) */}
          <group position={[-S.ROOM.SIDE_RACK_X, S.FLOOR_Y, -0.4]}>
            {/* 4 Trụ thép chữ V */}
            {[-0.22, 0.22].map((dx, ix) =>
              [-0.45, 0.45].map((dz, iz) => (
                <mesh key={`shelf-l-${ix}-${iz}`} position={[dx, 1.0, dz]} material={shelfSteelMat}>
                  <boxGeometry args={[0.03, 2.0, 0.03]} />
                </mesh>
              ))
            )}
            {/* 3 Tầng kệ thép dập tấm */}
            {[0.25, 0.85, 1.5].map((sy, sIdx) => (
              <mesh key={`shelf-slab-l-${sIdx}`} position={[0, sy, 0]} material={shelfSteelMat}>
                <boxGeometry args={[0.48, 0.02, 0.95]} />
              </mesh>
            ))}
            {/* Thiết bị retro phụ trên kệ trái: Thùng máy IBM AT nằm ngang */}
            <group position={[0, 0.95, -0.2]}>
              <RoundedBox args={[0.32, 0.14, 0.35]} radius={0.01} material={caseBeigeMat} />
              <mesh position={[0, 0, 0.178]} material={darkChassisMat}>
                <boxGeometry args={[0.3, 0.11, 0.006]} />
              </mesh>
            </group>
          </group>

          {/* Kệ sắt bên phải (X = +S.ROOM.SIDE_RACK_X = +2.2m, Z = -0.4m) */}
          <group position={[S.ROOM.SIDE_RACK_X, S.FLOOR_Y, -0.4]}>
            {/* 4 Trụ thép chữ V */}
            {[-0.22, 0.22].map((dx, ix) =>
              [-0.45, 0.45].map((dz, iz) => (
                <mesh key={`shelf-r-${ix}-${iz}`} position={[dx, 1.0, dz]} material={shelfSteelMat}>
                  <boxGeometry args={[0.03, 2.0, 0.03]} />
                </mesh>
              ))
            )}
            {/* 3 Tầng kệ thép */}
            {[0.25, 0.85, 1.5].map((sy, sIdx) => (
              <mesh key={`shelf-slab-r-${sIdx}`} position={[0, sy, 0]} material={shelfSteelMat}>
                <boxGeometry args={[0.48, 0.02, 0.95]} />
              </mesh>
            ))}
            {/* Thiết bị retro phụ trên kệ phải: Máy hiện sóng mini & CRT phụ */}
            <group position={[0, 0.95, 0.15]}>
              <RoundedBox args={[0.28, 0.16, 0.28]} radius={0.01} material={darkChassisMat} />
              {/* Màn hình tia sóng xanh */}
              <mesh position={[0, 0, 0.142]}>
                <planeGeometry args={[0.16, 0.11]} />
                <meshBasicMaterial color="#10b981" />
              </mesh>
            </group>
          </group>

          {/* Cuộn dây cáp lớn dưới sàn góc phòng */}
          <group position={[-2.6, S.FLOOR_Y + 0.08, 1.8]} rotation={[0, 0.45, 0]}>
            <mesh material={shelfSteelMat}>
              <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.015, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.07, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.015, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
