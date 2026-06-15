export class FrameStats {
  private frames = 0;
  private elapsed = 0;
  private latestFps = 60;
  private latestFrameMs = 16.7;

  update(deltaSeconds: number): void {
    this.frames += 1;
    this.elapsed += deltaSeconds;
    this.latestFrameMs = deltaSeconds * 1000;

    if (this.elapsed >= 0.35) {
      this.latestFps = this.frames / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
    }
  }

  get fps(): number {
    return this.latestFps;
  }

  get frameMs(): number {
    return this.latestFrameMs;
  }
}
