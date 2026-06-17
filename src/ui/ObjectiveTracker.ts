export interface ObjectiveChecklistItem {
  complete: boolean;
  id: string;
  label: string;
}

export interface ObjectiveSnapshot {
  checklist: ObjectiveChecklistItem[];
  description: string;
  id: string;
  title: string;
}

export class ObjectiveTracker {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly description: HTMLElement;
  private readonly list: HTMLElement;

  constructor(root: Document) {
    const tracker = root.querySelector<HTMLElement>('[data-testid="objective-tracker"]');
    const title = root.querySelector<HTMLElement>('[data-testid="objective-title"]');
    const description = root.querySelector<HTMLElement>('[data-testid="objective-description"]');
    const list = root.querySelector<HTMLElement>('[data-testid="objective-checklist"]');

    if (!tracker || !title || !description || !list) {
      throw new Error('Objective tracker markup is missing.');
    }

    this.root = tracker;
    this.title = title;
    this.description = description;
    this.list = list;
  }

  setVisible(visible: boolean): void {
    this.root.hidden = !visible;
  }

  update(snapshot: ObjectiveSnapshot): void {
    this.title.textContent = snapshot.title;
    this.description.textContent = snapshot.description;
    this.list.replaceChildren();
    snapshot.checklist.forEach((item) => {
      const row = document.createElement('li');
      row.className = item.complete ? 'complete' : '';
      row.dataset.objectiveItem = item.id;
      row.textContent = item.label;
      this.list.append(row);
    });
  }
}
