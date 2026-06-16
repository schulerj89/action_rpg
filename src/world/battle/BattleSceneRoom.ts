import {
  BoxGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';

const materials = {
  dirt: new MeshStandardMaterial({ color: '#74654d', roughness: 0.9 }),
  grass: new MeshStandardMaterial({ color: '#2f6a3c', roughness: 0.94 }),
  ridge: new MeshStandardMaterial({ color: '#5d6670', roughness: 0.86 }),
  wall: new MeshStandardMaterial({ color: '#c4a276', roughness: 0.82 }),
};

const box = new BoxGeometry(1, 1, 1);

export class BattleSceneRoom {
  readonly root = new Group();

  constructor() {
    this.root.name = 'north-field-battle-room';
    this.root.visible = false;
    this.root.add(createField(), createTownWallSilhouette(), createGrassDetails());
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  snapshot(): { id: string; visible: boolean } {
    return {
      id: this.root.name,
      visible: this.root.visible,
    };
  }
}

function createField(): Group {
  const root = new Group();
  const grass = new Mesh(new PlaneGeometry(28, 20), materials.grass);
  grass.position.set(0, -0.018, -28);
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;

  const road = new Mesh(new PlaneGeometry(7.4, 20), materials.dirt);
  road.position.set(0, -0.012, -28);
  road.rotation.x = -Math.PI / 2;
  road.receiveShadow = true;

  const ridge = new Mesh(box, materials.ridge);
  ridge.scale.set(28, 0.55, 0.8);
  ridge.position.set(0, 0.26, -38.2);
  ridge.receiveShadow = true;

  root.add(grass, road, ridge);
  return root;
}

function createTownWallSilhouette(): Group {
  const root = new Group();
  root.position.set(0, 0, -17.2);
  [-13.5, -8.2, 8.2, 13.5].forEach((x) => {
    const segment = new Mesh(box, materials.wall);
    segment.scale.set(4.4, 1.08, 0.46);
    segment.position.set(x, 0.54, 0);
    segment.receiveShadow = true;
    root.add(segment);
  });
  return root;
}

function createGrassDetails(): InstancedMesh {
  const blade = new BoxGeometry(0.035, 0.32, 0.035);
  const grass = new InstancedMesh(blade, materials.grass, 180);
  const matrix = new Matrix4();
  const position = new Vector3();

  for (let index = 0; index < 180; index += 1) {
    const x = seeded(index * 17.3) * 26 - 13;
    const z = -37 + seeded(index * 23.7 + 3) * 18;
    if (Math.abs(x) < 3.4) {
      matrix.makeScale(0.01, 0.01, 0.01);
      position.set(30, -6, 30);
    } else {
      matrix.makeRotationY(seeded(index * 5.1) * Math.PI);
      matrix.scale(new Vector3(1, 0.75 + seeded(index * 11.2) * 0.8, 1));
      position.set(x, 0.16, z);
    }
    matrix.setPosition(position);
    grass.setMatrixAt(index, matrix);
  }

  grass.instanceMatrix.needsUpdate = true;
  grass.frustumCulled = false;
  return grass;
}

function seeded(value: number): number {
  const x = Math.sin(value) * 10000;
  return x - Math.floor(x);
}
