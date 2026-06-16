import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

export interface WorldScene {
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  scene: Scene;
}

export function createWorldScene(canvas: HTMLCanvasElement): WorldScene {
  const scene = new Scene();
  scene.background = new Color('#8ec5ff');
  scene.fog = new Fog('#8ec5ff', 28, 58);

  const camera = new PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 3.1, 7);

  const renderer = new WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;

  const ambient = new AmbientLight('#98a2b3', 1.35);
  scene.add(ambient);

  const keyLight = new DirectionalLight('#fff3d6', 3.2);
  keyLight.position.set(6, 10, 4);
  keyLight.castShadow = false;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 35;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new DirectionalLight('#74b8ff', 1.1);
  fillLight.position.set(-6, 5, -8);
  scene.add(fillLight);

  return { camera, renderer, scene };
}
