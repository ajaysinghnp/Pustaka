import * as PDFJS from 'pdfjs-dist';

export class Pustaka {
  private container: HTMLElement;
  private pdfDoc: any;
  private currentPage = 1;
  private pageCanvas: HTMLCanvasElement | null = null;
  private nextCanvas: HTMLCanvasElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initWorker();
  }

  private initWorker() {
    PDFJS.GlobalWorkerOptions.workerSrc =
      typeof document !== 'undefined'
        ? new URL('./workers/pdf.worker.min.js', import.meta.url).toString()
        : // eslint-disable-next-line no-undef
          require.resolve('pdfjs-dist/build/pdf.worker.min.js');
  }

  async loadPDF(url: string): Promise<void> {
    this.pdfDoc = await PDFJS.getDocument(url).promise;
    await this.preparePages();
    this.renderCurrentPage();
  }

  private async preparePages() {
    this.pageCanvas = await this.createPageCanvas(this.currentPage);
    if (this.currentPage < this.pdfDoc.numPages) {
      this.nextCanvas = await this.createPageCanvas(this.currentPage + 1);
    }
  }

  private async createPageCanvas(pageNum: number): Promise<HTMLCanvasElement> {
    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.className = `page-${pageNum}`;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: canvas.getContext('2d'),
      viewport: viewport,
    }).promise;

    return canvas;
  }

  private renderCurrentPage() {
    if (!this.pageCanvas) return;

    this.container.innerHTML = '';
    this.container.appendChild(this.pageCanvas);

    // Add shadow for book-like effect
    this.container.style.boxShadow = '5px 5px 15px rgba(0,0,0,0.3)';
  }

  async nextPage() {
    if (this.currentPage >= this.pdfDoc.numPages) return;

    await this.applyPageTurnAnimation('right');
    this.currentPage++;
    this.pageCanvas = this.nextCanvas;

    if (this.currentPage < this.pdfDoc.numPages) {
      this.nextCanvas = await this.createPageCanvas(this.currentPage + 1);
    } else {
      this.nextCanvas = null;
    }

    this.renderCurrentPage();
  }

  async prevPage() {
    if (this.currentPage <= 1) return;

    await this.applyPageTurnAnimation('left');
    this.currentPage--;
    this.nextCanvas = this.pageCanvas;
    this.pageCanvas = await this.createPageCanvas(this.currentPage);

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
