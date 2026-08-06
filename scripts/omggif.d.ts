declare module "omggif" {
  export class GifReader {
    constructor(buffer: Buffer | Uint8Array);
    width: number;
    height: number;
    numFrames(): number;
    decodeAndBlitFrameRGBA(frameIndex: number, pixels: Uint8Array): void;
  }

  export class GifWriter {
    constructor(
      buffer: Buffer | Uint8Array,
      width: number,
      height: number,
      options?: { palette?: number[]; loop?: number },
    );
    addFrame(
      x: number,
      y: number,
      width: number,
      height: number,
      indexedPixels: Buffer | Uint8Array,
      options?: { palette?: number[]; delay?: number },
    ): number;
    end(): number;
  }
}
