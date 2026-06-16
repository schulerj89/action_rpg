export interface MovementAxes {
  reverse: boolean;
  forward: number;
  turn: number;
}

export class InputController {
  private readonly keys = new Set<string>();
  private readonly axes: MovementAxes = {
    reverse: false,
    forward: 0,
    turn: 0,
  };

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

  getMovementAxes(): MovementAxes {
    this.axes.reverse = false;
    this.axes.forward = 0;
    this.axes.turn = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) {
      this.axes.forward += 1;
    }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) {
      this.axes.reverse = true;
    }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) {
      this.axes.turn -= 1;
    }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) {
      this.axes.turn += 1;
    }

    return this.axes;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (isMovementKey(event.code)) {
      event.preventDefault();
    }

    if (event.repeat) {
      return;
    }
    this.keys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (isMovementKey(event.code)) {
      event.preventDefault();
    }

    this.keys.delete(event.code);
  };

  private readonly clear = (): void => {
    this.keys.clear();
  };
}

function isMovementKey(code: string): boolean {
  return (
    code === 'KeyW' ||
    code === 'KeyA' ||
    code === 'KeyS' ||
    code === 'KeyD' ||
    code === 'ArrowUp' ||
    code === 'ArrowLeft' ||
    code === 'ArrowDown' ||
    code === 'ArrowRight'
  );
}
