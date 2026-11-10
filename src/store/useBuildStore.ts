import { create } from 'zustand';
import { ASSEMBLY_STEPS } from '../data/assemblySteps';
import { retroSound } from '../utils/retroSound';

/** Thời gian màn hình POST BIOS hiển thị sau khi bật máy / nhấn RESET (ms) */
export const POST_SCREEN_MS = 1500;
/** Thời gian hiệu ứng khử từ CRT (ms) */
export const DEGAUSS_MS = 1200;
/** Thời gian thanh mức OSD xanh lá hiện trên CRT sau khi chỉnh (ms) */
export const OSD_FLASH_MS = 2000;

/** Các nấc co giãn khung hình (phím GEOMETRY / SIZE) */
const CRT_SCALE_STEPS = [1.0, 1.05, 0.9] as const;
/** Các nấc dịch tâm khung hình [H, V] (phím POSITION) */
const CRT_POSITION_STEPS: [number, number][] = [
  [0, 0],
  [0.035, 0],
  [-0.035, 0],
  [0, 0.03],
];

export type CrtOsdFlashKind = 'BRIGHTNESS' | 'CONTRAST' | 'SIZE' | 'CENTER' | 'DEGAUSS';

export type RetroOsState = 'OFF' | 'BIOS_POST' | 'BOOT_LOGO' | 'LOGIN_SCREEN' | 'DESKTOP';

export type ProjectAppTransition =
  | 'IDLE'
  | 'EXPANDING_ON_CRT'
  | 'DIVING_CAMERA'
  | 'INSIDE_APP'
  | 'EXITING_CAMERA';

export type StageTransition =
  | 'IDLE'
  | 'ABOUT_TO_PROJECT'
  | 'TO_ABOUT'
  | 'TO_PROJECT'
  | 'TO_MY_CV'
  | 'TO_HOME'
  | 'TO_HOME_STEP1'
  | 'HOME_TO_ABOUT'
  | 'HOME_TO_PROJECT'
  | 'HOME_TO_MY_CV';

export type CdLocation = 'DESK' | 'TRAY' | 'INSIDE';
export type CardLocation = 'DESK' | 'INSERTED';

export type DesktopWindowId =
  | 'THIS_PC'
  | 'AUTORUN'
  | 'WORDPAD_CV'
  | 'PORTFOLIO'
  | 'MSDOS'
  | 'README'
  | 'RECYCLE_BIN';

export interface CrtOsdFlash {
  kind: CrtOsdFlashKind;
  /** performance.now() lúc kích hoạt */
  at: number;
}

const now = () => performance.now();
const clampRange = (v: number, min: number, max: number) =>
  Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;

let resetTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;
let cdSequenceTimer: ReturnType<typeof setTimeout> | null = null;
let expandRaf: number | null = null;
let divingTimer: ReturnType<typeof setTimeout> | null = null;
let exitTimer: ReturnType<typeof setTimeout> | null = null;
let shutdownDisassemblyTimer: ReturnType<typeof setTimeout> | null = null;

export interface BuildStoreState {
  currentStep: number;
  isTurbo: boolean;
  isPoweredOn: boolean;
  freeCam: boolean;
  soundEnabled: boolean;
  floppyInserted: boolean;
  resumeModalOpen: boolean;

  // ----- Thùng máy, Ổ đĩa & Bộ nguồn -----
  cdLocation: CdLocation;
  cardLocation: CardLocation;
  isCdTrayOpen: boolean;
  isCdInserted: boolean;
  /** Cờ khóa trạng thái đang chạy animation nạp/rút đĩa CD để loại bỏ hoàn toàn race condition */
  isCdAnimating: boolean;
  psuVoltage: 115 | 230;
  isResetting: boolean;
  /** performance.now() của lần bật nguồn / RESET gần nhất (0 = chưa có) – dùng để chạy màn hình POST BIOS */
  bootSequenceAt: number;
  /** Số giây thực trôi qua kể từ khi nhấn nút Power trên thùng PC */
  bootElapsedTime: number;
  /** Trạng thái của Hệ điều hành Retro OS chạy trên màn hình 3D */
  osState: RetroOsState;
  /** Cửa sổ đang kích hoạt trên Desktop */
  activeWindow: DesktopWindowId | null;
  /** Danh sách các cửa sổ đang mở trên Desktop */
  openWindows: DesktopWindowId[];
  /** Hộp thoại cảnh báo lỗi Windows 95 (null = ẩn) */
  osDialogAlert: string | null;

  /** performance.now() của lần chập quá áp gần nhất – dùng cho hiệu ứng tia lửa ở bộ nguồn */
  psuSparkAt: number;
  /** Thông báo cảnh báo trên HUD (null = ẩn) */
  hudWarning: string | null;

  // ----- Màn hình CRT Sony Trinitron -----
  isLampOn: boolean;
  isCrtPowered: boolean;
  crtBrightness: number;
  crtContrast: number;
  crtOsdOpen: boolean;
  crtHOffset: number;
  crtVOffset: number;
  crtScale: number;
  /** performance.now() của lần khử từ gần nhất (0 = chưa có) */
  degaussTrigger: number;
  crtOsdFlash: CrtOsdFlash | null;

  // ----- 3D Fly-Through Project Showcase -----
  isInsideProjectApp: boolean;
  projectAppTransition: ProjectAppTransition;
  stageTransition: StageTransition;
  crtExpandProgress: number;
  projectScrollProgress: number;

  // ----- Thông tin nút đang rê chuột -----
  hoveredControl: string | null;

  /**
   * Tiến trình lắp ráp chi tiết của Bước hiện tại (0.0 = Exploded/Bắt đầu bước -> 1.0 = Hoàn tất bước)
   */
  benchProgress: number;
  benchAutoTarget: number;
  benchScrubbing: boolean;
  scrollTarget: number;
  scrollCurrent: number;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addScrollDelta: (delta: number) => void;
  syncScrollCurrent: (val: number) => void;
  toggleTurbo: () => void;
  togglePower: () => void;
  toggleFreeCam: () => void;
  toggleSound: () => void;
  toggleFloppyInsert: () => void;
  setResumeModalOpen: (open: boolean) => void;

  // ----- Thùng máy, Ổ đĩa & Bộ nguồn Actions -----
  handleCdClickOnDesk: () => void;
  handleCdTrayEjectClick: () => void;
  handleCdClickOnTray: () => void;
  handleCardClick: () => void;
  showOsDialogAlert: (msg: string) => void;
  dismissOsDialogAlert: () => void;

  toggleCdTray: () => void;
  togglePsuVoltage: () => void;
  triggerReset: () => void;

  toggleLamp: () => void;
  toggleCrtPower: () => void;
  adjustBrightness: (delta: number) => void;
  adjustContrast: (delta: number) => void;
  toggleCrtOsd: () => void;
  cycleCrtGeometry: () => void;
  cycleCrtPosition: () => void;
  triggerDegauss: () => void;

  setHoveredControl: (label: string | null) => void;
  showHudWarning: (message: string, durationMs?: number) => void;

  setBenchProgress: (val: number, manual?: boolean) => void;
  triggerBenchAssemble: () => void;
  triggerBenchExplode: () => void;

  // ----- Hệ điều hành Retro OS & Tương tác Màn hình 3D -----
  tickOsTimeline: (currentTime: number) => void;
  loginDesktop: () => void;
  openWindow: (id: DesktopWindowId) => void;
  closeWindow: (id: DesktopWindowId) => void;
  bringWindowToFront: (id: DesktopWindowId) => void;
  triggerInsertCdSequence: () => void;
  triggerEjectCdToDeskSequence: (force?: boolean) => void;
  insertCdAndCloseTray: () => void;
  enterProjectApp: () => void;
  exitProjectApp: () => void;
  quickJumpToProjects: () => void;
  homeTransitionProgress: number;
  setHomeTransitionProgress: (val: number) => void;
  jumpToHome: () => void;
  jumpToAbout: () => void;
  jumpToProject: () => void;
  jumpToCv: () => void;
  applyStep10State: () => void;
  applyStep11State: () => void;
  applyStep12State: () => void;
  applyStep1State: () => void;
  applyHomeResetState: () => void;
  setStageTransition: (val: StageTransition) => void;
  setProjectScrollProgress: (val: number) => void;
  setCrtExpandProgress: (val: number) => void;
  setProjectAppTransition: (val: ProjectAppTransition) => void;
}

export const useBuildStore = create<BuildStoreState>((set, get) => {
  /** Chập quá áp: gạt 115V trên lưới 230V -> bảo vệ quá áp ngắt nguồn */
  const tripOvervoltage = () => {
    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    retroSound.playPowerPop(get().soundEnabled);
    set({
      isPoweredOn: false,
      isResetting: false,
      osState: 'OFF',
      bootElapsedTime: 0,
      activeWindow: null,
      psuSparkAt: now(),
      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
    });
    get().showHudWarning(
      'WARNING: 115V SELECTED ON 230V GRID - OVERVOLTAGE PROTECTION TRIPPED!',
      5200
    );
  };

  /** Màn hình CRT chỉ thực sự phát hình khi cả màn hình và thùng máy đều bật */
  const crtDisplaying = () => get().isCrtPowered && get().isPoweredOn;

  return {
  currentStep: 0,
  homeTransitionProgress: 0,
  isTurbo: true,
  isPoweredOn: false,
  freeCam: false,
  soundEnabled: true,
  floppyInserted: false,
  resumeModalOpen: false,

  cdLocation: 'DESK',
  cardLocation: 'DESK',
  isCdTrayOpen: false,
  isCdInserted: false,
  isCdAnimating: false,
  psuVoltage: 230,
  isResetting: false,
  bootSequenceAt: 0,
  bootElapsedTime: 0,
  osState: 'OFF',
  activeWindow: null,
  openWindows: [],
  osDialogAlert: null,
  psuSparkAt: 0,
  hudWarning: null,

  isLampOn: true,
  isCrtPowered: true,
  crtBrightness: 1.0,
  crtContrast: 1.0,
  crtOsdOpen: false,
  crtHOffset: 0,
  crtVOffset: 0,
  crtScale: 1.0,
  degaussTrigger: 0,
  crtOsdFlash: null,

  isInsideProjectApp: false,
  projectAppTransition: 'IDLE',
  stageTransition: 'IDLE',
  crtExpandProgress: 0,
  projectScrollProgress: 0,

  hoveredControl: null,

  benchProgress: 0,
  benchAutoTarget: 0,
  benchScrubbing: true,
  scrollTarget: 0.0,
  scrollCurrent: 0.0,

  setHomeTransitionProgress: (val: number) => {
    set({ homeTransitionProgress: Math.max(0, Math.min(1, val)) });
  },

  setStep: (step: number) => {
    const clamped = Math.max(0, Math.min(12, step));
    // CHẶN: Chỉ khi cuộn vượt quá Step 10 sang Step 11/12 mà máy chưa vào DESKTOP
    if (clamped > 10 && get().currentStep >= 10 && get().osState !== 'DESKTOP') {
      get().showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
      return;
    }

    // 0. KHI VỀ LẠI STEP 00 (HOME):
    if (clamped === 0) {
      if (cdSequenceTimer) {
        clearTimeout(cdSequenceTimer);
        cdSequenceTimer = null;
      }
      set({ isCdAnimating: false });
      if (get().currentStep >= 11) {
        if (get().cdLocation === 'INSIDE' || get().cdLocation === 'TRAY') {
          get().triggerEjectCdToDeskSequence(true);
        }
        if (get().cardLocation === 'INSERTED') {
          set({ cardLocation: 'DESK', floppyInserted: false });
        }
        const currentWins = get().openWindows;
        const nextWins = currentWins.filter((w) => w !== 'AUTORUN' && w !== 'WORDPAD_CV');
        set({
          openWindows: nextWins,
          activeWindow: nextWins.length > 0 ? nextWins[nextWins.length - 1] : null,
        });
      }
      set({
        scrollTarget: 0.0,
        benchScrubbing: true,
      });
      return;
    }

    // 1. KHI CUỘN NGƯỢC TỪ STEP 12 VỀ STEP 11 (MY CV -> PROJECT):
    // Phản hồi tức thì 0ms delay: Hủy mọi timer chờ của Step 12, rút ngay Thẻ nhớ về bàn, đóng CV, phục hồi My Projects trên CRT
    if (get().currentStep === 12 && clamped <= 11) {
      retroSound.playFloppySeek(get().soundEnabled);
      set({
        currentStep: 11,
        cardLocation: 'DESK',
        floppyInserted: false,
        activeWindow: 'AUTORUN',
        openWindows: ['AUTORUN'],
      });
    }

    // 2. KHI CUỘN NGƯỢC TỪ STEP 11 VỀ STEP 10 (PROJECT -> ABOUT):
    // Phản hồi tức thì 0ms delay: Hủy ngay lập tức bất kỳ chuỗi insertCd nào đang chạy dở, không bị chặn bởi isCdAnimating
    if (get().currentStep === 11 && clamped <= 10) {
      if (cdSequenceTimer) {
        clearTimeout(cdSequenceTimer);
        cdSequenceTimer = null;
      }
      set({ isCdAnimating: false });
      const currentWins = get().openWindows;
      const nextWins = currentWins.filter((w) => w !== 'AUTORUN');
      set({
        openWindows: nextWins,
        activeWindow: get().activeWindow === 'AUTORUN' ? null : get().activeWindow,
      });
      // Mở khay và trả đĩa về bàn song song với camera lướt về góc nhìn Step 10 (force = true)
      if (get().cdLocation === 'INSIDE' || get().cdLocation === 'TRAY') {
        get().triggerEjectCdToDeskSequence(true);
      }
    }

    // 3. KHI CUỘN NGƯỢC TỪ STEP 10 VỀ STEP 09 TRỞ XUỐNG (ABOUT STEP 10 -> STEP 09 THÁO MÁY):
    // BẮT BUỘC TẮT MÁY AN TOÀN TRƯỚC KHI THÁO LINH KIỆN
    // Step 10 & 11 cần scroll đến cuối phân đoạn (10.99 và 11.99) để hoàn thành lắp ráp và nạp đĩa
    const targetTimeline =
      clamped === 10 ? 10.99 : clamped === 11 ? 11.99 : clamped;

    if (get().currentStep === 10 && clamped <= 9) {
      if (shutdownDisassemblyTimer) {
        clearTimeout(shutdownDisassemblyTimer);
        shutdownDisassemblyTimer = null;
      }
      const wasPowered = get().isPoweredOn;
      if (wasPowered) {
        // BƯỚC A: Tắt nguồn máy & Màn hình CRT sập nguồn (CRT Power-Off Collapse) ngay lập tức
        retroSound.playTurboClick(get().soundEnabled);
        set({
          isPoweredOn: false,
          osState: 'OFF',
          bootElapsedTime: 0,
          cdLocation: 'DESK',
          cardLocation: 'DESK',
          isCdTrayOpen: false,
          isCdInserted: false,
          floppyInserted: false,
          activeWindow: null,
          openWindows: [],
        });
        get().showHudWarning('SHUTTING DOWN SYSTEM SAFELY BEFORE DISASSEMBLY...', 1800);

        // BƯỚC B: Trễ 0.5s sau khi CRT sập nguồn và đèn tắt an toàn mới mở nắp thùng máy lùi về Step 09
        shutdownDisassemblyTimer = setTimeout(() => {
          set({
            scrollTarget: targetTimeline,
            benchScrubbing: true,
          });
          shutdownDisassemblyTimer = null;
        }, 500);
        return;
      }
    }

    if (clamped < 10) {
      if (get().freeCam) {
        set({ freeCam: false });
      }
      if (get().isPoweredOn || get().osState !== 'OFF') {
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
      if (expandRaf) {
        cancelAnimationFrame(expandRaf);
        expandRaf = null;
      }
      if (divingTimer) {
        clearTimeout(divingTimer);
        divingTimer = null;
      }
      if (exitTimer) {
        clearTimeout(exitTimer);
        exitTimer = null;
      }
      if (cdSequenceTimer) {
        clearTimeout(cdSequenceTimer);
        cdSequenceTimer = null;
      }
      if (shutdownDisassemblyTimer) {
        clearTimeout(shutdownDisassemblyTimer);
        shutdownDisassemblyTimer = null;
      }
        set({
          isPoweredOn: false,
          isResetting: false,
          osState: 'OFF',
          bootElapsedTime: 0,
          cdLocation: 'DESK',
          isCdTrayOpen: false,
          isCdInserted: false,
          cardLocation: 'DESK',
          floppyInserted: false,
          activeWindow: null,
          openWindows: [],
          isInsideProjectApp: false,
          projectAppTransition: 'IDLE',
          crtExpandProgress: 0,
        });
      }
    }
    set({
      scrollTarget: targetTimeline,
      benchScrubbing: true,
      homeTransitionProgress: targetTimeline === 0 ? 0 : (get().currentStep === 0 ? get().homeTransitionProgress : 1),
    });
  },

  nextStep: () => {
    if (get().currentStep === 10 && get().scrollTarget >= 10.9 && get().osState !== 'DESKTOP') {
      get().showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
      return;
    }
    get().setStep(get().currentStep + 1);
  },

  prevStep: () => {
    get().setStep(get().currentStep - 1);
  },

  addScrollDelta: (delta: number) => {
    let next = get().scrollTarget + delta;
    if (next > 11.0 && get().osState !== 'DESKTOP') {
      next = 10.99;
      get().showHudWarning('SYSTEM BOOTING... WAITING FOR DESKTOP LOGIN', 2200);
    }
    const clampedNext = Math.max(0.0, Math.min(12, next));
    set({ scrollTarget: clampedNext, benchScrubbing: true });
  },

  syncScrollCurrent: (val: number) => {
    const clamped = Math.max(0.0, Math.min(12, val));
    const prevStep = get().currentStep;
    const prevScroll = get().scrollCurrent;

    let nextStepNum: number;
    let nextBenchP: number;
    let nextHomeP: number;

    if (clamped <= 0.05) {
      nextStepNum = 0;
      nextBenchP = 0.0;
      nextHomeP = 0.0;
    } else if (clamped <= 1.0) {
      // Phân đoạn chuyển tiếp từ HOME (0.0) vào bàn làm việc ABOUT STEP 01 (1.0)
      // Linh kiện nằm sẵn trên bàn, CHƯA LẮP NGAY (benchProgress = 0.0), chờ thêm 1 lần scroll nữa!
      nextStepNum = clamped < 0.75 ? 0 : 1;
      nextBenchP = 0.0;
      nextHomeP = clamped;
    } else if (clamped >= 12.0) {
      nextStepNum = 12;
      nextBenchP = 1.0;
      nextHomeP = 1.0;
    } else {
      // Khi người dùng cuộn tiếp (clamped > 1.0):
      // - Khoảng [1.0, 2.0]: Lắp ráp Step 01 (CPU + Heatsink + RAM) với benchProgress = clamped - 1.0
      // - Khoảng [s, s + 1]: Lắp ráp Step s với benchProgress = clamped - s
      const s = Math.floor(clamped);
      const frac = clamped - s;
      nextStepNum = Math.min(12, s);
      nextBenchP = frac;
      nextHomeP = 1.0;
    }

    if (nextStepNum !== prevStep) {
      retroSound.playStepTick(get().soundEnabled);
    }

    // PHÂN ĐOẠN 1 — ABOUT (Step 01 -> Step 09): Máy chưa đóng nắp -> bắt buộc OFF, đĩa CD và Thẻ nhớ nằm trên bàn
    if (nextStepNum < 10) {
      if (get().freeCam) {
        set({ freeCam: false });
      }
      if (
        get().isPoweredOn ||
        get().osState !== 'OFF' ||
        get().cdLocation !== 'DESK' ||
        get().cardLocation !== 'DESK'
      ) {
        if (resetTimer) {
          clearTimeout(resetTimer);
          resetTimer = null;
        }
        if (expandRaf) {
          cancelAnimationFrame(expandRaf);
          expandRaf = null;
        }
        if (divingTimer) {
          clearTimeout(divingTimer);
          divingTimer = null;
        }
        if (exitTimer) {
          clearTimeout(exitTimer);
          exitTimer = null;
        }
        if (cdSequenceTimer) {
          clearTimeout(cdSequenceTimer);
          cdSequenceTimer = null;
        }
        set({
          isPoweredOn: false,
          isResetting: false,
          osState: 'OFF',
          bootElapsedTime: 0,
          cdLocation: 'DESK',
          isCdTrayOpen: false,
          isCdInserted: false,
          cardLocation: 'DESK',
          floppyInserted: false,
          activeWindow: null,
          openWindows: [],
          isInsideProjectApp: false,
          projectAppTransition: 'IDLE',
          crtExpandProgress: 0,
        });
      }
    } else if (nextStepNum === 10) {
      // Step 10: Hoàn tất đóng vỏ thùng máy, cắm ngoại vi và tự động bật nguồn khi benchProgress >= 0.95
      const isAssemblyComplete = clamped >= 10.95 || nextBenchP >= 0.95;

      if (!get().isPoweredOn && isAssemblyComplete) {
        retroSound.playPostBeep(get().soundEnabled);
        set({
          isPoweredOn: true,
          isCrtPowered: true,
          bootSequenceAt: now(),
          bootElapsedTime: 0,
          osState: 'BIOS_POST',
          cdLocation: 'DESK',
          isCdTrayOpen: false,
          isCdInserted: false,
          cardLocation: 'DESK',
          floppyInserted: false,
          activeWindow: null,
          openWindows: [],
          projectAppTransition: 'IDLE',
          crtExpandProgress: 0,
        });
      } else if (get().isPoweredOn && !isAssemblyComplete && prevStep <= 10) {
        // Nếu cuộn ngược lại trước khi hoàn thành cắm dây (benchProgress < 0.95): tắt nguồn an toàn
        set({
          isPoweredOn: false,
          isCrtPowered: false,
          osState: 'OFF',
          bootElapsedTime: 0,
        });
      } else if (prevStep >= 11) {
        // Cuộn ngược từ Step 11 về Step 10:
        // Đĩa CD tự động trả về mặt bàn tuần tự 3 pha (nếu chưa ở DESK và không đang chạy animation)
        if ((get().cdLocation === 'INSIDE' || get().cdLocation === 'TRAY') && !get().isCdAnimating) {
          get().triggerEjectCdToDeskSequence();
        }
      }
    } else if (nextStepNum === 11) {
      // PHÂN ĐOẠN 2 — PROJECT (Step 11): Tự động nạp Đĩa CD vào ổ & mở My Projects trên CRT
      if (prevStep <= 10) {
        // Cuộn xuôi từ Step 10 lên Step 11:
        if (get().cdLocation === 'DESK' && !get().isCdAnimating) {
          get().triggerInsertCdSequence();
        }
      } else if (prevStep === 12) {
        // Cuộn ngược từ Step 12 về Step 11:
        // Thẻ nhớ rút ra trả về bàn, phục hồi cửa sổ My Projects
        retroSound.playFloppySeek(get().soundEnabled);
        set({
          cardLocation: 'DESK',
          floppyInserted: false,
          activeWindow: 'AUTORUN',
        });
      }
    } else if (nextStepNum === 12) {
      // PHÂN ĐOẠN 3 — MY CV (Step 12): Tự động cắm Thẻ nhớ vào khe đọc & mở WordPad CV
      if (prevStep <= 11 || get().cardLocation !== 'INSERTED') {
        retroSound.playFloppySeek(get().soundEnabled);
      }
      const existingWins = get().openWindows;
      const cvWins = existingWins.includes('WORDPAD_CV')
        ? existingWins
        : [...existingWins, 'WORDPAD_CV' as DesktopWindowId];
      set({
        isPoweredOn: true,
        isCrtPowered: true,
        osState: 'DESKTOP',
        cdLocation: 'INSIDE',
        isCdTrayOpen: false,
        isCdInserted: true,
        cardLocation: 'INSERTED',
        floppyInserted: true,
        activeWindow: 'WORDPAD_CV',
        openWindows: cvWins,
      });
    }

    set({
      scrollCurrent: clamped,
      currentStep: nextStepNum,
      benchProgress: nextBenchP,
      benchAutoTarget: nextBenchP,
      homeTransitionProgress: nextHomeP,
      benchScrubbing: true,
    });
  },

  toggleTurbo: () => {
    const { isTurbo, soundEnabled } = get();
    retroSound.playTurboClick(soundEnabled);
    set({ isTurbo: !isTurbo });
  },

  togglePower: () => {
    const { isPoweredOn, soundEnabled, psuVoltage, currentStep } = get();
    // Tiếng công tắc cơ AT nặng (Latching Switch)
    retroSound.playTurboClick(soundEnabled);
    if (currentStep < 10) {
      get().showHudWarning(
        'POWER DISABLED: COMPLETE PC ASSEMBLY (STEP 10) FIRST',
        3200
      );
      return;
    }
    if (isPoweredOn) {
      if (resetTimer) clearTimeout(resetTimer);
      if (expandRaf) {
        cancelAnimationFrame(expandRaf);
        expandRaf = null;
      }
      if (divingTimer) {
        clearTimeout(divingTimer);
        divingTimer = null;
      }
      if (exitTimer) {
        clearTimeout(exitTimer);
        exitTimer = null;
      }
      set({
        isPoweredOn: false,
        isResetting: false,
        osState: 'OFF',
        bootElapsedTime: 0,
        activeWindow: null,
        openWindows: [],
        isInsideProjectApp: false,
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
      return;
    }
    // Bật máy khi công tắc nguồn đang gạt 115V trên lưới 230V -> chập quá áp ngay lập tức
    if (psuVoltage === 115) {
      tripOvervoltage();
      return;
    }
    retroSound.playPostBeep(soundEnabled);
    const t = now();
    set({
      isPoweredOn: true,
      bootSequenceAt: t,
      bootElapsedTime: 0,
      osState: 'BIOS_POST',
      activeWindow: null,
      openWindows: [],
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
    });
  },

  toggleFreeCam: () => {
    if (get().currentStep < 10) return;
    const { freeCam, soundEnabled } = get();
    retroSound.playStepTick(soundEnabled);
    set({ freeCam: !freeCam });
  },

  toggleSound: () => {
    const nextSound = !get().soundEnabled;
    retroSound.setGlobalMute(!nextSound);
    if (nextSound) {
      retroSound.playStepTick(true);
    }
    set({ soundEnabled: nextSound });
  },

  toggleFloppyInsert: () => {
    get().handleCardClick();
  },

  setResumeModalOpen: (open: boolean) => {
    retroSound.playStepTick(get().soundEnabled);
    set({ resumeModalOpen: open });
  },

  // ===========================================================================
  // THÙNG MÁY, Ổ ĐĨA & BỘ NGUỒN - CHUỖI ANIMATION NẠP/RÚT ĐĨA CD 3 PHA (TỔNG 1.6s)
  // Quản lý chặt chẽ qua State Machine + Cờ khóa isCdAnimating chống xung đột (race condition)
  // ===========================================================================
  triggerInsertCdSequence: () => {
    // 1. Chống race condition: Bỏ qua ngay lập tức nếu đang trong quá trình animation
    if (get().isCdAnimating) return;

    // 2. Hủy sạch mọi hẹn giờ cũ
    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    const { soundEnabled } = get();

    // Khóa cờ animation và bắt đầu:
    // Pha 1 (0.0s -> 0.5s): Khay ổ đĩa CD-ROM từ từ trượt mở ra hoàn toàn. Đĩa CD vẫn nằm yên trên bàn.
    retroSound.playCdMotor(soundEnabled);
    set({
      currentStep: 11,
      scrollTarget: 10.99,
      isCdAnimating: true,
      isPoweredOn: true,
      isCrtPowered: true,
      osState: 'DESKTOP',
      isCdTrayOpen: true,
      cdLocation: 'DESK',
      isCdInserted: false,
    });

    cdSequenceTimer = setTimeout(() => {
      // Pha 2 (0.5s -> 1.1s - Kéo dài 0.6s): Khi khay đã mở hẳn, đĩa CD bay từ mặt bàn vào lòng khay đĩa
      set({ cdLocation: 'TRAY' });

      cdSequenceTimer = setTimeout(() => {
        // Pha 3 (1.1s -> 1.6s - Kéo dài 0.5s): Khay đĩa mang theo Đĩa CD trượt đóng từ từ vào trong ổ
        retroSound.playCdMotor(soundEnabled);
        retroSound.playCdSpin(soundEnabled);
        set({
          isCdTrayOpen: false,
          cdLocation: 'INSIDE',
          isCdInserted: true,
        });

        // Kết thúc chuỗi (1.6s): Mở khóa isCdAnimating và bật cửa sổ AUTORUN (My Projects)
        cdSequenceTimer = setTimeout(() => {
          const currentWins = get().openWindows;
          const nextWins = currentWins.includes('AUTORUN')
            ? currentWins
            : [...currentWins, 'AUTORUN' as DesktopWindowId];
          set({
            isCdAnimating: false,
            openWindows: nextWins,
            activeWindow: 'AUTORUN',
          });
          cdSequenceTimer = null;
        }, 500);
      }, 600);
    }, 500);
  },

  triggerEjectCdToDeskSequence: (force = false) => {
    // 1. Chống race condition (trừ khi force = true từ lệnh cuộn ngược)
    if (!force && get().isCdAnimating) return;

    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    const { soundEnabled, openWindows, activeWindow } = get();

    // Khóa cờ animation:
    // Pha 1 (0.0s -> 0.4s): Khay đĩa mở trượt chiếc đĩa ra ngoài, đóng cửa sổ AUTORUN
    retroSound.playCdMotor(soundEnabled);
    const nextWins = openWindows.filter((w) => w !== 'AUTORUN');
    set({
      isCdAnimating: true,
      isCdTrayOpen: true,
      cdLocation: 'TRAY',
      isCdInserted: false,
      openWindows: nextWins,
      activeWindow:
        activeWindow === 'AUTORUN' ? nextWins[nextWins.length - 1] || null : activeWindow,
    });

    cdSequenceTimer = setTimeout(() => {
      // Pha 2 (0.4s -> 0.9s): Đĩa bay từ khay về mặt bàn
      set({ cdLocation: 'DESK' });
      // Khi đĩa CD đã trả về mặt bàn, nếu đang ở Step 11 thì nảy về nút ABOUT (Step 10)
      if (get().currentStep === 11) {
        set({ currentStep: 10, scrollTarget: 10.99 });
      }

      cdSequenceTimer = setTimeout(() => {
        // Pha 3 (0.9s -> 1.3s): Khay đĩa tự đóng lại
        retroSound.playCdMotor(soundEnabled);
        set({ isCdTrayOpen: false });

        cdSequenceTimer = setTimeout(() => {
          // Kết thúc (1.3s): Mở khóa isCdAnimating
          set({ isCdAnimating: false });
          cdSequenceTimer = null;
        }, 400);
      }, 500);
    }, 400);
  },

  handleCdClickOnDesk: () => {
    const { currentStep } = get();
    // Bấm nhét đĩa CD từ mặt bàn vào ổ tương đương việc bấm nút [ PROJECT ] (Step 11)
    if (currentStep < 10) {
      get().jumpToProject();
    } else {
      if (get().osState !== 'DESKTOP') {
        get().loginDesktop();
      }
      get().setStep(11);
      get().triggerInsertCdSequence();
      get().showHudWarning('PROJECT: VINZBOIZ 3D WORKS · CD-ROM AUTORUN (STEP 11/12)', 3000);
    }
  },

  handleCdClickOnTray: () => {
    get().triggerEjectCdToDeskSequence(true);
    if (get().currentStep === 11) {
      get().setStep(10);
      get().showHudWarning('ABOUT: VINZBOIZ PORTFOLIO · HARDWARE ASSEMBLY (STEP 10/12)', 3000);
    }
  },

  handleCdTrayEjectClick: () => {
    const { isPoweredOn, soundEnabled, isCdTrayOpen, cdLocation, openWindows, activeWindow } = get();
    retroSound.playButtonClick(soundEnabled);
    if (!isPoweredOn) {
      return;
    }
    retroSound.playCdMotor(soundEnabled);
    if (isCdTrayOpen) {
      // Đang mở -> Bấm đóng khay
      const nextLoc = cdLocation === 'TRAY' ? 'INSIDE' : cdLocation;
      const nextWins =
        nextLoc === 'INSIDE' && !openWindows.includes('AUTORUN')
          ? [...openWindows, 'AUTORUN' as DesktopWindowId]
          : openWindows;
      if (nextLoc === 'INSIDE') {
        retroSound.playCdSpin(soundEnabled);
      }
      set({
        isCdTrayOpen: false,
        cdLocation: nextLoc,
        isCdInserted: nextLoc === 'INSIDE',
        openWindows: nextWins,
        activeWindow: nextLoc === 'INSIDE' ? 'AUTORUN' : activeWindow,
      });
      // Nếu có đĩa trong khay và đóng vào ổ -> nảy sang nút PROJECT (Step 11)
      if (nextLoc === 'INSIDE') {
        get().setStep(11);
        get().showHudWarning('PROJECT: VINZBOIZ 3D WORKS · CD-ROM AUTORUN (STEP 11/12)', 3000);
      }
    } else {
      // Đang đóng -> Mở khay
      const nextLoc = cdLocation === 'INSIDE' ? 'TRAY' : cdLocation;
      const nextWins = openWindows.filter((w) => w !== 'AUTORUN');
      set({
        isCdTrayOpen: true,
        cdLocation: nextLoc,
        isCdInserted: false,
        openWindows: nextWins,
        activeWindow:
          activeWindow === 'AUTORUN' ? nextWins[nextWins.length - 1] || null : activeWindow,
      });
    }
  },

  handleCardClick: () => {
    const { cardLocation, soundEnabled, osState, openWindows, activeWindow, currentStep, cdLocation } = get();
    retroSound.playFloppySeek(soundEnabled);
    if (cardLocation === 'DESK') {
      // Bấm nhét Thẻ nhớ vào khe đọc tương đương việc bấm nút [ MY CV ] (Step 12)
      if (currentStep < 10) {
        get().jumpToCv();
      } else {
        if (osState !== 'DESKTOP') {
          get().loginDesktop();
        }
        get().setStep(12);
        const nextWins = openWindows.includes('WORDPAD_CV')
          ? openWindows
          : [...openWindows, 'WORDPAD_CV' as DesktopWindowId];
        set({
          currentStep: 12,
          scrollTarget: 11.99,
          cardLocation: 'INSERTED',
          floppyInserted: true,
          openWindows: nextWins,
          activeWindow: 'WORDPAD_CV',
        });
        get().showHudWarning('MY CV: VINZBOIZ DOSSIER · FLOPPY 1.44MB (STEP 12/12)', 3000);
      }
    } else {
      // Rút thẻ bay về lại bàn:
      // Nếu đĩa CD vẫn đang nằm trong ổ -> Quay về Step 11 (PROJECT)
      // Nếu đĩa CD nằm trên bàn -> Quay về Step 10 (ABOUT)
      const nextWins = openWindows.filter((w) => w !== 'WORDPAD_CV');
      const targetStep = cdLocation === 'INSIDE' ? 11 : 10;
      set({
        cardLocation: 'DESK',
        floppyInserted: false,
        openWindows: targetStep === 11 ? ['AUTORUN'] : nextWins,
        activeWindow: targetStep === 11 ? 'AUTORUN' : (nextWins[nextWins.length - 1] || null),
      });
      get().setStep(targetStep);
      get().showHudWarning(
        targetStep === 11
          ? 'PROJECT: VINZBOIZ 3D WORKS · CD-ROM AUTORUN (STEP 11/12)'
          : 'ABOUT: VINZBOIZ PORTFOLIO · HARDWARE ASSEMBLY (STEP 10/12)',
        3000
      );
    }
  },

  showOsDialogAlert: (msg: string) => {
    retroSound.playWindowClick(get().soundEnabled);
    set({ osDialogAlert: msg });
  },

  dismissOsDialogAlert: () => {
    retroSound.playButtonClick(get().soundEnabled);
    set({ osDialogAlert: null });
  },

  toggleCdTray: () => {
    get().handleCdTrayEjectClick();
  },

  insertCdAndCloseTray: () => {
    get().handleCdClickOnDesk();
  },

  togglePsuVoltage: () => {
    const { psuVoltage, isPoweredOn, soundEnabled } = get();
    const next: 115 | 230 = psuVoltage === 230 ? 115 : 230;
    retroSound.playSocketLever(soundEnabled);
    set({ psuVoltage: next });
    if (next === 115 && isPoweredOn) {
      tripOvervoltage();
    }
  },

  triggerReset: () => {
    const { isPoweredOn, soundEnabled } = get();
    retroSound.playButtonClick(soundEnabled);
    if (!isPoweredOn) return;
    retroSound.playPostBeep(soundEnabled);
    if (resetTimer) clearTimeout(resetTimer);
    const t = now();
    set({
      isResetting: true,
      bootSequenceAt: t,
      bootElapsedTime: 0,
      osState: 'BIOS_POST',
      activeWindow: null,
    });
    resetTimer = setTimeout(() => {
      resetTimer = null;
      set({ isResetting: false });
    }, 1200);
  },

  // ===========================================================================
  // HỆ ĐIỀU HÀNH RETRO OS & TƯƠNG TÁC MÀN HÌNH 3D
  // ===========================================================================
  tickOsTimeline: (currentTime: number) => {
    const { isPoweredOn, isResetting, bootSequenceAt, osState, currentStep } = get();
    if (!isPoweredOn || currentStep < 10) {
      if (osState !== 'OFF' || get().bootElapsedTime !== 0) {
        set({ osState: 'OFF', bootElapsedTime: 0 });
      }
      return;
    }
    if (isResetting) {
      if (osState !== 'BIOS_POST') {
        set({ osState: 'BIOS_POST', bootElapsedTime: 0 });
      }
      return;
    }
    // Khi đã vào Desktop, giữ trạng thái DESKTOP
    if (osState === 'DESKTOP') {
      const elapsed = Math.max(0, (currentTime - bootSequenceAt) / 1000);
      if (Math.abs(get().bootElapsedTime - elapsed) > 0.05) {
        set({ bootElapsedTime: elapsed });
      }
      return;
    }

    const elapsed = Math.max(0, (currentTime - bootSequenceAt) / 1000);
    if (elapsed >= 5.6) {
      // Sau khi hiển thị LOGIN_SCREEN ~1.4s (từ 4.2s đến 5.6s), tự động click Login vào Desktop
      get().loginDesktop();
      return;
    }

    let nextState: RetroOsState = osState;
    if (elapsed < 2.5) {
      nextState = 'BIOS_POST';
    } else if (elapsed < 4.2) {
      nextState = 'BOOT_LOGO';
    } else {
      nextState = 'LOGIN_SCREEN';
    }

    if (nextState !== osState || Math.abs(get().bootElapsedTime - elapsed) > 0.05) {
      set({ osState: nextState, bootElapsedTime: elapsed });
    }
  },

  loginDesktop: () => {
    const { soundEnabled, cdLocation, cardLocation } = get();
    retroSound.playButtonClick(soundEnabled);
    retroSound.playWin95Chime(soundEnabled);
    const autoWins: DesktopWindowId[] = [];
    let autoActive: DesktopWindowId | null = null;
    if (cdLocation === 'INSIDE') {
      autoWins.push('AUTORUN');
      autoActive = 'AUTORUN';
    }
    if (cardLocation === 'INSERTED') {
      autoWins.push('WORDPAD_CV');
      if (!autoActive) autoActive = 'WORDPAD_CV';
    }
    set({
      osState: 'DESKTOP',
      openWindows: autoWins,
      activeWindow: autoActive,
    });
  },

  openWindow: (id: DesktopWindowId) => {
    retroSound.playWindowClick(get().soundEnabled);
    const { openWindows, currentStep } = get();
    const filtered = openWindows.filter((w) => w !== id);
    set({
      openWindows: [...filtered, id],
      activeWindow: id,
    });
    // Mở AUTORUN (My Projects) đồng bộ nảy nút PROJECT (Step 11)
    if (id === 'AUTORUN' && currentStep >= 10 && currentStep !== 11) {
      get().setStep(11);
      get().showHudWarning('PROJECT: VINZBOIZ 3D WORKS · CD-ROM AUTORUN (STEP 11/12)', 3000);
    }
    // Mở WORDPAD_CV đồng bộ nảy nút MY CV (Step 12)
    if (id === 'WORDPAD_CV' && currentStep >= 10 && currentStep !== 12) {
      get().setStep(12);
      get().showHudWarning('MY CV: VINZBOIZ DOSSIER · FLOPPY 1.44MB (STEP 12/12)', 3000);
    }
  },

  closeWindow: (id: DesktopWindowId) => {
    retroSound.playWindowClick(get().soundEnabled);
    const { openWindows, activeWindow } = get();
    const nextWins = openWindows.filter((w) => w !== id);
    set({
      openWindows: nextWins,
      activeWindow: activeWindow === id ? (nextWins[nextWins.length - 1] || null) : activeWindow,
    });
  },

  bringWindowToFront: (id: DesktopWindowId) => {
    const { openWindows, activeWindow } = get();
    if (activeWindow === id) return;
    retroSound.playWindowClick(get().soundEnabled);
    const filtered = openWindows.filter((w) => w !== id);
    set({
      openWindows: [...filtered, id],
      activeWindow: id,
    });
  },

  // ===========================================================================
  // ĐÈN BÀN LÀM VIỆC ĐỘC LẬP (INDEPENDENT ARCHITECT DESK LAMP)
  // ===========================================================================
  toggleLamp: () => {
    const next = !get().isLampOn;
    retroSound.playTurboClick(get().soundEnabled);
    set({ isLampOn: next });
  },

  // ===========================================================================
  // MÀN HÌNH CRT SONY TRINITRON MULTISCAN 100ES
  // ===========================================================================
  toggleCrtPower: () => {
    const { isCrtPowered, soundEnabled } = get();
    retroSound.playTurboClick(soundEnabled);
    set({
      isCrtPowered: !isCrtPowered,
      // Tắt màn hình thì OSD cũng biến mất
      crtOsdOpen: isCrtPowered ? false : get().crtOsdOpen,
      crtOsdFlash: null,
    });
  },

  adjustBrightness: (delta: number) => {
    retroSound.playButtonClick(get().soundEnabled);
    if (!crtDisplaying()) return;
    set({
      crtBrightness: clampRange(get().crtBrightness + delta, 0.5, 1.5),
      crtOsdFlash: { kind: 'BRIGHTNESS', at: now() },
    });
  },

  adjustContrast: (delta: number) => {
    retroSound.playButtonClick(get().soundEnabled);
    if (!crtDisplaying()) return;
    set({
      crtContrast: clampRange(get().crtContrast + delta, 0.5, 1.5),
      crtOsdFlash: { kind: 'CONTRAST', at: now() },
    });
  },

  toggleCrtOsd: () => {
    retroSound.playButtonClick(get().soundEnabled);
    if (!crtDisplaying()) return;
    set({ crtOsdOpen: !get().crtOsdOpen });
  },

  cycleCrtGeometry: () => {
    retroSound.playButtonClick(get().soundEnabled);
    if (!crtDisplaying()) return;
    const idx = CRT_SCALE_STEPS.findIndex((s) => Math.abs(s - get().crtScale) < 0.001);
    const next = CRT_SCALE_STEPS[(idx + 1) % CRT_SCALE_STEPS.length];
    set({ crtScale: next, crtOsdFlash: { kind: 'SIZE', at: now() } });
  },

  cycleCrtPosition: () => {
    retroSound.playButtonClick(get().soundEnabled);
    if (!crtDisplaying()) return;
    const { crtHOffset, crtVOffset } = get();
    const idx = CRT_POSITION_STEPS.findIndex(
      ([h, v]) => Math.abs(h - crtHOffset) < 0.001 && Math.abs(v - crtVOffset) < 0.001
    );
    const [h, v] = CRT_POSITION_STEPS[(idx + 1) % CRT_POSITION_STEPS.length];
    set({ crtHOffset: h, crtVOffset: v, crtOsdFlash: { kind: 'CENTER', at: now() } });
  },

  triggerDegauss: () => {
    const { soundEnabled } = get();
    retroSound.playButtonClick(soundEnabled);
    // Cuộn khử từ chỉ hoạt động khi đèn hình đang được cấp điện
    if (!crtDisplaying()) return;
    retroSound.playDegauss(soundEnabled);
    const t = now();
    set({ degaussTrigger: t, crtOsdFlash: { kind: 'DEGAUSS', at: t } });
  },

  // ===========================================================================
  // HUD
  // ===========================================================================
  setHoveredControl: (label: string | null) => {
    if (get().hoveredControl !== label) set({ hoveredControl: label });
  },

  showHudWarning: (message: string, durationMs = 4500) => {
    if (warningTimer) clearTimeout(warningTimer);
    set({ hudWarning: message });
    warningTimer = setTimeout(() => {
      warningTimer = null;
      set({ hudWarning: null });
    }, durationMs);
  },

  setBenchProgress: (val: number, manual = false) => {
    const clamped = Math.max(0, Math.min(1, val));
    if (manual) {
      set({
        benchProgress: clamped,
        benchAutoTarget: clamped,
        benchScrubbing: true,
      });
    } else {
      set({ benchProgress: clamped });
    }
  },

  triggerBenchAssemble: () => {
    retroSound.playStepTick(get().soundEnabled);
    set({
      benchProgress: 0,
      benchAutoTarget: 1,
      benchScrubbing: false,
    });
  },

  triggerBenchExplode: () => {
    retroSound.playStepTick(get().soundEnabled);
    set({
      benchAutoTarget: 0,
      benchScrubbing: false,
    });
  },

  // ----- 3D Retro Fly-Through Showcase Actions -----
  enterProjectApp: () => {
    if (get().projectAppTransition !== 'IDLE') return;
    const { soundEnabled } = get();
    retroSound.playWindowClick(soundEnabled);
    retroSound.playCdSpin(soundEnabled);

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    set({
      projectAppTransition: 'EXPANDING_ON_CRT',
      crtExpandProgress: 0,
    });

    const startTime = performance.now();
    const duration = 650; // ms

    const step = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      set({ crtExpandProgress: eased });

      if (progress < 1) {
        expandRaf = requestAnimationFrame(step);
      } else {
        expandRaf = null;
        set({
          projectAppTransition: 'DIVING_CAMERA',
          crtExpandProgress: 1,
        });

        divingTimer = setTimeout(() => {
          divingTimer = null;
          set({
            projectAppTransition: 'INSIDE_APP',
            isInsideProjectApp: true,
          });
        }, 750);
      }
    };

    expandRaf = requestAnimationFrame(step);
  },

  exitProjectApp: () => {
    if (get().projectAppTransition !== 'INSIDE_APP') return;
    const { soundEnabled } = get();
    retroSound.playButtonClick(soundEnabled);

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    set({
      isInsideProjectApp: false,
      projectAppTransition: 'EXITING_CAMERA',
    });

    exitTimer = setTimeout(() => {
      exitTimer = null;
      set({
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
    }, 600);
  },

  setProjectScrollProgress: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    set({ projectScrollProgress: clamped });
  },

  quickJumpToProjects: () => {
    get().jumpToProject();
  },

  jumpToHome: () => {
    const { currentStep, isInsideProjectApp, soundEnabled, stageTransition } = get();
    // Nếu đang ở Home rồi (currentStep === 0) và không có transition thì bỏ qua
    if (currentStep === 0 && stageTransition === 'IDLE') return;
    if (stageTransition !== 'IDLE') return;

    if (shutdownDisassemblyTimer) {
      clearTimeout(shutdownDisassemblyTimer);
      shutdownDisassemblyTimer = null;
    }
    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    set({ isCdAnimating: false });

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    // 1. Nếu đang ở trong màn hình xem project (isInsideProjectApp === true), thoát ra ngoài ngay lập tức
    if (isInsideProjectApp) {
      set({
        isInsideProjectApp: false,
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
    }

    if (get().freeCam) {
      set({ freeCam: false });
    }

    retroSound.playButtonClick(soundEnabled);

    if (currentStep === 1) {
      // YÊU CẦU #3: Nếu đang ở Step 01 -> tween mượt smoothScrollProgress từ 1.0 về 0.0 trong 1.2s power3.inOut
      set({
        stageTransition: 'TO_HOME_STEP1',
        scrollTarget: 0.0,
      });
    } else {
      // YÊU CẦU #3: Nếu đang ở Step >= 2: Pha 1 (0.0s -> 0.6s) cất máy sang phải -> Pha 2 (0.6s -> 1.5s) tween 1.0 về 0.0
      set({
        stageTransition: 'TO_HOME',
        scrollTarget: 0.0,
      });
    }
    get().showHudWarning(
      'HOME: VINZBOIZ PORTFOLIO · SPLIT-TEXT PORTAL (STEP 00/12)',
      3000
    );
  },

  jumpToAbout: () => {
    const { isInsideProjectApp, currentStep, scrollTarget, soundEnabled, stageTransition } = get();
    if (stageTransition !== 'IDLE') return;

    if (shutdownDisassemblyTimer) {
      clearTimeout(shutdownDisassemblyTimer);
      shutdownDisassemblyTimer = null;
    }
    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    set({ isCdAnimating: false });

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    if (isInsideProjectApp) {
      set({
        isInsideProjectApp: false,
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
    }

    if (get().freeCam) {
      set({ freeCam: false });
    }

    retroSound.playButtonClick(soundEnabled);

    // Khi đang ở Step 00 (HOME): Vào Step 01 (ABOUT) bằng hiệu ứng bung khung cửa sổ trong 0.85s
    if (currentStep === 0) {
      set({ stageTransition: 'HOME_TO_ABOUT', scrollTarget: 1.0 });
      get().showHudWarning(
        'ABOUT: VINZBOIZ PORTFOLIO · HARDWARE ASSEMBLY (STEP 01/12)',
        3000
      );
      return;
    }

    // Nếu đã ở Step 01 và scrollTarget = 1.0 thì không cần chuyển cảnh
    if (currentStep === 1 && Math.abs(scrollTarget - 1.0) < 0.05) return;

    // Khi đang ở bất kỳ bước nào khác (Step 2..12, bao gồm Step 10, 11, 12):
    // Đẩy cụm sân khấu cũ trượt sang phải, đưa linh kiện Step 01 từ trái vào giữa bàn
    set({ stageTransition: 'TO_ABOUT' });
    get().showHudWarning(
      'ABOUT: VINZBOIZ PORTFOLIO · HARDWARE ASSEMBLY (STEP 01/12)',
      3000
    );
  },

  jumpToProject: () => {
    const { isInsideProjectApp, currentStep, soundEnabled, stageTransition } = get();
    if (stageTransition !== 'IDLE') return;

    if (shutdownDisassemblyTimer) {
      clearTimeout(shutdownDisassemblyTimer);
      shutdownDisassemblyTimer = null;
    }
    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    set({ isCdAnimating: false });

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    if (isInsideProjectApp) {
      set({
        isInsideProjectApp: false,
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
    }
    if (currentStep === 11) return;

    retroSound.playButtonClick(soundEnabled);

    if (currentStep === 0) {
      // Khi đang ở HOME bấm PROJECTS:
      // Đặt trước trạng thái máy tính hoàn chỉnh và màn hình DESKTOP,
      // sau đó kích hoạt hiệu ứng bung khung portal + trượt máy từ bên trái x = -18 vào giữa bàn
      get().applyStep11State();
      set({
        currentStep: 0,
        scrollTarget: 10.99,
        scrollCurrent: 0.0,
        homeTransitionProgress: 0.0,
        stageTransition: 'HOME_TO_PROJECT',
      });
    } else if (currentStep < 10) {
      // Đang ở các bước lắp dở (1 -> 9): Đẩy cụm lắp dở sang phải (x = +18), đưa bộ máy hoàn chỉnh từ trái vào (x = -18 -> 0), rồi nạp CD
      set({ stageTransition: 'TO_PROJECT' });
    } else if (currentStep === 10) {
      // Đã ở Step 10 hoàn chỉnh: Chuyển sang Step 11 và nạp đĩa CD ngay tại chỗ
      if (get().osState !== 'DESKTOP') {
        get().loginDesktop();
      }
      get().setStep(11);
      if (!get().isCdAnimating && get().cdLocation === 'DESK') {
        get().triggerInsertCdSequence();
      }
    } else if (currentStep === 12) {
      // Đang ở Step 12 (MY CV) lùi về Step 11 (PROJECT):
      // Rút thẻ nhớ ra trả về bàn, phục hồi AUTORUN
      retroSound.playFloppySeek(soundEnabled);
      get().setStep(11);
      set({
        cardLocation: 'DESK',
        floppyInserted: false,
        activeWindow: 'AUTORUN',
      });
    }
    get().showHudWarning(
      'PROJECT: VINZBOIZ 3D WORKS · CD-ROM AUTORUN (STEP 11/12)',
      3000
    );
  },

  jumpToCv: () => {
    const { isInsideProjectApp, currentStep, soundEnabled, stageTransition } = get();
    if (stageTransition !== 'IDLE') return;

    if (shutdownDisassemblyTimer) {
      clearTimeout(shutdownDisassemblyTimer);
      shutdownDisassemblyTimer = null;
    }
    if (cdSequenceTimer) {
      clearTimeout(cdSequenceTimer);
      cdSequenceTimer = null;
    }
    set({ isCdAnimating: false });

    if (expandRaf) {
      cancelAnimationFrame(expandRaf);
      expandRaf = null;
    }
    if (divingTimer) {
      clearTimeout(divingTimer);
      divingTimer = null;
    }
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }

    if (isInsideProjectApp) {
      set({
        isInsideProjectApp: false,
        projectAppTransition: 'IDLE',
        crtExpandProgress: 0,
      });
    }
    if (currentStep === 12) return;

    retroSound.playButtonClick(soundEnabled);

    if (currentStep === 0) {
      // Khi đang ở HOME bấm MY CV:
      // Đặt trước trạng thái máy tính hoàn chỉnh và màn hình DESKTOP,
      // sau đó kích hoạt hiệu ứng bung khung portal + trượt máy từ bên trái x = -18 vào giữa bàn
      get().applyStep12State();
      set({
        currentStep: 0,
        scrollTarget: 11.99,
        scrollCurrent: 0.0,
        homeTransitionProgress: 0.0,
        stageTransition: 'HOME_TO_MY_CV',
      });
    } else if (currentStep < 10) {
      // Đang ở các bước lắp dở (1 -> 9): Đẩy cụm lắp dở sang phải, đưa bộ máy hoàn chỉnh từ trái vào, rồi cắm Thẻ nhớ
      set({ stageTransition: 'TO_MY_CV' });
    } else {
      if (get().osState !== 'DESKTOP') {
        get().loginDesktop();
      }
      get().setStep(12);
    }
    get().showHudWarning(
      'MY CV: VINZBOIZ DOSSIER · FLOPPY 1.44MB (STEP 12/12)',
      3000
    );
  },

  applyStep10State: () => {
    set({
      // 1. Nhảy thẳng tới Step 10 hoàn thiện lắp ráp (scroll 10.99 -> benchProgress 1.0)
      currentStep: 10,
      scrollTarget: 10.99,
      scrollCurrent: 10.99,
      homeTransitionProgress: 1.0,
      benchProgress: 1.0,
      benchAutoTarget: 1.0,
      benchScrubbing: false,
      freeCam: false,

      // 2. Tự động bật nguồn PC và CRT, vào thẳng Desktop
      isPoweredOn: true,
      isCrtPowered: true,
      psuVoltage: 230,
      isResetting: false,
      bootElapsedTime: 10.0,
      osState: 'DESKTOP',

      // 3. Đĩa CD và Thẻ nhớ nằm trên bàn
      cdLocation: 'DESK',
      isCdTrayOpen: false,
      isCdInserted: false,
      isCdAnimating: false,

      cardLocation: 'DESK',
      floppyInserted: false,

      activeWindow: null,
      openWindows: [],
      osDialogAlert: null,

      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  applyStep11State: () => {
    set({
      // Nhảy thẳng tới Step 11 (PROJECT)
      currentStep: 11,
      scrollTarget: 10.99,
      scrollCurrent: 10.99,
      benchProgress: 0.99,
      benchAutoTarget: 0.99,
      benchScrubbing: false,
      freeCam: false,

      isPoweredOn: true,
      isCrtPowered: true,
      psuVoltage: 230,
      isResetting: false,
      bootElapsedTime: 10.0,
      osState: 'DESKTOP',

      // Đĩa CD nằm chờ trên bàn, khay đóng, để khi trượt vào giữa bàn sẽ diễn hoạt mở khay nạp đĩa
      cdLocation: 'DESK',
      isCdTrayOpen: false,
      isCdInserted: false,
      isCdAnimating: false,

      cardLocation: 'DESK',
      floppyInserted: false,

      activeWindow: null,
      openWindows: [],
      osDialogAlert: null,

      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  applyStep12State: () => {
    set({
      // Nhảy thẳng tới Step 12 (MY CV)
      currentStep: 12,
      scrollTarget: 11.99,
      scrollCurrent: 11.99,
      benchProgress: 0.99,
      benchAutoTarget: 0.99,
      benchScrubbing: false,
      freeCam: false,

      isPoweredOn: true,
      isCrtPowered: true,
      psuVoltage: 230,
      isResetting: false,
      bootElapsedTime: 10.0,
      osState: 'DESKTOP',

      cdLocation: 'INSIDE',
      isCdTrayOpen: false,
      isCdInserted: true,
      isCdAnimating: false,

      // Thẻ nhớ nằm chờ trên bàn để khi trượt vào giữa bàn sẽ diễn hoạt cắm thẻ
      cardLocation: 'DESK',
      floppyInserted: false,

      activeWindow: 'AUTORUN',
      openWindows: ['AUTORUN'],
      osDialogAlert: null,

      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  applyStep1State: () => {
    set({
      currentStep: 1,
      scrollTarget: 1.0,
      scrollCurrent: 1.0,
      homeTransitionProgress: 1.0,
      benchProgress: 0,
      benchAutoTarget: 0,
      benchScrubbing: false,
      freeCam: false,
      isPoweredOn: false,
      osState: 'OFF',
      bootElapsedTime: 0,

      cdLocation: 'DESK',
      isCdTrayOpen: false,
      isCdInserted: false,
      isCdAnimating: false,

      cardLocation: 'DESK',
      floppyInserted: false,

      activeWindow: null,
      openWindows: [],
      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  applyHomeResetState: () => {
    set({
      currentStep: 0,
      scrollTarget: 0.0,
      scrollCurrent: 1.0,
      homeTransitionProgress: 1.0,
      benchProgress: 0,
      benchAutoTarget: 0,
      benchScrubbing: false,
      freeCam: false,
      isPoweredOn: false,
      osState: 'OFF',
      bootElapsedTime: 0,

      cdLocation: 'DESK',
      isCdTrayOpen: false,
      isCdInserted: false,
      isCdAnimating: false,

      cardLocation: 'DESK',
      floppyInserted: false,

      activeWindow: null,
      openWindows: [],
      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  setStageTransition: (val: StageTransition) => {
    set({ stageTransition: val });
  },

  setCrtExpandProgress: (val: number) => {
    set({ crtExpandProgress: Math.max(0, Math.min(1, val)) });
  },

  setProjectAppTransition: (val: ProjectAppTransition) => {
    set({ projectAppTransition: val });
  },
  };
});
