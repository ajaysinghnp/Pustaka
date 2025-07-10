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

  constructor(container: HTMLElement) {
    this.container = container;
    this.initWorker();
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

    if (this.currentPageNum < this.pdfDoc.numPages) {
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
    canvas.className = `page-${pageNum}`;
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

    this.container.innerHTML = '';
    this.container.appendChild(this.pageCanvas);
    this.container.style.boxShadow = '5px 5px 15px rgba(0,0,0,0.3)';
  }

  async nextPage(): Promise<void> {
    if (!this.pdfDoc || this.currentPageNum >= this.pdfDoc.numPages) return;

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

    await this.applyPageTurnAnimation('left');
    this.currentPageNum--;
    this.nextCanvas = this.pageCanvas;
    this.pageCanvas = await this.createPageCanvas(this.currentPageNum);

    this.renderCurrentPage();
  }

  private applyPageTurnAnimation(direction: 'left' | 'right'): Promise<void> {
    return new Promise((resolve) => {
      this.container.style.transition = 'transform 0.8s ease';
      this.container.style.transform = `perspective(1500px) rotateY(${direction === 'right' ? -180 : 180}deg)`;

      // eslint-disable-next-line no-undef
      setTimeout(() => {
        this.container.style.transition = 'none';
        this.container.style.transform = 'perspective(1500px) rotateY(0deg)';
        resolve();
      }, 800);
    });
  }
}
