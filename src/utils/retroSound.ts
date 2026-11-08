import { Howl, Howler } from 'howler';

/**
 * Tạo WAV Data URI bằng code (100% Procedural Audio cho Howler)
 * giúp phát tiếng click cơ học AT, tiếng cần gạt ZIF Socket 7, tiếng chốt RAM snap,
 * tiếng bíp BIOS và tiếng chuyển bước lắp ráp mà không cần tải file .mp3/.wav ngoài.
 */
function createProceduralWavDataUri(
  durationSec: number,
  generator: (t: number) => number,
  sampleRate = 22050
): string {
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.max(-1, Math.min(1, generator(t)));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

class RetroSoundEngine {
  private stepTickHowl: Howl | null = null;
  private turboLatchHowl: Howl | null = null;
  private postBeepHowl: Howl | null = null;
  private socketLeverHowl: Howl | null = null;
  private ramSnapHowl: Howl | null = null;
  private floppySeekHowl: Howl | null = null;
  private buttonClickHowl: Howl | null = null;
  private cdMotorHowl: Howl | null = null;
  private degaussHowl: Howl | null = null;
  private popHowl: Howl | null = null;
  private win95ChimeHowl: Howl | null = null;
  private cdSpinHowl: Howl | null = null;
  private windowClickHowl: Howl | null = null;

  private ensureInit() {
    if (this.stepTickHowl) return;

    // 1. Tiếng lạch cạch cơ học khi chuyển bước lắp ráp (Mechanical Relay Tick)
    const tickUri = createProceduralWavDataUri(0.045, (t) => {
      const env = Math.exp(-t * 95);
      const click = Math.sin(2 * Math.PI * 1150 * t) + 0.5 * Math.sin(2 * Math.PI * 2400 * t);
      return click * env * 0.35;
    });

    // 2. Tiếng nút bấm vật lý TURBO (Heavy Latching Tactile Switch)
    const turboUri = createProceduralWavDataUri(0.085, (t) => {
      if (t < 0.03) {
        const env = Math.exp(-t * 110);
        return (Math.sin(2 * Math.PI * 680 * t) + (Math.random() * 2 - 1) * 0.4) * env * 0.5;
      }
      const t2 = t - 0.03;
      const env2 = Math.exp(-t2 * 85);
      return Math.sin(2 * Math.PI * 1620 * t2) * env2 * 0.45;
    });

    // 3. Tiếng bíp loa thùng PC Speaker (Award BIOS POST 1000Hz Square Beep)
    const beepUri = createProceduralWavDataUri(0.16, (t) => {
      const env = t < 0.13 ? 1.0 : Math.exp(-(t - 0.13) * 80);
      const sq = Math.sin(2 * Math.PI * 980 * t) >= 0 ? 1 : -1;
      return sq * env * 0.22;
    });

    // 4. Tiếng gập khóa cần gạt thép ZIF Socket 7 (socket_lever)
    const socketLeverUri = createProceduralWavDataUri(0.11, (t) => {
      const slide = Math.sin(2 * Math.PI * (320 + t * 1400) * t) * Math.exp(-t * 35) * 0.35;
      const lockClick =
        t > 0.065
          ? Math.sin(2 * Math.PI * 1450 * (t - 0.065)) * Math.exp(-(t - 0.065) * 120) * 0.65
          : 0;
      return slide + lockClick;
    });

    // 5. Tiếng bấm 2 chốt trắng khe RAM DIMM (ram_snap)
    const ramSnapUri = createProceduralWavDataUri(0.09, (t) => {
      const snap1 = Math.sin(2 * Math.PI * 1850 * t) * Math.exp(-t * 110) * 0.55;
      const snap2 =
        t > 0.028
          ? Math.sin(2 * Math.PI * 2250 * (t - 0.028)) * Math.exp(-(t - 0.028) * 120) * 0.65
          : 0;
      return snap1 + snap2;
    });

    // 6. Tiếng nhét đĩa mềm 3.5" & đầu đọc Sony MPF920 seek (Floppy Stepper Seek)
    const floppySeekUri = createProceduralWavDataUri(0.32, (t) => {
      if (t < 0.06) {
        // Tiếng cạch nắp lật kim loại khi đút đĩa mềm
        return Math.sin(2 * Math.PI * 920 * t) * Math.exp(-t * 85) * 0.55;
      }
      // Tiếng motor bước kêu "rẹt-rẹt" đặc trưng của ổ 3.5"
      const stepPhase = Math.floor((t - 0.06) * 28);
      const localT = (t - 0.06) * 28 - stepPhase;
      const env = Math.exp(-localT * 6);
      const buzz =
        Math.sin(2 * Math.PI * (165 + (stepPhase % 3) * 35) * t) +
        0.5 * Math.sin(2 * Math.PI * 520 * t);
      return buzz * env * 0.28;
    });

    this.stepTickHowl = new Howl({ src: [tickUri], volume: 0.55 });
    this.turboLatchHowl = new Howl({ src: [turboUri], volume: 0.7 });
    this.postBeepHowl = new Howl({ src: [beepUri], volume: 0.45 });
    this.socketLeverHowl = new Howl({ src: [socketLeverUri], volume: 0.75 });
    this.ramSnapHowl = new Howl({ src: [ramSnapUri], volume: 0.8 });
    this.floppySeekHowl = new Howl({ src: [floppySeekUri], volume: 0.72 });

    // 7. Tiếng nút nhấn nhả nhỏ (Momentary Tactile Click) cho RESET & các phím OSD màn hình
    const buttonClickUri = createProceduralWavDataUri(0.05, (t) => {
      const env = Math.exp(-t * 140);
      return (Math.sin(2 * Math.PI * 2100 * t) + 0.35 * (Math.random() * 2 - 1)) * env * 0.4;
    });

    // 8. Tiếng mô-tơ đẩy/thu khay đĩa CD-ROM (Tray Motor Whirr + Gear Rattle + Stop Clunk)
    const cdMotorUri = createProceduralWavDataUri(0.95, (t) => {
      const ramp = Math.min(1, t / 0.08) * (t < 0.82 ? 1 : Math.exp(-(t - 0.82) * 40));
      const whirr = Math.sin(2 * Math.PI * (210 + 18 * Math.sin(t * 22)) * t);
      const gear = Math.sin(2 * Math.PI * 1260 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 38 * t));
      const motor = (whirr * 0.22 + gear * 0.07 + (Math.random() * 2 - 1) * 0.04) * ramp;
      const clunk =
        t > 0.82 ? Math.sin(2 * Math.PI * 140 * (t - 0.82)) * Math.exp(-(t - 0.82) * 45) * 0.55 : 0;
      return motor + clunk;
    });

    // 9. Tiếng khử từ CRT (Degauss "BOONG"): xung 50Hz cộng hưởng lõi thép + rung dây đồng tắt dần
    const degaussUri = createProceduralWavDataUri(1.25, (t) => {
      const thump = Math.sin(2 * Math.PI * 55 * t) * Math.exp(-t * 2.6);
      const hum = Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 3.4) * 0.6;
      const ring = Math.sin(2 * Math.PI * 310 * t) * Math.exp(-t * 7) * 0.25;
      const attack = Math.min(1, t / 0.012);
      return (thump * 0.55 + hum * 0.3 + ring) * attack;
    });

    // 10. Tiếng "BỤP" chập điện quá áp bộ nguồn (Spark Crack + Low Thump)
    const popUri = createProceduralWavDataUri(0.42, (t) => {
      const crack = (Math.random() * 2 - 1) * Math.exp(-t * 32) * 0.9;
      const thump = Math.sin(2 * Math.PI * (90 - t * 120) * t) * Math.exp(-t * 11) * 0.7;
      const sizzle = t > 0.05 ? (Math.random() * 2 - 1) * Math.exp(-(t - 0.05) * 9) * 0.18 : 0;
      return crack + thump + sizzle;
    });

    // 11. Tiếng khởi động Windows 95 (Win95 Ambient Startup Chime - Brian Eno style)
    const win95Uri = createProceduralWavDataUri(3.6, (t) => {
      const freqs = [155.56, 233.08, 311.13, 392.00, 466.16, 523.25];
      let sum = 0;
      for (let i = 0; i < freqs.length; i++) {
        const f = freqs[i];
        const noteStart = i * 0.11;
        if (t >= noteStart) {
          const nt = t - noteStart;
          const attack = Math.min(1.0, nt / 0.16);
          const decay = Math.exp(-nt * 0.9);
          const tone =
            Math.sin(2 * Math.PI * f * nt) +
            0.4 * Math.sin(2 * Math.PI * (f * 1.003) * nt) +
            0.2 * Math.sin(2 * Math.PI * (f * 2.0) * nt);
          sum += tone * attack * decay * (1.0 / (i * 0.35 + 1.0));
        }
      }
      return sum * 0.28;
    });

    // 12. Tiếng đĩa CD-ROM quay vù tốc độ cao 24X (CD Spin-up CAV whirr + air rush)
    const cdSpinUri = createProceduralWavDataUri(1.8, (t) => {
      const pitchRamp = Math.min(1.0, t / 0.9);
      const curFreq = 220 + pitchRamp * 980;
      const whirr = Math.sin(2 * Math.PI * curFreq * t);
      const air = (Math.random() * 2 - 1) * (0.15 + 0.25 * pitchRamp);
      const env = t < 1.4 ? 1.0 : Math.exp(-(t - 1.4) * 8);
      return (whirr * 0.35 + air * 0.2) * env * Math.min(1.0, t / 0.1);
    });

    // 13. Tiếng click cửa sổ / icon Desktop (Retro UI Tick)
    const windowClickUri = createProceduralWavDataUri(0.04, (t) => {
      const env = Math.exp(-t * 160);
      return Math.sin(2 * Math.PI * 1850 * t) * env * 0.35;
    });

    this.buttonClickHowl = new Howl({ src: [buttonClickUri], volume: 0.6 });
    this.cdMotorHowl = new Howl({ src: [cdMotorUri], volume: 0.6 });
    this.degaussHowl = new Howl({ src: [degaussUri], volume: 0.85 });
    this.popHowl = new Howl({ src: [popUri], volume: 0.8 });
    this.win95ChimeHowl = new Howl({ src: [win95Uri], volume: 0.85 });
    this.cdSpinHowl = new Howl({ src: [cdSpinUri], volume: 0.7 });
    this.windowClickHowl = new Howl({ src: [windowClickUri], volume: 0.5 });
  }

  playWin95Chime(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.win95ChimeHowl?.play();
  }

  playCdSpin(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.cdSpinHowl?.play();
  }

  playWindowClick(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.windowClickHowl?.play();
  }

  playButtonClick(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.buttonClickHowl?.play();
  }

  playCdMotor(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.cdMotorHowl?.play();
  }

  playDegauss(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.degaussHowl?.play();
  }

  playPowerPop(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.popHowl?.play();
  }

  playStepTick(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.stepTickHowl?.play();
  }

  playTurboClick(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.turboLatchHowl?.play();
  }

  playPostBeep(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.postBeepHowl?.play();
  }

  playSocketLever(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.socketLeverHowl?.play();
  }

  playRamSnap(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.ramSnapHowl?.play();
  }

  playFloppySeek(enabled: boolean) {
    if (!enabled) return;
    this.ensureInit();
    this.floppySeekHowl?.play();
  }

  setGlobalMute(muted: boolean) {
    Howler.mute(muted);
  }
}

export const retroSound = new RetroSoundEngine();
