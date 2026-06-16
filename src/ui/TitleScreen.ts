interface TitleScreenHandlers {
  onStart: () => void;
}

export class TitleScreen {
  private readonly root: HTMLElement;
  private readonly menuPanel: HTMLElement;
  private readonly buttons: HTMLButtonElement[];
  private active = true;
  private selectedIndex = 0;

  constructor(root: Document, handlers: TitleScreenHandlers) {
    const titleScreen = root.querySelector<HTMLElement>('[data-testid="title-screen"]');
    const startButton = root.querySelector<HTMLButtonElement>('[data-testid="title-start"]');
    const menuButton = root.querySelector<HTMLButtonElement>('[data-testid="title-menu"]');
    const menuPanel = root.querySelector<HTMLElement>('[data-testid="title-menu-panel"]');
    const backButton = root.querySelector<HTMLButtonElement>('[data-testid="title-back"]');

    if (!titleScreen || !startButton || !menuButton || !menuPanel || !backButton) {
      throw new Error('Title screen markup is missing.');
    }

    this.root = titleScreen;
    this.menuPanel = menuPanel;
    this.buttons = [startButton, menuButton];
    this.buttons.forEach((button, index) => {
      button.addEventListener('mouseenter', () => {
        this.select(index);
      });
    });
    startButton.addEventListener('click', () => {
      this.start(handlers.onStart);
    });
    menuButton.addEventListener('click', () => {
      this.openMenu();
    });
    backButton.addEventListener('click', () => {
      this.closeMenu();
    });
    window.addEventListener('keydown', (event) => {
      if (!this.active) {
        return;
      }
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        this.select(this.selectedIndex - 1);
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        this.select(this.selectedIndex + 1);
      } else if (event.code === 'Enter' || event.code === 'Space') {
        event.preventDefault();
        this.activate(handlers.onStart);
      } else if (event.code === 'Escape' && !this.menuPanel.hidden) {
        event.preventDefault();
        this.closeMenu();
      }
    });
    this.select(0);
  }

  isActive(): boolean {
    return this.active;
  }

  private activate(onStart: () => void): void {
    if (!this.menuPanel.hidden) {
      this.closeMenu();
      return;
    }

    if (this.selectedIndex === 0) {
      this.start(onStart);
    } else {
      this.openMenu();
    }
  }

  private start(onStart: () => void): void {
    this.active = false;
    this.root.hidden = true;
    onStart();
  }

  private openMenu(): void {
    this.menuPanel.hidden = false;
  }

  private closeMenu(): void {
    this.menuPanel.hidden = true;
    this.select(1);
  }

  private select(index: number): void {
    this.selectedIndex = (index + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((button, buttonIndex) => {
      button.classList.toggle('selected', buttonIndex === this.selectedIndex);
    });
  }
}
