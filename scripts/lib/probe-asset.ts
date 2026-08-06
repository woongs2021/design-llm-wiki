import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { GifReader } from "omggif";
import { PNG } from "pngjs";
import {
  MOTION_EXTENSIONS,
  STILL_EXTENSIONS,
} from "../../src/shared/vocabulary.ts";

export type AssetKind = "still" | "motion";

export type ProbedAsset = {
  format: "png" | "jpeg" | "webp" | "gif" | "mp4" | "webm";
  kind: AssetKind;
  width: number;
  height: number;
  bytes: number;
  hash: string;
  frameCount: number | null;
  durationSec: number | null;
};

export type PosterResult = {
  posterBytes: Buffer;
  extension: ".png";
};

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function readUInt16BE(buf: Buffer, offset: number): number {
  return buf.readUInt16BE(offset);
}

function readUInt16LE(buf: Buffer, offset: number): number {
  return buf.readUInt16LE(offset);
}

function probePng(buf: Buffer): Pick<ProbedAsset, "width" | "height" | "format"> {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Invalid PNG");
  }
  return {
    format: "png",
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function probeJpeg(buf: Buffer): Pick<ProbedAsset, "width" | "height" | "format"> {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("Invalid JPEG");
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) throw new Error("Invalid JPEG marker");
    const marker = buf[offset + 1]!;
    const size = readUInt16BE(buf, offset + 2);
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3
    ) {
      return {
        format: "jpeg",
        height: readUInt16BE(buf, offset + 5),
        width: readUInt16BE(buf, offset + 7),
      };
    }
    offset += 2 + size;
  }
  throw new Error("JPEG dimensions not found");
}

function probeWebp(buf: Buffer): Pick<ProbedAsset, "width" | "height" | "format"> {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("Invalid WebP");
  }
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      format: "webp",
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8 ") {
    return {
      format: "webp",
      width: readUInt16LE(buf, 26) & 0x3fff,
      height: readUInt16LE(buf, 28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return {
      format: "webp",
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  throw new Error(`Unsupported WebP chunk ${chunk}`);
}

function sumGifDelayCentiseconds(buf: Buffer): number {
  let offset = 13;
  if (buf.length < 13 || buf.toString("ascii", 0, 3) !== "GIF") return 0;
  const packed = buf[10]!;
  if (packed & 0x80) offset += 3 * 2 ** ((packed & 0x07) + 1);

  let delayCentiseconds = 0;
  while (offset < buf.length) {
    const b = buf[offset]!;
    if (b === 0x3b) break;
    if (b === 0x21) {
      const label = buf[offset + 1]!;
      offset += 2;
      if (label === 0xf9 && buf[offset] === 4) {
        delayCentiseconds += readUInt16LE(buf, offset + 2);
        offset += 5;
        if (buf[offset] === 0) offset += 1;
        continue;
      }
      offset += 1;
      while (offset < buf.length) {
        const blockSize = buf[offset]!;
        offset += 1;
        if (blockSize === 0) break;
        offset += blockSize;
      }
      continue;
    }
    if (b === 0x2c) {
      offset += 10;
      const ipacked = buf[offset - 1]!;
      if (ipacked & 0x80) offset += 3 * 2 ** ((ipacked & 0x07) + 1);
      offset += 1;
      while (offset < buf.length) {
        const blockSize = buf[offset]!;
        offset += 1;
        if (blockSize === 0) break;
        offset += blockSize;
      }
      continue;
    }
    // Tolerant skip for compact/malformed filler bytes in minimal GIFs
    offset += 1;
  }
  return delayCentiseconds;
}

function probeGif(
  buf: Buffer,
): Pick<ProbedAsset, "width" | "height" | "format" | "frameCount" | "durationSec"> {
  const reader = new GifReader(buf);
  const frameCount = reader.numFrames();
  const delayCentiseconds = sumGifDelayCentiseconds(buf);
  return {
    format: "gif",
    width: reader.width,
    height: reader.height,
    frameCount,
    durationSec: frameCount <= 1 ? 0 : delayCentiseconds / 100,
  };
}

function which(bin: string): string | null {
  try {
    const out = execFileSync("which", [bin], { encoding: "utf8" }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function probeWithFfprobe(
  filePath: string,
): Pick<ProbedAsset, "width" | "height" | "format" | "frameCount" | "durationSec"> {
  const ffprobe = which("ffprobe");
  if (!ffprobe) {
    throw new Error("ffprobe not found — required for mp4/webm probing");
  }
  const raw = execFileSync(
    ffprobe,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,nb_frames,duration,codec_name",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      filePath,
    ],
    { encoding: "utf8" },
  );
  const json = JSON.parse(raw) as {
    streams?: Array<{
      width?: number;
      height?: number;
      nb_frames?: string;
      duration?: string;
      codec_name?: string;
    }>;
    format?: { duration?: string };
  };
  const stream = json.streams?.[0];
  if (!stream?.width || !stream?.height) {
    throw new Error("ffprobe did not return video dimensions");
  }
  const duration =
    Number(stream.duration ?? json.format?.duration ?? "NaN") || null;
  const frames = stream.nb_frames ? Number(stream.nb_frames) : null;
  const codec = stream.codec_name ?? "";
  const format = filePath.toLowerCase().endsWith(".webm") ? "webm" : "mp4";
  if (!["h264", "vp8", "vp9", "av1", "mpeg4", "hevc"].some((c) => codec.includes(c)) && codec) {
    // format is still taken from extension; codec is informational only
  }
  return {
    format,
    width: stream.width,
    height: stream.height,
    frameCount: Number.isFinite(frames) ? frames : null,
    durationSec: duration,
  };
}

export function probeAssetFile(filePath: string): ProbedAsset {
  const buf = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const bytes = buf.byteLength;
  const hash = sha256(buf);

  if (ext === ".png") {
    const meta = probePng(buf);
    return {
      ...meta,
      kind: "still",
      bytes,
      hash,
      frameCount: null,
      durationSec: null,
    };
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    const meta = probeJpeg(buf);
    return {
      ...meta,
      kind: "still",
      bytes,
      hash,
      frameCount: null,
      durationSec: null,
    };
  }
  if (ext === ".webp") {
    const meta = probeWebp(buf);
    return {
      ...meta,
      kind: "still",
      bytes,
      hash,
      frameCount: null,
      durationSec: null,
    };
  }
  if (ext === ".gif") {
    const meta = probeGif(buf);
    return {
      format: meta.format,
      kind: "motion",
      width: meta.width,
      height: meta.height,
      bytes,
      hash,
      frameCount: meta.frameCount,
      durationSec: meta.durationSec,
    };
  }
  if (ext === ".mp4" || ext === ".webm") {
    const meta = probeWithFfprobe(filePath);
    return {
      ...meta,
      kind: "motion",
      bytes,
      hash,
    };
  }

  if (STILL_EXTENSIONS.has(ext) || MOTION_EXTENSIONS.has(ext)) {
    throw new Error(`Unhandled asset extension ${ext}`);
  }
  throw new Error(`Unsupported asset extension ${ext}`);
}

export function extractPoster(filePath: string, probed: ProbedAsset): PosterResult {
  if (probed.kind !== "motion") {
    throw new Error("Poster extraction is only for motion assets");
  }

  if (probed.format === "gif") {
    const buf = readFileSync(filePath);
    const reader = new GifReader(buf);
    const pixels = new Uint8Array(reader.width * reader.height * 4);
    reader.decodeAndBlitFrameRGBA(0, pixels);
    const png = new PNG({ width: reader.width, height: reader.height });
    png.data = Buffer.from(pixels);
    return { posterBytes: PNG.sync.write(png), extension: ".png" };
  }

  const ffmpeg = which("ffmpeg");
  if (!ffmpeg) {
    throw new Error("ffmpeg not found — required for mp4/webm poster extraction");
  }
  const outPath = join(tmpdir(), `design-llm-wiki-poster-${process.pid}.png`);
  try {
    execFileSync(
      ffmpeg,
      ["-y", "-i", filePath, "-frames:v", "1", outPath],
      { stdio: "pipe" },
    );
    return { posterBytes: readFileSync(outPath), extension: ".png" };
  } finally {
    try {
      unlinkSync(outPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
