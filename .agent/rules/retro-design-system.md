---
trigger: always_on
description: Quy chuẩn Kiến trúc Công nghệ, Dựng hình 3D Procedural (No-GLB), Bảng Vật liệu PBR 1997 và Hệ thống Giao diện Retro (Hardware Manual + Win95/BIOS) cho dự án Portfolio 3D.
---

# RETRO 1997 PROCEDURAL 3D & DESIGN SYSTEM RULES

Mọi mã nguồn, component 3D và giao diện 2D trong dự án Portfolio này bắt buộc phải tuân thủ nghiêm ngặt các quy tắc kiến trúc và ngôn ngữ thiết kế dưới đây.

---

## 1. QUY CHUẨN TECH STACK (TECH STACK SPECIFICATION)

- **Core:** Vite + React + TypeScript (Strict typing cho toàn bộ props, 3D refs và Zustand store).
- **3D Procedural Engine:** `three` + `@react-three/fiber` (R3F) + `@react-three/drei`.
- **Animation & Scroll:** `gsap` + `ScrollTrigger` (đồng bộ hóa tiến trình cuộn trang với timeline lắp ghép phần cứng 3D và trạng thái UI).
- **State & GUI:**
  - `zustand`: Quản lý trạng thái lắp ráp (`currentStep`, `turboMode`, `activeComponent`, `explodedProgress`, `audioMuted`).
  - `leva`: Tinh chỉnh thông số tọa độ, góc xoay, vật liệu PBR và ánh sáng trực tiếp trong quá trình phát triển.
  - `howler`: Quản lý âm thanh cơ học (tiếng click công tắc AT, tiếng quạt quay, tiếng ổ đĩa mềm Floppy seek, tiếng bíp POST BIOS, tiếng lạch cạch lắp khe ISA/PCI).
- **Styling:** Tailwind CSS kết hợp biến CSS thuần (CSS Custom Properties) cho hệ thống Bevel/Border 3D kiểu Windows 95 và lưới kỹ thuật (Blueprint/Cutting Mat).

---

## 2. QUY TẮC DỰNG HÌNH 3D BẰNG CODE (100% PROCEDURAL THREE.JS - NO EXTERNAL GLB)

> **CẤM TUYỆT ĐỐI:** Không tải hoặc sử dụng bất kỳ file mô hình `.glb`, `.gltf`, `.obj`, `.fbx` hoặc texture ảnh tĩnh bên ngoài. Toàn bộ linh kiện máy tính năm 1997 phải được sinh bằng code (100% Procedural Geometry & Procedural CanvasTexture).

### A. Phân bổ Kỹ thuật Dựng hình theo Linh kiện
1. **Khung vỏ (Case), Mainboard, Thanh RAM, Thân CPU, Ổ đĩa (FDD/HDD/CD-ROM):**
   - Sử dụng `<RoundedBox>` (từ `@react-three/drei`) cho các khối nhựa vát cạnh nhẹ hoặc kim loại dập.
   - Sử dụng `THREE.BoxGeometry` hoặc `THREE.ExtrudeGeometry` kết hợp `THREE.Shape` (có `holes` / rãnh khuyết notch) cho bản mạch PCB, khe cắm Socket 7, khe RAM SIMM/DIMM, khe ISA/PCI.
2. **Tụ điện hóa học, Chân ốc đồng (Standoffs), Cổng DIN-5 / PS/2, Quạt tản nhiệt:**
   - Sử dụng `THREE.CylinderGeometry`, `THREE.RingGeometry` và `THREE.TorusGeometry`.
   - Cánh quạt tản nhiệt được dựng bằng các lát `BoxGeometry` hoặc `ExtrudeGeometry` xoay nghiêng quanh trục tâm bằng vòng lặp toán học (`Math.cos`, `Math.sin`).
3. **Chân kim CPU (PGA Pins), Hàng chân cắm Jumper/Header, Rãnh tản nhiệt Heatsink, Chip nhớ RAM:**
   - **BẮT BUỘC** sử dụng `<Instances>` / `<Instance>` (Drei) hoặc `THREE.InstancedMesh` để gộp hàng trăm chi tiết lặp lại vào **1 draw call duy nhất**, đảm bảo hiệu năng ổn định ở **60 FPS**.
4. **Dây cáp (IDE Ribbon 40-pin, Cáp nguồn Molex 4-pin, Dây công tắc nguồn AT):**
   - Sử dụng `THREE.CatmullRomCurve3` đi qua mảng các điểm chốt `THREE.Vector3`.
   - Dùng `THREE.TubeGeometry` cho dây tròn (Molex, dây nguồn AT, dây LED mặt trước) và `THREE.ExtrudeGeometry` tiết diện chữ nhật dẹt cho cáp bẹ IDE Ribbon.
5. **Nhãn dán (Stickers), Chữ in trên chip (Silkscreen), Đường mạch PCB, Đồng hồ LED 7-đoạn:**
   - Khởi tạo động bằng HTML5 `<canvas>` 2D, vẽ chữ/họa tiết bằng Canvas API rồi đóng gói qua `new THREE.CanvasTexture(canvas)`.
   - Nhớ gọi `texture.needsUpdate = true`, cấu hình `anisotropy` hoặc `magFilter = THREE.NearestFilter` (với font pixel/LED) và giải phóng bộ nhớ (`dispose`) khi unmount.

---

## 3. BẢNG VẬT LIỆU PBR & MÀU SẮC CHUẨN (RETRO PALETTE & MATERIALS)

Mọi mesh 3D và thành phần giao diện 2D phải lấy mã màu từ bảng chuẩn phần cứng năm 1997 dưới đây (không tự ý pha màu lệch tông):

### A. Vật liệu 3D (`meshStandardMaterial` / `meshPhysicalMaterial`)

| Tên Vật Liệu (Token) | Ứng dụng Linh kiện | `color` | `roughness` | `metalness` | Ghi chú |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Retro Beige Plastic** | Vỏ Case AT, Màn CRT, Mặt nạ Ổ Floppy/CD | `#d8d2c5` | `0.65` | `0.05` | Nhựa ABS ngả màu kem cổ điển |
| **Aged Dark Beige** | Phím bấm phụ, Khung đỡ ổ đĩa, Nút Eject | `#b8b0a0` | `0.70` | `0.05` | Tạo độ tương phản phân khối trên vỏ |
| **Classic PCB Green** | Mainboard ASUS Socket 7, Card âm thanh/VGA | `#1a472a` | `0.45` | `0.15` | Lớp phủ solder mask bóng mờ nhẹ |
| **Ceramic CPU Purple/Brown** | Đế gốm chip Intel Pentium MMX | `#2b2321` | `0.50` | `0.10` | Gốm kỹ thuật nhám mờ |
| **Galvanized Steel** | Vỏ nguồn AT PSU, Khung sắt trong, Nắp HDD | `#8c9296` | `0.35` | `0.85` | Thép mạ kẽm phản xạ kim loại |
| **Anodized Black Aluminum** | Khối tản nhiệt Heatsink, Khe cắm ISA, Chip IC | `#1e1e1e` | `0.40` | `0.60` | Nhôm sơn tĩnh điện / nhựa IC đen |
| **Gold Pins & Contacts** | Chân kim CPU, Chân RAM, Đệm ốc đồng | `#d4af37` | `0.20` | `1.00` | Bắt sáng mạnh tạo điểm nhấn thị giác |
| **IDE Ribbon Gray** | Thân cáp bẹ IDE / Floppy | `#9ea3a8` | `0.80` | `0.05` | Nhựa PVC xám nhám |
| **IDE Pin-1 Red Stripe** | Viền đỏ đánh dấu Pin 1 trên cáp IDE | `#b82525` | `0.80` | `0.05` | Chạy dọc mép ngoài cáp IDE |

### B. Bảng màu Giao diện 2D (UI/HUD Color Tokens)

```css
:root {
  /* Workbench & Grid */
  --workbench-bg: #141413;
  --cutting-mat-grid: rgba(255, 255, 255, 0.04);
  --cutting-mat-major: rgba(255, 255, 255, 0.09);

  /* Windows 95 / System Gray & Bevels */
  --win95-gray: #c0c0c0;
  --win95-text: #000000;
  --bevel-highlight: #ffffff;
  --bevel-shadow: #808080;
  --bevel-dark-shadow: #000000;

  /* BIOS, CRT & LED Indicators */
  --bios-blue: #0000aa;
  --crt-green: #33ff33;
  --crt-green-glow: 0 0 8px rgba(51, 255, 51, 0.6);
  --led-turbo-red: #ff2a2a;
  --led-amber: #ffb000;
}
```

---

## 4. NGÔN NGỮ THIẾT KẾ GIAO DIỆN (UI/UX DESIGN LANGUAGE)

Giao diện 2D phủ trên Canvas 3D là sự giao thoa giữa **Sách hướng dẫn lắp ráp phần cứng thập niên 90 (Hardware Assembly Manual)** và **Hệ điều hành cổ điển (Award BIOS / Windows 95)**:

### A. Typography
- **Tiêu đề & Chỉ số bước lắp ráp (`01 / 10`):** Sử dụng font Monospace / Pixel hoặc Serif cổ điển kiểu quảng cáo IBM/Apple thập niên 90 (`JetBrains Mono`, `VT323`, hoặc `IBM Plex Mono`).
- **Nội dung Spec Sheet & Portfolio:** Font kỹ thuật sắc nét, kích thước nhỏ gọn (`11px` – `13px`), căn lề chuẩn bảng biểu kỹ thuật.
- **Nhãn thông số (Field Labels):** Bắt buộc viết hoa (`text-transform: uppercase`, `letter-spacing: 0.08em`) cho các trường như `CLOCK SPEED`, `INTERFACE`, `ARCHITECTURE`, `ROLE`, `TECH STACK`, `YEAR`.

### B. Quy tắc Component UI Đặc trưng
1. **3D Bevel Borders (Zero Border-Radius):**
   - Nghiêm cấm dùng `border-radius` bo tròn hiện đại (`border-radius: 0px` trên toàn bộ UI).
   - Các nút bấm, cửa sổ và thanh trạng thái phải sử dụng viền nổi 3D 2 lớp (`outset` cho panel/button nhô lên, `inset` cho màn hình LCD/ô nhập liệu/nút đang nhấn) hoặc khung viền mảnh kẻ ô kiểu bản vẽ kỹ thuật (Blueprint Table `1px solid`).
2. **7-Segment LED Widget & Nút `TURBO`:**
   - Đặt ở góc màn hình, mô phỏng cụm đèn LED 7 đoạn trên thùng máy AT cổ điển hiển thị xung nhịp (`66` MHz ở chế độ thường và `233` MHz khi bật `TURBO`).
   - Nút bấm vật lý `TURBO` có hiệu ứng lún cơ học (đảo chiều bevel highlight/shadow khi active) kèm âm thanh click từ `howler`, đồng thời tăng tốc độ hiệu ứng/quạt trong cảnh 3D.
3. **Spec Sheet Card (Datasheet Portfolio Content):**
   - Khi người dùng cuộn trang tới bước lắp ráp linh kiện nào (ví dụ: CPU = Core Engineering/Backend, GPU = Creative Coding/Shaders, RAM = State & Performance, HDD = Featured Projects, Mainboard = System Architecture), bảng thông tin xuất hiện dưới dạng **"Phiếu thông số linh kiện (Hardware Datasheet)"**.
   - Mỗi Datasheet gồm: Mã linh kiện (`PART NO.`), Sơ đồ chân/khối, Bảng thông số kỹ thuật ánh xạ trực tiếp tới kỹ năng/dự án thực tế của ứng viên.
4. **Workbench Mat HUD (Thước đo lắp ráp đáy màn hình):**
   - Thanh tiến trình cuộn nằm sát đáy màn hình được thiết kế như vạch chia milimet/centimet trên thảm cắt kỹ thuật (Cutting Mat Ruler), đánh dấu rõ vị trí từng trạm lắp ráp (`STEP 01` → `STEP 10`).

