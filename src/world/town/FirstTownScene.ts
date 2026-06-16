import { Group, Mesh, Vector3 } from 'three';
import { firstTownAssetDefinitions, type TownAssetId } from '../../config/townAssets';
import { CollisionResolver } from '../CollisionResolver';
import { InteractionTrigger } from '../InteractionTrigger';
import {
  firstTownBattleTrigger,
  firstTownBuildings,
  firstTownColliders,
  firstTownDetailAssets,
  firstTownGroundAssets,
  firstTownNpcs,
  firstTownPreloadAssetIds,
  firstTownSceneId,
  firstTownSpawn,
  firstTownWallSegments,
  type TownAssetPlacement,
} from './firstTownLayout';
import { TownAssetSystem, type TownAssetSystemSnapshot } from './TownAssetSystem';
import {
  createBattleTriggerPad,
  createGrassField,
  createTownBuilding,
  createTownGround,
  createTownNpc,
  createTownWell,
  createWallSegmentFallback,
} from './TownPrimitiveFactory';

export class FirstTownScene {
  readonly battleTriggerPad: Mesh;
  readonly battleTriggerPosition = firstTownBattleTrigger.clone();
  readonly root = new Group();
  readonly sceneId = firstTownSceneId;
  readonly spawn = firstTownSpawn.clone();

  private readonly combatHiddenRoot = new Group();
  private readonly assetSystem = new TownAssetSystem(firstTownAssetDefinitions);
  private readonly collision = new CollisionResolver(firstTownColliders);
  private readonly fallbackRoots = new Map<string, Group>();
  private readonly interactions: InteractionTrigger[] = [];
  private readonly npcRoots = new Map<string, Group>();

  constructor() {
    this.root.name = 'first-town';
    this.combatHiddenRoot.name = 'first-town-combat-hidden';
    this.root.add(createTownGround(), createGrassField(), this.combatHiddenRoot);
    this.addFallback('town-well', createTownWell(), this.combatHiddenRoot);

    firstTownBuildings.forEach((building) => {
      this.addFallback(building.id, createTownBuilding(building), this.combatHiddenRoot);
    });

    firstTownNpcs.forEach((npc) => {
      const npcRoot = createTownNpc(npc);
      this.npcRoots.set(npc.dialogueId, npcRoot);
      this.addFallback(npc.id, npcRoot, this.combatHiddenRoot);
      this.interactions.push(
        new InteractionTrigger({
          id: `${npc.dialogueId}-dialogue`,
          kind: 'dialogue',
          npcId: npc.dialogueId,
          position: npc.position.clone(),
          radius: 1.55,
        }),
      );
    });

    firstTownWallSegments.forEach((wall) => {
      this.addFallback(wall.id, createWallSegmentFallback(wall), this.combatHiddenRoot);
    });

    this.battleTriggerPad = createBattleTriggerPad(this.battleTriggerPosition);
    this.root.add(this.battleTriggerPad);
  }

  async loadMeshyProps(): Promise<void> {
    await this.assetSystem.loadAssets(this.getRequiredAssetIds());
    this.addGroundAssets();
    this.addBuildingAssets();
    this.addNpcAssets();
    this.addPlacements(firstTownDetailAssets, this.combatHiddenRoot);
    this.addPlacements(firstTownWallSegments, this.combatHiddenRoot);
  }

  update(deltaSeconds: number): void {
    this.battleTriggerPad.rotation.z += deltaSeconds * 1.8;
    let index = 0;
    this.npcRoots.forEach((npc) => {
      npc.rotation.y = Math.sin(performance.now() * 0.0014 + index) * 0.12;
      npc.position.y = Math.sin(performance.now() * 0.0021 + index) * 0.025;
      index += 1;
    });
  }

  resolvePlayerPosition(previous: Vector3, proposed: Vector3): Vector3 {
    return this.collision.resolve(previous, proposed);
  }

  findNearestInteraction(position: Vector3): InteractionTrigger | undefined {
    const candidates = this.interactions
      .map((interaction) => ({
        distance: interaction.distanceTo(position),
        interaction,
      }))
      .filter((candidate) => candidate.distance <= candidate.interaction.radius)
      .sort((a, b) => a.distance - b.distance);
    return candidates[0]?.interaction;
  }

  getNpcIds(): string[] {
    return firstTownNpcs.map((npc) => npc.dialogueId);
  }

  getLoadedMeshyProps(): string[] {
    return this.assetSystem.getLoadedAssetIds();
  }

  getAssetSnapshot(): TownAssetSystemSnapshot {
    return this.assetSystem.snapshot();
  }

  getFallbackIds(): string[] {
    return [...this.fallbackRoots.entries()].filter(([, root]) => root.visible).map(([id]) => id);
  }

  setCombatMode(enabled: boolean): void {
    this.combatHiddenRoot.visible = !enabled;
  }

  areCombatOccludersVisible(): boolean {
    return this.combatHiddenRoot.visible;
  }

  private addGroundAssets(): void {
    this.addPlacements(firstTownGroundAssets, this.root);
  }

  private addBuildingAssets(): void {
    firstTownBuildings.forEach((building) => {
      const model = this.assetSystem.createInstance(building.assetId, {
        name: `${building.id}-meshy`,
        position: building.position,
        rotationY: building.rotationY,
        targetHeight: building.targetHeight,
      });
      if (!model) {
        return;
      }

      this.hideFallback(building.id);
      this.combatHiddenRoot.add(model);
    });
  }

  private addNpcAssets(): void {
    firstTownNpcs.forEach((npc) => {
      const model = this.assetSystem.createInstance(npc.assetId, {
        name: `${npc.id}-meshy`,
        position: npc.position,
        rotationY: npc.rotationY,
        targetHeight: 1.55,
      });
      if (!model) {
        return;
      }

      this.hideFallback(npc.id);
      this.npcRoots.set(npc.dialogueId, model);
      this.combatHiddenRoot.add(model);
    });
  }

  private addPlacements(placements: TownAssetPlacement[], parent: Group): void {
    placements.forEach((placement) => {
      const model = this.assetSystem.createInstance(placement.assetId, {
        name: `${placement.id}-meshy`,
        position: placement.position,
        rotationY: placement.rotationY,
        targetHeight: placement.targetHeight,
        targetLongestSide: placement.targetLongestSide,
      });
      if (!model) {
        return;
      }

      this.hideFallback(placement.id);
      parent.add(model);
    });
  }

  private addFallback(id: string, root: Group, parent: Group): void {
    root.name = `${id}-fallback`;
    this.fallbackRoots.set(id, root);
    parent.add(root);
  }

  private hideFallback(id: string): void {
    const fallback = this.fallbackRoots.get(id);
    if (fallback) {
      fallback.visible = false;
    }
  }

  private getRequiredAssetIds(): TownAssetId[] {
    return [
      ...firstTownPreloadAssetIds,
      ...firstTownGroundAssets.map((asset) => asset.assetId),
      ...firstTownBuildings.map((building) => building.assetId),
      ...firstTownNpcs.map((npc) => npc.assetId),
      ...firstTownDetailAssets.map((asset) => asset.assetId),
      ...firstTownWallSegments.map((wall) => wall.assetId),
    ];
  }
}
