// src/core/PustakaInteraction.ts
import { EventEmitter } from './EventEmitter';

export interface PustakaInteractionEvents {
  startFlip: { direction: 'forward' | 'backward' };
  updateFlip: { progress: number };
  completeFlip: { direction: 'forward' | 'backward' };
  cancelFlip: void;
}

export class PustakaInteraction extends EventEmitter<PustakaInteractionEvents> {
  private canvas: HTMLCanvasElement;
  private isInteracting: boolean = false;
  private startX: number = 0;
  private currentX: number = 0;
  private flipDirection: 'forward' | 'backward' | null = null;
  private flipProgress: number = 0;
  private readonly flipThreshold: number = 0.3; // 30% progress needed to complete flip

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);

    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
    this.canvas.addEventListener('touchmove', this.handleTouchMove);
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

    // Prevent default touch actions to avoid browser interference
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      },
      { passive: false },
    );
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.startInteraction(e.clientX, e.clientY);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    this.updateInteraction(e.clientX);
  };

  private handleMouseUp = (): void => {
    this.endInteraction();
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.startInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.updateInteraction(e.touches[0].clientX);
    }
  };

  private handleTouchEnd = (): void => {
    this.endInteraction();
  };

  private startInteraction(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Only start interaction if within canvas bounds
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return;
    }

    this.isInteracting = true;
    this.startX = clientX;
    this.currentX = clientX;

    // Determine flip direction based on which side of the canvas was clicked
    const isRightSide = x > rect.width / 2;
    this.flipDirection = isRightSide ? 'forward' : 'backward';

    this.emit('startFlip', { direction: this.flipDirection });
  }

  private updateInteraction(clientX: number): void {
    if (!this.isInteracting || this.flipDirection === null) return;

    this.currentX = clientX;
    const deltaX = this.currentX - this.startX;
    const rect = this.canvas.getBoundingClientRect();

    // Calculate progress based on drag distance
    // For forward flip, drag left (negative delta)
    // For backward flip, drag right (positive delta)
    let progress = 0;

    if (this.flipDirection === 'forward') {
      progress = Math.max(0, Math.min(1, -deltaX / (rect.width * 0.5)));
    } else {
      progress = Math.max(0, Math.min(1, deltaX / (rect.width * 0.5)));
    }

    this.flipProgress = progress;
    this.emit('updateFlip', { progress });
  }

  private endInteraction(): void {
    if (!this.isInteracting || this.flipDirection === null) return;

    // Complete or cancel the flip based on progress threshold
    if (this.flipProgress > this.flipThreshold) {
      this.emit('completeFlip', { direction: this.flipDirection });
    } else {
      this.emit('cancelFlip', undefined);
    }

    // Reset interaction state
    this.isInteracting = false;
    this.flipDirection = null;
    this.flipProgress = 0;
  }

  // Method to programmatically trigger a page turn
  triggerPageTurn(direction: 'forward' | 'backward'): void {
    this.emit('startFlip', { direction });

    // Simulate a quick flip animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        clearInterval(interval);
        this.emit('completeFlip', { direction });
      } else {
        this.emit('updateFlip', { progress });
      }
    }, 16); // ~60fps
  }

  // Clean up method to remove event listeners
  dispose(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);

    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);

    this.removeAllListeners();
  }
}
