import { PerspectiveCamera, Vector3 } from 'three';
import { tweenVector3 } from '../core/tween';

type CameraMode = 'exploration' | 'scripted' | 'battle';

export class CameraRig {
  private readonly lookTarget = new Vector3();
  private readonly desired = new Vector3();
  private readonly lastForward = new Vector3(0, 0, -1);
  private readonly camera: PerspectiveCamera;
  private mode: CameraMode = 'exploration';

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  updateExploration(heroPosition: Vector3, movementDirection: Vector3, deltaSeconds: number): void {
    if (this.mode !== 'exploration') {
      return;
    }

    if (movementDirection.lengthSq() > 0.001) {
      this.lastForward.copy(movementDirection).normalize();
    }

    this.desired.copy(heroPosition).addScaledVector(this.lastForward, -5.6);
    this.desired.y += 3.1;
    this.camera.position.lerp(this.desired, Math.min(deltaSeconds * 7.5, 1));

    this.lookTarget.copy(heroPosition);
    this.lookTarget.y += 1.25;
    this.camera.lookAt(this.lookTarget);
  }

  async transitionToBattle(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const targetPosition = heroPosition.clone().addScaledVector(forward, -5.4);
    targetPosition.y += 3.05;
    const targetLook = heroPosition.clone().lerp(enemyPosition, 0.55);
    targetLook.y = 1.2;
    await this.moveCamera(targetPosition, targetLook, 780);
    this.mode = 'battle';
  }

  async focusHeroFace(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const targetPosition = heroPosition.clone().addScaledVector(forward, 1.18);
    targetPosition.y += 1.42;
    const targetLook = heroPosition.clone();
    targetLook.y += 1.38;
    await this.moveCamera(targetPosition, targetLook, 520);
  }

  async restoreBattleView(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    await this.transitionToBattle(heroPosition, enemyPosition);
  }

  async victoryView(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const side = new Vector3(3.2, 2.1, 2.8);
    const targetPosition = heroPosition.clone().add(side);
    const targetLook = heroPosition.clone().lerp(enemyPosition, 0.22);
    targetLook.y += 1.25;
    await this.moveCamera(targetPosition, targetLook, 720);
  }

  setExploration(): void {
    this.mode = 'exploration';
  }

  private async moveCamera(position: Vector3, lookAt: Vector3, durationMs: number): Promise<void> {
    await Promise.all([
      tweenVector3(this.camera.position, position, durationMs),
      tweenVector3(this.lookTarget, lookAt, durationMs, () => {
        this.camera.lookAt(this.lookTarget);
      }),
    ]);
    this.camera.lookAt(this.lookTarget);
  }
}
