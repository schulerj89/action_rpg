export interface MovementAxes {
  reverse: boolean;
  forward: number;
  turn: number;
}

export interface FreeCameraAxes {
  fast: boolean;
  forward: number;
  pitch: number;
  strafe: number;
  turn: number;
  vertical: number;
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

  getFreeCameraAxes(): FreeCameraAxes {
    return {
      fast: this.keys.has('ShiftLeft'),
      forward: keyAxis(this.keys, 'KeyW', 'ArrowUp') - keyAxis(this.keys, 'KeyS', 'ArrowDown'),
      pitch: keyAxis(this.keys, 'KeyR') - keyAxis(this.keys, 'KeyF'),
      strafe: keyAxis(this.keys, 'KeyD') - keyAxis(this.keys, 'KeyA'),
      turn: keyAxis(this.keys, 'ArrowRight') - keyAxis(this.keys, 'ArrowLeft'),
      vertical: keyAxis(this.keys, 'KeyE') - keyAxis(this.keys, 'KeyQ'),
    };
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

function keyAxis(keys: Set<string>, positive: string, alternatePositive?: string): number {
  return keys.has(positive) || (alternatePositive ? keys.has(alternatePositive) : false) ? 1 : 0;
}
