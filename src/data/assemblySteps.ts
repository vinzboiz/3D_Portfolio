import { S } from '../constants/scale';

/**
 * Cấu hình dữ liệu toạ độ Camera 3D cho từng bước lắp ráp phần cứng
 * Được CameraRig.tsx sử dụng để điều phối góc nhìn và tâm ngắm khi cuộn chuột
 */
export interface AssemblyStepData {
  step: number;
  code: string;
  shortName: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

const dScale = (pos: [number, number, number]): [number, number, number] => [
  Number((pos[0] * S.DESK_ITEMS_SCALE).toFixed(4)),
  Number((pos[1] * S.DESK_ITEMS_SCALE).toFixed(4)),
  Number((pos[2] * S.DESK_ITEMS_SCALE).toFixed(4)),
];

export const ASSEMBLY_STEPS: AssemblyStepData[] = [
  {
    step: 0,
    code: '00',
    shortName: 'PORTAL HOME',
    cameraPos: dScale([-4.5, 5.8, 6.8]),
    cameraTarget: dScale([0.0, 1.85, 0]),
  },
  {
    step: 1,
    code: '01',
    shortName: 'XIN CHÀO',
    cameraPos: dScale([-3.6, 5.4, 5.8]),
    cameraTarget: dScale([0.0, 0.15, 0.0]),
  },
  {
    step: 2,
    code: '02',
    shortName: 'CASE PREPARATION',
    cameraPos: dScale([-4.2, 5.4, 5.6]),
    cameraTarget: dScale([0.8, 1.55, -0.35]),
  },
  {
    step: 3,
    code: '03',
    shortName: 'AT POWER SUPPLY',
    cameraPos: dScale([-4.6, 5.3, 5.2]),
    cameraTarget: dScale([0.8, 1.60, -0.4]),
  },
  {
    step: 4,
    code: '04',
    shortName: 'MOBO MOUNTING',
    cameraPos: dScale([-5.4, 4.2, 3.2]),
    cameraTarget: dScale([0.75, 1.30, -0.35]),
  },
  {
    step: 5,
    code: '05',
    shortName: 'STORAGE DRIVES',
    cameraPos: dScale([-4.4, 4.6, 6.0]),
    cameraTarget: dScale([0.8, 1.45, 0.6]),
  },
  {
    step: 6,
    code: '06',
    shortName: 'POWER CABLING',
    cameraPos: dScale([-5.8, 4.2, 0.2]),
    cameraTarget: dScale([0.7, 1.45, -0.1]),
  },
  {
    step: 7,
    code: '07',
    shortName: 'RIBBON CABLES',
    cameraPos: dScale([-5.6, 4.0, 1.0]),
    cameraTarget: dScale([0.7, 1.40, 0.3]),
  },
  {
    step: 8,
    code: '08',
    shortName: 'FRONT PANEL I/O',
    cameraPos: dScale([-5.4, 3.4, 1.4]),
    cameraTarget: dScale([0.7, 1.3, 0.4]),
  },
  {
    step: 9,
    code: '09',
    shortName: 'LỜI CẢM ƠN',
    cameraPos: dScale([-5.4, 4.4, 2.8]),
    cameraTarget: dScale([0.75, 1.35, -0.4]),
  },
  {
    step: 10,
    code: '10',
    shortName: 'CRT & BOOT UP',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
  },
  {
    step: 11,
    code: '11',
    shortName: 'MY PROJECTS',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
  },
  {
    step: 12,
    code: '12',
    shortName: 'MY CV / RESUME',
    cameraPos: dScale([0.2, 4.2, 11.2]),
    cameraTarget: dScale([0.1, 1.7, 0.2]),
  },
];
