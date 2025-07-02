/* eslint-env browser */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PustakaOptions {
  container: HTMLElement;
  pdfUrl: string;
}

export class Pustaka {
  private container: HTMLElement;
  private pdfUrl: string;
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private currentPage = 1;
  private totalPages = 0;

  constructor(options: PustakaOptions) {
    this.container = options.container;
    this.pdfUrl = options.pdfUrl;
  }

  public async init() {
    this.pdfDoc = await pdfjsLib.getDocument(this.pdfUrl).promise;
    this.totalPages = this.pdfDoc.numPages;
    this.render();
  }

  private async render() {
    if (!this.pdfDoc) return;

    // Clear container
    this.container.innerHTML = '';

    const leftPageNum = this.currentPage;
    const rightPageNum = this.currentPage + 1;

    const leftCanvas = await this.renderPage(leftPageNum);
    const rightCanvas =
      rightPageNum <= this.totalPages
        ? await this.renderPage(rightPageNum)
        : null;

    const bookWrapper = document.createElement('div');
    bookWrapper.className = 'pustaka-book';

    leftCanvas.classList.add('pustaka-page', 'left');
    bookWrapper.appendChild(leftCanvas);

    if (rightCanvas) {
      rightCanvas.classList.add('pustaka-page', 'right');
      bookWrapper.appendChild(rightCanvas);
    }

    this.container.appendChild(bookWrapper);

    // Example: click anywhere to go next
    bookWrapper.addEventListener('click', () => this.next());
  }

  private async renderPage(pageNum: number): Promise<HTMLCanvasElement> {
    if (!this.pdfDoc) throw new Error('PDF not loaded');

    const page = await this.pdfDoc.getPage(pageNum);

    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    return canvas;
  }

  public next() {
    if (this.currentPage + 2 <= this.totalPages) {
      this.currentPage += 2;
      this.render();
    }
  }

  public prev() {
    if (this.currentPage - 2 >= 1) {
      this.currentPage -= 2;
      this.render();
    }
  }
}
