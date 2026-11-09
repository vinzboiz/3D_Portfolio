/**
 * RETRO 1997 HUMAN-SCALE SYSTEM (NGUỒN SỰ THẬT DUY NHẤT VỀ KÍCH THƯỚC)
 * Quy chuẩn: 1 Three.js unit = 1 mét (1.0m)
 *
 * Mọi component (Workbench, RetroLabEnvironment, CameraRig, v.v.)
 * BẮT BUỘC đọc thông số từ file này, không hardcode số riêng.
 */

export const S = {
  FLOOR_Y: -0.75, // Mặt sàn phòng thí nghiệm; mặt bàn chuẩn ở y = 0.0

  TABLE: {
    W: 2.0, // Chiều dài bàn (trục X)
    D: 0.95, // Chiều sâu bàn (trục Z)
    TOP_THICK: 0.05, // Độ dày mặt bàn gỗ ép phenolic
    LEG: 0.07, // Tiết diện vuông chân thép chịu lực
    LEG_INSET: 0.06, // Độ thụt lề chân bàn so với mép bàn
    RAIL_H: 0.1, // Chiều cao thanh giằng ngang trên (dưới mặt bàn)
    LOWER_BRACE_Y: -0.55, // Cao độ thanh giằng thấp liên kết các chân
  },

  CHAIR: {
    SEAT_H: 0.45, // Chiều cao mặt ghế so với mặt sàn (y = FLOOR_Y + 0.45 = -0.30)
    SEAT_W: 0.44, // Chiều rộng đệm ngồi
    SEAT_D: 0.42, // Chiều sâu đệm ngồi
    BACK_H: 0.4, // Chiều cao tựa lưng so với mặt ghế (chạm y = -0.30 + 0.40 = +0.10)
    BACK_W: 0.42, // Chiều rộng tựa lưng
    COLUMN_R: 0.025, // Bán kính trục nâng hạ thủy lực
    BASE_R: 0.28, // Bán kính chân đế 5 nhánh
    CASTER_R: 0.03, // Bán kính bánh xe chạm sàn
    HOME_POS: [-0.45, -0.75, 0.95] as [number, number, number],
    HOME_ROT_Y: 0.45, // Góc xoay ban đầu ở Home (rad)
    RETRACT_POS: [-1.4, -0.75, 1.6] as [number, number, number],
    RETRACT_ROT_Y: 1.15, // Góc xoay khi lùi sang trái
  },

  HUMAN: {
    EYE_H_SEATED: 1.15, // Chiều cao mắt người ngồi tính từ sàn (tương đương y = 0.40 trên mặt bàn)
    HEIGHT: 1.7, // Chiều cao người đứng chuẩn cho DEBUG_SCALE_REF
  },

  /**
   * Tỉ lệ quy đổi cụm linh kiện trên bàn (Motherboard, Case, Drives, Cables, Lamp):
   * Trong model gốc: Mainboard PCB có chiều dài z = 2.8 units.
   * Kích thước thực tế chuẩn ATX: dài 0.305m x rộng 0.244m (12" x 9.6").
   * Hệ số co cụm = 0.305 / 2.8 ≈ 0.10892857.
   */
  DESK_ITEMS_SCALE: 0.305 / 2.8,

  /**
   * Bức tường màn hình CRT (Flat CRT Video Wall) & Phòng Retro Lab
   */
  ROOM: {
    WALL_Z: -2.4, // Tọa độ Z bức tường màn hình phẳng sau bàn
    WALL_W: 6.2, // Chiều rộng bức tường
    WALL_H: 3.2, // Chiều cao bức tường
    FLOOR_SIZE: [8.5, 7.5] as [number, number],
    SIDE_RACK_X: 2.2, // Kệ sắt hai bên (X = ±2.2m)
  },

  /**
   * Cờ bật người mẫu dummy 1.7m đứng cạnh bàn để kiểm tra tỉ lệ trực quan (chỉ bật khi dev)
   */
  DEBUG_SCALE_REF: false,
} as const;

/**
 * Kiểm tra nghiệm thu tỉ lệ theo ràng buộc kỹ thuật (Unit Tests / Assertions):
 */
export function validateScaleContract(): { valid: boolean; logs: string[] } {
  const logs: string[] = [];
  let valid = true;

  // 1. Mặt bàn cao 0.75m so với sàn
  const tableHeight = 0 - S.FLOOR_Y;
  if (Math.abs(tableHeight - 0.75) > 0.001) {
    valid = false;
    logs.push(`FAIL: Mặt bàn cao ${tableHeight}m, kỳ vọng 0.75m`);
  } else {
    logs.push(`PASS: Mặt bàn cao ${tableHeight}m so với sàn`);
  }

  // 2. Mặt ghế cao 0.45m so với sàn, khoảng chênh 0.30m
  const seatH = S.CHAIR.SEAT_H;
  const thighClearance = tableHeight - seatH;
  if (Math.abs(thighClearance - 0.3) > 0.001) {
    valid = false;
    logs.push(`FAIL: Khoảng chênh mặt bàn - mặt ghế là ${thighClearance}m, kỳ vọng 0.30m`);
  } else {
    logs.push(`PASS: Đùi người ngồi có khoảng chênh lý tưởng ${thighClearance}m`);
  }

  // 3. Chiều dài bàn không vượt quá 2.4m và xấp xỉ 6.5x chiều rộng mainboard
  if (S.TABLE.W > 2.4) {
    valid = false;
    logs.push(`FAIL: Chiều dài bàn ${S.TABLE.W}m vượt quá 2.4m`);
  } else {
    logs.push(`PASS: Chiều dài bàn ${S.TABLE.W}m hợp lệ (<= 2.4m)`);
  }

  // 4. Lưng ghế cao hơn mặt bàn khoảng 0.10m khi ghế sát bàn
  const seatTopY = S.FLOOR_Y + S.CHAIR.SEAT_H;
  const backTopY = seatTopY + S.CHAIR.BACK_H;
  const backAboveDesk = backTopY - 0;
  if (Math.abs(backAboveDesk - 0.1) > 0.01) {
    valid = false;
    logs.push(`FAIL: Lưng ghế cao hơn mặt bàn ${backAboveDesk}m, kỳ vọng 0.10m`);
  } else {
    logs.push(`PASS: Lưng ghế cao hơn mặt bàn ${backAboveDesk.toFixed(2)}m (+0.10m)`);
  }

  // 5. Gầm bàn trống tối thiểu 0.62m chiều cao và 0.55m chiều sâu
  const underTableHeight = tableHeight - S.TABLE.TOP_THICK - (S.TABLE.RAIL_H - S.TABLE.TOP_THICK);
  const underTableDepth = S.TABLE.D - 2 * (S.TABLE.LEG_INSET + S.TABLE.LEG);
  if (underTableHeight < 0.62) {
    valid = false;
    logs.push(`FAIL: Gầm bàn cao ${underTableHeight}m (< 0.62m)`);
  } else {
    logs.push(`PASS: Gầm bàn cao ${underTableHeight.toFixed(2)}m (>= 0.62m)`);
  }

  if (underTableDepth < 0.55) {
    valid = false;
    logs.push(`FAIL: Gầm bàn sâu ${underTableDepth}m (< 0.55m)`);
  } else {
    logs.push(`PASS: Gầm bàn sâu ${underTableDepth.toFixed(2)}m (>= 0.55m)`);
  }

  return { valid, logs };
}
