declare module '@plotdb/upscaler' {
  type UpscalerOptions = Record<string, unknown>;
  class WebUpscaler {
    constructor(options?: UpscalerOptions);
    warmup(): Promise<unknown>;
    upscale(
      input: Blob,
      options?: { format?: string; onProgress?: (p: number) => void },
    ): Promise<Blob>;
    dispose(): void;
  }
  export default WebUpscaler;
}
