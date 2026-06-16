import { Group, Mesh, Vector3 } from 'three';
import { firstTownAssetDefinitions, type TownAssetId } from '../../config/townAssets';
import { CollisionResolver } from '../CollisionResolver';
import { InteractionTrigger } from '../InteractionTrigger';
import {
  firstTownBattleTrigger,
  firstTownBuildings,
  firstTownColliders,
  firstTownDebugPoses,
  firstTownDetailAssets,
  firstTownGroundAssets,
  firstTownNextTownName,
  firstTownNpcs,
  firstTownNorthRouteStart,
  firstTownPreloadAssetIds,
  firstTownSceneId,
  firstTownSpawn,
  firstTownWallSegments,
  type TownDebugPose,
  type TownAssetPlacement,
  type TownNpcPose,
} from './firstTownLayout';
import { TownAssetSystem, type TownAssetSystemSnapshot } from './TownAssetSystem';
import {
  createBattleTriggerPad,
  createCollisionOverlay,
  createFieldEnemyMarker,
  createGrassField,
  createTerrainPatch,
  createTrailDestinationMarker,
  createTownBuilding,
  createTownGround,
  createTownNpc,
  createTownWell,
  createWallSegmentFallback,
} from './TownPrimitiveFactory';
import { loadFirstTownRegionMap, type FirstTownRegionMap } from './FirstTownRegionMap';

export class FirstTownScene {
  readonly battleTriggerPad: Mesh;
  readonly battleTriggerPosition = firstTownBattleTrigger.clone();
  readonly root = new Group();
  readonly sceneId = firstTownSceneId;
  readonly spawn = firstTownSpawn.clone();

  private readonly combatHiddenRoot = new Group();
  private readonly streamedTerrainRoot = new Group();
  private readonly collisionOverlayRoot = createCollisionOverlay(firstTownColliders);
  private readonly assetSystem = new TownAssetSystem(firstTownAssetDefinitions);
  private readonly collision = new CollisionResolver(firstTownColliders);
  private readonly fallbackRoots = new Map<string, Group>();
  private readonly fieldEnemyRoot: Group;
  private readonly interactions: InteractionTrigger[] = [];
  private readonly npcBaseRotations = new Map<string, number>();
  private readonly npcRoots = new Map<string, Group>();
  private regionMap?: FirstTownRegionMap;

  constructor() {
    this.root.name = 'first-town';
    this.combatHiddenRoot.name = 'first-town-combat-hidden';
    this.streamedTerrainRoot.name = 'first-town-streamed-terrain';
    this.fieldEnemyRoot = createFieldEnemyMarker(this.battleTriggerPosition);
    this.root.add(createTownGround(), createGrassField(), this.combatHiddenRoot, this.collisionOverlayRoot);
    this.combatHiddenRoot.add(this.streamedTerrainRoot);
    this.combatHiddenRoot.add(this.fieldEnemyRoot, createTrailDestinationMarker());
    this.addFallback('town-well', createTownWell(), this.combatHiddenRoot);

    firstTownBuildings.forEach((building) => {
      this.addFallback(building.id, createTownBuilding(building), this.combatHiddenRoot);
      if (building.kind === 'weapons' || building.kind === 'potions') {
        this.interactions.push(
          new InteractionTrigger({
            id: `${building.id}-shop`,
            kind: 'shop',
            position: new Vector3(
              (building.collider.minX + building.collider.maxX) / 2,
              0,
              building.collider.maxZ + 1.05,
            ),
            radius: 1.55,
            shopId: building.kind,
          }),
        );
      }
    });

    firstTownNpcs.forEach((npc) => {
      const npcRoot = createTownNpc(npc);
      this.npcRoots.set(npc.dialogueId, npcRoot);
      this.npcBaseRotations.set(npc.dialogueId, npcRoot.rotation.y);
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
    await Promise.all([this.assetSystem.loadAssets(this.getRequiredAssetIds()), this.loadRegionMap()]);
    this.addGroundAssets();
    this.addBuildingAssets();
    this.addNpcAssets();
    this.addPlacements(firstTownDetailAssets, this.combatHiddenRoot);
    this.addPlacements(firstTownWallSegments, this.combatHiddenRoot);
  }

  update(deltaSeconds: number): void {
    this.battleTriggerPad.rotation.z += deltaSeconds * 1.8;
    let index = 0;
    this.npcRoots.forEach((npc, dialogueId) => {
      const baseRotation = this.npcBaseRotations.get(dialogueId) ?? npc.rotation.y;
      npc.rotation.y = baseRotation + Math.sin(performance.now() * 0.0014 + index) * 0.08;
      npc.position.y = 0;
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

  getNextTownName(): string {
    return firstTownNextTownName;
  }

  getDebugPoses(): TownDebugPose[] {
    return firstTownDebugPoses.map((pose) => ({
      ...pose,
      camera: pose.camera.clone(),
      lookAt: pose.lookAt.clone(),
      player: pose.player.clone(),
    }));
  }

  getDebugPose(id: string): TownDebugPose | undefined {
    const pose = firstTownDebugPoses.find((candidate) => candidate.id === id);
    if (!pose) {
      return undefined;
    }

    return {
      ...pose,
      camera: pose.camera.clone(),
      lookAt: pose.lookAt.clone(),
      player: pose.player.clone(),
    };
  }

  getLoadedMeshyProps(): string[] {
    return this.assetSystem.getLoadedAssetIds();
  }

  getAssetSnapshot(): TownAssetSystemSnapshot {
    return this.assetSystem.snapshot();
  }

  getRegionMapSnapshot(): Pick<FirstTownRegionMap, 'activeZones' | 'battleScenes' | 'id' | 'version'> | undefined {
    if (!this.regionMap) {
      return undefined;
    }

    return {
      activeZones: [...this.regionMap.activeZones],
      battleScenes: [...this.regionMap.battleScenes],
      id: this.regionMap.id,
      version: this.regionMap.version,
    };
  }

  getFallbackIds(): string[] {
    return [...this.fallbackRoots.entries()].filter(([, root]) => root.visible).map(([id]) => id);
  }

  getRouteSnapshot(): { fieldEnemyVisible: boolean; northRouteStartZ: number; nextTownName: string } {
    return {
      fieldEnemyVisible: this.fieldEnemyRoot.visible,
      nextTownName: firstTownNextTownName,
      northRouteStartZ: firstTownNorthRouteStart,
    };
  }

  setFieldEnemyVisible(visible: boolean): void {
    this.fieldEnemyRoot.visible = visible;
    this.battleTriggerPad.visible = visible;
  }

  isFieldEnemyVisible(): boolean {
    return this.fieldEnemyRoot.visible;
  }

  setNpcPose(dialogueId: string, pose: TownNpcPose): boolean {
    const npcRoot = this.npcRoots.get(dialogueId);
    if (!npcRoot) {
      return false;
    }

    npcRoot.position.copy(pose.position);
    npcRoot.rotation.y = pose.rotationY;
    this.npcBaseRotations.set(dialogueId, pose.rotationY);
    return true;
  }

  restoreNpcPose(dialogueId: string): boolean {
    const layout = firstTownNpcs.find((npc) => npc.dialogueId === dialogueId);
    if (!layout) {
      return false;
    }

    return this.setNpcPose(dialogueId, {
      position: layout.position,
      rotationY: layout.rotationY ?? 0,
    });
  }

  getNpcPose(dialogueId: string): TownNpcPose | undefined {
    const npcRoot = this.npcRoots.get(dialogueId);
    if (!npcRoot) {
      return undefined;
    }

    return {
      position: npcRoot.position.clone(),
      rotationY: npcRoot.rotation.y,
    };
  }

  setCombatMode(enabled: boolean): void {
    this.combatHiddenRoot.visible = !enabled;
  }

  areCombatOccludersVisible(): boolean {
    return this.combatHiddenRoot.visible;
  }

  setCollisionOverlay(enabled: boolean): void {
    this.collisionOverlayRoot.visible = enabled;
  }

  isCollisionOverlayVisible(): boolean {
    return this.collisionOverlayRoot.visible;
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
    this.assetSystem.markReferenced('villager-npc');
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
      this.npcBaseRotations.set(npc.dialogueId, npc.rotationY ?? 0);
      this.combatHiddenRoot.add(model);
    });
  }

  private addPlacements(placements: TownAssetPlacement[], parent: Group): void {
    placements.forEach((placement) => {
      const model = this.assetSystem.createInstance(placement.assetId, {
        name: `${placement.id}-meshy`,
        position: placement.position,
        flattenY: placement.flattenY,
        rotationY: placement.rotationY,
        targetHeight: placement.targetHeight,
        targetLongestSide: placement.targetLongestSide,
        yOffset: placement.yOffset,
      });
      if (!model) {
        return;
      }

      this.hideFallback(placement.id);
      parent.add(model);
    });
  }

  private async loadRegionMap(): Promise<void> {
    try {
      this.regionMap = await loadFirstTownRegionMap();
      this.streamedTerrainRoot.clear();
      const activeZones = new Set(this.regionMap.activeZones);
      this.regionMap.terrainPatches
        .filter((patch) => activeZones.has(patch.zoneId))
        .forEach((patch) => {
          this.streamedTerrainRoot.add(createTerrainPatch(patch));
        });
    } catch {
      this.regionMap = undefined;
    }
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
