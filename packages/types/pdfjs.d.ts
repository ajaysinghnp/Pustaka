// types/pdfjs.d.ts
declare module 'pdfjs-dist' {
  // Add missing GlobalWorkerOptions declaration
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  // eslint-disable-next-line no-unused-vars
  export function getDocument(source: string | { url: string }): {
    promise: Promise<PDFDocumentProxy>;
    // Add other properties if needed
    // eslint-disable-next-line no-unused-vars
    onProgress?: (progress: { loaded: number; total: number }) => void;
    // eslint-disable-next-line no-unused-vars
    onPassword?: (callback: (password: string) => void) => void;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    // eslint-disable-next-line no-unused-vars
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): void;
  }

  export interface PDFPageProxy {
    // eslint-disable-next-line no-unused-vars
    getViewport(options: { scale: number }): PDFPageViewport;
    // eslint-disable-next-line no-unused-vars
    render(options: PDFRenderOptions): PDFRenderTask;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
  }

  export interface PDFRenderOptions {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewport;
  }

  export interface PDFRenderTask {
    promise: Promise<void>;
  }
}
