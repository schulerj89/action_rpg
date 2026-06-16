export type EnemyAssetId = 'ember-prowler' | 'shellback-guardian';

export interface EnemyAssetDefinition {
  id: EnemyAssetId;
  targetHeight: number;
  url: string;
}

export const enemyAssetDefinitions: EnemyAssetDefinition[] = [
  {
    id: 'ember-prowler',
    targetHeight: 2.05,
    url: '/assets/enemies/first-town/ember-prowler.glb',
  },
  {
    id: 'shellback-guardian',
    targetHeight: 2.65,
    url: '/assets/enemies/first-town/shellback-guardian.glb',
  },
];
