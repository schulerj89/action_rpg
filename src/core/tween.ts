import type { Vector3 } from 'three';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function easeInOutCubic(value: number): number {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function tweenVector3(
  target: Vector3,
  to: Vector3,
  durationMs: number,
  onStep?: (progress: number) => void,
): Promise<void> {
  const from = target.clone();
  const start = performance.now();

  return new Promise((resolve) => {
    const step = (now: number): void => {
      const rawProgress = Math.min((now - start) / durationMs, 1);
      const progress = easeInOutCubic(rawProgress);
      target.lerpVectors(from, to, progress);
      onStep?.(rawProgress);

      if (rawProgress < 1) {
        window.requestAnimationFrame(step);
      } else {
        resolve();
      }
    };

    window.requestAnimationFrame(step);
  });
}
