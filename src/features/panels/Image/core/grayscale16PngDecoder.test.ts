import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decodeGrayscale16Png } from './grayscale16PngDecoder';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_16UC1 = path.join(__dirname, '../../../../../test-fixtures/image/compressed-depth-16uc1.bin');

describe('decodeGrayscale16Png', () => {
  it('decodes 16-bit grayscale PNG bytes from a compressed depth fixture', async () => {
    const payload = fs.readFileSync(FIXTURE_16UC1);
    const pngOffset = payload.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    expect(pngOffset).toBeGreaterThanOrEqual(0);

    const decoded = await decodeGrayscale16Png(payload.subarray(pngOffset));
    expect(decoded.width).toBe(640);
    expect(decoded.height).toBe(480);
    expect(decoded.data.byteLength).toBe(640 * 480 * 2);

    const view = new DataView(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    expect(view.getUint16(0, true)).toBeGreaterThan(0);
    expect(view.getUint16(2, true)).toBeGreaterThan(0);
  });

  it('preserves 16-bit sample values through unfilter and byte-order swap', async () => {
    const width = 2;
    const height = 1;
    // Filter None; PNG stores 16-bit grayscale big-endian: 1000, 2000 mm.
    const filtered = new Uint8Array([0, 0x03, 0xe8, 0x07, 0xd0]);

    const idat = await (async () => {
      if (typeof CompressionStream === 'undefined') {
        return null;
      }
      const stream = new Blob([filtered.buffer]).stream().pipeThrough(new CompressionStream('deflate'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    })();

    if (!idat) {
      return;
    }

    const ihdr = new Uint8Array([
      0x00, 0x00, 0x00, 0x02, // width
      0x00, 0x00, 0x00, 0x01, // height
      0x10, // bit depth 16
      0x00, // grayscale
      0x00,
      0x00,
      0x00,
    ]);
    const ihdrChunk = wrapChunk('IHDR', ihdr);
    const idatChunk = wrapChunk('IDAT', idat);
    const iendChunk = wrapChunk('IEND', new Uint8Array(0));
    const png = concatBytes([
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ihdrChunk,
      idatChunk,
      iendChunk,
    ]);

    const decoded = await decodeGrayscale16Png(png);
    expect(decoded.width).toBe(width);
    expect(decoded.height).toBe(height);
    const view = new DataView(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    expect(view.getUint16(0, true)).toBe(1000);
    expect(view.getUint16(2, true)).toBe(2000);
  });
});

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function wrapChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length, false);
  out[4] = type.charCodeAt(0)!;
  out[5] = type.charCodeAt(1)!;
  out[6] = type.charCodeAt(2)!;
  out[7] = type.charCodeAt(3)!;
  out.set(data, 8);
  const crcInput = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcInput), false);
  return out;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
