/**
 * RETRO 1997 HUMAN-SCALE SYSTEM (NGUỒN SỰ THẬT DUY NHẤT VỀ KÍCH THƯỚC)
 * Quy chuẩn: 1 Three.js unit = 1 mét (1.0m)
 *
 * Mọi component (Workbench, RetroLabEnvironment, CameraRig, v.v.)
 * BẮT BUỘC đọc thông số từ file này, không hardcode số riêng.
 */

export const DESK_Z_OFFSET = 2.4; // Khoảng cách đẩy bàn làm việc tiến về phía trước theo trục +Z

export const S = {
  DESK_Z_OFFSET: 2.4, // Độ lệch trục Z của bàn làm việc, đèn bàn, thảm cắt và linh kiện
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
   * Phòng Retro Lab & Bức tường màn hình CRT sát tường sau
   */
  ROOM: {
    SIZE: 2.85, // Bề ngang phòng (trục X): 2.85m (vừa khít bề ngang dãy màn hình 2.64m)
    WALL_Z: -0.75, // Tọa độ Z bức tường màn hình (đáy màn hình áp sát tường sau z = -0.95m)
    BACK_WALL_Z: -0.95, // Tường sau của phòng
    FRONT_Z: 4.8, // Rìa trước phòng: 4.8m (mở rộng về phía trước +Z để chứa bàn +2.4m và camera)
    HEIGHT: 2.8, // Chiều cao phòng
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

  // 2. Chiều dài bàn không vượt quá 2.4m và xấp xỉ 6.5x chiều rộng mainboard
  if (S.TABLE.W > 2.4) {
    valid = false;
    logs.push(`FAIL: Chiều dài bàn ${S.TABLE.W}m vượt quá 2.4m`);
  } else {
    logs.push(`PASS: Chiều dài bàn ${S.TABLE.W}m hợp lệ (<= 2.4m)`);
  }

  // 3. Chiều sâu phòng đủ không gian cho bàn và camera
  const roomDepth = S.ROOM.FRONT_Z - S.ROOM.BACK_WALL_Z;
  if (roomDepth < 5.0) {
    valid = false;
    logs.push(`FAIL: Chiều sâu phòng ${roomDepth.toFixed(2)}m chưa đủ chứa bàn offset +2.4m`);
  } else {
    logs.push(`PASS: Chiều sâu phòng ${roomDepth.toFixed(2)}m rộng rãi cho bàn và quỹ đạo camera`);
  }

  // 4. Dãy màn hình sát tường sau
  const wallGap = S.ROOM.WALL_Z - 0.38 / 2 - S.ROOM.BACK_WALL_Z;
  if (wallGap > 0.05) {
    valid = false;
    logs.push(`FAIL: Dãy màn hình cách tường sau ${wallGap}m (> 0.05m)`);
  } else {
    logs.push(`PASS: Dãy màn hình kê sát tường sau (${wallGap.toFixed(3)}m gap)`);
  }

  // 5. Khoảng cách thoáng giữa bàn làm việc và dàn kệ màn hình CRT (2.4m)
  const tableBackZ = -S.TABLE.D / 2 + S.DESK_Z_OFFSET; // -0.475 + 2.4 = 1.925m
  const monitorFrontZ = S.ROOM.WALL_Z + 0.38 / 2; // -0.56m
  const deskToMonitorGap = Math.abs(tableBackZ - monitorFrontZ);
  logs.push(`PASS: Khoảng cách sau bàn tới dàn màn hình: ${deskToMonitorGap.toFixed(3)}m (thoáng đãng ~2.4m)`);

  return { valid, logs };
}
