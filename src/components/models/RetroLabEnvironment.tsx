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

      {/* 3. INSTANCED MESH #2: MẶT KÍNH SHADER MẤT TÍN HIỆU 90S (1 DRAW CALL DUY NHẤT) */}
      <instancedMesh
        ref={screenInstancedRef}
        args={[screenGeometry, shaderMat, wallConfig.totalCount]}
        frustumCulled={false}
      />

      {/* 4. FAKE LIGHT SPILL: ÁNH SÁNG LAN TỎA DỊU TỪ DÀN MÀN HÌNH LÊN SÀN VÀ BÀN */}
      <pointLight position={[0, 0.45, S.ROOM.WALL_Z + 0.4]} intensity={1.1} distance={3.2} decay={2} color="#60a5fa" />
      <pointLight position={[-0.8, 0.35, S.ROOM.WALL_Z + 0.4]} intensity={0.8} distance={2.6} decay={2} color="#34d399" />
      <pointLight position={[0.8, 0.35, S.ROOM.WALL_Z + 0.4]} intensity={0.8} distance={2.6} decay={2} color="#f59e0b" />

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
// 2. TOÀN CẢNH PHÒNG RETRO LAB VUÔNG 1997 (SQUARE LAB ENVIRONMENT)
// =============================================================================
export function RetroLabEnvironment() {
  const { floorMat, wallMat, ceilingMat } = useMemo(() => {
    return {
      floorMat: new THREE.MeshStandardMaterial({
        color: '#111318',
        roughness: 0.52,
        metalness: 0.12,
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

      {/* 2. Plane phản chiếu ánh sáng màn hình CRT lên mặt sàn bê tông */}
      <mesh position={[0, S.FLOOR_Y + 0.002, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 0.8]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Tường sau (Z = S.ROOM.BACK_WALL_Z = -0.95m, ngay sát sau dãy màn hình) */}
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
              emissive="#e0f2fe"
              emissiveIntensity={0.65}
              roughness={0.25}
            />
          </mesh>
        ))}
        {/* Nguồn sáng mềm từ trần rọi xuống cả phòng */}
        <pointLight position={[0, -0.1, 0]} intensity={0.75} distance={3.8} decay={2} color="#f0f6ff" />
      </group>
    </group>
  );
}
