import type { NpcDialogue, SceneDialogue } from '../world/dialogue/DialogueRepository';

export class DialogueBox {
  private readonly root: HTMLElement;
  private readonly speaker: HTMLElement;
  private readonly text: HTMLElement;
  private readonly nextButton: HTMLButtonElement;
  private activeNpc?: NpcDialogue;
  private currentNodeId?: string;

  constructor(root: Document) {
    const dialogueBox = root.querySelector<HTMLElement>('[data-testid="dialogue-box"]');
    const speaker = root.querySelector<HTMLElement>('[data-testid="dialogue-speaker"]');
    const text = root.querySelector<HTMLElement>('[data-testid="dialogue-text"]');
    const nextButton = root.querySelector<HTMLButtonElement>('[data-testid="dialogue-next"]');

    if (!dialogueBox || !speaker || !text || !nextButton) {
      throw new Error('Dialogue box markup is missing.');
    }

    this.root = dialogueBox;
    this.speaker = speaker;
    this.text = text;
    this.nextButton = nextButton;
    this.nextButton.addEventListener('click', () => this.advance());
  }

  show(sceneDialogue: SceneDialogue, npcId: string): boolean {
    const npc = sceneDialogue.npcs[npcId];
    if (!npc) {
      return false;
    }

    this.activeNpc = npc;
    this.currentNodeId = npc.start;
    this.root.hidden = false;
    this.renderCurrentNode();
    return true;
  }

  advance(): void {
    if (!this.activeNpc || !this.currentNodeId) {
      return;
    }

    const currentNode = this.activeNpc.nodes[this.currentNodeId];
    if (!currentNode?.next) {
      this.hide();
      return;
    }

    this.currentNodeId = currentNode.next;
    this.renderCurrentNode();
  }

  hide(): void {
    this.root.hidden = true;
    this.activeNpc = undefined;
    this.currentNodeId = undefined;
  }

  isActive(): boolean {
    return !this.root.hidden;
  }

  getCurrentNpcName(): string | undefined {
    return this.activeNpc?.displayName;
  }

  private renderCurrentNode(): void {
    if (!this.activeNpc || !this.currentNodeId) {
      return;
    }

    const currentNode = this.activeNpc.nodes[this.currentNodeId];
    this.speaker.textContent = this.activeNpc.displayName;
    this.text.textContent = currentNode.text;
    this.nextButton.textContent = currentNode.next ? 'Next' : 'Close';
  }
}
