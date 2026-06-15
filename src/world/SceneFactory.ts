import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  GridHelper,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RingGeometry,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

export const battleTriggerPosition = new Vector3(0, 0, -8.5);

export interface WorldScene {
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  scene: Scene;
  triggerPad: Mesh;
}

export function createWorldScene(canvas: HTMLCanvasElement): WorldScene {
  const scene = new Scene();
  scene.background = new Color('#121419');
  scene.fog = new Fog('#121419', 18, 42);

  const camera = new PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 3.1, 7);

  const renderer = new WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const ambient = new AmbientLight('#98a2b3', 1.35);
  scene.add(ambient);

  const keyLight = new DirectionalLight('#fff3d6', 3.2);
  keyLight.position.set(6, 10, 4);
  keyLight.castShadow = true;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 35;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new DirectionalLight('#74b8ff', 1.1);
  fillLight.position.set(-6, 5, -8);
  scene.add(fillLight);

  const floor = new Mesh(
    new PlaneGeometry(42, 42),
    new MeshStandardMaterial({
      color: '#252a2f',
      roughness: 0.82,
      metalness: 0.04,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const arena = new Mesh(
    new CylinderGeometry(7, 7, 0.05, 72),
    new MeshStandardMaterial({
      color: '#303744',
      roughness: 0.7,
      metalness: 0.08,
    }),
  );
  arena.position.set(0, 0.028, -9);
  arena.receiveShadow = true;
  scene.add(arena);

  const grid = new GridHelper(42, 42, '#3a4250', '#2e3440');
  grid.position.y = 0.04;
  scene.add(grid);

  const triggerPad = new Mesh(
    new RingGeometry(1.15, 1.42, 48),
    new MeshStandardMaterial({
      color: '#50e3c2',
      emissive: '#0a6f5f',
      transparent: true,
      opacity: 0.72,
    }),
  );
  triggerPad.rotation.x = -Math.PI / 2;
  triggerPad.position.copy(battleTriggerPosition);
  triggerPad.position.y = 0.08;
  scene.add(triggerPad);

  return { camera, renderer, scene, triggerPad };
}
