export interface PdfBookConfig {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  pdfSource?: string | ArrayBuffer | Uint8Array;
  fileFetcher?: FileFetcher;
  pageSpacing?: number;
  enableWebGL?: boolean;
}

export interface FileFetcher {
  (url: string): Promise<ArrayBuffer>;
}

export interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  texture?: WebGLTexture | null;
}

export interface WebGLContextWrapper {
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  program: WebGLProgram;
  buffers: {
    position: WebGLBuffer;
    textureCoord: WebGLBuffer;
    indices: WebGLBuffer;
  };
  uniforms: {
    uSampler: WebGLUniformLocation;
    uModelViewMatrix: WebGLUniformLocation;
    uProjectionMatrix: WebGLUniformLocation;
  };
  attributes: {
    aVertexPosition: number;
    aTextureCoord: number;
  };
}

export interface WebGLRendererMethods {
  loadPageTexture(page: PdfPage): void;
  render(): void;
  dispose(): void;
  resize(width: number, height: number): void;
  setOrientation(orientation: "landscape" | "portrait"): void;
  startFlip(
    direction: "forward" | "backward",
    fromPage: number,
    toPage: number
  ): void;
  updateFlipProgress(progress: number): void;
  completeFlip(): void;
  getFlipDirection(): "forward" | "backward" | null;
  isFlipping(): boolean;
  cancelFlip(): void;
  getFlipProgress(): number;
}

export type PdfBookEvents = {
  ready: { totalPages: number };
  error: { message: string; error: Error };
  pageChanged: { currentPage: number };
  pageLoaded: { pageNumber: number; page: PdfPage };
  renderComplete: { frameTime: number };
  orientationChanged: { orientation: "landscape" | "portrait" };
};
