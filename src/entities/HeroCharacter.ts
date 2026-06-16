import {
  AnimationMixer,
  Box3,
  Group,
  LoopOnce,
  LoopRepeat,
  Object3D,
  Vector3,
} from 'three';
import type { AnimationAction, AnimationClip } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { HeroAnimationKey } from '../core/types';

interface PlayOptions {
  fadeSeconds?: number;
  loopOnce?: boolean;
  timeScale?: number;
}

export class HeroCharacter {
  readonly root: Group;

  private readonly mixer: AnimationMixer;
  private readonly actions = new Map<HeroAnimationKey, AnimationAction>();
  private readonly bones = new Map<string, Object3D>();
  private currentAction?: AnimationAction;
  private currentKey?: HeroAnimationKey;

  private constructor(root: Group, visualRoot: Object3D, clips: Map<HeroAnimationKey, AnimationClip>) {
    this.root = root;
    this.mixer = new AnimationMixer(visualRoot);
    visualRoot.traverse((child) => {
      if (child.name) {
        this.bones.set(child.name, child);
      }
    });

    clips.forEach((clip, key) => {
      this.actions.set(key, this.mixer.clipAction(clip));
    });
  }

  static async load(assets: Record<HeroAnimationKey, string>): Promise<HeroCharacter> {
    const loader = new GLTFLoader();
    const loaded = new Map<HeroAnimationKey, GLTF>();

    for (const key of Object.keys(assets) as HeroAnimationKey[]) {
      loaded.set(key, await loader.loadAsync(assets[key]));
    }

    const idleGltf = loaded.get('explorationIdle');
    if (!idleGltf) {
      throw new Error('Hero exploration idle GLB failed to load.');
    }

    const visualRoot = idleGltf.scene;
    normalizeModel(visualRoot);

    const root = new Group();
    root.name = 'Ryuji Vale';
    root.add(visualRoot);

    visualRoot.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });

    const clips = new Map<HeroAnimationKey, AnimationClip>();
    loaded.forEach((gltf, key) => {
      const clip = gltf.animations[0];
      if (clip) {
        clip.name = key;
        clips.set(key, clip);
      }
    });

    const hero = new HeroCharacter(root, visualRoot, clips);
    hero.play('explorationIdle');
    return hero;
  }

  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
  }

  play(key: HeroAnimationKey, options: PlayOptions = {}): void {
    if (this.currentKey === key && !options.loopOnce) {
      return;
    }

    const action = this.actions.get(key);
    if (!action) {
      return;
    }

    const fadeSeconds = options.fadeSeconds ?? 0.18;
    action.enabled = true;
    action.timeScale = options.timeScale ?? 1;
    action.clampWhenFinished = Boolean(options.loopOnce);
    action.setLoop(options.loopOnce ? LoopOnce : LoopRepeat, options.loopOnce ? 1 : Infinity);
    action.reset();

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(fadeSeconds);
    }

    action.fadeIn(fadeSeconds).play();
    this.currentAction = action;
    this.currentKey = key;
  }

  faceToward(target: Vector3): void {
    const dx = target.x - this.root.position.x;
    const dz = target.z - this.root.position.z;

    if (Math.abs(dx) + Math.abs(dz) < 0.001) {
      return;
    }

    this.root.rotation.y = Math.atan2(dx, dz);
  }

  faceTowardSmooth(target: Vector3, deltaSeconds: number, turnSpeed = 12): void {
    const dx = target.x - this.root.position.x;
    const dz = target.z - this.root.position.z;

    if (Math.abs(dx) + Math.abs(dz) < 0.001) {
      return;
    }

    const targetAngle = Math.atan2(dx, dz);
    const currentAngle = this.root.rotation.y;
    const angleDelta = normalizeAngle(targetAngle - currentAngle);
    const smoothing = 1 - Math.exp(-turnSpeed * deltaSeconds);
    this.root.rotation.y = currentAngle + angleDelta * smoothing;
  }

  getLeftFootWorldPosition(target: Vector3): Vector3 {
    const leftFoot = this.bones.get('LeftFoot');
    if (leftFoot) {
      return leftFoot.getWorldPosition(target);
    }

    return target.copy(this.root.position).add(new Vector3(-0.32, 0.16, 0).applyAxisAngle(new Vector3(0, 1, 0), this.root.rotation.y));
  }
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function normalizeModel(model: Object3D): void {
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const targetHeight = 1.75;
  const scale = targetHeight / Math.max(size.y, 0.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const scaledBox = new Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;
}
