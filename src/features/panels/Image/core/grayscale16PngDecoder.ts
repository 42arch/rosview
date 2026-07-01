/**
 * Minimal 16-bit grayscale PNG decoder for ROS `compressedDepth` payloads.
 * Uses the platform `DecompressionStream` API (no extra dependencies).
 */

import { unfilter16BitGrayscaleScanlines } from './png16ScanlineUnfilter';

/** Standard PNG file signature. */
export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Grayscale16PngImage {
  width: number;
  height: number;
  /** Little-endian 16-bit samples, `width * height * 2` bytes. */
  data: Uint8Array;
}

/** Locate the first PNG signature inside a buffer (e.g. after a ROS depth header). */
export function findPngSignatureOffset(data: Uint8Array): number {
  const limit = Math.max(0, data.byteLength - PNG_SIGNATURE.byteLength);
  for (let offset = 0; offset <= limit; offset++) {
    let matched = true;
    for (let i = 0; i < PNG_SIGNATURE.byteLength; i++) {
      if (data[offset + i] !== PNG_SIGNATURE[i]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return offset;
    }
  }
  return -1;
}

function readU32Be(view: DataView, offset: number): number {
  return view.getUint32(offset, false);
}

function concatIdatChunks(png: Uint8Array): Uint8Array {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: Uint8Array[] = [];
  let offset = PNG_SIGNATURE.byteLength;

  while (offset + 8 <= png.byteLength) {
    const length = readU32Be(view, offset);
    const type =
      String.fromCharCode(png[offset + 4], png[offset + 5], png[offset + 6], png[offset + 7]);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > png.byteLength) {
      throw new Error('PNG chunk exceeds buffer bounds');
    }
    if (type === 'IDAT') {
      chunks.push(png.subarray(dataStart, dataEnd));
    }
    if (type === 'IEND') {
      break;
    }
    offset = dataEnd + 4;
  }

  if (chunks.length === 0) {
    throw new Error('PNG is missing IDAT chunks');
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let writeOffset = 0;
  for (const chunk of chunks) {
    out.set(chunk, writeOffset);
    writeOffset += chunk.byteLength;
  }
  return out;
}

async function inflateZlib(zlibData: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not supported in this environment');
  }
  const owned = new Uint8Array(zlibData.byteLength);
  owned.set(zlibData);
  const stream = new Blob([owned.buffer]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseIhdr(png: Uint8Array): { width: number; height: number; bitDepth: number; colorType: number } {
  if (png.byteLength < PNG_SIGNATURE.byteLength + 8 + 13) {
    throw new Error('PNG buffer is too small');
  }
  for (let i = 0; i < PNG_SIGNATURE.byteLength; i++) {
    if (png[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Invalid PNG signature');
    }
  }

  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const firstLength = readU32Be(view, PNG_SIGNATURE.byteLength);
  const firstType = String.fromCharCode(
    png[PNG_SIGNATURE.byteLength + 4],
    png[PNG_SIGNATURE.byteLength + 5],
    png[PNG_SIGNATURE.byteLength + 6],
    png[PNG_SIGNATURE.byteLength + 7],
  );
  if (firstType !== 'IHDR' || firstLength !== 13) {
    throw new Error('PNG is missing IHDR chunk');
  }

  const ihdrOffset = PNG_SIGNATURE.byteLength + 8;
  return {
    width: readU32Be(view, ihdrOffset),
    height: readU32Be(view, ihdrOffset + 4),
    bitDepth: png[ihdrOffset + 8],
    colorType: png[ihdrOffset + 9],
  };
}

/** Decode a 16-bit grayscale PNG into little-endian depth sample bytes. */
export async function decodeGrayscale16Png(png: Uint8Array): Promise<Grayscale16PngImage> {
  const { width, height, bitDepth, colorType } = parseIhdr(png);
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid PNG dimensions: ${width}x${height}`);
  }
  if (bitDepth !== 16 || colorType !== 0) {
    throw new Error(
      `Compressed depth PNG must be 16-bit grayscale (got depth=${bitDepth}, colorType=${colorType})`,
    );
  }

  const idat = concatIdatChunks(png);
  const filtered = await inflateZlib(idat);
  const data = unfilter16BitGrayscaleScanlines(filtered, width, height);

  return { width, height, data };
}
