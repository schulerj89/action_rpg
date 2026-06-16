export interface DialogueNode {
  next: string | null;
  text: string;
}

export interface NpcDialogue {
  displayName: string;
  nodes: Record<string, DialogueNode>;
  start: string;
}

export interface SceneDialogue {
  npcs: Record<string, NpcDialogue>;
  sceneId: string;
}

export class DialogueRepository {
  async loadScene(sceneId: string): Promise<SceneDialogue> {
    const response = await fetch(`/assets/scenes/${sceneId}/dialogue.json`);
    if (!response.ok) {
      throw new Error(`Dialogue failed to load for ${sceneId}.`);
    }

    const dialogue = (await response.json()) as SceneDialogue;
    validateDialogue(sceneId, dialogue);
    return dialogue;
  }
}

function validateDialogue(sceneId: string, dialogue: SceneDialogue): void {
  if (dialogue.sceneId !== sceneId) {
    throw new Error(`Dialogue scene mismatch: expected ${sceneId}, got ${dialogue.sceneId}.`);
  }

  Object.entries(dialogue.npcs).forEach(([npcId, npc]) => {
    if (!npc.displayName || !npc.start || !npc.nodes[npc.start]) {
      throw new Error(`Dialogue entry ${npcId} is missing a display name or start node.`);
    }

    Object.entries(npc.nodes).forEach(([nodeId, node]) => {
      if (!node.text.trim()) {
        throw new Error(`Dialogue node ${npcId}.${nodeId} is empty.`);
      }
      if (node.next !== null && !npc.nodes[node.next]) {
        throw new Error(`Dialogue node ${npcId}.${nodeId} points to missing node ${node.next}.`);
      }
    });
  });
}
