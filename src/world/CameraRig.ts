import { PerspectiveCamera, Vector3 } from 'three';
import { tweenVector3, wait } from '../core/tween';
import type { FreeCameraAxes } from '../core/InputController';

type CameraMode = 'exploration' | 'scripted' | 'battle' | 'debug' | 'free';

export interface CameraSnapshot {
  fov: number;
  mode: CameraMode;
  position: { x: number; y: number; z: number };
  preset?: string;
}

export class CameraRig {
  private readonly lookTarget = new Vector3();
  private readonly desired = new Vector3();
  private readonly lastForward = new Vector3(0, 0, -1);
  private readonly camera: PerspectiveCamera;
  private readonly freeForward = new Vector3();
  private readonly freeRight = new Vector3();
  private mode: CameraMode = 'exploration';
  private activePreset?: string;
  private freeYaw = Math.PI;
  private freePitch = -0.22;
  private rightMouseDown = false;
  private readonly freeCameraFocus?: () => Vector3;

  constructor(camera: PerspectiveCamera, canvas?: HTMLCanvasElement, freeCameraFocus?: () => Vector3) {
    this.camera = camera;
    this.freeCameraFocus = freeCameraFocus;
    if (canvas) {
      this.installPointerControls(canvas);
    }
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

  updateFreeCamera(axes: FreeCameraAxes, deltaSeconds: number): void {
    if (this.mode !== 'free') {
      return;
    }

    this.freeYaw -= axes.turn * deltaSeconds * 1.7;
    this.freePitch = clamp(this.freePitch + axes.pitch * deltaSeconds * 1.15, -1.2, 0.65);
    this.freeForward.set(Math.sin(this.freeYaw), 0, Math.cos(this.freeYaw)).normalize();
    this.freeRight.set(this.freeForward.z, 0, -this.freeForward.x).normalize();

    const speed = axes.fast ? 13 : 6.2;
    this.camera.position.addScaledVector(this.freeForward, axes.forward * speed * deltaSeconds);
    this.camera.position.addScaledVector(this.freeRight, axes.strafe * speed * deltaSeconds);
    this.camera.position.y += axes.vertical * speed * deltaSeconds;
    this.camera.position.y = Math.max(0.55, Math.min(15, this.camera.position.y));
    this.applyFreeLook();
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
    this.activePreset = 'battle.mage.special.charge';
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
    this.activePreset = 'battle.mage.special.impact';
    const forward = enemyPosition.clone().sub(casterPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = enemyPosition.clone().addScaledVector(forward, -3.25).addScaledVector(right, 1.6);
    targetPosition.y += 2.1;
    const targetLook = enemyPosition.clone();
    targetLook.y += 1.05;
    await this.moveCamera(targetPosition, targetLook, 520);
  }

  async framePhysicalMove(heroPosition: Vector3, enemyPosition: Vector3, turnIndex = 0): Promise<void> {
    this.mode = 'scripted';
    this.activePreset = `battle.physical.${turnIndex % 3}`;
    const forward = enemyPosition.clone().sub(heroPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const side = turnIndex % 2 === 0 ? 1 : -1;
    const targetPosition = heroPosition.clone().lerp(enemyPosition, 0.42).addScaledVector(right, side * 2.2);
    targetPosition.y += 1.65 + (turnIndex % 3) * 0.18;
    const targetLook = heroPosition.clone().lerp(enemyPosition, 0.62);
    targetLook.y += 0.92;
    await this.moveCamera(targetPosition, targetLook, 280);
  }

  async frameEnemyAttack(enemyPosition: Vector3, targetPosition: Vector3, turnIndex = 0): Promise<void> {
    this.mode = 'scripted';
    this.activePreset = `battle.enemy.${turnIndex % 2}`;
    const forward = targetPosition.clone().sub(enemyPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const side = turnIndex % 2 === 0 ? -1 : 1;
    const targetCamera = enemyPosition.clone().lerp(targetPosition, 0.55).addScaledVector(right, side * 2.45);
    targetCamera.y += 1.86;
    const targetLook = enemyPosition.clone().lerp(targetPosition, 0.54);
    targetLook.y += 0.95;
    await this.moveCamera(targetCamera, targetLook, 260);
  }

  async frameThunderOverhead(casterPosition: Vector3, enemyPosition: Vector3): Promise<void> {
    this.mode = 'scripted';
    this.activePreset = 'battle.mage.thunder.overhead';
    const forward = enemyPosition.clone().sub(casterPosition).setY(0).normalize();
    const right = new Vector3(forward.z, 0, -forward.x).normalize();
    const targetPosition = enemyPosition.clone().addScaledVector(forward, -4.4).addScaledVector(right, 1.4);
    targetPosition.y += 4.7;
    const targetLook = enemyPosition.clone();
    targetLook.y += 0.92;
    const previousFov = this.camera.fov;
    this.camera.fov = 58;
    this.camera.updateProjectionMatrix();
    await this.moveCamera(targetPosition, targetLook, 520);
    this.camera.fov = previousFov;
    this.camera.updateProjectionMatrix();
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
    this.activePreset = undefined;
    this.camera.fov = 54;
    this.camera.updateProjectionMatrix();
  }

  setDebugPose(position: Vector3, lookAt: Vector3, fov = 50, preset?: string): void {
    this.mode = 'debug';
    this.activePreset = preset;
    this.camera.position.copy(position);
    this.lookTarget.copy(lookAt);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.lookTarget);
  }

  setFreeCamera(enabled: boolean, focus?: Vector3): void {
    if (enabled) {
      if (focus) {
        const currentDirection = this.camera.position.clone().sub(focus).setY(0);
        if (currentDirection.lengthSq() < 0.5) {
          currentDirection.set(0, 0, 1);
        }
        currentDirection.normalize();
        this.camera.position.copy(focus).addScaledVector(currentDirection, 6.2);
        this.camera.position.y = Math.max(this.camera.position.y, focus.y + 2.8);
        this.camera.lookAt(focus.clone().setY(focus.y + 1.2));
      }
      const direction = new Vector3();
      this.camera.getWorldDirection(direction);
      this.freeYaw = Math.atan2(direction.x, direction.z);
      this.freePitch = Math.asin(clamp(direction.y, -0.99, 0.99));
      this.mode = 'free';
      this.activePreset = 'free';
      return;
    }

    this.setExploration();
  }

  getMode(): CameraMode {
    return this.mode;
  }

  snapshot(): CameraSnapshot {
    return {
      fov: this.camera.fov,
      mode: this.mode,
      preset: this.activePreset,
      position: {
        x: round(this.camera.position.x),
        y: round(this.camera.position.y),
        z: round(this.camera.position.z),
      },
    };
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

  private applyFreeLook(): void {
    this.lookTarget.copy(this.camera.position);
    this.lookTarget.x += Math.sin(this.freeYaw) * Math.cos(this.freePitch);
    this.lookTarget.y += Math.sin(this.freePitch);
    this.lookTarget.z += Math.cos(this.freeYaw) * Math.cos(this.freePitch);
    this.camera.lookAt(this.lookTarget);
  }

  private installPointerControls(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 2) {
        return;
      }

      event.preventDefault();
      if (this.mode !== 'free') {
        this.setFreeCamera(true, this.freeCameraFocus?.());
      }
      this.rightMouseDown = true;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointerup', (event) => {
      if (event.button === 2) {
        this.rightMouseDown = false;
      }
    });
    canvas.addEventListener('pointermove', (event) => {
      if (this.mode !== 'free' || !this.rightMouseDown) {
        return;
      }
      this.freeYaw -= event.movementX * 0.0038;
      this.freePitch = clamp(this.freePitch - event.movementY * 0.0028, -1.2, 0.65);
      this.applyFreeLook();
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
