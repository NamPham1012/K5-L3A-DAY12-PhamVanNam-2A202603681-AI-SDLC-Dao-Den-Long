export function frameMetrics(samples: number[]) {
  if (!samples.length || samples.some(dt => !Number.isFinite(dt) || dt <= 0)) throw new Error('Frame times must be positive');
  const sorted = [...samples].sort((a, b) => a - b);
  const k = Math.max(1, Math.ceil(sorted.length * 0.01));
  const total = samples.reduce((a, b) => a + b, 0);
  const slow = sorted.slice(-k).reduce((a, b) => a + b, 0) / k;
  return { frames: samples.length, avg_fps: 1000 * samples.length / total, p1_low_fps: 1000 / slow, frame_ms_p95: sorted[Math.ceil(sorted.length * 0.95) - 1] };
}
