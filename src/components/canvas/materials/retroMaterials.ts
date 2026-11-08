import * as THREE from 'three';

/**
 * Bảng thông số vật liệu PBR chuẩn phần cứng năm 1997
 */
export const RETRO_PBR_PARAMS = {
  beigePlastic: { color: '#d8d2c5', roughness: 0.65, metalness: 0.05 },
  darkBeige: { color: '#b8b0a0', roughness: 0.7, metalness: 0.05 },
  pcbGreen: { color: '#1a472a', roughness: 0.45, metalness: 0.15 },
  ceramicCpu: { color: '#2b2321', roughness: 0.5, metalness: 0.1 },
  galvanizedSteel: { color: '#8c9296', roughness: 0.35, metalness: 0.85 },
  blackAnodized: { color: '#1e1e1e', roughness: 0.4, metalness: 0.6 },
  goldPin: { color: '#d4af37', roughness: 0.2, metalness: 1.0 },
  ribbonGray: { color: '#9ea3a8', roughness: 0.8, metalness: 0.05 },
  ribbonRed: { color: '#b82525', roughness: 0.8, metalness: 0.05 },
  whiteSlot: { color: '#e6e2d8', roughness: 0.55, metalness: 0.05 },
  isaBlack: { color: '#161616', roughness: 0.5, metalness: 0.2 },
  pearlKey: { color: '#ded9ca', roughness: 0.55, metalness: 0.05 },
  pebbleKey: { color: '#989284', roughness: 0.6, metalness: 0.05 },
} as const satisfies Record<string, THREE.MeshStandardMaterialParameters>;

/**
 * Các instance THREE.MeshStandardMaterial dùng chung toàn cục
 * giúp tái sử dụng shader và giảm thiểu draw call overhead.
 */
export const retroMaterials = {
  beigePlastic: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.beigePlastic),
  darkBeige: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.darkBeige),
  pcbGreen: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.pcbGreen),
  ceramicCpu: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.ceramicCpu),
  galvanizedSteel: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.galvanizedSteel),
  blackAnodized: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.blackAnodized),
  goldPin: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.goldPin),
  ribbonGray: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.ribbonGray),
  ribbonRed: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.ribbonRed),
  whiteSlot: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.whiteSlot),
  isaBlack: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.isaBlack),
  pearlKey: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.pearlKey),
  pebbleKey: new THREE.MeshStandardMaterial(RETRO_PBR_PARAMS.pebbleKey),
};

/**
 * Helper tạo CanvasTexture in chữ laser lên lưng/nắp CPU (Pentium MMX)
 */
export function createCpuLabelTexture(
  title = 'INTEL PENTIUM® MMX™',
  subtitle = '233 MHz // FV80503233',
  serial = 'SL27S MALAY 1997'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Nền gốm tím nâu sẫm / kim loại đen
  ctx.fillStyle = '#221c1a';
  ctx.fillRect(0, 0, 512, 512);

  // Khung viền mạ vàng kỹ thuật
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 472, 472);

  // Dấu vát góc Pin 1 (góc dưới trái)
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.moveTo(20, 440);
  ctx.lineTo(72, 492);
  ctx.lineTo(20, 492);
  ctx.closePath();
  ctx.fill();

  // Silkscreen text
  ctx.fillStyle = '#d8d2c5';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 175);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.fillText(subtitle, 256, 235);

  // Kẻ ngang phân cách
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 275);
  ctx.lineTo(432, 275);
  ctx.stroke();

  ctx.fillStyle = '#9ea3a8';
  ctx.font = '20px "IBM Plex Mono", monospace';
  ctx.fillText(serial, 256, 330);
  ctx.fillText('2.8V CORE / 3.3V I/O', 256, 370);
  ctx.fillText('(C) INTEL 1992-1997', 256, 430);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Helper tạo CanvasTexture cho nhãn ổ cứng (Quantum Fireball / Seagate 1997)
 */
export function createHddStickerTexture(
  brand = 'QUANTUM FIREBALL ST',
  capacity = '3.2 GB ULTRA ATA',
  rpm = '5400 RPM // MASTER'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Nền giấy decal trắng ngà
  ctx.fillStyle = '#e8e4d9';
  ctx.fillRect(0, 0, 512, 768);

  // Viền đen kỹ thuật
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 480, 736);

  // Header dải đỏ cam cổ điển
  ctx.fillStyle = '#b82525';
  ctx.fillRect(20, 20, 472, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(brand, 40, 78);

  // Thông số dung lượng
  ctx.fillStyle = '#141413';
  ctx.font = 'bold 38px "JetBrains Mono", monospace';
  ctx.fillText(capacity, 40, 175);

  ctx.font = '22px "IBM Plex Mono", monospace';
  ctx.fillStyle = '#333333';
  ctx.fillText(rpm, 40, 220);
  ctx.fillText('CYL: 6256  HD: 16  SEC: 63', 40, 265);

  // Bảng Jumper giả lập
  ctx.strokeStyle = '#141413';
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 310, 432, 180);
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText('JUMPER CONFIGURATION [DS / CS / PK]', 56, 345);
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillText('MASTER:  [ : | : ]  DS ON', 56, 390);
  ctx.fillText('SLAVE:   [ : : : ]  ALL OFF', 56, 425);
  ctx.fillText('CABLE:   [ | : : ]  CS ON', 56, 460);

  // Mã vạch (Barcode) procedural
  ctx.fillStyle = '#141413';
  for (let x = 44; x < 460; x += 8) {
    const barW = (x * 7) % 5 === 0 ? 5 : 2;
    ctx.fillRect(x, 550, barW, 95);
  }
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('* QF-3200AT-1997-REV04 *', 256, 680);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Helper tạo Procedural CanvasTexture độ phân giải cao cho mặt bàn Cutting Mat
 * (Nền #141413, kẻ ô milimet, thước đo tọa độ; các khung chữ vàng Staging Zones chỉ hiển thị khi showStagingZones = true)
 */
export function createCuttingMatTexture(showStagingZones = true): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d')!;

  // 1. Nền bàn kỹ thuật tối ấm (#141413)
  ctx.fillStyle = '#141413';
  ctx.fillRect(0, 0, 2048, 2048);

  // 2. Lưới phụ milimet (mỗi 16px)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 2048; i += 16) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 2048);
    ctx.moveTo(0, i);
    ctx.lineTo(2048, i);
  }
  ctx.stroke();

  // 3. Lưới chính centimet (mỗi 128px)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 2048; i += 128) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 2048);
    ctx.moveTo(0, i);
    ctx.lineTo(2048, i);
  }
  ctx.stroke();

  // 4. Khung viền ngoài của Thảm cắt (Cutting Mat Outer Border)
  const pad = 96;
  ctx.strokeStyle = 'rgba(216, 210, 197, 0.32)';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, pad, 2048 - pad * 2, 2048 - pad * 2);

  ctx.strokeStyle = 'rgba(216, 210, 197, 0.14)';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad + 12, pad + 12, 2048 - (pad + 12) * 2, 2048 - (pad + 12) * 2);

  // 5. Vạch chia thước đo (Ruler Ticks & Numbers) dọc trục X và Y
  ctx.fillStyle = 'rgba(216, 210, 197, 0.45)';
  ctx.strokeStyle = 'rgba(216, 210, 197, 0.4)';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';

  for (let x = pad + 128; x <= 2048 - pad - 128; x += 128) {
    const cmVal = Math.round((x - pad) / 16);
    // Tick trên & dưới
    ctx.beginPath();
    ctx.moveTo(x, pad);
    ctx.lineTo(x, pad + 18);
    ctx.moveTo(x, 2048 - pad);
    ctx.lineTo(x, 2048 - pad - 18);
    ctx.stroke();
    ctx.fillText(`${cmVal}0 MM`, x, pad + 36);
    ctx.fillText(`${cmVal}0 MM`, x, 2048 - pad - 24);
  }

  ctx.textAlign = 'left';
  for (let y = pad + 128; y <= 2048 - pad - 128; y += 128) {
    const cmVal = Math.round((y - pad) / 16);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(pad + 18, y);
    ctx.moveTo(2048 - pad, y);
    ctx.lineTo(2048 - pad - 18, y);
    ctx.stroke();
    ctx.fillText(`${cmVal}0`, pad + 24, y + 5);
  }

  // 6. Các phân khu lắp ráp kiểu Badge Factory (Component Staging Zones)
  const drawZoneBox = (
    x: number,
    y: number,
    w: number,
    h: number,
    code: string,
    title: string,
    subtitle: string,
    accent = 'rgba(216, 210, 197, 0.28)'
  ) => {
    // Khung nét đứt
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();

    // 4 góc chữ L đậm (Corner Crosshairs)
    const cLen = 28;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x, y + cLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cLen, y);
    // Top-Right
    ctx.moveTo(x + w - cLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cLen);
    // Bottom-Left
    ctx.moveTo(x, y + h - cLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cLen, y + h);
    // Bottom-Right
    ctx.moveTo(x + w - cLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cLen);
    ctx.stroke();

    // Tag tiêu đề góc trên
    ctx.fillStyle = 'rgba(216, 210, 197, 0.12)';
    ctx.fillRect(x + 8, y + 8, w - 16, 34);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.font = 'bold 17px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`[${code}] // ${title}`, x + 18, y + 31);

    ctx.fillStyle = 'rgba(216, 210, 197, 0.42)';
    ctx.font = '15px "IBM Plex Mono", monospace';
    ctx.fillText(subtitle, x + 18, y + h - 16);
  };

  if (showStagingZones) {
    // Khu trung tâm: Khung máy AT Tower & Mainboard ASUS TX97-E
    drawZoneBox(
      540,
      460,
      968,
      1120,
      'ZONE-A01',
      'PRIMARY AT CHASSIS & ASUS TX97-E MAINBOARD BAY',
      'FORM FACTOR: BABY-AT (330x220MM) // SOCKET 7 ZIF // 430TX PCISET'
    );

    // Khu bên trái trên: CPU & Heatsink Staging
    drawZoneBox(
      180,
      460,
      310,
      520,
      'ZONE-B02',
      'CPU & COOLING TRAY',
      'PENTIUM MMX 233MHZ // 296-PIN SPGA'
    );

    // Khu bên trái dưới: RAM & Expansion Cards
    drawZoneBox(
      180,
      1040,
      310,
      540,
      'ZONE-B03',
      'DIMM / PCI / ISA BAY',
      '64MB PC66 SDRAM // S3 VIRGE // AWE64'
    );

    // Khu bên phải trên: AT PSU Staging
    drawZoneBox(
      1558,
      460,
      310,
      520,
      'ZONE-C04',
      'AT POWER SUPPLY UNIT',
      '250W GALVANIZED STEEL // P8+P9 HARNESS'
    );

    // Khu bên phải dưới: Storage Drives & Ribbon Cables
    drawZoneBox(
      1558,
      1040,
      310,
      540,
      'ZONE-C05',
      'STORAGE & RIBBON BAY',
      '3.5" FDD 1.44MB // QUANTUM 3.2GB IDE'
    );
  }

  // 7. Vòng tròn tâm ngắm kỹ thuật ở chính giữa bàn (Center Reticle)
  const cx = 1024;
  const cy = 1024;
  ctx.strokeStyle = 'rgba(51, 255, 51, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.arc(cx, cy, 320, 0, Math.PI * 2);
  ctx.moveTo(cx - 380, cy);
  ctx.lineTo(cx + 380, cy);
  ctx.moveTo(cx, cy - 380);
  ctx.lineTo(cx, cy + 380);
  ctx.stroke();

  // 8. Dòng chữ định danh ESD Mat ở đầu và cuối bàn
  ctx.fillStyle = 'rgba(216, 210, 197, 0.55)';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    'ANTI-STATIC HARDWARE ASSEMBLY MAT // REV 1997.11 // SCALE 1:1 MM',
    180,
    240
  );
  ctx.font = '18px "IBM Plex Mono", monospace';
  ctx.fillStyle = 'rgba(216, 210, 197, 0.35)';
  ctx.fillText(
    'CAUTION: OBSERVE PRECAUTIONS FOR HANDLING ELECTROSTATIC SENSITIVE DEVICES (CMOS/PGA)',
    180,
    275
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

