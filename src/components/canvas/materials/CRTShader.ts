import * as THREE from 'three';

/**
 * SHADER ĐÈN HÌNH CRT SONY TRINITRON MULTISCAN 100ES
 * - Lưới Aperture Grille đặc trưng của dòng Trinitron (vạch dọc siêu mịn)
 * - Điều chỉnh độ sáng (uBrightness) & độ tương phản (uContrast)
 * - Co giãn (uScale) & dịch tâm khung hình (uOffset)
 * - Hiệu ứng khử từ Degauss (uDegauss): sóng từ trường xoắn vặn + tán sắc quang học RGB Chromatic Aberration
 * - Hiệu ứng sập nguồn CRT (uCollapse): co tia sáng trắng về 1 đường ngang rồi về 1 chấm phát sáng ở tâm trước khi tắt hẳn
 */
export const CRTShader = {
  uniforms: {
    uTexture: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uPower: { value: 1.0 }, // 1.0 = sáng bình thường, 0.0 = tắt hẳn
    uCollapse: { value: 0.0 }, // 0.0 = mở đủ, 1.0 = sập nguồn hoàn toàn
    uBrightness: { value: 1.0 },
    uContrast: { value: 1.0 },
    uScale: { value: 1.0 },
    uOffset: { value: new THREE.Vector2(0, 0) },
    uDegauss: { value: 0.0 }, // 0.0 -> 1.0
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uPower;
    uniform float uCollapse;
    uniform float uBrightness;
    uniform float uContrast;
    uniform float uScale;
    uniform vec2 uOffset;
    uniform float uDegauss;

    varying vec2 vUv;

    // Uốn cong nhẹ mặt kính CRT (Trinitron hình trụ lồi ngang)
    vec2 curveUV(vec2 uv) {
      vec2 centered = uv - 0.5;
      float r2 = centered.x * centered.x + centered.y * centered.y;
      centered *= 1.0 + r2 * 0.04;
      return centered + 0.5;
    }

    void main() {
      vec2 uv = curveUV(vUv);

      // Hiệu ứng Sập nguồn CRT (Power-off Collapse):
      // Giai đoạn 1: Khung hình co lại theo chiều dọc thành 1 dải mỏng chói sáng
      // Giai đoạn 2: Dải mỏng co thành 1 chấm tròn cực sáng ở giữa rồi tàn lụi
      if (uCollapse > 0.001) {
        float cY = clamp(uCollapse * 1.5, 0.0, 1.0);
        float cX = clamp((uCollapse - 0.35) * 1.6, 0.0, 1.0);
        
        vec2 collapseUV = uv - 0.5;
        collapseUV.y /= max(0.002, 1.0 - cY * 0.992);
        collapseUV.x /= max(0.002, 1.0 - cX * 0.992);
        uv = collapseUV + 0.5;

        // Vệt chói phosphor khi tia electron tập trung mật độ cao
        if (abs(collapseUV.y) < 0.02 && uCollapse < 0.9) {
          float lineGlow = exp(-abs(collapseUV.y) * 160.0) * (1.0 - uCollapse * 0.7);
          float dotGlow = exp(-length(collapseUV) * 45.0) * 1.5;
          vec3 sparkColor = vec3(0.85, 0.92, 1.0) * (lineGlow + dotGlow);
          gl_FragColor = vec4(sparkColor * (1.0 - uCollapse), 1.0);
          return;
        }
      }

      // Nếu màn hình đã tắt hẳn
      if (uPower <= 0.001) {
        // Nền đen phốt-pho khi tắt đèn hình
        gl_FragColor = vec4(0.045, 0.05, 0.052, 1.0);
        return;
      }

      // Áp dụng co giãn GEOMETRY & dịch tâm POSITION
      vec2 screenUv = (uv - 0.5 - uOffset) / max(0.2, uScale) + 0.5;

      // Biến dạng xoắn sóng từ trường khi bấm nút DEGAUSS
      if (uDegauss > 0.001) {
        float wave = sin(screenUv.y * 28.0 + uTime * 42.0) * 0.035 * uDegauss;
        float waveX = cos(screenUv.x * 22.0 - uTime * 35.0) * 0.02 * uDegauss;
        screenUv.x += wave;
        screenUv.y += waveX;
      }

      // Kiểm tra viền màn hình (Overscan / Underscan border)
      if (screenUv.x < 0.0 || screenUv.x > 1.0 || screenUv.y < 0.0 || screenUv.y > 1.0) {
        // Viền đen bóng của lòng đèn hình
        gl_FragColor = vec4(0.03, 0.035, 0.038, 1.0);
        return;
      }

      // Lấy mẫu màu kèm tán sắc RGB (Chromatic Aberration khi Degauss hoặc ở 4 góc màn hình)
      float chromaDist = 0.0018 + uDegauss * 0.016;
      vec2 rUv = screenUv + vec2(chromaDist, 0.0);
      vec2 gUv = screenUv;
      vec2 bUv = screenUv - vec2(chromaDist, 0.0);

      float r = texture2D(uTexture, rUv).r;
      float g = texture2D(uTexture, gUv).g;
      float b = texture2D(uTexture, bUv).b;
      vec3 color = vec3(r, g, b);

      // Hiệu ứng Aperture Grille đặc trưng của Sony Trinitron (vạch lọc dọc)
      float grille = 0.92 + 0.08 * sin(vUv.x * 1280.0);
      // Quét dòng raster ngang mờ
      float scanline = 0.94 + 0.06 * sin(vUv.y * 768.0 * 2.0);
      color *= grille * scanline;

      // Điều chỉnh Độ sáng (uBrightness: 0.5 -> 1.5) & Độ tương phản (uContrast: 0.5 -> 1.5)
      color = (color - 0.5) * uContrast + 0.5 + (uBrightness - 1.0) * 0.35;

      // Đốm sáng ngẫu nhiên phốt-pho (Phosphor noise)
      float noise = (fract(sin(dot(vUv + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.018;
      color += noise;

      // Tối 4 góc (Vignetting tự nhiên)
      vec2 vigUV = vUv * (1.0 - vUv.yx);
      float vig = vigUV.x * vigUV.y * 15.0;
      vig = clamp(pow(vig, 0.18), 0.0, 1.0);
      color *= vig;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};

