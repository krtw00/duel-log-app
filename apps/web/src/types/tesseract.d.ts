declare module 'tesseract.js' {
  export interface TesseractWorker {
    setParameters(params: Record<string, string>): Promise<unknown>;
    recognize(image: ImageData | string): Promise<{ data: { text: string } }>;
    terminate(): Promise<unknown>;
  }
  export function createWorker(lang: string): Promise<TesseractWorker>;
}
