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

export type StageTransition = 'IDLE' | 'ABOUT_TO_PROJECT';

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
  insertCdAndCloseTray: () => void;
  enterProjectApp: () => void;
  exitProjectApp: () => void;
  quickJumpToProjects: () => void;
  jumpToAbout: () => void;
  applyStep10State: () => void;
  applyStep1State: () => void;
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
  currentStep: 1,
  isTurbo: true,
  isPoweredOn: true,
  freeCam: false,
  soundEnabled: true,
  floppyInserted: false,
  resumeModalOpen: false,

  cdLocation: 'DESK',
  cardLocation: 'DESK',
  isCdTrayOpen: false,
  isCdInserted: false,
  psuVoltage: 230,
  isResetting: false,
  bootSequenceAt: now(),
  bootElapsedTime: 0,
  osState: 'BIOS_POST',
  activeWindow: null,
  openWindows: [],
  osDialogAlert: null,
  psuSparkAt: 0,
  hudWarning: null,

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
  scrollTarget: 0,
  scrollCurrent: 0,

  setStep: (step: number) => {
    const clamped = Math.max(1, Math.min(ASSEMBLY_STEPS.length, step));
    const targetTimeline = clamped - 1;
    set({
      scrollTarget: targetTimeline,
      benchScrubbing: true,
    });
  },

  nextStep: () => {
    const next = Math.min(ASSEMBLY_STEPS.length, get().scrollTarget + 0.45);
    set({ scrollTarget: next, benchScrubbing: true });
  },

  prevStep: () => {
    const prev = Math.max(0, get().scrollTarget - 0.45);
    set({ scrollTarget: prev, benchScrubbing: true });
  },

  addScrollDelta: (delta: number) => {
    const next = Math.max(0, Math.min(ASSEMBLY_STEPS.length, get().scrollTarget + delta));
    set({ scrollTarget: next, benchScrubbing: true });
  },

  syncScrollCurrent: (val: number) => {
    const clamped = Math.max(0, Math.min(ASSEMBLY_STEPS.length, val));
    const prevStep = get().currentStep;
    const prevScroll = get().scrollCurrent;

    let nextStepNum: number;
    let nextBenchP: number;

    if (clamped >= ASSEMBLY_STEPS.length) {
      nextStepNum = ASSEMBLY_STEPS.length;
      nextBenchP = 1.0;
    } else {
      nextStepNum = Math.floor(clamped) + 1;
      nextBenchP = clamped - Math.floor(clamped);
    }

    if (nextStepNum !== prevStep) {
      retroSound.playStepTick(get().soundEnabled);
    }
    if (prevScroll < 9.92 && clamped >= 9.92) {
      retroSound.playPostBeep(get().soundEnabled);
    }

    set({
      scrollCurrent: clamped,
      currentStep: nextStepNum,
      benchProgress: nextBenchP,
      benchAutoTarget: nextBenchP,
      benchScrubbing: true,
    });
  },

  toggleTurbo: () => {
    const { isTurbo, soundEnabled } = get();
    retroSound.playTurboClick(soundEnabled);
    set({ isTurbo: !isTurbo });
  },

  togglePower: () => {
    const { isPoweredOn, soundEnabled, psuVoltage } = get();
    // Tiếng công tắc cơ AT nặng (Latching Switch)
    retroSound.playTurboClick(soundEnabled);
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
  // THÙNG MÁY, Ổ ĐĨA & BỘ NGUỒN
  // ===========================================================================
  handleCdClickOnDesk: () => {
    const { isPoweredOn, soundEnabled, osState, openWindows, activeWindow } = get();
    retroSound.playButtonClick(soundEnabled);
    if (!isPoweredOn) {
      get().showHudWarning('POWER REQUIRED TO OPERATE CD-ROM MOTOR', 3000);
      return;
    }
    // Bước 1: Khay mở ra
    retroSound.playCdMotor(soundEnabled);
    set({ isCdTrayOpen: true });

    if (cdSequenceTimer) clearTimeout(cdSequenceTimer);
    // Bước 2: Sau 500ms khi khay đã trượt mở, đĩa bay lên và từ từ hạ xuống khay
    cdSequenceTimer = setTimeout(() => {
      set({ cdLocation: 'TRAY' });
      // Bước 3: Sau 1400ms khi đĩa đã hạ hoàn toàn vào lòng khay, khay đóng lại
      cdSequenceTimer = setTimeout(() => {
        retroSound.playCdMotor(soundEnabled);
        retroSound.playCdSpin(soundEnabled);
        const nextWins = openWindows.includes('AUTORUN')
          ? openWindows
          : [...openWindows, 'AUTORUN' as DesktopWindowId];
        set({
          cdLocation: 'INSIDE',
          isCdInserted: true,
          isCdTrayOpen: false,
          openWindows: osState === 'DESKTOP' ? nextWins : openWindows,
          activeWindow: osState === 'DESKTOP' ? 'AUTORUN' : activeWindow,
        });
        cdSequenceTimer = null;
      }, 1400);
    }, 500);
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

  handleCdClickOnTray: () => {
    const { soundEnabled } = get();
    retroSound.playButtonClick(soundEnabled);
    // Bước 1: Đĩa từ từ nhấc lên khỏi khay rồi bay về hạ xuống mặt bàn
    set({ cdLocation: 'DESK', isCdInserted: false });
    // Bước 2: Sau 1400ms khi đĩa đã về yên vị trên bàn, khay tự động đóng lại
    if (cdSequenceTimer) clearTimeout(cdSequenceTimer);
    cdSequenceTimer = setTimeout(() => {
      retroSound.playCdMotor(soundEnabled);
      set({ isCdTrayOpen: false });
      cdSequenceTimer = null;
    }, 1400);
  },

  handleCardClick: () => {
    const { cardLocation, soundEnabled, osState, openWindows, activeWindow } = get();
    retroSound.playFloppySeek(soundEnabled);
    if (cardLocation === 'DESK') {
      // Bay vào khe đọc 3.5" (nhô 30% ra ngoài)
      const nextWins = openWindows.includes('WORDPAD_CV')
        ? openWindows
        : [...openWindows, 'WORDPAD_CV' as DesktopWindowId];
      set({
        cardLocation: 'INSERTED',
        floppyInserted: true,
        openWindows: osState === 'DESKTOP' ? nextWins : openWindows,
        activeWindow: osState === 'DESKTOP' ? 'WORDPAD_CV' : activeWindow,
      });
    } else {
      // Rút thẻ bay về lại bàn
      const nextWins = openWindows.filter((w) => w !== 'WORDPAD_CV');
      set({
        cardLocation: 'DESK',
        floppyInserted: false,
        openWindows: nextWins,
        activeWindow:
          activeWindow === 'WORDPAD_CV' ? nextWins[nextWins.length - 1] || null : activeWindow,
      });
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
    const { isPoweredOn, isResetting, bootSequenceAt, osState } = get();
    if (!isPoweredOn) {
      if (osState !== 'OFF') {
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
    let nextState: RetroOsState = osState;
    if (elapsed < 2.0) {
      nextState = 'BIOS_POST';
    } else if (elapsed < 3.5) {
      nextState = 'BOOT_LOGO';
    } else {
      nextState = 'DESKTOP';
    }

    if (nextState !== osState || Math.abs(get().bootElapsedTime - elapsed) > 0.05) {
      const updates: Partial<BuildStoreState> = { osState: nextState, bootElapsedTime: elapsed };
      // Khi vừa bước vào DESKTOP tự động:
      if (nextState === 'DESKTOP') {
        retroSound.playWin95Chime(get().soundEnabled);
        const autoWins: DesktopWindowId[] = [];
        let autoActive: DesktopWindowId | null = null;
        if (get().cdLocation === 'INSIDE') {
          autoWins.push('AUTORUN');
          autoActive = 'AUTORUN';
        }
        if (get().cardLocation === 'INSERTED') {
          autoWins.push('WORDPAD_CV');
          if (!autoActive) autoActive = 'WORDPAD_CV';
        }
        updates.openWindows = autoWins;
        updates.activeWindow = autoActive;
      }
      set(updates);
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
    const { openWindows } = get();
    const filtered = openWindows.filter((w) => w !== id);
    set({
      openWindows: [...filtered, id],
      activeWindow: id,
    });
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
    const { currentStep, stageTransition, soundEnabled } = get();
    if (stageTransition !== 'IDLE') return;

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

    if (currentStep >= 10) return;

    retroSound.playButtonClick(soundEnabled);
    set({ stageTransition: 'ABOUT_TO_PROJECT' });
  },

  jumpToAbout: () => {
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
      currentStep: 1,
      scrollTarget: 0,
      scrollCurrent: 0,
      benchProgress: 0,
      benchAutoTarget: 0,
      benchScrubbing: false,
      freeCam: false,
      stageTransition: 'IDLE',
      activeWindow: null,
      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });

    get().showHudWarning(
      'ABOUT: VINZBOIZ PORTFOLIO · HARDWARE ASSEMBLY (STEP 01/10)',
      3000
    );
  },

  applyStep10State: () => {
    set({
      // 1. Nhảy thẳng tới Step 10 hoàn thiện lắp ráp (scroll 9.99 -> benchProgress 1.0)
      currentStep: 10,
      scrollTarget: 9.99,
      scrollCurrent: 9.99,
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

      // 3. Tự động nạp đĩa CD vào trong ổ và đóng khay lại
      cdLocation: 'INSIDE',
      isCdTrayOpen: false,
      isCdInserted: true,

      // 4. Mở sẵn cửa sổ My Projects (AUTORUN) với nút [ VIEW ] phát sáng
      activeWindow: 'AUTORUN',
      openWindows: ['AUTORUN'],
      osDialogAlert: null,

      // 5. Đưa trạng thái chuyển cảnh về sẵn sàng
      isInsideProjectApp: false,
      projectAppTransition: 'IDLE',
      crtExpandProgress: 0,
      projectScrollProgress: 0,
    });
  },

  applyStep1State: () => {
    set({
      currentStep: 1,
      scrollTarget: 0,
      scrollCurrent: 0,
      benchProgress: 0,
      benchAutoTarget: 0,
      benchScrubbing: false,
      freeCam: false,
      activeWindow: null,
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
