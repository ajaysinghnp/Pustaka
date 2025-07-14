// core/pustaka.ts
import * as PDFJS from 'pdfjs-dist';
import { IPustaka } from './pustaka.interface';

declare const console: Console;

export class Pustaka implements IPustaka {
  private container: HTMLElement;
  private pdfDoc: PDFJS.PDFDocumentProxy | null = null;
  private currentPageNum = 1;
  private pageCanvas: HTMLCanvasElement | null = null;
  private nextCanvas: HTMLCanvasElement | null = null;
  private bookContainer!: HTMLDivElement;
  private bookSpine!: HTMLDivElement;
  private bookPages!: HTMLDivElement;
  private isBookOpen = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.classList.add('pustaka-container');
    this.initBookStructure();
    this.initWorker();
  }

  private initBookStructure(): void {
    // Create book container
    this.bookContainer = document.createElement('div');
    this.bookContainer.classList.add('pustaka-cover');

    // Create book spine
    this.bookSpine = document.createElement('div');
    this.bookSpine.classList.add('pustaka-spine');

    // Create pages container
    this.bookPages = document.createElement('div');
    this.bookPages.classList.add('pustaka-pages');

    // Assemble book structure
    this.bookContainer.appendChild(this.bookPages);
    this.bookContainer.appendChild(this.bookSpine);
    this.container.appendChild(this.bookContainer);

    // Apply initial closed state styling
    this.applyClosedBookState();
  }

  private applyClosedBookState(): void {
    this.bookContainer.style.transform = 'perspective(1200px) rotateY(25deg)';
    this.bookContainer.style.boxShadow = '15px 15px 30px rgba(0,0,0,0.5)';
    this.bookSpine.style.display = 'block';
    this.isBookOpen = false;
  }

  private applyOpenBookState(): void {
    this.bookContainer.style.transform = 'perspective(1200px) rotateY(0deg)';
    this.bookContainer.style.boxShadow = '5px 5px 30px rgba(0,0,0,0.3)';
    this.bookSpine.style.display = 'none';
    this.isBookOpen = true;
  }

  // Public properties with getters
  get currentPage(): number {
    return this.currentPageNum;
  }

  get totalPages(): number {
    return this.pdfDoc?.numPages || 0;
  }

  private initWorker(): void {
    PDFJS.GlobalWorkerOptions.workerSrc =
      typeof document !== 'undefined'
        ? new URL('./workers/pdf.worker.min.js', import.meta.url).toString()
        : // eslint-disable-next-line no-undef
          require.resolve('pdfjs-dist/build/pdf.worker.min.js');
  }

  private async progressHandler(progress: {
    loaded: number;
    total: number;
  }): Promise<void> {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`Loading: ${percent}%`);
  }

  async loadPDF(url: string): Promise<void> {
    try {
      // Type-safe loading task
      const loadingTask: {
        promise: Promise<PDFJS.PDFDocumentProxy>;
        // eslint-disable-next-line no-unused-vars
        onProgress?: (progress: { loaded: number; total: number }) => void;
      } = PDFJS.getDocument(url);

      // Add progress handler if needed
      loadingTask.onProgress = this.progressHandler;

      this.pdfDoc = await loadingTask.promise;
      await this.preparePages();
      this.renderCurrentPage();
    } catch (error) {
      console.error('Failed to load PDF:', error);
      throw new Error('PDF loading failed');
    }
  }

  private async preparePages(): Promise<void> {
    if (!this.pdfDoc) return;

    this.pageCanvas = await this.createPageCanvas(this.currentPageNum);

    if (
      this.currentPageNum < this.pdfDoc.numPages &&
      this.currentPageNum >= 1
    ) {
      this.nextCanvas = await this.createPageCanvas(this.currentPageNum + 1);
    }
  }

  private async createPageCanvas(pageNum: number): Promise<HTMLCanvasElement> {
    if (!this.pdfDoc) {
      throw new Error('PDF document not loaded');
    }

    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.className = `pustaka-page-canvas page-${pageNum}`;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D,
      viewport: viewport,
    }).promise;

    return canvas;
  }

  private renderCurrentPage(): void {
    if (!this.pageCanvas) return;

    // Clear previous content
    this.bookPages.innerHTML = '';

    // Create page container
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pustaka-page';

    // Add page edges
    const leftEdge = document.createElement('div');
    leftEdge.className = 'pustaka-page-edge left';
    pageContainer.appendChild(leftEdge);

    // Add the canvas
    pageContainer.appendChild(this.pageCanvas);

    // Add page center line (book binding)
    const centerLine = document.createElement('div');
    centerLine.className = 'pustaka-center-line';
    pageContainer.appendChild(centerLine);

    // Add right edge
    const rightEdge = document.createElement('div');
    rightEdge.className = 'pustaka-page-edge right';
    pageContainer.appendChild(rightEdge);

    // Add to book
    this.bookPages.appendChild(pageContainer);
  }

  async nextPage(): Promise<void> {
    if (!this.pdfDoc || this.currentPageNum >= this.pdfDoc.numPages) return;

    if (!this.isBookOpen) {
      this.applyOpenBookState();
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    await this.applyPageTurnAnimation('right');
    this.currentPageNum++;
    this.pageCanvas = this.nextCanvas;

    if (this.currentPageNum < this.pdfDoc.numPages) {
      this.nextCanvas = await this.createPageCanvas(this.currentPageNum + 1);
    } else {
      this.nextCanvas = null;
    }

    this.renderCurrentPage();
  }

  async prevPage(): Promise<void> {
    if (!this.pdfDoc || this.currentPageNum <= 1) return;

    if (!this.isBookOpen) {
      this.applyOpenBookState();
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    await this.applyPageTurnAnimation('left');
    this.currentPageNum--;
    this.nextCanvas = this.pageCanvas;
    this.pageCanvas = await this.createPageCanvas(this.currentPageNum);

    this.renderCurrentPage();
  }

  private applyPageTurnAnimation(direction: 'left' | 'right'): Promise<void> {
    return new Promise((resolve) => {
      const pages = this.bookPages.querySelector(
        '.pustaka-page',
      ) as HTMLElement;
      if (!pages) return resolve();

      pages.style.transition = 'transform 0.8s ease';
      pages.style.transform = `perspective(1500px) rotateY(${direction === 'right' ? -180 : 180}deg)`;

      window.setTimeout(() => {
        pages.style.transition = 'none';
        pages.style.transform = 'perspective(1500px) rotateY(0deg)';
        resolve();
      }, 800);
    });
  }
}
