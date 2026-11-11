import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useBuildStore } from '../../store/useBuildStore';

export interface DeskSpatialStepData {
  step: number;
  badge: string;
  titleBold: string;
  titleItalic: string;
  subtitle: string;
}

export const DESK_SPATIAL_STEPS: DeskSpatialStepData[] = [
  {
    step: 1,
    badge: '01 // MOTHERBOARD',
    titleBold: 'NỀN TẢNG',
    titleItalic: 'Kỹ thuật',
    subtitle: 'Kỹ sư Phần mềm HUTECH · GPA 3.43/4.0',
  },
  {
    step: 2,
    badge: '02 // PENTIUM MMX',
    titleBold: 'CORE',
    titleItalic: 'Full-Stack',
    subtitle: 'C# .NET Core · Spring Boot · Node.js',
  },
  {
    step: 3,
    badge: '03 // COOLER MASTER',
    titleBold: 'BỀN BỈ',
    titleItalic: 'Dưới áp lực',
    subtitle: 'Kỷ luật 4:45 AM · HDBank Hackathon',
  },
  {
    step: 4,
    badge: '04 // 32MB SDRAM',
    titleBold: 'DỮ LIỆU',
    titleItalic: 'Tức thời',
    subtitle: 'PostgreSQL · SQL Server · Angular & React 19',
  },
  {
    step: 5,
    badge: '05 // ENLIGHT CHASSIS',
    titleBold: 'HỆ THỐNG',
    titleItalic: 'Thực chiến',
    subtitle: 'Pungkook Saigon II · PLM & MES / SCADA',
  },
  {
    step: 6,
    badge: '06 // QUANTUM STORAGE',
    titleBold: 'CHUẨN HÓA',
    titleItalic: 'AI & Media',
    subtitle: 'Alchera Computer Vision · 360° Pipeline',
  },
  {
    step: 7,
    badge: '07 // 3DFX VOODOO',
    titleBold: 'KHÔNG GIAN',
    titleItalic: '3D WebGL',
    subtitle: 'Three.js · APS Forge · 3D Digital Twin',
  },
  {
    step: 8,
    badge: '08 // RIBBON CABLES',
    titleBold: 'KẾT NỐI',
    titleItalic: 'Đa chiều',
    subtitle: 'Figma UI/UX · Clean API · Teamwork',
  },
  {
    step: 9,
    badge: '09 // STEEL ENCLOSURE',
    titleBold: 'CHỈN CHU',
    titleItalic: 'Từng chi tiết',
    subtitle: 'Clean Architecture · 60 FPS Optimization',
  },
  {
    step: 10,
    badge: '10 // TRINITRON CRT',
    titleBold: 'SẴN SÀNG',
    titleItalic: 'Khởi chạy',
    subtitle: 'Khám phá CRT hoặc xem Projects & CV',
  },
];

export function DeskSpatialText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textProgressRef = useRef(1.0);

  useFrame((_, delta) => {
    const state = useBuildStore.getState();
    const portalProgress = THREE.MathUtils.clamp(state.homeTransitionProgress, 0, 1);
    const isAboutActive = state.currentStep >= 1 && portalProgress >= 0.45;

    if (containerRef.current) {
      containerRef.current.style.opacity = isAboutActive ? '1' : '0';
      containerRef.current.style.visibility = isAboutActive ? 'visible' : 'hidden';
    }

    if (!isAboutActive) return;

    // Tốc độ lerp tiến trình chữ chậm rãi, cực kỳ đằm và êm ái (lerp 0.035)
    const targetScroll = THREE.MathUtils.clamp(state.scrollCurrent, 1.0, 10.0);
    const lerpSpeed = Math.min(1, Math.max(0.02, delta * 2.2));
    textProgressRef.current = THREE.MathUtils.lerp(
      textProgressRef.current,
      targetScroll,
      lerpSpeed
    );

    const progress = textProgressRef.current;

    for (let i = 0; i < DESK_SPATIAL_STEPS.length; i++) {
      const stepIndex = i + 1;
      const stepDelta = stepIndex - progress;
      const el = stepCardRefs.current[i];
      if (!el) continue;

      if (Math.abs(stepDelta) > 1.2) {
        el.style.display = 'none';
        continue;
      }

      el.style.display = 'block';

      let yOffsetPx = 0;
      let opacity = 0;
      let scale = 1.0;

      if (stepDelta <= 0) {
        // Bước đã qua: bay bổng lên cao (y: 0.42 -> 1.15) và mờ dần
        const t = THREE.MathUtils.clamp(-stepDelta, 0, 1);
        yOffsetPx = -t * 120; // Bay lên trên
        opacity = THREE.MathUtils.clamp(1 - t * 1.35, 0, 1);
        scale = THREE.MathUtils.lerp(1.0, 1.06, t);
      } else {
        // Bước chuẩn bị đến: trồi nhẹ từ dưới mặt thảm cắt lên (y: 0.05 -> 0.42)
        const t = THREE.MathUtils.clamp(stepDelta, 0, 1);
        yOffsetPx = t * 90; // Từ dưới trồi lên
        opacity = THREE.MathUtils.clamp(1 - t * 1.35, 0, 1);
        scale = THREE.MathUtils.lerp(1.0, 0.94, t);
      }

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${yOffsetPx.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }
  });

  return (
    <group
      position={[-2.35, 0.42, 1.25]}
      rotation={[-0.42, 0.28, 0.08]}
    >
      <Html
        transform
        distanceFactor={4.2}
        pointerEvents="none"
        center
      >
        <div
          ref={containerRef}
          className="relative select-none will-change-transform"
          style={{
            width: '580px',
            minHeight: '220px',
            transition: 'opacity 0.4s ease-out',
          }}
        >
          {DESK_SPATIAL_STEPS.map((item, idx) => (
            <div
              key={item.step}
              ref={(el) => {
                stepCardRefs.current[idx] = el;
              }}
              className="absolute left-0 top-0 w-full will-change-transform"
              style={{
                display: idx === 0 ? 'block' : 'none',
                transformOrigin: 'left center',
              }}
            >
              {/* Dòng chỉ mục (01 // MOTHERBOARD): Monospace cam sáng */}
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#ff5a36] shadow-[0_0_8px_#ff5a36]" />
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", "IBM Plex Mono", monospace',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#ff5a36',
                    textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  }}
                >
                  {item.badge}
                </span>
              </div>

              {/* Dòng Chữ Lớn: Bold Geometric Sans trắng + Serif Italic đỏ cam */}
              <h2
                className="flex items-baseline gap-3 mb-4 leading-none"
                style={{
                  textShadow: '0 8px 24px rgba(0,0,0,0.95), 0 2px 6px rgba(0,0,0,0.9)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '54px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 0.95,
                  }}
                >
                  {item.titleBold}
                </span>
                <span
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '58px',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: '#ff5a36',
                    lineHeight: 0.95,
                  }}
                >
                  {item.titleItalic}
                </span>
              </h2>

              {/* Dòng Phụ đề ngắn: Monospace/Sans bạc với viền cam và nền mờ */}
              <div className="inline-flex items-center">
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#e4e4ea',
                    background: 'rgba(10, 11, 14, 0.78)',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    borderLeft: '3px solid #ff5a36',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 6px 18px rgba(0,0,0,0.8)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Html>
    </group>
  );
}
