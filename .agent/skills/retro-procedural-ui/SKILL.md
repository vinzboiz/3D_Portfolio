---
name: retro-procedural-ui
description: >-
  Hướng dẫn chuyên sâu và mẫu triển khai (Runbook & Code Recipes) để xây dựng linh kiện máy tính 3D năm 1997 hoàn toàn bằng code (100% Procedural Three.js/R3F, không dùng file GLB), đồng bộ hóa timeline lắp ráp bằng GSAP ScrollTrigger + Zustand, và thiết kế giao diện HUD kiểu Windows 95 / Hardware Manual. Kích hoạt skill này khi tạo hoặc chỉnh sửa các component 3D, vật liệu PBR, hiệu ứng dây cáp, CanvasTexture hoặc giao diện Retro UI trong dự án Portfolio.
---

# Retro 1997 Procedural 3D & UI Architecture Skill

Skill này cung cấp quy trình chuẩn và các mẫu code (recipes) cho kiến trúc **100% Procedural 3D PC Assembly (1997 Era)** kết hợp giao diện **Hardware Manual & Windows 95 HUD**.

---

## 1. Cấu trúc Thư mục Khuyến nghị (Recommended Architecture)

Khi triển khai tính năng trong dự án, hãy tổ chức code theo cấu trúc tách biệt rõ giữa **Procedural 3D Primitives**, **Materials/Textures**, **State/Timeline** và **2D HUD**:

```text
src/
├── components/
│   ├── canvas/
│   │   ├── parts/              # Các linh kiện 3D dựng bằng code (Mainboard, CPU, RAM, PSU, IDE...)
│   │   ├── primitives/         # Khối hình học dùng chung (InstancedPins, RibbonCable, Capacitor...)
│   │   ├── materials/          # Hằng số vật liệu PBR 1997 & trình tạo CanvasTexture
│   │   └── AssemblyRig.tsx     # Nhóm 3D chính được điều khiển bởi GSAP ScrollTrigger
│   └── hud/
│       ├── Win95BevelBox.tsx   # Khung viền 3D Bevel chuẩn Windows 95
│       ├── TurboLedWidget.tsx  # Đồng hồ LED 7-đoạn (66/233 MHz) + nút bấm vật lý TURBO
│       ├── SpecSheetCard.tsx   # Datasheet linh kiện liên kết kỹ năng/dự án Portfolio
│       └── WorkbenchRuler.tsx  # Thanh thước đo milimet đáy màn hình (Cutting Mat HUD)
├── store/
│   └── useAssemblyStore.ts     # Zustand store quản lý bước lắp ráp, Turbo mode, âm thanh
└── styles/
    └── retro-tokens.css        # Biến CSS màu sắc 1997, lưới Cutting Mat & utility class Bevel
```

---

## 2. Kho Vật liệu PBR Chuẩn 1997 (`materials/retroMaterials.ts`)

Luôn tái sử dụng các cấu hình `THREE.MeshStandardMaterialParameters` dưới đây để giữ đồng nhất ánh sáng và chất liệu phần cứng năm 1997 và giảm số lượng shader cần biên dịch:

```tsx
import * as THREE from 'three';

export const RETRO_PBR_PRESETS = {
  beigePlastic: {
    color: '#d8d2c5',
    roughness: 0.65,
    metalness: 0.05,
  },
  agedDarkBeige: {
    color: '#b8b0a0',
    roughness: 0.7,
    metalness: 0.05,
  },
  pcbGreen: {
    color: '#1a472a',
    roughness: 0.45,
    metalness: 0.15,
  },
  ceramicCpu: {
    color: '#2b2321',
    roughness: 0.5,
    metalness: 0.1,
  },
  galvanizedSteel: {
    color: '#8c9296',
    roughness: 0.35,
    metalness: 0.85,
  },
  anodizedBlack: {
    color: '#1e1e1e',
    roughness: 0.4,
    metalness: 0.6,
  },
  goldContacts: {
    color: '#d4af37',
    roughness: 0.2,
    metalness: 1.0,
  },
  ideRibbonGray: {
    color: '#9ea3a8',
    roughness: 0.8,
    metalness: 0.05,
  },
  idePin1Red: {
    color: '#b82525',
    roughness: 0.8,
    metalness: 0.05,
  },
} as const satisfies Record<string, THREE.MeshStandardMaterialParameters>;
```

---

## 3. Các Mẫu Dựng Hình 3D Bằng Code (Procedural 3D Recipes)

### A. Khung Vỏ, Bản mạch PCB & Khe cắm (`<RoundedBox>` & `ExtrudeGeometry`)
- Dùng `<RoundedBox>` từ `@react-three/drei` cho vỏ nhựa CRT/Case AT, ổ Floppy/CD-ROM, thân chip IC.
- Dùng `THREE.Shape` + `THREE.ExtrudeGeometry` khi cần tạo rãnh khuyết (ví dụ: rãnh định vị trên thanh RAM SIMM/SDRAM hoặc bo mạch có lỗ bắt ốc):

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { RETRO_PBR_PRESETS } from '../materials/retroMaterials';

export function RamPcbBlade({ width = 4.2, height = 1.1, depth = 0.06 }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = width / 2;
    const h = height / 2;

    // Viền ngoài thanh RAM kèm rãnh khuyết (key notch) ở đáy
    shape.moveTo(-w, -h);
    shape.lineTo(-0.2, -h);
    shape.lineTo(-0.2, -h + 0.12);
    shape.lineTo(0.2, -h + 0.12);
    shape.lineTo(0.2, -h);
    shape.lineTo(w, -h);
    shape.lineTo(w, h);
    shape.lineTo(-w, h);
    shape.closePath();

    // Lỗ ngàm khóa 2 bên mép
    const leftHole = new THREE.Path();
    leftHole.absarc(-w + 0.15, 0, 0.08, 0, Math.PI * 2, false);
    shape.holes.push(leftHole);

    const rightHole = new THREE.Path();
    rightHole.absarc(w - 0.15, 0, 0.08, 0, Math.PI * 2, false);
    shape.holes.push(rightHole);

    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });
  }, [width, height, depth]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial {...RETRO_PBR_PRESETS.pcbGreen} />
    </mesh>
  );
}
```

### B. Chi tiết Lặp lại Số lượng lớn bằng `<Instances>` (Giữ 60 FPS)
Bắt buộc dùng `<Instances>` từ `@react-three/drei` cho:
- Chân kim CPU PGA (hàng trăm chân vàng quanh đế chip).
- Hàng chân cắm IDE/Jumper Header trên Mainboard.
- Lá nhôm tản nhiệt Heatsink và dàn chip nhớ đen trên thanh RAM.

```tsx
import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { RETRO_PBR_PRESETS } from '../materials/retroMaterials';

export function CpuPinGrid({ gridSize = 19, innerCutout = 9, spacing = 0.11 }) {
  const pinPositions = useMemo(() => {
    const coords: [number, number, number][] = [];
    const half = (gridSize - 1) / 2;
    const cutoutHalf = (innerCutout - 1) / 2;

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const dx = x - half;
        const dz = z - half;
        // Bỏ trống vùng bụng giữa của đế PGA Socket 7
        if (Math.abs(dx) <= cutoutHalf && Math.abs(dz) <= cutoutHalf) continue;
        coords.push([dx * spacing, -0.08, dz * spacing]);
      }
    }
    return coords;
  }, [gridSize, innerCutout, spacing]);

  return (
    <Instances limit={pinPositions.length} castShadow>
      <cylinderGeometry args={[0.018, 0.018, 0.16, 6]} />
      <meshStandardMaterial {...RETRO_PBR_PRESETS.goldContacts} />
      {pinPositions.map((pos, idx) => (
        <Instance key={idx} position={pos} />
      ))}
    </Instances>
  );
}
```

### C. Dây cáp Uốn lượn bằng `CatmullRomCurve3` (IDE Ribbon & Dây Nguồn Molex)
- **Dây tròn (Molex / AT Power):** Dùng `THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false)`.
- **Cáp bẹ dẹt (IDE 40-pin Ribbon):** Dùng `THREE.ExtrudeGeometry` với mặt cắt ngang hình chữ nhật dẹt trượt dọc theo `CatmullRomCurve3`, kết hợp một sợi chỉ đỏ mảnh ở mép đánh dấu Pin 1 (`#b82525`):

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { RETRO_PBR_PRESETS } from '../materials/retroMaterials';

interface IdeRibbonProps {
  points: [number, number, number][];
  ribbonWidth?: number;
  ribbonThickness?: number;
}

export function IdeRibbonCable({
  points,
  ribbonWidth = 1.2,
  ribbonThickness = 0.03,
}: IdeRibbonProps) {
  const { bodyGeo, pin1Geo } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
      false,
      'catmullrom',
      0.5
    );

    // Tiết diện thân cáp xám
    const bodyShape = new THREE.Shape();
    const w = ribbonWidth / 2;
    const t = ribbonThickness / 2;
    bodyShape.moveTo(-w, -t);
    bodyShape.lineTo(w, -t);
    bodyShape.lineTo(w, t);
    bodyShape.lineTo(-w, t);
    bodyShape.closePath();

    // Tiết diện viền đỏ Pin 1 ở mép cáp
    const stripeWidth = ribbonWidth * 0.08;
    const stripeShape = new THREE.Shape();
    stripeShape.moveTo(-w, -t * 1.05);
    stripeShape.lineTo(-w + stripeWidth, -t * 1.05);
    stripeShape.lineTo(-w + stripeWidth, t * 1.05);
    stripeShape.lineTo(-w, t * 1.05);
    stripeShape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 64,
      bevelEnabled: false,
      extrudePath: curve,
    };

    return {
      bodyGeo: new THREE.ExtrudeGeometry(bodyShape, extrudeSettings),
      pin1Geo: new THREE.ExtrudeGeometry(stripeShape, extrudeSettings),
    };
  }, [points, ribbonWidth, ribbonThickness]);

  return (
    <group>
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshStandardMaterial {...RETRO_PBR_PRESETS.ideRibbonGray} />
      </mesh>
      <mesh geometry={pin1Geo}>
        <meshStandardMaterial {...RETRO_PBR_PRESETS.idePin1Red} />
      </mesh>
    </group>
  );
}
```

### D. Nhãn dán, Chữ in trên Chip & Đường mạch bằng `THREE.CanvasTexture`
Mọi thông số in trên linh kiện (ví dụ: `"Intel Pentium MMX 233MHz"`, nhãn ổ cứng Quantum Fireball, vạch mã vạch, đường mạch đồng trên PCB) đều được vẽ bằng HTML5 `<canvas>` 2D:

```tsx
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export function useCpuLabelTexture(title: string, subtitle: string, serial: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Nền kim loại/gốm tối của nắp CPU
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 512, 512);

    // Viền mạ vàng kỹ thuật
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, 464, 464);

    // Chữ in laser (Silkscreen)
    ctx.fillStyle = '#d8d2c5';
    ctx.font = 'bold 42px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), 256, 200);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillText(subtitle.toUpperCase(), 256, 260);

    ctx.fillStyle = '#9ea3a8';
    ctx.font = '20px "IBM Plex Mono", monospace';
    ctx.fillText(`S/N: ${serial}`, 256, 420);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, [title, subtitle, serial]);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return texture;
}
```

---

## 4. Đồng bộ Cuộn Trang & Lắp Ráp (`GSAP ScrollTrigger` + `Zustand`)

- **Nguyên tắc hiệu năng:** Không cập nhật React state ở mỗi frame cuộn chuột cho tọa độ 3D. Hãy dùng `GSAP timeline` điều khiển trực tiếp `ref.current.position` / `ref.current.rotation` của từng nhóm linh kiện 3D, hoặc đọc giá trị tiến trình trong `useFrame` để nội suy (`THREE.MathUtils.lerp`).
- Chỉ cập nhật `Zustand` (`setCurrentStep`) khi vượt qua mốc trạm lắp ráp (`STEP 01` → `STEP 10`) để kích hoạt hiệu ứng âm thanh `howler` và đổi nội dung **Spec Sheet Card** trên giao diện 2D.

---

## 5. Xây dựng Giao diện 2D Retro (Hardware Manual + Win95 HUD)

### A. Utility Classes cho 3D Bevel & Workbench Grid (`retro-tokens.css`)

```css
/* Nền bàn kỹ thuật kèm lưới thảm cắt (Cutting Mat Grid) */
.workbench-surface {
  background-color: #141413;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
}

/* Hộp nổi chuẩn Windows 95 (Outset 2px, góc vuông 0px) */
.win95-outset {
  background-color: #c0c0c0;
  color: #000000;
  border-radius: 0px;
  box-shadow:
    inset 1px 1px 0px #ffffff,
    inset -1px -1px 0px #808080,
    inset 2px 2px 0px #dfdfdf,
    inset -2px -2px 0px #000000;
}

/* Khung lõm cho màn hình LED / Ô thông số / Nút đang được nhấn (Inset 2px) */
.win95-inset {
  background-color: #000000;
  border-radius: 0px;
  box-shadow:
    inset 1px 1px 0px #808080,
    inset -1px -1px 0px #ffffff,
    inset 2px 2px 0px #000000,
    inset -2px -2px 0px #dfdfdf;
}

/* Chữ phát sáng CRT Phosphor Green */
.crt-phosphor-text {
  color: #33ff33;
  text-shadow: 0 0 8px rgba(51, 255, 51, 0.6);
  font-family: 'VT323', 'JetBrains Mono', monospace;
}
```

### B. Checklist Kiểm định Chất lượng (Validation Checklist)
Trước khi hoàn tất bất kỳ component nào trong dự án, hãy kiểm tra:
1. **Không có GLB/GLTF:** Đảm bảo không có lệnh gọi `useGLTF` hoặc file `.glb`/`.gltf` nào trong thư mục `public/` hay `src/`.
2. **Kiểm tra Draw Calls:** Các chi tiết lặp lại (>10 phần tử giống nhau như chân kim CPU, chân cắm jumper, lá tản nhiệt, ốc vít) đã được bọc trong `<Instances>` chưa?
3. **Kiểm tra Bảng màu 1997:** Toàn bộ `meshStandardMaterial` đã sử dụng đúng mã hex và thông số `roughness`/`metalness` trong `RETRO_PBR_PRESETS` chưa?
4. **Kiểm tra Zero Border-Radius:** Đảm bảo không có class Tailwind `rounded-*` nào vô tình được áp vào các hộp thoại, nút bấm hoặc Spec Sheet Card trên giao diện 2D.

