import type { WebGLContextWrapper, pustakaPage } from '../types';
import {
  createShader,
  createProgram,
  createBuffer,
  createTexture,
} from '../utils/webgl.utils';

const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying highp vec2 vTextureCoord;
  
  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

const fragmentShaderSource = `
  varying highp vec2 vTextureCoord;
  
  uniform sampler2D uSampler;
  
  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
`;

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const A4_ASPECT = A4_WIDTH / A4_HEIGHT; // ≈ 0.707

export class WebGLRenderer {
  private context: WebGLContextWrapper;
  private currentTexture: WebGLTexture | null = null;
  private previousTexture: WebGLTexture | null = null;
  private orientation: 'landscape' | 'portrait' = 'landscape';
  private projectionMatrix: Float32Array = new Float32Array(16);
  private currentPageAspect: number = A4_ASPECT; // Add this
  private previousPageAspect: number = A4_ASPECT; // Add this

  private flippingPage: {
    isFlipping: boolean;
    progress: number; // 0 to 1
    direction: 'forward' | 'backward';
    fromPage: number;
    toPage: number;
  } = {
    isFlipping: false,
    progress: 0,
    direction: 'forward',
    fromPage: 0,
    toPage: 0,
  };

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.context = this.initializeWebGL(canvas);
    this.projectionMatrix = this.createProjectionMatrix(); // Initialize
  }
  private initializeWebGL(
    canvas: HTMLCanvasElement | OffscreenCanvas,
  ): WebGLContextWrapper {
    // Handle context creation differently based on canvas type
    let gl: WebGLRenderingContext | null = null;

    if (canvas instanceof HTMLCanvasElement) {
      // For HTMLCanvasElement, try both standard and experimental contexts
      gl =
        (canvas.getContext('webgl') as WebGLRenderingContext) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    } else {
      // For OffscreenCanvas, only try standard context
      gl = canvas.getContext('webgl') as WebGLRenderingContext;
    }
    if (!gl) {
      throw new Error('WebGL not supported');
    }

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Clean up shaders (they're now part of the program)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // Define quad geometry
    const positions = new Float32Array([
      -1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
    ]);

    const textureCoords = new Float32Array([
      0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0,
    ]);

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    // Create buffers
    const positionBuffer = createBuffer(gl, positions);
    const texCoordBuffer = createBuffer(gl, textureCoords);
    const indexBuffer = createBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);

    // Get attribute and uniform locations
    const aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
    const aTextureCoord = gl.getAttribLocation(program, 'aTextureCoord');

    const uSampler = gl.getUniformLocation(program, 'uSampler');
    const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(
      program,
      'uProjectionMatrix',
    );

    if (!uSampler || !uModelViewMatrix || !uProjectionMatrix) {
      throw new Error('Failed to get uniform locations');
    }

    return {
      gl,
      canvas,
      program,
      buffers: {
        position: positionBuffer,
        textureCoord: texCoordBuffer,
        indices: indexBuffer,
      },
      uniforms: {
        uSampler,
        uModelViewMatrix,
        uProjectionMatrix,
      },
      attributes: {
        aVertexPosition,
        aTextureCoord,
      },
    };
  }

  setOrientation(orientation: 'landscape' | 'portrait'): void {
    // Store the current orientation
    this.orientation = orientation;

    // Recalculate the projection matrix based on orientation
    this.createProjectionMatrix();

    // You might also need to adjust other rendering parameters
    // based on the orientation (like page layout, etc.)
  }

  loadPageTexture(page: pustakaPage, isPrevious: boolean = false): void {
    const { gl } = this.context;
    const aspect = page.width / page.height;

    if (isPrevious) {
      if (this.previousTexture) {
        gl.deleteTexture(this.previousTexture);
      }
      this.previousTexture = createTexture(gl, page.canvas);
      this.previousPageAspect = aspect; // Set the aspect ratio
      page.texture = this.previousTexture;
    } else {
      if (this.currentTexture) {
        // Move current to previous before loading new current
        if (this.previousTexture) {
          gl.deleteTexture(this.previousTexture);
        }
        this.previousTexture = this.currentTexture;
        this.previousPageAspect = this.currentPageAspect; // Move aspect too
      }
      this.currentTexture = createTexture(gl, page.canvas);
      this.currentPageAspect = aspect; // Set the aspect ratio
      page.texture = this.currentTexture;
    }
  }

  startFlip(
    direction: 'forward' | 'backward',
    fromPage: number,
    toPage: number,
  ): void {
    this.flippingPage = {
      isFlipping: true,
      progress: 0,
      direction,
      fromPage,
      toPage,
    };
  }

  updateFlipProgress(progress: number): void {
    if (this.flippingPage.isFlipping) {
      this.flippingPage.progress = Math.max(0, Math.min(1, progress));
    }
  }

  getFlipProgress(): number {
    return this.flippingPage.progress;
  }

  completeFlip(): void {
    if (this.flippingPage.isFlipping) {
      this.flippingPage.isFlipping = false;
      this.flippingPage.progress = 1;
    }
  }

  cancelFlip(currentPage: number): void {
    if (this.flippingPage.isFlipping) {
      // Reset the flipping state without completing the page turn
      this.flippingPage = {
        isFlipping: false,
        progress: 0,
        direction: 'forward',
        fromPage: 0,
        toPage: 0,
      };

      // Trigger a render to show the original page
      this.render(currentPage);
    }
  }

  isFlipping(): boolean {
    return this.flippingPage.isFlipping;
  }

  getFlipDirection(): 'forward' | 'backward' | null {
    if (!this.flippingPage.isFlipping) {
      return null;
    }
    return this.flippingPage.direction;
  }

  render(currentPage: number): void {
    const { gl, program, uniforms } = this.context;

    // Set viewport and clear
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use shader program
    gl.useProgram(program);

    // Set projection matrix
    gl.uniformMatrix4fv(
      uniforms.uProjectionMatrix,
      false,
      this.projectionMatrix,
    );

    if (this.flippingPage.isFlipping) {
      this.renderFlippingPage(currentPage);
    } else {
      this.renderStaticPages(currentPage);
    }
  }

  private createProjectionMatrix(): Float32Array {
    const canvas = this.context.canvas;
    const canvasAspect = canvas.width / canvas.height;

    if (this.orientation === 'landscape') {
      // For two-page spread
      const spreadAspect = 2 * A4_ASPECT;
      const scale = Math.min(1, canvasAspect / spreadAspect);
      return new Float32Array([
        scale / canvasAspect,
        0,
        0,
        0,
        0,
        scale,
        0,
        0,
        0,
        0,
        -1,
        0,
        0,
        0,
        0,
        1,
      ]);
    } else {
      // For single page
      const scale = Math.min(1, canvasAspect / A4_ASPECT);
      return new Float32Array([
        scale / canvasAspect,
        0,
        0,
        0,
        0,
        scale,
        0,
        0,
        0,
        0,
        -1,
        0,
        0,
        0,
        0,
        1,
      ]);
    }
  }

  dispose(): void {
    const { gl } = this.context;

    if (this.currentTexture) {
      gl.deleteTexture(this.currentTexture);
      this.currentTexture = null;
    }

    if (this.previousTexture) {
      gl.deleteTexture(this.previousTexture);
      this.previousTexture = null;
    }

    // Clean up buffers
    gl.deleteBuffer(this.context.buffers.position);
    gl.deleteBuffer(this.context.buffers.textureCoord);
    gl.deleteBuffer(this.context.buffers.indices);

    // Clean up program
    gl.deleteProgram(this.context.program);
  }

  resize(width: number, height: number): void {
    this.context.canvas.width = width;
    this.context.canvas.height = height;
    this.context.gl.viewport(0, 0, width, height);

    // Update projection matrix for new aspect ratio
    this.projectionMatrix = this.createProjectionMatrix();
  }

  // In WebGLRenderer.ts, implement the renderFlippingPage method
  private renderFlippingPage(currentPage: number): void {
    const { gl, program, buffers, uniforms, attributes } = this.context;

    // Clear canvas
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use shader program
    gl.useProgram(program);

    // Set projection matrix
    gl.uniformMatrix4fv(
      uniforms.uProjectionMatrix,
      false,
      this.projectionMatrix,
    );

    // Render the static pages in the background
    this.renderStaticPages(currentPage);

    // Calculate flip angle based on progress (0 to 180 degrees)
    const angle = this.flippingPage.progress * Math.PI;

    // Create transformation matrix for the flipping page
    const flipMatrix = this.createFlipMatrix(angle);

    // Set model-view matrix for the flipping page
    gl.uniformMatrix4fv(uniforms.uModelViewMatrix, false, flipMatrix);

    // Bind and draw the flipping page
    if (this.flippingPage.direction === 'forward' && this.currentTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
    } else if (
      this.flippingPage.direction === 'backward' &&
      this.previousTexture
    ) {
      gl.bindTexture(gl.TEXTURE_2D, this.previousTexture);
    }

    this.bindAndDrawPage(buffers, attributes, uniforms);
  }

  private createFlipMatrix(angle: number): Float32Array {
    // Simple rotation around Y-axis for now
    // This will be enhanced later with curvature and lighting
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Float32Array([
      cos,
      0,
      -sin,
      0,
      0,
      1,
      0,
      0,
      sin,
      0,
      cos,
      0,
      0,
      0,
      0,
      1,
    ]);
  }

  private renderStaticPages(currentPage: number): void {
    if (this.orientation === 'landscape') {
      this.renderTwoPageSpread(currentPage);
    } else {
      this.renderSinglePage();
    }
  }

  private renderSinglePage(): void {
    const { gl, buffers, uniforms, attributes } = this.context;

    if (this.currentTexture) {
      const modelViewMatrix = new Float32Array([
        this.currentPageAspect,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ]);

      gl.uniformMatrix4fv(uniforms.uModelViewMatrix, false, modelViewMatrix);
      gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
      this.bindAndDrawPage(buffers, attributes, uniforms);
    }
  }

  private renderTwoPageSpread(currentPage: number): void {
    const { gl, buffers, uniforms, attributes } = this.context;

    // Use the stored aspect ratios or fallback to A4
    const leftAspect = this.previousPageAspect;
    const rightAspect = this.currentPageAspect;

    // Calculate total width for centering
    const totalWidth = leftAspect + rightAspect;

    // Center position for the entire spread
    const centerX = -totalWidth / 2;

    // console.log('Rendering two-page spread:', {
    //   currentPage,
    //   leftAspect,
    //   rightAspect,
    //   totalWidth,
    //   centerX,
    // });

    // Left page (current page - 1)
    if (currentPage > 1 && this.previousTexture) {
      const leftPageMatrix = new Float32Array([
        leftAspect,
        0,
        0,
        0, // Scale X by page aspect
        0,
        1,
        0,
        0, // Scale Y by 1
        0,
        0,
        1,
        0, // No scale on Z
        centerX + leftAspect / 2,
        0,
        0,
        1, // Position
      ]);

      gl.uniformMatrix4fv(uniforms.uModelViewMatrix, false, leftPageMatrix);
      gl.bindTexture(gl.TEXTURE_2D, this.previousTexture);
      this.bindAndDrawPage(buffers, attributes, uniforms);
    }

    // Right page (current page)
    if (this.currentTexture) {
      const rightPageMatrix = new Float32Array([
        rightAspect,
        0,
        0,
        0, // Scale X by page aspect
        0,
        1,
        0,
        0, // Scale Y by 1
        0,
        0,
        1,
        0, // No scale on Z
        centerX + leftAspect + rightAspect / 2,
        0,
        0,
        1, // Position
      ]);

      gl.uniformMatrix4fv(uniforms.uModelViewMatrix, false, rightPageMatrix);
      gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
      this.bindAndDrawPage(buffers, attributes, uniforms);
    }
  }

  private bindAndDrawPage(
    buffers: WebGLContextWrapper['buffers'],
    attributes: WebGLContextWrapper['attributes'],
    uniforms: WebGLContextWrapper['uniforms'],
  ): void {
    const { gl } = this.context;

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      attributes.aVertexPosition,
      3,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.enableVertexAttribArray(attributes.aVertexPosition);

    // Bind texture coordinate buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(attributes.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributes.aTextureCoord);

    // Bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set texture sampler
    gl.uniform1i(uniforms.uSampler, 0);

    // Draw
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}
