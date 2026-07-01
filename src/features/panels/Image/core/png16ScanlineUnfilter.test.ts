import { describe, expect, it } from 'vitest';
import { unfilter16BitGrayscaleScanlines } from './png16ScanlineUnfilter';

describe('unfilter16BitGrayscaleScanlines', () => {
  it('reconstructs Sub-filtered rows using 2-byte pixel stride', () => {
    const width = 2;
    const height = 1;
    // Sub: first pixel stored raw (1000), second pixel as deltas from pixel0 high byte.
    const inflated = new Uint8Array([1, 0x03, 0xe8, 0x04, 0xe8]);

    const out = unfilter16BitGrayscaleScanlines(inflated, width, height);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    expect(view.getUint16(0, true)).toBe(1000);
    expect(view.getUint16(2, true)).toBe(2000);
  });

  it('byte-swaps to little-endian after reconstruction', () => {
    const inflated = new Uint8Array([
      0, // None
      0x03,
      0xe8,
      0x07,
      0xd0,
    ]);

    const out = unfilter16BitGrayscaleScanlines(inflated, 2, 1);
    expect(out[0]).toBe(0xe8);
    expect(out[1]).toBe(0x03);
  });
});
