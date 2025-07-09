import * as PDFJS from 'pdfjs-dist';

export class Pustaka {
  private container: HTMLElement;
  private pdfDoc: any;
  private currentPage = 1;
  private pageWidth: number = 800;
  private pageHeight: number = 600;

  constructor(container: HTMLElement) {
    this.container = container;
    PDFJS.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  }

  async loadPDF(url: string): Promise<void> {
    this.pdfDoc = await PDFJS.getDocument(url).promise;
    this.renderPage(this.currentPage);
  }

  private async renderPage(pageNum: number) {
    const page = await this.pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    this.container.innerHTML = '';
    this.container.appendChild(canvas);
  }

  nextPage() {
    if (this.currentPage < this.pdfDoc.numPages) {
      this.currentPage++;
      this.renderPage(this.currentPage);
      this.applyPageTurnEffect('right');
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage(this.currentPage);
      this.applyPageTurnEffect('left');
    }
  }

  private applyPageTurnEffect(direction: 'left' | 'right') {
    // Placeholder for flip animation
    this.container.style.transition = 'transform 0.6s';
    this.container.style.transform = `perspective(1000px) rotateY(${direction === 'right' ? -10 : 10}deg)`;

    // eslint-disable-next-line no-undef
    setTimeout(() => {
      this.container.style.transform = 'perspective(1000px) rotateY(0deg)';
    }, 600);
  }
}
