import type { TerrainPatchLayout } from './TownPrimitiveFactory';

export interface FirstTownRegionMap {
  activeZones: string[];
  battleScenes: Array<{
    id: string;
    terrainZone: string;
    theme: string;
  }>;
  id: string;
  terrainPatches: Array<TerrainPatchLayout & { zoneId: string }>;
  version: number;
}

export async function loadFirstTownRegionMap(): Promise<FirstTownRegionMap> {
  const response = await fetch('/assets/maps/first-town-region.json');
  if (!response.ok) {
    throw new Error(`Failed to load first town region map: ${response.status}`);
  }

  return (await response.json()) as FirstTownRegionMap;
}
