import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { retroMaterials } from '../materials/retroMaterials';
import { useBuildStore } from '../../../store/useBuildStore';

const U = 0.058; // Chuẩn bước phím 1U = 19.05mm
const LEFT_X = -11.5 * U; // Căn tâm toàn bộ 23U (0.0U -> 23.0U) ngay tại X = 0.000
const KEY_GAP = 0.0055; // Khe hở sắc nét giữa các mũ phím

// Tọa độ Z và độ cao Y (uốn cong vòm công thái học Buckling Spring) của 6 hàng phím
const ROW_Z = [-0.175, -0.074, -0.016, 0.042, 0.1, 0.158] as const;
const ROW_Y = [0.068, 0.061, 0.055, 0.051, 0.048, 0.046] as const;

interface KeyDef {
  x: number;
  z: number;
  w: number;
  d: number;
  y: number;
  tone: 'pearl' | 'pebble';
  label: string;
  subLabel?: string;
}

function makeKey(
  uStart: number,
  uWidth: number,
  rowIdx: number,
  tone: 'pearl' | 'pebble',
  label: string,
  subLabel?: string,
  rowSpan = 1
): KeyDef {
  const x = LEFT_X + (uStart + uWidth / 2) * U;
  const w = uWidth * U - KEY_GAP;
  const zStart = ROW_Z[rowIdx];
  const zEnd = ROW_Z[Math.min(5, rowIdx + rowSpan - 1)];
  const z = (zStart + zEnd) / 2;
  const d = (rowSpan === 1 ? U : Math.abs(zEnd - zStart) + U) - KEY_GAP;
  const y = (ROW_Y[rowIdx] + ROW_Y[Math.min(5, rowIdx + rowSpan - 1)]) / 2;
  return { x, z, w, d, y, tone, label, subLabel };
}

/**
 * Khởi tạo chính xác 100% ma trận 102 phím chuẩn cơ khí 23.0U của IBM Model M (ISO Layout theo ảnh mẫu):
 * - Cột 0.0U -> 15.0U: Cụm phím chính (Main Alphanumeric Block) + Hàng F-keys (Esc, F1-F4 trắng, F5-F8 xám, F9-F12 trắng)
 * - Cột 15.5U -> 18.5U: Cụm 3 phím PrtSc/ScrLk/Pause + 6 phím Navigation + 4 phím mũi tên chữ T ngược
 * - Cột 19.0U -> 23.0U: Bảng đèn LED (trên) + Cụm bàn phím số Numpad 17 phím (dưới)
 */
function buildModelM102Keys(): KeyDef[] {
  const keys: KeyDef[] = [];

  // =========================================================================
  // HÀNG 0 (rowIdx = 0): Esc + F1..F4 (Pearl) + F5..F8 (Pebble) + F9..F12 (Pearl) + 3 phím hệ thống
  // =========================================================================
  keys.push(makeKey(0, 1, 0, 'pebble', 'Esc'));
  ['F1', 'F2', 'F3', 'F4'].forEach((lbl, i) => {
    keys.push(makeKey(2 + i, 1, 0, 'pearl', lbl));
  });
  ['F5', 'F6', 'F7', 'F8'].forEach((lbl, i) => {
    keys.push(makeKey(6.5 + i, 1, 0, 'pebble', lbl));
  });
  ['F9', 'F10', 'F11', 'F12'].forEach((lbl, i) => {
    keys.push(makeKey(11 + i, 1, 0, 'pearl', lbl));
  });
  [
    { lbl: 'ImpPnt', sub: 'SisPet' },
    { lbl: 'Bloq', sub: 'Despl' },
    { lbl: 'Pausa', sub: 'Inter' },
  ].forEach((item, i) => {
    keys.push(makeKey(15.5 + i, 1, 0, 'pebble', item.lbl, item.sub));
  });

  // =========================================================================
  // HÀNG 1 (rowIdx = 1): 13 phím số Pearl (0..13U) + Backspace 2U Pebble (13..15U)
  // =========================================================================
  const row1 = [
    { t: 'ª', b: 'º' },
    { t: '!', b: '1' },
    { t: '"', b: '2' },
    { t: '·', b: '3' },
    { t: '$', b: '4' },
    { t: '%', b: '5' },
    { t: '&', b: '6' },
    { t: '/', b: '7' },
    { t: '(', b: '8' },
    { t: ')', b: '9' },
    { t: '=', b: '0' },
    { t: '?', b: "'" },
    { t: '¿', b: '¡' },
  ];
  row1.forEach((item, i) => {
    keys.push(makeKey(i, 1, 1, 'pearl', item.t, item.b));
  });
  keys.push(makeKey(13, 2, 1, 'pebble', '←──'));

  // =========================================================================
  // HÀNG 2 (rowIdx = 2): Tab 1.5U (0..1.5U) + 12 phím QWERTY Pearl (1.5..13.5U)
  // (Nửa trên của phím ISO Enter chiếm 13.5..15.0U được dựng liền khối bên dưới)
  // =========================================================================
  keys.push(makeKey(0, 1.5, 2, 'pebble', 'Tab', '↹'));
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '^ `', '* +'].forEach((lbl, i) => {
    keys.push(makeKey(1.5 + i, 1, 2, 'pearl', lbl));
  });

  // =========================================================================
  // HÀNG 3 (rowIdx = 3): Caps Lock 1.75U (0..1.75U) + 12 phím ASDF..Ñ..Ç Pearl (1.75..13.75U)
  // (Nửa dưới của phím ISO Enter chiếm 13.75..15.0U)
  // =========================================================================
  keys.push(makeKey(0, 1.75, 3, 'pebble', 'Bloq', 'Mayús'));
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ', '¨ ´', 'Ç'].forEach((lbl, i) => {
    keys.push(makeKey(1.75 + i, 1, 3, 'pearl', lbl));
  });

  // =========================================================================
  // HÀNG 4 (rowIdx = 4): Left Shift 1.25U + 11 phím (<, Z..M, , . -) Pearl + Right Shift 2.75U
  // =========================================================================
  keys.push(makeKey(0, 1.25, 4, 'pebble', '⇧'));
  ['< >', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '; ,', ': .', '_ -'].forEach((lbl, i) => {
    keys.push(makeKey(1.25 + i, 1, 4, 'pearl', lbl));
  });
  keys.push(makeKey(12.25, 2.75, 4, 'pebble', '⇧ Mayús'));

  // =========================================================================
  // HÀNG 5 (rowIdx = 5): Ctrl (1.5U) + [gap 0.75U] + Alt (1.5U) + Spacebar (6.5U) + AltGr (1.5U) + [gap 0.75U] + Ctrl (1.5U)
  // =========================================================================
  keys.push(makeKey(0, 1.5, 5, 'pebble', 'Ctrl'));
  keys.push(makeKey(2.25, 1.5, 5, 'pebble', 'Alt'));
  keys.push(makeKey(3.75, 7.25, 5, 'pearl', ''));
  keys.push(makeKey(11.0, 1.5, 5, 'pebble', 'AltGr'));
  keys.push(makeKey(13.5, 1.5, 5, 'pebble', 'Ctrl'));

  // =========================================================================
  // CỤM NAVIGATION (15.5U -> 18.5U): 6 phím trên + 4 phím mũi tên chữ T ngược
  // =========================================================================
  ['Ins', 'Inicio', 'RePág'].forEach((lbl, i) => {
    keys.push(makeKey(15.5 + i, 1, 1, 'pebble', lbl));
  });
  ['Supr', 'Fin', 'AvPág'].forEach((lbl, i) => {
    keys.push(makeKey(15.5 + i, 1, 2, 'pebble', lbl));
  });
  keys.push(makeKey(16.5, 1, 4, 'pebble', '↑'));
  keys.push(makeKey(15.5, 1, 5, 'pebble', '←'));
  keys.push(makeKey(16.5, 1, 5, 'pebble', '↓'));
  keys.push(makeKey(17.5, 1, 5, 'pebble', '→'));

  // =========================================================================
  // CỤM NUMPAD 17 PHÍM (19.0U -> 23.0U)
  // =========================================================================
  ['Bloq', '/', '*', '-'].forEach((lbl, i) => {
    keys.push(makeKey(19 + i, 1, 1, 'pebble', lbl));
  });
  ['7', '8', '9'].forEach((lbl, i) => {
    keys.push(makeKey(19 + i, 1, 2, 'pearl', lbl, i === 0 ? 'Inic' : i === 1 ? '↑' : 'RePág'));
  });
  ['4', '5', '6'].forEach((lbl, i) => {
    keys.push(makeKey(19 + i, 1, 3, 'pearl', lbl, i === 0 ? '←' : i === 2 ? '→' : ''));
  });
  ['1', '2', '3'].forEach((lbl, i) => {
    keys.push(makeKey(19 + i, 1, 4, 'pearl', lbl, i === 0 ? 'Fin' : i === 1 ? '↓' : 'AvPág'));
  });
  keys.push(makeKey(19, 2, 5, 'pearl', '0', 'Ins'));
  keys.push(makeKey(21, 1, 5, 'pearl', '.', 'Supr'));

  // 2 phím dọc 2U bên phải Numpad (+ và Intro)
  keys.push(makeKey(22, 1, 2, 'pebble', '+', undefined, 2));
  keys.push(makeKey(22, 1, 4, 'pebble', 'Intro', undefined, 2));

  return keys;
}

/**
 * 1. CanvasTexture cho Huy hiệu Oval IBM (IBM Blue Oval Badge)
 *    Đặt ở góc trên bên trái dải Top Brow của bàn phím IBM Model M
 */
function createIbmOvalBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 160);

  ctx.fillStyle = '#b4b9be';
  ctx.beginPath();
  ctx.ellipse(128, 80, 118, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#6c7075';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#0042aa';
  ctx.font = 'bold 74px "JetBrains Mono", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IBM', 128, 80);

  ctx.fillStyle = '#b4b9be';
  for (let y = 44; y <= 116; y += 10) {
    ctx.fillRect(36, y, 184, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 2. CanvasTexture cho Bảng đèn LED tín hiệu (LED Indicator Panel)
 *    Đặt ngay phía trên cụm Numpad (19.0U -> 23.0U): nền xám kem nhạt viền đen mảnh như ảnh thật
 */
function createIbmIndicatorPanelTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b8b3a6';
  ctx.fillRect(0, 0, 384, 128);

  ctx.strokeStyle = '#2a2825';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 378, 122);

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(128, 3);
  ctx.lineTo(128, 125);
  ctx.moveTo(256, 3);
  ctx.lineTo(256, 125);
  ctx.stroke();

  ctx.fillStyle = '#1e1d1b';
  ctx.font = 'bold 21px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';

  ctx.fillText('Bloq', 64, 36);
  ctx.fillText('Num', 64, 60);

  ctx.fillText('Bloq', 192, 36);
  ctx.fillText('Mayús', 192, 60);

  ctx.fillText('Bloq', 320, 36);
  ctx.fillText('Despl', 320, 60);

  ctx.fillStyle = '#1f2e1f';
  ctx.fillRect(48, 86, 32, 16);
  ctx.fillRect(176, 86, 32, 16);
  ctx.fillRect(304, 86, 32, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const ATLAS_X_MIN = -0.7;
const ATLAS_X_SPAN = 1.4;
const ATLAS_Z_MIN = -0.22;
const ATLAS_Z_SPAN = 0.44;

/**
 * 3. CanvasTexture Atlas (2048 x 768) in chữ sắc nét cho mặt đỉnh của toàn bộ 102 mũ phím
 */
function createKeyboardTopLegendsTexture(keys: KeyDef[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e5e0d3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const mapX = (x: number) => ((x - ATLAS_X_MIN) / ATLAS_X_SPAN) * canvas.width;
  const mapZ = (z: number) => ((z - ATLAS_Z_MIN) / ATLAS_Z_SPAN) * canvas.height;
  const scaleW = (w: number) => (w / ATLAS_X_SPAN) * canvas.width;
  const scaleD = (d: number) => (d / ATLAS_Z_SPAN) * canvas.height;

  for (const k of keys) {
    const cx = mapX(k.x);
    const cz = mapZ(k.z);
    const pw = scaleW(k.w * 0.8);
    const pd = scaleD(k.d * 0.76);

    const x0 = cx - pw / 2;
    const y0 = cz - pd / 2;

    ctx.fillStyle = k.tone === 'pearl' ? '#e6e1d4' : '#9e988b';
    ctx.fillRect(x0 - 2, y0 - 2, pw + 4, pd + 4);

    ctx.strokeStyle = k.tone === 'pearl' ? '#f4f1e8' : '#b4ae9f';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, pw, pd);

    if (k.label) {
      ctx.fillStyle = '#161513';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(k.label, x0 + 5, y0 + 3);
    }
    if (k.subLabel) {
      ctx.fillStyle = '#24221f';
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(k.subLabel, x0 + 5, y0 + pd - 2);
    }
  }

  // Vùng mặt đỉnh cho phím ISO Enter (13.5U..15.0U ở hàng 2 & 3)
  const enterX = mapX(LEFT_X + 14.25 * U);
  const enterZ = mapZ((ROW_Z[2] + ROW_Z[3]) / 2);
  const ew = scaleW(1.5 * U);
  const ed = scaleD(2 * U);
  ctx.fillStyle = '#9e988b';
  ctx.fillRect(enterX - ew / 2, enterZ - ed / 2, ew, ed);
  ctx.fillStyle = '#161513';
  ctx.font = 'bold 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('↵', enterX + 4, enterZ - 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Tạo 1 BufferGeometry duy nhất chứa mặt đỉnh phẳng của toàn bộ 102 mũ phím,
 * mỗi mặt đỉnh nằm đúng độ cao Y riêng của hàng phím đó và ánh xạ UV chính xác vào Atlas chữ!
 */
function buildKeycapTopsGeometry(keys: KeyDef[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vOffset = 0;

  const addQuad = (cx: number, cy: number, cz: number, qw: number, qd: number) => {
    const hw = qw / 2;
    const hd = qd / 2;
    const x0 = cx - hw;
    const x1 = cx + hw;
    const z0 = cz - hd;
    const z1 = cz + hd;

    positions.push(
      x0, cy, z1,
      x1, cy, z1,
      x1, cy, z0,
      x0, cy, z0
    );
    for (let i = 0; i < 4; i++) {
      normals.push(0, 1, 0);
    }

    const u0 = (x0 - ATLAS_X_MIN) / ATLAS_X_SPAN;
    const u1 = (x1 - ATLAS_X_MIN) / ATLAS_X_SPAN;
    const v0 = 1 - (z0 - ATLAS_Z_MIN) / ATLAS_Z_SPAN;
    const v1 = 1 - (z1 - ATLAS_Z_MIN) / ATLAS_Z_SPAN;

    uvs.push(
      u0, v1,
      u1, v1,
      u1, v0,
      u0, v0
    );

    indices.push(
      vOffset, vOffset + 1, vOffset + 2,
      vOffset, vOffset + 2, vOffset + 3
    );
    vOffset += 4;
  };

  for (const k of keys) {
    addQuad(k.x, k.y + 0.0185, k.z - 0.001, k.w * 0.8, k.d * 0.76);
  }

  // Thêm mặt đỉnh của phím ISO Enter
  addQuad(
    LEFT_X + 14.375 * U,
    (ROW_Y[2] + ROW_Y[3]) / 2 + 0.0185,
    (ROW_Z[2] + ROW_Z[3]) / 2,
    1.25 * U * 0.78,
    1.85 * U * 0.78
  );

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

export interface IbmModelMKeyboardProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function IbmModelMKeyboard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: IbmModelMKeyboardProps) {
  const isPoweredOn = useBuildStore((s) => s.isPoweredOn);
  const numLockLedRef = useRef<THREE.MeshStandardMaterial>(null);

  const allKeys = useMemo(() => buildModelM102Keys(), []);
  const pearlKeys = useMemo(() => allKeys.filter((k) => k.tone === 'pearl'), [allKeys]);
  const pebbleKeys = useMemo(() => allKeys.filter((k) => k.tone === 'pebble'), [allKeys]);

  const badgeTex = useMemo(() => createIbmOvalBadgeTexture(), []);
  const indicatorTex = useMemo(() => createIbmIndicatorPanelTexture(), []);
  const legendsTex = useMemo(() => createKeyboardTopLegendsTexture(allKeys), [allKeys]);
  const keycapTopsGeo = useMemo(() => buildKeycapTopsGeometry(allKeys), [allKeys]);

  useEffect(() => {
    return () => {
      badgeTex.dispose();
      indicatorTex.dispose();
      legendsTex.dispose();
      keycapTopsGeo.dispose();
    };
  }, [badgeTex, indicatorTex, legendsTex, keycapTopsGeo]);

  useFrame(() => {
    if (numLockLedRef.current) {
      numLockLedRef.current.emissiveIntensity = isPoweredOn ? 2.2 : 0;
    }
  });

  // Tọa độ tâm của các hốc âm màu tối (#262421) khoét trên mặt vỏ ôm sát từng cụm phím:
  const keyWells = useMemo(
    () => [
      // (1) Hốc riêng của phím Esc (0..1U)
      { x: LEFT_X + 0.5 * U, z: ROW_Z[0], w: 1.12 * U, d: 1.12 * U, y: 0.053 },
      // (2) Hốc cụm F1 - F4 (2..6U)
      { x: LEFT_X + 4.0 * U, z: ROW_Z[0], w: 4.12 * U, d: 1.12 * U, y: 0.053 },
      // (3) Hốc cụm F5 - F8 (6.5..10.5U)
      { x: LEFT_X + 8.5 * U, z: ROW_Z[0], w: 4.12 * U, d: 1.12 * U, y: 0.053 },
      // (4) Hốc cụm F9 - F12 (11..15U)
      { x: LEFT_X + 13.0 * U, z: ROW_Z[0], w: 4.12 * U, d: 1.12 * U, y: 0.053 },
      // (5) Hốc cụm 3 phím PrtSc / ScrLk / Pause (15.5..18.5U)
      { x: LEFT_X + 17.0 * U, z: ROW_Z[0], w: 3.12 * U, d: 1.12 * U, y: 0.053 },
      // (6) Hốc lớn của khối phím chính Alphanumeric (0..15U, hàng 1..5)
      {
        x: LEFT_X + 7.5 * U,
        z: (ROW_Z[1] + ROW_Z[5]) / 2,
        w: 15.14 * U,
        d: ROW_Z[5] - ROW_Z[1] + 1.14 * U,
        y: 0.045,
      },
      // (7) Hốc cụm 6 phím Navigation (15.5..18.5U, hàng 1..2)
      {
        x: LEFT_X + 17.0 * U,
        z: (ROW_Z[1] + ROW_Z[2]) / 2,
        w: 3.14 * U,
        d: ROW_Z[2] - ROW_Z[1] + 1.14 * U,
        y: 0.048,
      },
      // (8) Hốc chữ T ngược của 4 phím Mũi tên (Arrows)
      { x: LEFT_X + 17.0 * U, z: ROW_Z[4], w: 1.14 * U, d: 1.14 * U, y: 0.044 },
      { x: LEFT_X + 17.0 * U, z: ROW_Z[5], w: 3.14 * U, d: 1.14 * U, y: 0.042 },
      // (9) Hốc lớn của cụm Numpad 17 phím bên phải (19..23U, hàng 1..5)
      {
        x: LEFT_X + 21.0 * U,
        z: (ROW_Z[1] + ROW_Z[5]) / 2,
        w: 4.14 * U,
        d: ROW_Z[5] - ROW_Z[1] + 1.14 * U,
        y: 0.045,
      },
    ],
    []
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* =====================================================================
          A. KHUNG VỎ CÔNG THÁI HỌC IBM MODEL M (ERGONOMIC CURVED HOUSING)
             Căn tâm hoàn hảo tại X = 0.000 (Rộng 1.48 x Sâu 0.56)
         ===================================================================== */}
      <group name="KeyboardHousing">
        {/* 1. Thân vỏ chính bằng nhựa Beige cổ điển */}
        <RoundedBox
          args={[1.48, 0.052, 0.56]}
          radius={0.01}
          smoothness={2}
          position={[0, 0.024, -0.01]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Dải gờ đỉnh trên cùng (Top Brow phẳng trơn liền mạch như ảnh thật) */}
        <RoundedBox
          args={[1.48, 0.062, 0.11]}
          radius={0.008}
          smoothness={2}
          position={[0, 0.036, -0.24]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* Gờ vát dốc phía trước (Front Beveled Lip) */}
        <RoundedBox
          args={[1.48, 0.038, 0.07]}
          radius={0.008}
          smoothness={2}
          position={[0, 0.019, 0.24]}
          castShadow
          receiveShadow
          material={retroMaterials.beigePlastic}
        />

        {/* 2. CÁC HỐC ÂM MÀU TỐI (#262421) KHOÉT TRÊN MẶT VỎ ÔM SÁT TỪNG CỤM PHÍM */}
        {keyWells.map((well, idx) => (
          <mesh key={`key-well-${idx}`} position={[well.x, well.y, well.z]}>
            <boxGeometry args={[well.w, 0.008, well.d]} />
            <meshStandardMaterial color="#262421" roughness={0.85} />
          </mesh>
        ))}

        {/* 3. HUY HIỆU LOGO OVAL IBM (Góc trên bên trái dải Top Brow: x = -0.58, z = -0.24) */}
        <mesh position={[-0.58, 0.068, -0.24]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.105, 0.064]} />
          <meshStandardMaterial
            map={badgeTex}
            transparent
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>

        {/* 4. BẢNG ĐÈN LED TÍN HIỆU (Góc trên bên phải, thẳng cột 19..23U với cụm Numpad) */}
        <group position={[LEFT_X + 21.0 * U, 0.054, ROW_Z[0]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.0 * U, 1.05 * U]} />
            <meshStandardMaterial map={indicatorTex} roughness={0.55} />
          </mesh>
          {/* Đèn LED Num Lock xanh lá (ô trái) */}
          <mesh position={[-0.075, 0.002, 0.016]}>
            <boxGeometry args={[0.018, 0.004, 0.008]} />
            <meshStandardMaterial
              ref={numLockLedRef}
              color={isPoweredOn ? '#33ff33' : '#1b2e1b'}
              emissive="#33ff33"
              emissiveIntensity={isPoweredOn ? 2.2 : 0}
            />
          </mesh>
          {/* Đèn LED Caps Lock & Scroll Lock */}
          <mesh position={[0.0, 0.002, 0.016]}>
            <boxGeometry args={[0.018, 0.004, 0.008]} />
            <meshStandardMaterial color="#1b2e1b" roughness={0.5} />
          </mesh>
          <mesh position={[0.075, 0.002, 0.016]}>
            <boxGeometry args={[0.018, 0.004, 0.008]} />
            <meshStandardMaterial color="#1b2e1b" roughness={0.5} />
          </mesh>
        </group>

        {/* Ống cao su dẫn dây xoắn ở lưng sau (Coiled Cable Exit Grommet) */}
        <mesh
          position={[-0.15, 0.035, -0.295]}
          rotation={[Math.PI / 2, 0, 0]}
          material={retroMaterials.blackAnodized}
        >
          <cylinderGeometry args={[0.016, 0.016, 0.02, 12]} />
        </mesh>
      </group>

      {/* =====================================================================
          B. TOÀN BỘ 102 MŨ PHÍM 3D HAI TÔNG MÀU PEARL & PEBBLE + MẶT CHỮ IN
         ===================================================================== */}
      <group name="All102Keycaps">
        {/* 1. Chân đế & মũ phím màu Trắng Ngà (Pearl White: F1-F4, F9-F12, Alphas, Numbers, Spacebar, Numpad 0-9) */}
        {pearlKeys.map((k, idx) => (
          <group key={`pearl-k-${idx}`} position={[k.x, k.y, k.z]}>
            <mesh castShadow receiveShadow material={retroMaterials.pearlKey}>
              <boxGeometry args={[k.w, 0.026, k.d]} />
            </mesh>
            <mesh position={[0, 0.015, -0.001]} material={retroMaterials.pearlKey}>
              <boxGeometry args={[k.w * 0.8, 0.006, k.d * 0.76]} />
            </mesh>
          </group>
        ))}

        {/* 2. Chân đế & Mũ phím màu Xám Ấm (Pebble Gray: Esc, F5-F8, PrtSc/ScrLk/Pause, Modifiers, Nav, Arrows, Numpad Ops) */}
        {pebbleKeys.map((k, idx) => (
          <group key={`pebble-k-${idx}`} position={[k.x, k.y, k.z]}>
            <mesh castShadow receiveShadow material={retroMaterials.pebbleKey}>
              <boxGeometry args={[k.w, 0.026, k.d]} />
            </mesh>
            <mesh position={[0, 0.015, -0.001]} material={retroMaterials.pebbleKey}>
              <boxGeometry args={[k.w * 0.8, 0.006, k.d * 0.76]} />
            </mesh>
          </group>
        ))}

        {/* 3. Phím Enter chuẩn ISO (Hình chữ L ngược liền khối cao 2 hàng tại 13.5U..15.0U) */}
        <group position={[0, 0, 0]}>
          {/* Nhánh trên ở hàng 2 (13.5U -> 15.0U) */}
          <mesh
            position={[LEFT_X + 14.25 * U, ROW_Y[2], ROW_Z[2]]}
            castShadow
            receiveShadow
            material={retroMaterials.pebbleKey}
          >
            <boxGeometry args={[1.5 * U - KEY_GAP, 0.026, U - KEY_GAP]} />
          </mesh>
          {/* Thân dọc dưới nối liền hàng 2 & hàng 3 (13.75U -> 15.0U) */}
          <mesh
            position={[
              LEFT_X + 14.375 * U,
              (ROW_Y[2] + ROW_Y[3]) / 2,
              (ROW_Z[2] + ROW_Z[3]) / 2,
            ]}
            castShadow
            receiveShadow
            material={retroMaterials.pebbleKey}
          >
            <boxGeometry
              args={[
                1.25 * U - KEY_GAP,
                0.026,
                Math.abs(ROW_Z[3] - ROW_Z[2]) + U - KEY_GAP,
              ]}
            />
          </mesh>
          {/* Mặt đỉnh mũ phím ISO Enter */}
          <mesh
            position={[
              LEFT_X + 14.375 * U,
              (ROW_Y[2] + ROW_Y[3]) / 2 + 0.015,
              (ROW_Z[2] + ROW_Z[3]) / 2,
            ]}
            material={retroMaterials.pebbleKey}
          >
            <boxGeometry args={[1.25 * U * 0.78, 0.006, 1.85 * U * 0.78]} />
          </mesh>
        </group>

        {/* 4. Mặt chữ in ký tự sắc nét trên từng mũ phím (1 BufferGeometry khớp từng độ cao Y của mỗi hàng) */}
        <mesh geometry={keycapTopsGeo}>
          <meshStandardMaterial map={legendsTex} roughness={0.5} metalness={0.05} />
        </mesh>
      </group>
    </group>
  );
}
