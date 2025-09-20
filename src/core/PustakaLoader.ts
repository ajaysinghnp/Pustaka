import type { FileFetcher, pustakaPage } from '../types';

// Interface for PDF.js compatibility
interface PdfJsDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
}

interface PdfJsPage {
  getViewport(params: { scale: number }): { width: number; height: number };
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: any }): {
    promise: Promise<void>;
  };
}

interface PdfJsStatic {
  getDocument(src: string | ArrayBuffer | Uint8Array): {
    promise: Promise<PdfJsDocument>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

export class PustakaLoader {
  private pdfjs: PdfJsStatic | null = null;
  private document: PdfJsDocument | null = null;
  private fileFetcher?: FileFetcher;
  private loadedPages: Map<number, pustakaPage> = new Map();

  constructor(fileFetcher?: FileFetcher) {
    this.fileFetcher = fileFetcher;
  }

  async initialize(): Promise<void> {
    try {
      // Try to load PDF.js dynamically
      this.pdfjs = await this.loadPdfJs();
    } catch (error) {
      throw new Error(
        'PDF.js is required but not available. Please install pdfjs-dist as a peer dependency.',
      );
    }
  }

  private async loadPdfJs(): Promise<PdfJsStatic> {
    // This will be provided by the platform wrapper or throw if not available
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }

    // For Node.js environments or dynamic imports
    try {
      const pdfjsLib = await import('pdfjs-dist');
      return pdfjsLib as any;
    } catch (error) {
      throw new Error('PDF.js not found');
    }
  }

  async loadDocument(
    source: string | ArrayBuffer | Uint8Array,
  ): Promise<number> {
    if (!this.pdfjs) {
      throw new Error('PDF.js not initialized');
    }

    let documentSource: ArrayBuffer | Uint8Array | string = source;

    // If source is a URL and we have a file fetcher, use it
    if (typeof source === 'string' && this.fileFetcher) {
      try {
        documentSource = await this.fileFetcher(source);
      } catch (error) {
        throw new Error(`Failed to fetch PDF: ${error}`);
      }
    }

    try {
      const loadingTask = this.pdfjs.getDocument(documentSource);
      this.document = await loadingTask.promise;
      return this.document.numPages;
    } catch (error) {
      throw new Error(`Failed to load PDF document: ${error}`);
    }
  }

  async getPage(pageNumber: number, scale: number = 1.0): Promise<pustakaPage> {
    if (!this.document) {
      throw new Error('No PDF document loaded');
    }

    // Check cache first
    const cacheKey = pageNumber;
    if (this.loadedPages.has(cacheKey)) {
      return this.loadedPages.get(cacheKey)!;
    }

    try {
      const page = await this.document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: scale * 2 });

      // Create canvas for rendering
      const canvas = this.createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d')!;

      // Render page to canvas
      const renderTask = page.render({
        canvasContext: context as CanvasRenderingContext2D,
        viewport: viewport,
      });
      await renderTask.promise;

      const pustakaPage: pustakaPage = {
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        canvas,
      };

      // Cache the page
      this.loadedPages.set(cacheKey, pustakaPage);
      return pustakaPage;
    } catch (error) {
      throw new Error(`Failed to render page ${pageNumber}: ${error}`);
    }
  }

  private createCanvas(
    width: number,
    height: number,
  ): HTMLCanvasElement | OffscreenCanvas {
    // Use OffscreenCanvas if available (for web workers), otherwise HTMLCanvasElement
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    } else if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    } else {
      throw new Error('Canvas creation not supported in this environment');
    }
  }

  getTotalPages(): number {
    return this.document?.numPages || 0;
  }

  dispose(): void {
    this.loadedPages.clear();
    this.document = null;
  }
}
