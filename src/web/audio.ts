export class GameAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private volume = 0.7;

  public setVolume(value: number): void {
    this.volume = value;
    if (this.gain) this.gain.gain.value = value;
  }

  public unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.context.destination);
    }
    void this.context.resume();
  }

  public cue(name: string): void {
    if (!this.context || !this.gain || this.context.state !== 'running') return;
    const pitch: Record<string, number> = { mote_picked: 660, deposit: 520, refuel: 610, lantern_lit: 780, lantern_out: 190, pulse: 340, player_hit: 140, dash: 400, game_over: 250 };
    if (!pitch[name]) return;
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    const now = this.context.currentTime;
    osc.frequency.value = pitch[name];
    envelope.gain.setValueAtTime(0.08, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(envelope); envelope.connect(this.gain);
    osc.start(now); osc.stop(now + 0.12);
  }
}
