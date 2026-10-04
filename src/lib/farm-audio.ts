import type { DisplayPreferences } from './display-store';

export type AudioStatus = 'off' | 'playing' | 'paused' | 'muted' | 'unavailable';
/** Original synthesized soundscape. No wildlife recording or species claim. */
export class FarmAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private wind: AudioBufferSourceNode | null = null;
  private nodes = new Set<AudioNode>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private wanted = false;
  private disposed = false;
  private generation = 0;
  private preferences: DisplayPreferences;
  constructor(
    preferences: DisplayPreferences,
    private report: (status: AudioStatus) => void,
  ) {
    this.preferences = preferences;
  }
  private async ready() {
    if (this.disposed) return false;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.master.gain.value = this.preferences.volume / 100;
      }
      await this.context.resume();
      return !this.disposed && this.context.state === 'running';
    } catch {
      this.report('unavailable');
      return false;
    }
  }
  update(preferences: DisplayPreferences) {
    const changed = preferences.ambience !== this.preferences.ambience;
    this.preferences = preferences;
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(preferences.volume / 100, this.context.currentTime, 0.04);
    if (!preferences.volume || changed) this.stopNodes();
    if (this.wanted) void this.start();
  }
  async start() {
    this.wanted = true;
    if (!this.preferences.volume) {
      this.report('muted');
      return;
    }
    if (document.hidden) {
      this.report('paused');
      return;
    }
    const token = this.generation;
    if (
      !(await this.ready()) ||
      !this.wanted ||
      document.hidden ||
      this.disposed ||
      token !== this.generation
    )
      return;
    if (!this.wind) this.soundscape();
    this.report('playing');
  }
  stop() {
    this.wanted = false;
    this.stopNodes();
    this.report('off');
  }
  visibility() {
    if (document.hidden) {
      this.stopNodes();
      void this.context?.suspend().catch(() => {});
      if (this.wanted) this.report('paused');
    } else if (this.wanted) void this.start();
  }
  private stopNodes() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.wind?.stop();
    this.wind = null;
    for (const node of this.nodes) node.disconnect();
    this.nodes.clear();
  }
  private soundscape() {
    const ctx = this.context!;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const samples = noise.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
      samples[i] = previous;
    }
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 650;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master!);
    this.nodes.add(source);
    this.nodes.add(filter);
    this.nodes.add(gain);
    this.wind = source;
    source.start();
    const call = () => {
      if (
        !this.wanted ||
        document.hidden ||
        !this.wind ||
        this.disposed ||
        !this.preferences.volume
      )
        return;
      const now = ctx.currentTime;
      const evening = this.preferences.ambience === 'evening';
      for (let i = 0; i < (evening ? 3 : 2); i++) {
        const at = now + i * (evening ? 0.12 : 0.22);
        this.tone(
          evening ? 2800 : 1700,
          evening ? 2700 : 2400,
          at,
          evening ? 0.055 : 0.14,
          evening ? 0.008 : 0.018,
        );
      }
      this.timer = setTimeout(call, (evening ? 1900 : 3400) + Math.random() * 1800);
    };
    call();
  }
  private tone(from: number, to: number, at: number, duration: number, level: number) {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration - 0.005);
    oscillator.connect(gain);
    gain.connect(this.master!);
    this.nodes.add(oscillator);
    this.nodes.add(gain);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.nodes.delete(oscillator);
      this.nodes.delete(gain);
    };
    oscillator.start(at);
    oscillator.stop(at + duration);
  }
  async click() {
    if (!this.preferences.sound || !this.preferences.volume || document.hidden) return;
    if (
      !(await this.ready()) ||
      !this.preferences.sound ||
      !this.preferences.volume ||
      document.hidden
    )
      return;
    this.tone(540, 540, this.context!.currentTime, 0.065, 0.025);
  }
  dispose() {
    this.disposed = true;
    this.wanted = false;
    this.stopNodes();
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
