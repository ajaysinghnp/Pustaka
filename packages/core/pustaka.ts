import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry.js';

const blob = new Blob([workerSrc], { type: 'application/javascript' });
const blobUrl = URL.createObjectURL(blob);
pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;

export interface PustakaOptions {
  container: HTMLElement;
  pdfUrl: string;
}

export class Pustaka {
  container: HTMLElement;
  pdfUrl: string;

  constructor(options: PustakaOptions) {
    this.container = options.container;
    this.pdfUrl = options.pdfUrl;
  }

  async init() {
    const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    this.container.appendChild(canvas);
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
  }
}
