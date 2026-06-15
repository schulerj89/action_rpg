import { Vector3 } from 'three';

export class InputController {
  private readonly keys = new Set<string>();
  private readonly movement = new Vector3();

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clear);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clear);
  }

  getMovementDirection(): Vector3 {
    this.movement.set(0, 0, 0);

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.movement.z -= 1;
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.movement.z += 1;
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      this.movement.x -= 1;
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      this.movement.x += 1;
    }

    if (this.movement.lengthSq() > 0) {
      this.movement.normalize();
    }

    return this.movement;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private readonly clear = (): void => {
    this.keys.clear();
  };
}
