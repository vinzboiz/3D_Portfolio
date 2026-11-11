import { useMemo, useEffect, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { IbmModelMKeyboard } from './IbmModelMKeyboard';
import {
  useBuildStore,
  DEGAUSS_MS,
  type DesktopWindowId,
} from '../../../store/useBuildStore';
import { PressableControl } from '../interaction/PressableControl';
import { CRTShader } from '../materials/CRTShader';
import {
  drawCrtScreen,
  handleCrtScreenClick,
  getCrtScreenHoverInfo,
} from './crtOsRenderer';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smooth(v: number, min: number, max: number): number {
  const t = clamp01((v - min) / (max - min));
  return t * t * (3 - 2 * t);
}

/**
 * 1. Hàm vẽ động lên CanvasTexture mặt kính màn hình CRT Sony Trinitron Multiscan 100ES
 * được quản lý tập trung bởi crtOsRenderer.ts (Award BIOS POST -> Boot Logo -> Login -> Desktop & Windows)
 */

/**
 * 2. Tạo CanvasTexture cho Màn hình Sony Trinitron Multiscan 100ES
 */
function createCrtScreenCanvasTexture(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return { canvas, ctx, texture };
}

/**
 * 2. Tạo bộ CanvasTexture cho Mặt Trước của Sony Trinitron Multiscan 100ES (Ảnh 1):
 * - Góc trên trái: chữ "Trinitron" (nền trong suốt để tiệp tuyệt đối với vỏ nhựa beigePlastic)
 * - Góc trên phải: chữ "Multiscan 100ES" (nền trong suốt)
 * - Chính giữa viền dưới: Logo "SONY" chữ bạc nổi trên nền nhựa
 * - Nút nguồn vuông có icon nguồn (|)
 */
function createSonyFrontBezelTextures() {
  // A. Tem chữ "Trinitron" góc trên bên trái (Nền trong suốt hoàn toàn)
  const trinitronCanvas = document.createElement('canvas');
  trinitronCanvas.width = 256;
  trinitronCanvas.height = 64;
  const tCtx = trinitronCanvas.getContext('2d')!;
  tCtx.clearRect(0, 0, 256, 64);
  tCtx.fillStyle = '#2d2b28';
  tCtx.font = 'bold 34px Georgia, serif';
  tCtx.fillText('Trinitron', 12, 44);
  const trinitronTex = new THREE.CanvasTexture(trinitronCanvas);
  trinitronTex.colorSpace = THREE.SRGBColorSpace;

  // B. Tem chữ "Multiscan 100ES" góc trên bên phải (Nền trong suốt hoàn toàn)
  const multiscanCanvas = document.createElement('canvas');
  multiscanCanvas.width = 384;
  multiscanCanvas.height = 64;
  const mCtx = multiscanCanvas.getContext('2d')!;
  mCtx.clearRect(0, 0, 384, 64);
  mCtx.fillStyle = '#4a4640';
  mCtx.font = 'italic bold 24px "IBM Plex Mono", sans-serif';
  mCtx.fillText('Multiscan', 10, 42);
  mCtx.fillStyle = '#22201d';
  mCtx.font = 'bold 34px "JetBrains Mono", sans-serif';
  mCtx.fillText('100ES', 190, 44);
  const multiscanTex = new THREE.CanvasTexture(multiscanCanvas);
  multiscanTex.colorSpace = THREE.SRGBColorSpace;

  // C. Logo "SONY" chữ nổi ánh bạc đặt chính giữa cạnh dưới màn hình (Nền trong suốt)
  const sonyLogoCanvas = document.createElement('canvas');
  sonyLogoCanvas.width = 256;
  sonyLogoCanvas.height = 64;
  const sCtx = sonyLogoCanvas.getContext('2d')!;
  sCtx.clearRect(0, 0, 256, 64);
  sCtx.fillStyle = '#2c2a27';
  sCtx.font = 'bold 46px Georgia, "Times New Roman", serif';
  sCtx.textAlign = 'center';
  sCtx.fillText('SONY', 130, 49);
  const silverGrad = sCtx.createLinearGradient(0, 10, 0, 52);
  silverGrad.addColorStop(0, '#f0efec');
  silverGrad.addColorStop(0.5, '#a8acb0');
  silverGrad.addColorStop(1, '#585c60');
  sCtx.fillStyle = silverGrad;
  sCtx.fillText('SONY', 128, 47);
  const sonyLogoTex = new THREE.CanvasTexture(sonyLogoCanvas);
  sonyLogoTex.colorSpace = THREE.SRGBColorSpace;

  // D. Mặt nút nguồn vuông bên phải thanh điều khiển dưới
  const powerBtnCanvas = document.createElement('canvas');
  powerBtnCanvas.width = 128;
  powerBtnCanvas.height = 128;
  const pCtx = powerBtnCanvas.getContext('2d')!;
  pCtx.fillStyle = '#d8d2c5';
  pCtx.fillRect(0, 0, 128, 128);
  pCtx.strokeStyle = '#9a9384';
  pCtx.lineWidth = 4;
  pCtx.strokeRect(4, 4, 120, 120);
  // Vòng tròn & vạch nguồn (|) ở tâm
  pCtx.strokeStyle = '#4a4742';
  pCtx.lineWidth = 5;
  pCtx.beginPath();
  pCtx.arc(64, 66, 22, 0.35 * Math.PI, 0.65 * Math.PI, true);
  pCtx.stroke();
  pCtx.beginPath();
  pCtx.moveTo(64, 38);
  pCtx.lineTo(64, 66);
  pCtx.stroke();
  const powerBtnTex = new THREE.CanvasTexture(powerBtnCanvas);
  powerBtnTex.colorSpace = THREE.SRGBColorSpace;

  return { trinitronTex, multiscanTex, sonyLogoTex, powerBtnTex };
}

/**
 * 3. Tạo CanvasTexture cho Tem nhãn thông số SONY khổ lớn dán ở mặt lưng sau màn hình (Ảnh 2):
 * Có chữ SONY cực lớn ở đầu nhãn, bảng thông số MODEL NO. CPD-100ES, mã vạch Barcode, logo CE / TÜV / UL
 */
function createSonyRearSpecLabelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  // Nền giấy nhãn trắng ngà cổ điển
  ctx.fillStyle = '#e6e3da';
  ctx.fillRect(0, 0, 512, 640);
  ctx.strokeStyle = '#8c887e';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 628);

  // Chữ SONY khổng lồ đậm sắc nét ở phần đầu nhãn (giống hệt ảnh mặt sau)
  ctx.fillStyle = '#181816';
  ctx.font = 'bold 112px Georgia, "Times New Roman", serif';
  ctx.fillText('SONY', 24, 112);

  // Đường kẻ ngang phân cách dưới chữ SONY
  ctx.fillRect(20, 128, 472, 5);

  // Dòng thông số Model & Điện áp
  ctx.font = 'bold 22px "IBM Plex Mono", sans-serif';
  ctx.fillText('MODEL NO.  CPD-100ES', 24, 162);
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillText('TRINITRON COLOR COMPUTER DISPLAY', 24, 190);
  ctx.fillText('100-240V ~ 50/60Hz  1.5A - 0.8A', 24, 216);

  // Mã vạch (Barcode) bên phải giống ảnh thật
  ctx.fillStyle = '#111111';
  for (let x = 290; x < 476; x += 6) {
    const barW = (x * 7) % 5 === 0 ? 4 : 2;
    ctx.fillRect(x, 232, barW, 32);
  }
  ctx.font = '14px "IBM Plex Mono", monospace';
  ctx.fillText('S/N  7048291 - ICH', 302, 280);

  // Các khung bảng thông số & cảnh báo an toàn chia 2 cột
  ctx.strokeStyle = '#33312e';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 296, 224, 190);
  ctx.strokeRect(256, 296, 236, 110);
  ctx.strokeRect(256, 416, 236, 70);

  ctx.font = 'bold 15px "IBM Plex Mono", sans-serif';
  ctx.fillText('CAUTION / ATTENTION', 28, 320);
  ctx.font = '13px "IBM Plex Mono", sans-serif';
  ctx.fillText('HIGH VOLTAGE INSIDE.', 28, 344);
  ctx.fillText('DO NOT REMOVE REAR COVER.', 28, 364);
  ctx.fillText('REFER SERVICING TO QUALIFIED', 28, 384);
  ctx.fillText('SERVICE PERSONNEL ONLY.', 28, 404);
  ctx.fillText('MANUFACTURED: NOV 1997', 28, 440);
  ctx.fillText('CHASSIS NO. SCC-L14A-A', 28, 464);

  // Các huy hiệu chứng nhận CE / TÜV / GS / UL bên khung phải
  ctx.font = 'bold 26px "JetBrains Mono", sans-serif';
  ctx.fillText('CE   UL   TÜV', 268, 344);
  ctx.font = '14px "IBM Plex Mono", sans-serif';
  ctx.fillText('LISTED 42G9 E129843', 268, 376);
  ctx.fillText('LOW RADIATION MPR-II', 268, 396);
  ctx.fillText('EPA ENERGY STAR COMPLIANT', 268, 446);
  ctx.fillText('SONY CORPORATION TOKYO JAPAN', 268, 470);

  // Phần chân nhãn
  ctx.font = 'bold 20px "IBM Plex Mono", sans-serif';
  ctx.fillText('MADE IN U.K.', 24, 545);
  ctx.font = '15px "IBM Plex Mono", monospace';
  ctx.fillText('3-860-921-01', 356, 608);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 4. Tạo CanvasTexture có nền trong suốt cho các mảng lưới khe tản nhiệt đục lỗ (Top & Side Ventilation Grille)
 * đúng như ảnh chụp mặt lưng và hông của Sony Trinitron 100ES (Ảnh 2)
 */
function createCrtVentGrilleTexture(cols: number, rows: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const padX = 24;
  const padY = 24;
  const cellW = (512 - padX * 2) / cols;
  const cellH = (512 - padY * 2) / rows;
  const slotW = Math.max(4, cellW * 0.42);
  const slotH = Math.max(8, cellH * 0.66);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * cellW + (cellW - slotW) * 0.5;
      const y = padY + r * cellH + (cellH - slotH) * 0.5;
      // Viền vát âm quanh lỗ thông gió
      ctx.fillStyle = 'rgba(145, 138, 124, 0.85)';
      ctx.fillRect(x - 1, y - 1, slotW + 2, slotH + 2);
      // Khe tối bên trong
      ctx.fillStyle = '#22201d';
      ctx.fillRect(x, y, slotW, slotH);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 5. Tạo CanvasTexture cho bề mặt lưng Chuột Bi Logitech M-S34 (Ảnh mẫu):
 * - Toàn bộ vỏ và 2 phím bấm đồng màu xám trắng ngà cổ điển (#d8d2c5)
 * - Khe rãnh chữ T (đường ngang hơi cong nhẹ + đường dọc chia 2 phím Trái/Phải)
 * - Logo Logitech thập niên 90 (Biểu tượng mặt trời/con mắt cách điệu + chữ "Logitech" màu đen) nằm ngay dưới rãnh ngang
 */
function createLogitechMS34Texture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Nền nhựa xám kem đồng nhất của Logitech M-S34
  const grad = ctx.createRadialGradient(256, 340, 30, 256, 380, 420);
  grad.addColorStop(0, '#ded9cc');
  grad.addColorStop(0.65, '#d5cfc2');
  grad.addColorStop(1, '#c4bdb0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  // Đường rãnh ngang hơi cong nhẹ phân tách 2 nút bấm với phần thân lưng (tại t ≈ 0.31 -> y ≈ 238)
  // Công thức khớp với rãnh 3D: t_seam(s) = 0.31 + 0.022 * s^2
  ctx.lineCap = 'round';
  // Viền sáng bevel cạnh dưới rãnh ngang
  ctx.strokeStyle = '#ece7dc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(16, (0.31 + 0.022) * 768 + 3);
  ctx.quadraticCurveTo(256, (0.31 - 0.022) * 768 + 3, 496, (0.31 + 0.022) * 768 + 3);
  ctx.stroke();

  // Khe tối chính của rãnh ngang
  ctx.strokeStyle = '#22201d';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(16, (0.31 + 0.022) * 768);
  ctx.quadraticCurveTo(256, (0.31 - 0.022) * 768, 496, (0.31 + 0.022) * 768);
  ctx.stroke();

  // Khe rãnh dọc chính giữa chia đôi nút bấm Trái và Phải (từ mũi y = 0 tới rãnh ngang y = 238)
  ctx.strokeStyle = '#ece7dc';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(259, 0);
  ctx.lineTo(259, 0.31 * 768 - 2);
  ctx.stroke();

  ctx.strokeStyle = '#22201d';
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 0.31 * 768);
  ctx.stroke();

  // LOGO LOGITECH CỔ ĐIỂN THẬP NIÊN 90 (Nằm chính giữa ngay dưới rãnh ngang: y ≈ 290..355)
  ctx.save();
  ctx.translate(256, 300);

  // 1. Nửa vầng trăng / con mắt đậm bên trái
  ctx.fillStyle = '#181816';
  ctx.beginPath();
  ctx.arc(-8, 2, 18, 0.42 * Math.PI, 1.58 * Math.PI, false);
  ctx.quadraticCurveTo(-12, 2, -8, 18);
  ctx.closePath();
  ctx.fill();

  // Hạt nhân nhỏ ở tâm biểu tượng
  ctx.beginPath();
  ctx.arc(-2, 2, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Bốn tia nắng vạch chéo tỏa sang bên phải (đặc trưng của logo Logitech M-S34)
  const rayAngles = [-0.68, -0.22, 0.22, 0.68];
  for (const ang of rayAngles) {
    ctx.save();
    ctx.translate(-1, 2);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.roundRect(10, -2.6, 15, 5.2, 2.5);
    ctx.fill();
    ctx.restore();
  }

  // 3. Dòng chữ "Logitech" sắc nét ngay bên dưới biểu tượng
  ctx.font = 'bold 28px "IBM Plex Sans", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#181816';
  ctx.fillText('Logitech', 0, 46);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 6. Dựng lưới 3D Procedural dáng giọt nước (Teardrop Ergonomic Dome) chuẩn mẫu Logitech M-S34:
 * - Đầu mũi trước hơi vuông nhẹ có vát bo góc tròn, phình rộng nhất ở ngang khớp nút bấm rồi thuôn bầu tròn về đuôi
 * - Lưng uốn vòm công thái học kèm rãnh 3D chữ T chia 2 nút bấm Trái/Phải
 */
function createLogitechMS34Geometry(): THREE.BufferGeometry {
  const segS = 36; // Chiều ngang (-1 .. +1)
  const segT = 48; // Chiều dọc từ mũi (t=0) về đuôi (t=1)

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let it = 0; it <= segT; it++) {
    const t = it / segT; // 0 = Mũi trước (-Z), 1 = Đuôi tròn (+Z)

    // Chiều rộng nửa thân chuột theo t (dáng bầu dục bo tròn đầy đặn ở đuôi chuẩn Logitech M-S34):
    // Mũi trước t=0 rộng 0.084 -> phình tối đa 0.114 ở t=0.30 -> bo tròn bầu dục đầy đặn (Super-ellipse) về đuôi t=1.0
    let halfW: number;
    if (t <= 0.3) {
      const u = t / 0.3;
      halfW = 0.084 + (0.114 - 0.084) * Math.sin(u * Math.PI * 0.5);
    } else {
      const u = (t - 0.3) / 0.7;
      // Công thức Super-ellipse: giữ thân sau bầu tròn đầy đặn, tiếp tuyến vuông góc ở đuôi (không bị nhọn)
      halfW = 0.114 * Math.pow(Math.max(0, 1 - Math.pow(u, 2.35)), 0.42);
    }

    // Độ cao vòm lưng tại đường tâm dọc: uốn vòm đầy đặn và bo tròn êm xuống đuôi
    const arch =
      Math.sin(Math.pow(t, 0.65) * Math.PI) *
      Math.pow(Math.max(0, 1 - Math.pow(t, 3.2)), 0.35);
    const centerH = 0.008 + (1 - t) * 0.024 + 0.072 * arch;

    for (let is = 0; is <= segS; is++) {
      const s = (is / segS) * 2 - 1; // -1 (Trái) .. +1 (Phải)
      const absS = Math.abs(s);

      const x = s * halfW;

      // Mũi trước hơi cong nhẹ ở 2 góc ngoài, phần đuôi giữ đúng cung bầu dục tròn trịa
      const noseCurve = Math.pow(Math.max(0, 1 - t * 2.5), 2) * 0.016 * (s * s);
      const z = -0.18 + t * 0.355 + noseCurve;

      // Mặt cắt ngang vòm công thái học: vòm thoải ở mặt trên và bo tròn xuống chân đế ở 2 mép bên
      let crossProfile: number;
      if (absS <= 0.82) {
        const r = absS / 0.82;
        crossProfile = 0.38 + 0.62 * Math.cos(r * Math.PI * 0.38);
      } else {
        const r = (absS - 0.82) / 0.18;
        crossProfile = 0.38 * Math.cos(r * Math.PI * 0.5);
      }

      let y = 0.006 + centerH * crossProfile;

      // Rãnh âm 3D chữ T (khớp chính xác với đường kẻ trên CanvasTexture)
      const tSeam = 0.31 + 0.022 * (s * s);
      const distTransverse = Math.abs(t - tSeam);
      const isTransverseGroove = distTransverse < 0.014;
      const isCenterButtonGroove = t < tSeam && absS < 0.024;

      if (isTransverseGroove || isCenterButtonGroove) {
        y -= 0.0045;
      }

      positions.push(x, y, z);
      // UV ánh xạ trực tiếp lên CanvasTexture (u: Trái->Phải, v: 1 ở mũi t=0 -> 0 ở đuôi t=1)
      uvs.push((s + 1) * 0.5, 1 - t);
    }
  }

  const stride = segS + 1;
  for (let it = 0; it < segT; it++) {
    for (let is = 0; is < segS; is++) {
      const a = it * stride + is;
      const b = (it + 1) * stride + is;
      const c = (it + 1) * stride + (is + 1);
      const d = it * stride + (is + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export interface PeripheralsCRTProps {
  /** Tiến trình xuất hiện Màn hình CRT Sony Trinitron, Bàn phím IBM Model M, Chuột & Cáp ngoại vi ở Step 10 (0 -> 1) */
  peripheralsProgress: number;
}

export function PeripheralsCRT({ peripheralsProgress }: PeripheralsCRTProps) {
  const currentStep = useBuildStore((s) => s.currentStep);
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const isCrtPowered = useBuildStore((s) => s.isCrtPowered);
  const toggleCrtPower = useBuildStore((s) => s.toggleCrtPower);
  const isResetting = useBuildStore((s) => s.isResetting);
  const bootSequenceAt = useBuildStore((s) => s.bootSequenceAt);
  const bootElapsedTime = useBuildStore((s) => s.bootElapsedTime);
  const osState = useBuildStore((s) => s.osState);
  const tickOsTimeline = useBuildStore((s) => s.tickOsTimeline);
  const loginDesktop = useBuildStore((s) => s.loginDesktop);
  const openWindow = useBuildStore((s) => s.openWindow);
  const closeWindow = useBuildStore((s) => s.closeWindow);
  const bringWindowToFront = useBuildStore((s) => s.bringWindowToFront);
  const activeWindow = useBuildStore((s) => s.activeWindow);
  const openWindows = useBuildStore((s) => s.openWindows);
  const isCdInserted = useBuildStore((s) => s.isCdInserted);
  const insertCdAndCloseTray = useBuildStore((s) => s.insertCdAndCloseTray);
  const floppyInserted = useBuildStore((s) => s.floppyInserted);
  const toggleFloppyInsert = useBuildStore((s) => s.toggleFloppyInsert);
  const cdLocation = useBuildStore((s) => s.cdLocation);
  const cardLocation = useBuildStore((s) => s.cardLocation);
  const osDialogAlert = useBuildStore((s) => s.osDialogAlert);
  const showOsDialogAlert = useBuildStore((s) => s.showOsDialogAlert);
  const dismissOsDialogAlert = useBuildStore((s) => s.dismissOsDialogAlert);
  const handleCdClickOnDesk = useBuildStore((s) => s.handleCdClickOnDesk);
  const handleCdTrayEjectClick = useBuildStore((s) => s.handleCdTrayEjectClick);
  const handleCardClick = useBuildStore((s) => s.handleCardClick);
  const enterProjectApp = useBuildStore((s) => s.enterProjectApp);
  const projectAppTransition = useBuildStore((s) => s.projectAppTransition);
  const crtExpandProgress = useBuildStore((s) => s.crtExpandProgress);
  const setHoveredControl = useBuildStore((s) => s.setHoveredControl);
  const showHudWarning = useBuildStore((s) => s.showHudWarning);

  const crtBrightness = useBuildStore((s) => s.crtBrightness);
  const adjustBrightness = useBuildStore((s) => s.adjustBrightness);
  const crtContrast = useBuildStore((s) => s.crtContrast);
  const adjustContrast = useBuildStore((s) => s.adjustContrast);
  const crtOsdOpen = useBuildStore((s) => s.crtOsdOpen);
  const toggleCrtOsd = useBuildStore((s) => s.toggleCrtOsd);
  const crtHOffset = useBuildStore((s) => s.crtHOffset);
  const crtVOffset = useBuildStore((s) => s.crtVOffset);
  const cycleCrtPosition = useBuildStore((s) => s.cycleCrtPosition);
  const crtScale = useBuildStore((s) => s.crtScale);
  const cycleCrtGeometry = useBuildStore((s) => s.cycleCrtGeometry);
  const degaussTrigger = useBuildStore((s) => s.degaussTrigger);
  const triggerDegauss = useBuildStore((s) => s.triggerDegauss);
  const crtOsdFlash = useBuildStore((s) => s.crtOsdFlash);

  const crtCanvasObj = useMemo(() => createCrtScreenCanvasTexture(), []);
  const crtShaderMat = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CRTShader.uniforms),
      vertexShader: CRTShader.vertexShader,
      fragmentShader: CRTShader.fragmentShader,
    });
    mat.uniforms.uTexture.value = crtCanvasObj.texture;
    return mat;
  }, [crtCanvasObj]);

  const collapseRef = useRef(isPoweredOn && isCrtPowered ? 0 : 1);
  const frontTextures = useMemo(() => createSonyFrontBezelTextures(), []);
  const rearSpecTex = useMemo(() => createSonyRearSpecLabelTexture(), []);
  const topVentTex = useMemo(() => createCrtVentGrilleTexture(18, 10), []);
  const sideVentTex = useMemo(() => createCrtVentGrilleTexture(16, 8), []);
  const mouseTex = useMemo(() => createLogitechMS34Texture(), []);
  const mouseGeo = useMemo(() => createLogitechMS34Geometry(), []);

  // 1. Mặt kính CRT hơi lồi (Convex Cylindrical-Spherical Trinitron Tube) và nằm thụt vào trong hốc Bezel
  const convexScreenGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.42, 1.1, 28, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i); // Chiều ngang màn hình (-0.71 .. +0.71)
      const py = pos.getY(i); // Chiều dọc màn hình (-0.55 .. +0.55)
      const nx = px / 0.71;
      const ny = py / 0.55;
      // Độ lồi tự nhiên của mặt kính đèn hình CRT: lồi nhẹ ở tâm, mép ôm khít hốc âm
      const bulge =
        Math.cos(nx * (Math.PI * 0.46)) *
        0.048 *
        Math.cos(ny * (Math.PI * 0.36));
      pos.setZ(i, bulge);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 2. Hốc vát âm 4 cạnh cắt góc 45° liền mạch (Mitered Recessed Inner Bezel Frame)
  // Nối từ mép ngoài khung Bezel (x = 0.618) thụt sâu vào mép kính CRT (x = 0.505) mà không có bất kỳ khe hở hay vết chồng khối nào ở 4 góc!
  const recessedChamferGeo = useMemo(() => {
    const xOut = 0.618;
    const yOutTop = 1.735;
    const yOutBot = 0.615;
    const zOutLeft = 0.745;
    const zOutRight = -0.745;

    const xIn = 0.502;
    const yInTop = 1.695;
    const yInBot = 0.655;
    const zInLeft = 0.695;
    const zInRight = -0.695;

    // 4 mặt vát hình thang nối 4 cạnh ngoài với 4 cạnh trong (hướng pháp tuyến vào lòng màn hình và ra phía trước +X)
    const positions: number[] = [];
    const addQuad = (
      a: [number, number, number],
      b: [number, number, number],
      c: [number, number, number],
      d: [number, number, number]
    ) => {
      positions.push(...a, ...b, ...c, ...a, ...c, ...d);
    };

    // Mặt vát Trên (nhìn xuống + ra trước)
    addQuad(
      [xOut, yOutTop, zOutLeft],
      [xOut, yOutTop, zOutRight],
      [xIn, yInTop, zInRight],
      [xIn, yInTop, zInLeft]
    );
    // Mặt vát Dưới (nhìn lên + ra trước)
    addQuad(
      [xIn, yInBot, zInLeft],
      [xIn, yInBot, zInRight],
      [xOut, yOutBot, zOutRight],
      [xOut, yOutBot, zOutLeft]
    );
    // Mặt vát Trái (+Z_local, nhìn sang phải -Z + ra trước)
    addQuad(
      [xIn, yInTop, zInLeft],
      [xIn, yInBot, zInLeft],
      [xOut, yOutBot, zOutLeft],
      [xOut, yOutTop, zOutLeft]
    );
    // Mặt vát Phải (-Z_local, nhìn sang trái +Z + ra trước)
    addQuad(
      [xOut, yOutTop, zOutRight],
      [xOut, yOutBot, zOutRight],
      [xIn, yInBot, zInRight],
      [xIn, yInTop, zInRight]
    );

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 3. Khối gầm & Khay nút bấm phía dưới đúc liền mạch từ trước ra tận đuôi máy sau (Unified Stepped Lower Control & Rear Skirt)
  // Dùng ExtrudeGeometry kéo dài xuyên suốt từ mặt sau (x = -0.78) tới mặt trước (x = +0.63) để không bao giờ bị tách khối!
  const steppedControlPodGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Trong mặt phẳng (x_shape = -Z_local từ trái sang phải, y_shape = Y_local):
    // Bắt đầu từ đáy trái (-0.75, 0.17) -> đáy phải (+0.75, 0.17)
    shape.moveTo(-0.75, 0.17);
    shape.lineTo(0.75, 0.17);
    // Cạnh phải đi lên tới đỉnh bậc cao bên phải (y = 0.358)
    shape.lineTo(0.75, 0.358);
    // Đi ngang sang giữa phải (x_shape = +0.02)
    shape.lineTo(0.02, 0.358);
    // Đường vát chéo mượt ở chính giữa hạ xuống bậc thấp bên trái (y = 0.322 tại x_shape = -0.09)
    shape.bezierCurveTo(-0.02, 0.358, -0.05, 0.322, -0.09, 0.322);
    // Đi ngang hết nửa bên trái tới (-0.75, 0.322)
    shape.lineTo(-0.75, 0.322);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.41,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    });
    // Xoay để trục extrude hướng dọc theo trục X_local chạy liền mạch từ đuôi sau (x = -0.78) ra mặt trước (x = +0.63)
    geo.rotateY(Math.PI / 2);
    geo.translate(-0.78, 0, 0);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 4. Khối vỏ sau vát dốc (Sloped Rear CRT Funnel Housing) chuẩn theo Ảnh 2
  const slopedRearHousingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.22, 0.48);
    shape.lineTo(0.22, 1.88);
    shape.lineTo(-0.82, 1.56);
    shape.quadraticCurveTo(-0.89, 1.54, -0.89, 1.46);
    shape.lineTo(-0.89, 0.56);
    shape.quadraticCurveTo(-0.89, 0.48, -0.81, 0.48);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 1.52,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.055,
      bevelThickness: 0.055,
    };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.translate(0, 0, -0.76);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // 1. Dây xoắn lò xo Bàn phím IBM Model M (Coiled Spring Keyboard Cable):
  // Đi từ ống cao su sau bàn phím [-1.05, 0.085, 2.16] -> uốn ngang phía trước chân đế CRT (Z = 1.52)
  // -> đi lách qua KHE HỞ giữa Màn hình CRT và Thùng máy PC (X = 0.76) -> vòng ra sau lưng PC -> cắm vuông góc vào đuôi giắc PS/2 Tím [2.43, 2.63, -1.67]
  const keyboardCableGeo = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(-1.048, 0.085, 2.16), // Ống cao su dẫn dây sau bàn phím
      new THREE.Vector3(-1.02, 0.036, 1.86),  // Hạ êm xuống mặt bàn phía sau bàn phím
      new THREE.Vector3(-0.55, 0.028, 1.54),  // Uốn sang phải ở PHÍA TRƯỚC chân đế màn hình CRT (không đâm qua đế CRT)
      new THREE.Vector3(0.25, 0.028, 1.44),   // Tiến về phía khe hở giữa màn hình và thùng PC
      new THREE.Vector3(0.74, 0.028, 1.05),   // Đi vào hành lang khe hở (X = 0.74..0.78)
      new THREE.Vector3(0.76, 0.028, 0.15),   // Chạy dọc khe hở giữa CRT (X <= 0.58) và PC (X >= 1.05)
      new THREE.Vector3(0.76, 0.028, -0.85),  // Tiếp tục chạy dọc khe hở ra phía sau
      new THREE.Vector3(0.84, 0.035, -1.78),  // Ra khỏi khe hở ở phía sau thùng máy
      new THREE.Vector3(1.42, 0.22, -2.02),   // Vòng ra sau lưng thùng PC, bắt đầu nâng độ cao
      new THREE.Vector3(2.12, 1.05, -2.04),   // Đi lên phía sau lưng thùng PC
      new THREE.Vector3(2.41, 2.08, -1.96),   // Tiếp cận cao độ cổng PS/2
      new THREE.Vector3(2.43, 2.63, -1.84),   // Căn thẳng trục vuông góc phía ngoài phích cắm PS/2 Tím
      new THREE.Vector3(2.43, 2.63, -1.66),   // Chạm đúng đuôi ngoài phích cắm PS/2 Tím (không đâm xuyên qua)
    ];

    const baseCurve = new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.5);
    const pts: THREE.Vector3[] = [];
    const totalSamples = 128;
    for (let i = 0; i <= totalSamples; i++) {
      const u = i / totalSamples;
      const p = baseCurve.getPoint(u);
      // Hiệu ứng xoắn lò xo ở đoạn đầu dây trên mặt bàn
      const coilEnv =
        u > 0.04 && u < 0.34 ? Math.sin(((u - 0.04) / 0.3) * Math.PI) : 0;
      const coilAngle = u * Math.PI * 68;
      p.y += Math.abs(Math.sin(coilAngle)) * 0.026 * coilEnv;
      p.x += Math.cos(coilAngle) * 0.018 * coilEnv;
      // Tuyệt đối không cho bất kỳ điểm nào chìm xuống dưới mặt bàn (y >= 0.022)
      p.y = Math.max(0.022, p.y);
      pts.push(p);
    }
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5),
      100,
      0.014,
      8,
      false
    );
  }, []);

  // 2. Cáp màn hình VGA màu trắng ngà/be (Captive Beige VGA Cable):
  // Nối vuông góc từ đuôi ngoài phích VGA xanh dương [2.35, 1.52, -1.67] sang đúng đầu ống cao su sau màn hình CRT [-0.759, 0.471, -1.00]
  const vgaCableGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(2.35, 1.52, -1.67),   // Đuôi ngoài phích cắm VGA xanh dương (không đâm xuyên phích)
        new THREE.Vector3(2.35, 1.5, -1.88),    // Đi thẳng vuông góc ra phía sau phích VGA
        new THREE.Vector3(1.72, 0.92, -1.96),   // Võng tự nhiên trên không phía sau thùng máy
        new THREE.Vector3(0.55, 0.46, -1.78),   // Uốn ngang sang phía sau màn hình CRT
        new THREE.Vector3(-0.42, 0.44, -1.42),  // Hướng về ống cao su màn hình CRT
        new THREE.Vector3(-0.759, 0.468, -1.18), // Căn thẳng trục vuông góc với ống cao su CRT
        new THREE.Vector3(-0.759, 0.471, -1.0),  // Chạm đúng đầu ống cao su Strain-Relief sau CRT
      ],
      false,
      'centripetal',
      0.5
    );
    return new THREE.TubeGeometry(curve, 48, 0.021, 10, false);
  }, []);

  // 3. Cáp nguồn đen nối từ đuôi phích nguồn AC trên nguồn Seasonic [2.21, 3.52, -1.67] sang đuôi phích nguồn AC sau màn hình CRT [-1.276, 0.517, -1.03]
  const acOutCableGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(2.21, 3.52, -1.67),   // Đuôi ngoài phích nguồn AC trên PSU Seasonic
        new THREE.Vector3(2.21, 3.48, -1.9),    // Đi thẳng vuông góc ra sau phích nguồn PSU
        new THREE.Vector3(1.55, 2.15, -2.04),   // Uốn võng mềm mại xuống phía sau
        new THREE.Vector3(0.25, 0.95, -1.92),   // Vòng qua phía sau màn hình CRT
        new THREE.Vector3(-0.92, 0.54, -1.48),  // Hướng về phía ổ nguồn bên trái mặt sau CRT
        new THREE.Vector3(-1.276, 0.517, -1.22), // Căn thẳng trục vuông góc với phích nguồn CRT
        new THREE.Vector3(-1.276, 0.517, -1.03), // Cắm vuông góc vào đuôi phích nguồn AC sau màn hình CRT
      ],
      false,
      'centripetal',
      0.5
    );
    return new THREE.TubeGeometry(curve, 48, 0.023, 10, false);
  }, []);

  // 4. Dây chuột Logitech M-S34 màu xám:
  // Đi từ ống đệm mũi chuột [0.65, 0.045, 2.45] -> lách sang trái ở PHÍA TRƯỚC mặt nạ thùng PC
  // -> chạy dọc KHE HỞ giữa Màn hình CRT và Thùng máy PC (X = 0.88) -> vòng ra sau lưng PC -> cắm vuông góc vào đuôi giắc PS/2 Xám [2.29, 2.63, -1.66]
  const mouseCableGeo = useMemo(() => {
    const waypoints = [
      new THREE.Vector3(0.65, 0.045, 2.45), // Đầu ống cao su chống gập ở mũi chuột Logitech M-S34
      new THREE.Vector3(0.68, 0.026, 2.18), // Hạ êm xuống mặt bàn ở mép trước tấm lót chuột
      new THREE.Vector3(0.78, 0.024, 1.88), // Lách sang bên trái trước khi gặp mặt trước thùng PC (Z = 1.80)
      new THREE.Vector3(0.88, 0.024, 1.52), // Đi vào hành lang khe hở (X = 0.88) giữa CRT và vách trái thùng PC
      new THREE.Vector3(0.88, 0.024, 0.45), // Chạy dọc khe hở song song với dây bàn phím
      new THREE.Vector3(0.88, 0.024, -0.65), // Tiếp tục chạy dọc khe hở ra phía sau
      new THREE.Vector3(0.92, 0.03, -1.72), // Ra khỏi khe hở ở phía sau thùng máy
      new THREE.Vector3(1.38, 0.18, -1.96), // Vòng sang phải phía sau lưng thùng PC
      new THREE.Vector3(1.98, 0.92, -1.98),  // Đi lên dọc phía sau lưng thùng PC
      new THREE.Vector3(2.27, 2.02, -1.92),  // Tiếp cận cao độ cổng PS/2 chuột
      new THREE.Vector3(2.29, 2.63, -1.82),  // Căn thẳng trục vuông góc phía ngoài phích cắm PS/2 Xám
      new THREE.Vector3(2.29, 2.63, -1.66),  // Chạm đúng đuôi ngoài phích cắm PS/2 Xám (không đâm xuyên qua)
    ];
    const baseCurve = new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.5);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const p = baseCurve.getPoint(i / 72);
      p.y = Math.max(0.02, p.y);
      pts.push(p);
    }
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5),
      64,
      0.01,
      8,
      false
    );
  }, []);

  const hoveredCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

  const getCanvasCoords = (uv: THREE.Vector2 | undefined): { x: number; y: number } | null => {
    if (!uv) return null;
    const sux = (uv.x - 0.5 - crtHOffset) / Math.max(0.2, crtScale) + 0.5;
    const suy = (uv.y - 0.5 - crtVOffset) / Math.max(0.2, crtScale) + 0.5;
    if (sux < 0 || sux > 1 || suy < 0 || suy > 1) return null;
    return {
      x: sux * 1024,
      y: (1.0 - suy) * 768,
    };
  };

  const handleScreenPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const coords = getCanvasCoords(e.uv);
    hoveredCanvasPosRef.current = coords;

    if (!coords) {
      document.body.style.cursor = 'auto';
      return;
    }

    const hoverInfo = getCrtScreenHoverInfo(coords.x, coords.y, {
      isPoweredOn,
      isCrtPowered,
      osState,
      bootElapsedTime,
      isResetting,
      cdLocation,
      cardLocation,
      isCdInserted,
      floppyInserted,
      osDialogAlert,
      activeWindow,
      openWindows,
      crtOsdOpen,
      crtOsdFlash,
      crtBrightness,
      crtContrast,
      crtScale,
      crtHOffset,
      crtVOffset,
      hoveredCanvasPos: coords,
    });

    document.body.style.cursor = hoverInfo.isPointer ? 'pointer' : 'auto';

    if (hoverInfo.label) {
      setHoveredControl(hoverInfo.label);
    } else if (useBuildStore.getState().hoveredControl?.startsWith('[CRT OS]')) {
      setHoveredControl(null);
    }
  };

  const handleScreenPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const coords = getCanvasCoords(e.uv);
    if (!coords) return;

    handleCrtScreenClick(
      coords.x,
      coords.y,
      {
        isPoweredOn,
        isCrtPowered,
        osState,
        bootElapsedTime,
        isResetting,
        cdLocation,
        cardLocation,
        isCdInserted,
        floppyInserted,
        osDialogAlert,
        activeWindow,
        openWindows,
        crtOsdOpen,
        crtOsdFlash,
        crtBrightness,
        crtContrast,
        crtScale,
        crtHOffset,
        crtVOffset,
        hoveredCanvasPos: coords,
      },
      {
        loginDesktop,
        openWindow,
        closeWindow,
        bringWindowToFront,
        insertCdAndCloseTray,
        toggleFloppyInsert,
        showHudWarning,
        showOsDialogAlert,
        dismissOsDialogAlert,
        handleCdClickOnDesk,
        handleCdTrayEjectClick,
        handleCardClick,
        enterProjectApp,
      }
    );
  };

  const handleScreenPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoveredCanvasPosRef.current = null;
    document.body.style.cursor = 'auto';
    if (useBuildStore.getState().hoveredControl?.startsWith('[CRT OS]')) {
      setHoveredControl(null);
    }
  };

  const lastCanvasDrawTimeRef = useRef(0);
  const wasCrtActiveRef = useRef(false);

  // Điều khiển các tham số Shader của đèn hình CRT trong useFrame
  useFrame((state, delta) => {
    // Khi chưa tới Step 10, bỏ qua render màn hình CRT để tối ưu GPU và CPU
    if (currentStep < 10) return;

    const dt = Math.min(delta, 0.05);
    const isCrtActive = isPoweredOn && isCrtPowered;

    // Tiến trình boot của thùng PC chạy liên tục trong nền khi máy đã bật
    if (isPoweredOn) {
      tickOsTimeline(performance.now());
    }

    // Hiệu ứng Sập nguồn CRT: co tia sáng khi tắt (uCollapse: 0 -> 1) và giãn mở khi bật (uCollapse: 1 -> 0)
    const targetCollapse = isCrtActive ? 0 : 1;
    collapseRef.current = THREE.MathUtils.damp(collapseRef.current, targetCollapse, 14, dt);

    crtShaderMat.uniforms.uTime.value = state.clock.elapsedTime;
    crtShaderMat.uniforms.uPower.value = isCrtActive ? 1.0 : 0.0;
    crtShaderMat.uniforms.uCollapse.value = collapseRef.current;
    crtShaderMat.uniforms.uBrightness.value = crtBrightness;
    crtShaderMat.uniforms.uContrast.value = crtContrast;
    crtShaderMat.uniforms.uScale.value = crtScale;
    crtShaderMat.uniforms.uOffset.value.set(crtHOffset, crtVOffset);

    // Cường độ khử từ Degauss tắt dần theo hàm mũ trong DEGAUSS_MS (1.2s)
    const degaussElapsed = performance.now() - degaussTrigger;
    if (degaussElapsed < DEGAUSS_MS) {
      const t = degaussElapsed / DEGAUSS_MS;
      crtShaderMat.uniforms.uDegauss.value = Math.exp(-t * 3.5) * (1.0 - t);
    } else {
      crtShaderMat.uniforms.uDegauss.value = 0.0;
    }

    // TỐI ƯU HIỆU NĂNG VẼ CANVAS CRT:
    // 1. Khi màn hình CRT đang TẮT (Step 9 -> 9.85): Chỉ vẽ màn hình tối 1 lần duy nhất, KHÔNG upload texture liên tục mỗi frame
    // 2. Khi màn hình CRT BẬT: Giới hạn tần số vẽ tối đa 30 FPS (~33ms) giúp giải phóng băng thông GPU và triệt tiêu 100% giật lag
    const now = performance.now();
    if (!isCrtActive) {
      if (wasCrtActiveRef.current) {
        drawCrtScreen(crtCanvasObj.ctx, {
          isPoweredOn: false,
          isCrtPowered: false,
          osState: 'OFF',
          bootElapsedTime: 0,
          isResetting: false,
          cdLocation,
          cardLocation,
          isCdInserted: false,
          floppyInserted: false,
          osDialogAlert: null,
          activeWindow: null,
          openWindows: [],
          crtOsdOpen: false,
          crtOsdFlash,
          crtBrightness,
          crtContrast,
          crtScale,
          crtHOffset,
          crtVOffset,
          hoveredCanvasPos: null,
          projectAppTransition: 'IDLE',
          crtExpandProgress: 0,
        });
        crtCanvasObj.texture.needsUpdate = true;
        wasCrtActiveRef.current = false;
      }
      return;
    }

    wasCrtActiveRef.current = true;
    if (now - lastCanvasDrawTimeRef.current >= 33) {
      lastCanvasDrawTimeRef.current = now;
      drawCrtScreen(crtCanvasObj.ctx, {
        isPoweredOn,
        isCrtPowered,
        osState,
        bootElapsedTime,
        isResetting,
        cdLocation,
        cardLocation,
        isCdInserted,
        floppyInserted,
        osDialogAlert,
        activeWindow,
        openWindows,
        crtOsdOpen,
        crtOsdFlash,
        crtBrightness,
        crtContrast,
        crtScale,
        crtHOffset,
        crtVOffset,
        hoveredCanvasPos: hoveredCanvasPosRef.current,
        projectAppTransition,
        crtExpandProgress,
      });
      crtCanvasObj.texture.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      crtCanvasObj.texture.dispose();
      crtShaderMat.dispose();
      frontTextures.trinitronTex.dispose();
      frontTextures.multiscanTex.dispose();
      frontTextures.sonyLogoTex.dispose();
      frontTextures.powerBtnTex.dispose();
      rearSpecTex.dispose();
      topVentTex.dispose();
      sideVentTex.dispose();
      mouseTex.dispose();
      mouseGeo.dispose();
      convexScreenGeo.dispose();
      recessedChamferGeo.dispose();
      steppedControlPodGeo.dispose();
      slopedRearHousingGeo.dispose();
      keyboardCableGeo.dispose();
      vgaCableGeo.dispose();
      acOutCableGeo.dispose();
      mouseCableGeo.dispose();
    };
  }, [
    crtCanvasObj,
    crtShaderMat,
    frontTextures,
    rearSpecTex,
    topVentTex,
    sideVentTex,
    mouseTex,
    mouseGeo,
    convexScreenGeo,
    recessedChamferGeo,
    steppedControlPodGeo,
    slopedRearHousingGeo,
    keyboardCableGeo,
    vgaCableGeo,
    acOutCableGeo,
    mouseCableGeo,
  ]);

  const p = clamp01(peripheralsProgress);
  const appearT = smooth(p, 0.56, 0.88);
  const cableT = smooth(p, 0.78, 0.98);

  if (p <= 0.52) return null;

  const dropY = (1 - appearT) * 2.2;

  return (
    <group>
      {/* =====================================================================
          A. MÀN HÌNH CRT SONY TRINITRON MULTISCAN 100ES (CPD-100ES)
             - +X_local = Mặt trước (+Z_world)
             - -X_local = Mặt sau (-Z_world)
             - +Z_local = Bên trái khi nhìn từ mặt trước (-X_world)
             - -Z_local = Bên phải khi nhìn từ mặt trước (+X_world)
         ===================================================================== */}
      <group
        position={[-0.85, dropY, 0.25]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={Math.max(0.001, appearT * 1.52)}
      >
        {/* -----------------------------------------------------------------
            1. CHÂN ĐẾ XOAY NGHIÊNG (TILT-SWIVEL PEDESTAL BASE)
               Đã loại bỏ thanh trụ vát lệch gây lỗi giao diện dưới chân đế
            ----------------------------------------------------------------- */}
        <RoundedBox
          args={[1.08, 0.065, 1.24]}
          radius={0.024}
          smoothness={3}
          position={[0.04, 0.032, 0]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />
        {/* Cổ trụ xoay (Swivel Neck) nối giữa đế và gầm màn hình */}
        <mesh position={[0.02, 0.13, 0]} castShadow material={retroMaterials.darkBeige}>
          <cylinderGeometry args={[0.38, 0.46, 0.16, 28]} />
        </mesh>

        {/* -----------------------------------------------------------------
            2. CỤM BẢNG ĐIỀU KHIỂN NỔI PHÍA DƯỚI (SEAMLESS STEPPED CONTROL POD - ẢNH 1)
               Đúc liền 1 khối bằng ExtrudeGeometry (không còn vết gãy ở giữa)
            ----------------------------------------------------------------- */}
        <mesh
          geometry={steppedControlPodGeo}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Các nút điều khiển gắn trên mặt trước của thanh Control Pod (x = 0.642) */}
        <group>
          {/* 4 Nút bấm OSD kỹ thuật số nhỏ ở nửa bên trái (+Z_local: 0.60, 0.46, 0.32, 0.18) */}
          {[
            {
              z: 0.6,
              label: '[CLICK] CRT OSD MENU (ENTER / EXIT)',
              action: toggleCrtOsd,
            },
            {
              z: 0.46,
              label: '[CLICK] CRT GEOMETRY / SIZE (CYCLE 90% → 100% → 105%)',
              action: cycleCrtGeometry,
            },
            {
              z: 0.32,
              label: '[CLICK] CRT POSITION (CYCLE H/V CENTER)',
              action: cycleCrtPosition,
            },
            {
              z: 0.18,
              label: '[CLICK] CRT DEGAUSS (DISCHARGE MAGNETIC COIL)',
              action: triggerDegauss,
            },
          ].map((btn, idx) => (
            <group key={`left-osd-${idx}`} position={[0.64, 0.25, btn.z]}>
              <mesh material={retroMaterials.darkBeige}>
                <boxGeometry args={[0.008, 0.028, 0.078]} />
              </mesh>
              <PressableControl
                label={btn.label}
                onPress={btn.action}
                position={[0.005, 0, 0]}
                travel={0.008}
                pressAxis={[-1, 0, 0]}
              >
                <RoundedBox
                  args={[0.016, 0.022, 0.068]}
                  radius={0.005}
                  smoothness={2}
                  material={retroMaterials.beigePlastic}
                />
              </PressableControl>
            </group>
          ))}

          {/* 2 Cặp nút bấm đôi (Rocker Buttons - / +) chỉnh Contrast & Brightness ở nửa bên phải */}
          {/* Cặp Contrast tại z = -0.12 */}
          <group position={[0.64, 0.262, -0.12]}>
            <mesh material={retroMaterials.darkBeige}>
              <boxGeometry args={[0.008, 0.048, 0.168]} />
            </mesh>
            {/* Phím Contrast (+) */}
            <PressableControl
              label="[CLICK] CRT CONTRAST (+)"
              onPress={() => adjustContrast(0.1)}
              position={[0.005, 0, 0.04]}
              travel={0.008}
              pressAxis={[-1, 0, 0]}
            >
              <RoundedBox
                args={[0.016, 0.038, 0.076]}
                radius={0.005}
                smoothness={2}
                material={retroMaterials.beigePlastic}
              />
            </PressableControl>
            {/* Phím Contrast (-) */}
            <PressableControl
              label="[CLICK] CRT CONTRAST (-)"
              onPress={() => adjustContrast(-0.1)}
              position={[0.005, 0, -0.04]}
              travel={0.008}
              pressAxis={[-1, 0, 0]}
            >
              <RoundedBox
                args={[0.016, 0.038, 0.076]}
                radius={0.005}
                smoothness={2}
                material={retroMaterials.beigePlastic}
              />
            </PressableControl>
            {/* Chấm ký hiệu nhỏ in phía trên cặp nút */}
            <mesh position={[0.003, 0.038, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.008, 12]} />
              <meshBasicMaterial color="#4a4640" />
            </mesh>
          </group>

          {/* Cặp Brightness tại z = -0.34 */}
          <group position={[0.64, 0.262, -0.34]}>
            <mesh material={retroMaterials.darkBeige}>
              <boxGeometry args={[0.008, 0.048, 0.168]} />
            </mesh>
            {/* Phím Brightness (+) */}
            <PressableControl
              label="[CLICK] CRT BRIGHTNESS (+)"
              onPress={() => adjustBrightness(0.1)}
              position={[0.005, 0, 0.04]}
              travel={0.008}
              pressAxis={[-1, 0, 0]}
            >
              <RoundedBox
                args={[0.016, 0.038, 0.076]}
                radius={0.005}
                smoothness={2}
                material={retroMaterials.beigePlastic}
              />
            </PressableControl>
            {/* Phím Brightness (-) */}
            <PressableControl
              label="[CLICK] CRT BRIGHTNESS (-)"
              onPress={() => adjustBrightness(-0.1)}
              position={[0.005, 0, -0.04]}
              travel={0.008}
              pressAxis={[-1, 0, 0]}
            >
              <RoundedBox
                args={[0.016, 0.038, 0.076]}
                radius={0.005}
                smoothness={2}
                material={retroMaterials.beigePlastic}
              />
            </PressableControl>
            {/* Chấm ký hiệu nhỏ in phía trên cặp nút */}
            <mesh position={[0.003, 0.038, 0]} rotation={[0, Math.PI / 2, 0]}>
              <circleGeometry args={[0.008, 12]} />
              <meshBasicMaterial color="#4a4640" />
            </mesh>
          </group>

          {/* Đèn LED báo nguồn nhỏ nằm ngay bên trái nút nguồn vuông: Xanh lá (bật), Cam (chờ), Đen tắt */}
          <mesh position={[0.642, 0.262, -0.515]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.011, 0.011, 0.012, 14]} />
            <meshStandardMaterial
              color={!isCrtPowered ? '#141413' : isPoweredOn ? '#33ff33' : '#ffb000'}
              emissive={!isCrtPowered ? '#000000' : isPoweredOn ? '#33ff33' : '#ffb000'}
              emissiveIntensity={!isCrtPowered ? 0 : isPoweredOn ? 1.8 : 1.2}
            />
          </mesh>

          {/* Nút Nguồn (POWER) hình vuông lớn ở ngoài cùng bên phải (-Z_local = -0.625) */}
          <group position={[0.64, 0.268, -0.625]}>
            <mesh material={retroMaterials.darkBeige}>
              <boxGeometry args={[0.01, 0.092, 0.106]} />
            </mesh>
            <PressableControl
              label={`[CLICK] CRT POWER SWITCH (${isCrtPowered ? 'TURN OFF' : 'TURN ON'})`}
              onPress={toggleCrtPower}
              latched={isCrtPowered}
              travel={0.012}
              pressAxis={[-1, 0, 0]}
              position={[0.007, 0, 0]}
            >
              <RoundedBox
                args={[0.018, 0.078, 0.092]}
                radius={0.006}
                smoothness={2}
                material={retroMaterials.beigePlastic}
              />
              <mesh
                position={[0.01, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
              >
                <planeGeometry args={[0.078, 0.068]} />
                <meshStandardMaterial
                  map={frontTextures.powerBtnTex}
                  roughness={0.55}
                  metalness={0.05}
                />
              </mesh>
            </PressableControl>
          </group>
        </group>

        {/* -----------------------------------------------------------------
            3. KHUNG VIỀN MẶT TRƯỚC (FRONT BEZEL COLLAR) & HỐC VÁT ÂM LIỀN KHỐI
            ----------------------------------------------------------------- */}
        {/* A. 4 Thanh khung ngoài của Front Bezel */}
        {/* Thanh Bezel Trên (Top Bar) */}
        <RoundedBox
          args={[0.42, 0.24, 1.88]}
          radius={0.028}
          smoothness={3}
          position={[0.41, 1.855, 0]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />
        {/* Thanh Bezel Dưới (Bottom Bar - chứa logo SONY ở chính giữa) */}
        <RoundedBox
          args={[0.42, 0.26, 1.88]}
          radius={0.028}
          smoothness={3}
          position={[0.41, 0.485, 0]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />
        {/* Thanh Bezel Trái (+Z_local = +0.84) */}
        <RoundedBox
          args={[0.42, 1.24, 0.2]}
          radius={0.028}
          smoothness={3}
          position={[0.41, 1.175, 0.84]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />
        {/* Thanh Bezel Phải (-Z_local = -0.84) */}
        <RoundedBox
          args={[0.42, 1.24, 0.2]}
          radius={0.028}
          smoothness={3}
          position={[0.41, 1.175, -0.84]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Hai ô nắp chữ nhật nhỏ khắc chìm ở phần trên hai bên hông khung trước (Ảnh 2) */}
        {[0.941, -0.941].map((zSide, idx) => (
          <mesh key={`side-latch-${idx}`} position={[0.36, 1.72, zSide]} material={retroMaterials.darkBeige}>
            <boxGeometry args={[0.16, 0.065, 0.004]} />
          </mesh>
        ))}

        {/* B. Hốc vát âm 4 cạnh cắt góc 45° liền khối (Mitered Recessed Chamfer) cùng màu nhựa beigePlastic */}
        <mesh
          geometry={recessedChamferGeo}
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* C. Gioăng viền đen sâu trong lòng hốc kính (Deep CRT Cavity Mask) */}
        <mesh position={[0.495, 1.175, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.44, 1.12]} />
          <meshBasicMaterial color="#0d0e0d" />
        </mesh>

        {/* D. MẶT KÍNH MÀN HÌNH CRT HƠI LỒI VÀ THỤT VÀO TRONG (RECESSED CONVEX CRT GLASS TUBE)
               Hiển thị Award BIOS POST + Retro OS 98 + Sony Trinitron OSD + Custom CRT GLSL Shader
               Gắn tương tác UV Raycasting trực tiếp trên màn hình 3D */}
        <mesh
          geometry={convexScreenGeo}
          position={[0.502, 1.175, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={crtShaderMat}
          onPointerMove={handleScreenPointerMove}
          onPointerDown={handleScreenPointerDown}
          onPointerOut={handleScreenPointerOut}
        />

        {/* E. CÁC TEM CHỮ & LOGO TRÊN VIỀN BEZEL MẶT TRƯỚC (NỀN TRONG SUỐT TIỆP MÀU VỎ) */}
        {/* Góc trên bên trái (+Z_local = +0.56): Chữ "Trinitron" */}
        <mesh position={[0.622, 1.84, 0.56]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.26, 0.064]} />
          <meshStandardMaterial
            map={frontTextures.trinitronTex}
            transparent
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>

        {/* Góc trên bên phải (-Z_local = -0.50): Chữ "Multiscan 100ES" */}
        <mesh position={[0.622, 1.84, -0.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.38, 0.064]} />
          <meshStandardMaterial
            map={frontTextures.multiscanTex}
            transparent
            roughness={0.6}
            metalness={0.05}
          />
        </mesh>

        {/* Chính giữa cạnh dưới (Z_local = 0, Y_local = 0.49): Logo "SONY" chữ nổi ánh bạc */}
        <mesh position={[0.622, 0.49, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.24, 0.06]} />
          <meshStandardMaterial
            map={frontTextures.sonyLogoTex}
            transparent
            roughness={0.35}
            metalness={0.35}
          />
        </mesh>

        {/* -----------------------------------------------------------------
            4. THÂN VỎ SAU VÁT DỐC, LƯỚI TẢN NHIỆT NẰM PHẲNG TRÊN ĐỈNH, NHÃN SONY LỚN & HỘP CỔNG SAU (ẢNH 2)
            ----------------------------------------------------------------- */}
        {/* A. Khối vỏ sau vát dốc chính (Sloped Rear CRT Housing) */}
        <mesh
          geometry={slopedRearHousingGeo}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Mảng lưới khe tản nhiệt nằm phẳng 100% sát mặt lưng dốc phía trên (Đã sửa lỗi dựng đứng) */}
        <group position={[-0.3, 1.776, 0]} rotation={[0, 0, 0.2985]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.88, 1.32]} />
            <meshStandardMaterial
              map={topVentTex}
              transparent
              roughness={0.65}
              metalness={0.05}
            />
          </mesh>
        </group>

        {/* Mảng lưới khe tản nhiệt dọc ở nửa dưới hai bên hông vỏ sau (Side Ventilation Grids - Ảnh 2) */}
        <mesh position={[-0.32, 0.84, 0.816]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.88, 0.52]} />
          <meshStandardMaterial
            map={sideVentTex}
            transparent
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[-0.32, 0.84, -0.816]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.88, 0.52]} />
          <meshStandardMaterial
            map={sideVentTex}
            transparent
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>

        {/* Tem nhãn thông số "SONY" khổ lớn dán ở mặt lưng sau (Rear SONY Spec Sticker - Ảnh 2) */}
        <mesh position={[-0.946, 1.03, 0.16]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.68, 0.82]} />
          <meshStandardMaterial
            map={rearSpecTex}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>

        {/* B. Khối thân gầm liền khối nối khít từ cổ khay nút bấm trước (x = +0.59) ra tận đuôi sau (x = -0.78) và ăn sâu lên thân trên (y = 0.52) */}
        <RoundedBox
          args={[1.37, 0.35, 1.52]}
          radius={0.018}
          smoothness={2}
          position={[-0.095, 0.345, 0]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Lưới khe tản nhiệt bên hông của khối hộp dưới (Lower Side Vents - Ảnh 2, đặt sát bề mặt z = ±0.762) */}
        <mesh position={[-0.28, 0.33, 0.762]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.78, 0.24]} />
          <meshStandardMaterial
            map={sideVentTex}
            transparent
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[-0.28, 0.33, -0.762]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[0.78, 0.24]} />
          <meshStandardMaterial
            map={sideVentTex}
            transparent
            roughness={0.68}
            metalness={0.05}
          />
        </mesh>

        {/* C. Giao diện cổng kết nối mặt sau của khối hộp dưới (x = -0.78):
               - Bên trái (nhìn từ mặt sau, +Z_local = +0.28): Hốc ổ cắm nguồn AC đen âm sâu vào trong
               - Bên phải (nhìn từ mặt sau, -Z_local = -0.06): Vòng đệm cao su + dây cáp VGA màu trắng ngà đi ra */}
        <group position={[-0.778, 0.34, 0.28]}>
          <mesh material={retroMaterials.isaBlack}>
            <boxGeometry args={[0.04, 0.14, 0.19]} />
          </mesh>
          {[-0.045, 0, 0.045].map((zPin, idx) => (
            <mesh
              key={`crt-ac-pin-${idx}`}
              position={[-0.012, idx === 1 ? 0.02 : -0.015, zPin]}
              material={retroMaterials.galvanizedSteel}
            >
              <boxGeometry args={[0.025, 0.016, 0.008]} />
            </mesh>
          ))}
        </group>

        {/* Vòng đệm cao su (Strain-relief Grommet) nơi dây VGA màu trắng ngà đi ra ở mặt sau */}
        <group position={[-0.78, 0.31, -0.06]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={retroMaterials.darkBeige}>
            <cylinderGeometry args={[0.048, 0.056, 0.04, 16]} />
          </mesh>
          <mesh position={[0, 0.032, 0]} material={retroMaterials.beigePlastic}>
            <cylinderGeometry args={[0.026, 0.036, 0.06, 14]} />
          </mesh>
        </group>
      </group>

      {/* =====================================================================
          B. BÀN PHÍM CƠ IBM MODEL M (TRƯỚC MÀN HÌNH) & CHUỘT BI LOGITECH (BÊN PHẢI BÀN PHÍM)
         ===================================================================== */}
      <group
        position={[0, dropY * 0.7, 0]}
        scale={Math.max(0.001, appearT)}
        visible={appearT > 0.005}
      >
        {/* 1. BÀN PHÍM CƠ IBM MODEL M chuẩn xác theo ảnh thật đặt trước màn hình CRT */}
        <IbmModelMKeyboard
          position={[-0.85, 0.045, 2.55]}
          rotation={[0.08, 0, 0]}
          scale={1.32}
        />

        {/* 2. TẤM LÓT CHUỘT (MOUSEPAD) & CHUỘT BI 2 NÚT LOGITECH M-S34 đặt cạnh bàn phím [0.65, 0.015, 2.65] (cách đều bàn phím và thùng máy) */}
        <group
          position={[0.65, 0.015, 2.65]}
          scale={1.25}
        >
          {/* Tấm lót chuột xanh navy cổ điển */}
          <RoundedBox
            args={[0.68, 0.016, 0.78]}
            radius={0.006}
            smoothness={1}
            receiveShadow
          >
            <meshStandardMaterial color="#0e2c66" roughness={0.85} metalness={0.02} />
          </RoundedBox>

          {/* Thân chuột bi 2 nút Logitech M-S34 dáng giọt nước (Teardrop Ergonomic Shell) */}
          <group position={[0.0, 0.008, 0.02]} rotation={[0, -0.08, 0]}>
            {/* Đế phẳng tối màu dưới bụng chuột */}
            <mesh position={[0, 0.004, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.095, 24]} />
              <meshStandardMaterial color="#2a2825" roughness={0.8} />
            </mesh>

            {/* Vỏ vòm công thái học dáng giọt nước + Rãnh chữ T + Logo Logitech */}
            <mesh geometry={mouseGeo} castShadow receiveShadow>
              <meshStandardMaterial
                map={mouseTex}
                roughness={0.55}
                metalness={0.05}
              />
            </mesh>

            {/* Ống cao su chống gập dây (Strain-relief Grommet) ở chính giữa mũi trước chuột */}
            <mesh
              position={[0, 0.018, -0.195]}
              rotation={[Math.PI / 2, 0, 0]}
              material={retroMaterials.darkBeige}
            >
              <cylinderGeometry args={[0.01, 0.014, 0.036, 12]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* =====================================================================
          C. CÁP NGOẠI VI PHÍA SAU (CÁP VGA MÀU TRẮNG NGÀ ĐẦU XANH DƯƠNG, CÁP NGUỒN AC OUT & DÂY BÀN PHÍM XOẮN)
         ===================================================================== */}
      {cableT > 0.01 && (
        <group scale={[1, cableT, 1]}>
          <mesh
            geometry={keyboardCableGeo}
            castShadow
            material={retroMaterials.blackAnodized}
          />
          <mesh
            position={[2.43, 2.63, -1.6]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.036, 0.036, 0.12, 16]} />
            <meshStandardMaterial color="#4b2878" roughness={0.45} />
          </mesh>

          <mesh
            geometry={mouseCableGeo}
            castShadow
            material={retroMaterials.darkBeige}
          />
          <mesh
            position={[2.29, 2.63, -1.6]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.034, 0.034, 0.11, 16]} />
            <meshStandardMaterial color="#989284" roughness={0.5} />
          </mesh>

          {/* Dây cáp tín hiệu VGA màu trắng ngà/be (Captive Beige VGA Cable đúng như Ảnh 2) */}
          <mesh
            geometry={vgaCableGeo}
            castShadow
            material={retroMaterials.beigePlastic}
          />
          <RoundedBox
            args={[0.14, 0.08, 0.12]}
            radius={0.006}
            smoothness={1}
            position={[2.35, 1.52, -1.61]}
          >
            <meshStandardMaterial color="#0038a8" roughness={0.4} metalness={0.1} />
          </RoundedBox>

          <mesh
            geometry={acOutCableGeo}
            castShadow
            material={retroMaterials.isaBlack}
          />
          {/* Phích cắm nguồn AC đen tại ổ cắm nguồn Seasonic trên thùng PC */}
          <RoundedBox
            args={[0.16, 0.11, 0.12]}
            radius={0.006}
            smoothness={1}
            position={[2.21, 3.52, -1.61]}
            material={retroMaterials.isaBlack}
          />
          {/* Phích cắm nguồn AC đen cắm khít vào hốc nguồn IEC C14 sau lưng màn hình CRT */}
          <RoundedBox
            args={[0.18, 0.13, 0.11]}
            radius={0.006}
            smoothness={1}
            position={[-1.276, 0.517, -0.98]}
            material={retroMaterials.isaBlack}
          />
        </group>
      )}
    </group>
  );
}
