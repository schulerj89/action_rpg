interface TitleScreenHandlers {
  onStart: () => void;
}

export class TitleScreen {
  private readonly root: HTMLElement;
  private readonly settingsPanel: HTMLElement;
  private readonly helpPanel: HTMLElement;
  private readonly buttons: HTMLButtonElement[];
  private active = true;
  private selectedIndex = 0;

  constructor(root: Document, handlers: TitleScreenHandlers) {
    const titleScreen = root.querySelector<HTMLElement>('[data-testid="title-screen"]');
    const startButton = root.querySelector<HTMLButtonElement>('[data-testid="title-start"]');
    const menuButton = root.querySelector<HTMLButtonElement>('[data-testid="title-menu"]');
    const helpButton = root.querySelector<HTMLButtonElement>('[data-testid="title-help"]');
    const settingsPanel = root.querySelector<HTMLElement>('[data-testid="title-menu-panel"]');
    const helpPanel = root.querySelector<HTMLElement>('[data-testid="title-help-panel"]');
    const backButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-title-panel-back]'));

    if (!titleScreen || !startButton || !menuButton || !helpButton || !settingsPanel || !helpPanel || backButtons.length === 0) {
      throw new Error('Title screen markup is missing.');
    }

    this.root = titleScreen;
    this.settingsPanel = settingsPanel;
    this.helpPanel = helpPanel;
    this.buttons = [startButton, menuButton, helpButton];
    this.buttons.forEach((button, index) => {
      button.addEventListener('mouseenter', () => {
        this.select(index);
      });
    });
    startButton.addEventListener('click', () => {
      this.start(handlers.onStart);
    });
    menuButton.addEventListener('click', () => {
      this.openSettings();
    });
    helpButton.addEventListener('click', () => {
      this.openHelp();
    });
    backButtons.forEach((button) => {
      button.addEventListener('click', () => {
        this.closePanels();
      });
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
      } else if (event.code === 'Escape' && this.hasOpenPanel()) {
        event.preventDefault();
        this.closePanels();
      }
    });
    this.select(0);
  }

  isActive(): boolean {
    return this.active;
  }

  private activate(onStart: () => void): void {
    if (this.hasOpenPanel()) {
      this.closePanels();
      return;
    }

    if (this.selectedIndex === 0) {
      this.start(onStart);
    } else if (this.selectedIndex === 1) {
      this.openSettings();
    } else {
      this.openHelp();
    }
  }

  private start(onStart: () => void): void {
    this.active = false;
    this.root.hidden = true;
    onStart();
  }

  private openSettings(): void {
    this.settingsPanel.hidden = false;
    this.helpPanel.hidden = true;
    this.select(1);
  }

  private openHelp(): void {
    this.settingsPanel.hidden = true;
    this.helpPanel.hidden = false;
    this.select(2);
  }

  private closePanels(): void {
    this.settingsPanel.hidden = true;
    this.helpPanel.hidden = true;
  }

  private hasOpenPanel(): boolean {
    return !this.settingsPanel.hidden || !this.helpPanel.hidden;
  }

  private select(index: number): void {
    this.selectedIndex = (index + this.buttons.length) % this.buttons.length;
    this.buttons.forEach((button, buttonIndex) => {
      button.classList.toggle('selected', buttonIndex === this.selectedIndex);
    });
  }
}
