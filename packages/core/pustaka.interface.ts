// core/pustaka.interface.ts
export interface IPustaka {
  // eslint-disable-next-line no-unused-vars
  loadPDF(url: string): Promise<void>;
  nextPage(): Promise<void>;
  prevPage(): Promise<void>;
  readonly currentPage: number;
  readonly totalPages: number;
}
