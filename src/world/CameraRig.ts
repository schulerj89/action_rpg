import { PerspectiveCamera, Vector3 } from 'three';
import { tweenVector3, wait } from '../core/tween';

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

  async focusHeroChi(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = heroPosition.clone().addScaledVector(forward, 2.95).addScaledVector(right, 1.35);
    targetPosition.y += 1.72;
    const targetLook = heroPosition.clone();
    targetLook.y += 0.92;
    await this.moveCamera(targetPosition, targetLook, 520);
  }

  async frameChiBreakerCharge(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = heroPosition.clone().addScaledVector(forward, -2.85).addScaledVector(right, 2.05);
    targetPosition.y += 1.72;
    const targetLook = heroPosition.clone().addScaledVector(forward, 0.45);
    targetLook.y += 0.95;
    await this.moveCamera(targetPosition, targetLook, 720);
  }

  async frameChiBreakerImpact(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = heroPosition.clone().addScaledVector(forward, -3.6).addScaledVector(right, 2.35);
    targetPosition.y += 2.18;
    const targetLook = heroPosition.clone().lerp(enemyPosition, 0.42);
    targetLook.y += 1.16;
    await this.moveCamera(targetPosition, targetLook, 760);
  }

  async frameMageSpecial(casterPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(casterPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = casterPosition.clone().addScaledVector(forward, -4.2).addScaledVector(right, -2.35);
    targetPosition.y += 2.55;
    const targetLook = casterPosition.clone().lerp(enemyPosition, 0.48);
    targetLook.y += 1.15;
    await this.moveCamera(targetPosition, targetLook, 680);
  }

  async frameMageSpecialImpact(casterPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(casterPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = enemyPosition.clone().addScaledVector(forward, -3.25).addScaledVector(right, 1.6);
    targetPosition.y += 2.1;
    const targetLook = enemyPosition.clone();
    targetLook.y += 1.05;
    await this.moveCamera(targetPosition, targetLook, 520);
  }

  async restoreBattleView(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    await this.transitionToBattle(heroPosition, enemyPosition);
  }

  async victorySequence(heroPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const face = heroPosition.clone();
    face.y += 1.35;

    const closeFront = heroPosition.clone().addScaledVector(forward, 1.15);
    closeFront.y += 1.48;

    const lowFront = heroPosition.clone().addScaledVector(forward, 2.55).addScaledVector(right, -0.78);
    lowFront.y += 0.95;

    const pullBack = heroPosition.clone().addScaledVector(forward, 4.2).addScaledVector(right, 0.9);
    pullBack.y += 2.25;

    await this.moveCamera(closeFront, face, 420);
    await wait(340);
    await this.moveCamera(lowFront, face, 620);
    await wait(280);
    await this.moveCamera(pullBack, face, 780);
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
