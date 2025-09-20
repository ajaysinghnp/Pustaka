import { EventEmitter } from './EventEmitter';
import { PustakaLoader } from './PustakaLoader';
import { WebGLRenderer } from './WebGLRenderer';
import type { FileFetcher, PustakaConfig, PustakaEvents } from '../types';
import { PustakaInteraction } from './PustakaInteraction';

export class PustakaCore extends EventEmitter<PustakaEvents> {
  private config: Required<PustakaConfig>;
  private PustakaLoader: PustakaLoader;
  private renderer: WebGLRenderer;
  private currentPage: number = 1;
  private totalPages: number = 0;
  private _isReady: boolean = false;
  private animationFrame: number | null = null;
  private orientation: 'landscape' | 'portrait' = 'landscape';
  private PustakaInteraction: PustakaInteraction;

  constructor(config: PustakaConfig) {
    super();

    // Provide proper defaults for required properties
    const defaultFileFetcher: FileFetcher = async (url: string) => {
      const response = await fetch(url);
      return await response.arrayBuffer();
    };

    // Set default config
    this.config = {
      pageSpacing: 10,
      enableWebGL: true,
      fileFetcher: defaultFileFetcher,
      pdfSource: new Uint8Array(),
      ...config,
    } as Required<PustakaConfig>;

    // Initialize components
    this.PustakaLoader = new PustakaLoader(this.config.fileFetcher);

    // Check if canvas is provided
    if (!config.canvas) {
      throw new Error('Canvas element is required');
    }

    this.renderer = new WebGLRenderer(this.config.canvas);

    this.initialize();

    // Initialize book interaction
    this.PustakaInteraction = new PustakaInteraction(
      this.config.canvas as HTMLCanvasElement,
    );

    // Set up event listeners for page turning
    this.PustakaInteraction.on('startFlip', (data) => {
      this.startPageTurn(data.direction);
    });

    this.PustakaInteraction.on('updateFlip', (data) => {
      this.updatePageTurnProgress(data.progress);
    });

    this.PustakaInteraction.on('completeFlip', (_) => {
      this.completePageTurn();
    });

    this.PustakaInteraction.on('cancelFlip', () => {
      this.cancelPageTurn();
    });
  }

  checkOrientation(): void {
    const isPortrait = window.innerHeight > window.innerWidth;
    const newOrientation = isPortrait ? 'portrait' : 'landscape';

    if (this.orientation !== newOrientation) {
      this.orientation = newOrientation;
      this.renderer.setOrientation(newOrientation);

      // You might also want to reload pages or adjust layout
      this.emit('orientationChanged', { orientation: newOrientation });
    }
  }

  private async initialize(): Promise<void> {
    try {
      await this.PustakaLoader.initialize();

      if (
        this.config.pdfSource &&
        (typeof this.config.pdfSource === 'string' ||
          (this.config.pdfSource instanceof Uint8Array &&
            this.config.pdfSource.length > 0) ||
          (this.config.pdfSource instanceof ArrayBuffer &&
            this.config.pdfSource.byteLength > 0))
      ) {
        await this.loadDocument(this.config.pdfSource);
      }
    } catch (error) {
      this.emit('error', {
        message: 'Failed to initialize PDF Book Core',
        error: error as Error,
      });
    }
  }

  async loadDocument(source: string | ArrayBuffer | Uint8Array): Promise<void> {
    try {
      this.totalPages = await this.PustakaLoader.loadDocument(source);

      // Load first page
      await this.loadPage(1);

      this._isReady = true;
      this.emit('ready', { totalPages: this.totalPages });

      // Start render loop
      this.startRenderLoop();
    } catch (error) {
      this.emit('error', {
        message: 'Failed to load PDF document',
        error: error as Error,
      });
    }
  }

  private async loadPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    try {
      // Load current page
      const page = await this.PustakaLoader.getPage(pageNumber);
      this.renderer.loadPageTexture(page);

      // Load previous page for two-page view if needed
      if (pageNumber > 1 && this.orientation === 'landscape') {
        const prevPage = await this.PustakaLoader.getPage(pageNumber - 1);
        this.renderer.loadPageTexture(prevPage, true);
      }

      this.emit('pageLoaded', { pageNumber, page });

      if (pageNumber !== this.currentPage) {
        this.currentPage = pageNumber;
        this.emit('pageChanged', { currentPage: this.currentPage });
      }
    } catch (error) {
      this.emit('error', {
        message: `Failed to load page ${pageNumber}`,
        error: error as Error,
      });
    }
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (!this.isReady) {
      throw new Error('PDF Book Core not ready');
    }

    await this.loadPage(pageNumber);
  }

  async nextPage(): Promise<void> {
    if (this.currentPage < this.totalPages) {
      await this.goToPage(this.currentPage + 1);
    }
  }

  async previousPage(): Promise<void> {
    if (this.currentPage > 1) {
      await this.goToPage(this.currentPage - 1);
    }
  }

  private startRenderLoop(): void {
    const render = (_: number) => {
      const startTime = performance.now();

      this.renderer.render(this.currentPage);

      const frameTime = performance.now() - startTime;
      this.emit('renderComplete', { frameTime });

      this.animationFrame = requestAnimationFrame(render);
    };

    this.animationFrame = requestAnimationFrame(render);
  }

  private stopRenderLoop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  resize(width: number, height: number): void {
    this.checkOrientation();
    this.renderer.resize(width, height);
  }

  // Getters
  getCurrentPage(): number {
    return this.currentPage;
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  isReady(): boolean {
    return this._isReady;
  }

  dispose(): void {
    this.stopRenderLoop();
    this.renderer.dispose();
    this.PustakaLoader.dispose();
    this.removeAllListeners();
    this._isReady = false;
    this.PustakaInteraction.dispose();
  }

  startPageTurn(direction: 'forward' | 'backward'): void {
    if (!this.isReady()) return;

    const fromPage = this.currentPage;
    let toPage =
      direction === 'forward' ? this.currentPage + 1 : this.currentPage - 1;

    // Validate page range
    if (toPage < 1 || toPage > this.totalPages) return;

    // Start animation
    this.renderer.startFlip(direction, fromPage, toPage);

    // Preload the target page
    this.loadPage(toPage).catch(() => {
      // Handle error if page fails to load
    });
  }

  private updatePageTurnProgress(progress: number): void {
    this.renderer.updateFlipProgress(progress);
  }

  private completePageTurn(): void {
    const direction = this.renderer.getFlipDirection();

    if (direction === 'forward' && this.currentPage < this.totalPages) {
      this.currentPage++;
      this.emit('pageChanged', { currentPage: this.currentPage });
    } else if (direction === 'backward' && this.currentPage > 1) {
      this.currentPage--;
      this.emit('pageChanged', { currentPage: this.currentPage });
    }

    this.renderer.completeFlip();
  }

  private cancelPageTurn(): void {
    this.renderer.cancelFlip(this.currentPage);
  }
}
