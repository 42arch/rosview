import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decodeCompressedDepth } from './compressedDepthDecoder';
import { decodeRawImage } from './rawDecoders';
import { getColorConverter, DEFAULT_RAW_IMAGE_DECODE_OPTIONS } from './imageColorMode';
import {
  DEFAULT_DEPTH_16UC1_COLOR_MAX,
  DEFAULT_DEPTH_16UC1_COLOR_MIN,
} from './depthColorDefaults';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_16UC1 = path.join(__dirname, '../../../../../test-fixtures/image/compressed-depth-16uc1.bin');

function isDarkBlue(r: number, g: number, b: number): boolean {
  return b > r && b > g && b > 40;
}

describe('compressed depth colorization', () => {
  it('maps near-zero depths to dark blue and keeps valid depths distinguishable', async () => {
    const fixture = fs.readFileSync(FIXTURE_16UC1);
    const decoded = await decodeCompressedDepth(fixture, '16UC1; compressedDepth');
    const view = new DataView(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    const { width, height } = decoded;

    const rgba = new Uint8ClampedArray(width * height * 4);
    decodeRawImage(
      {
        encoding: '16uc1',
        width,
        height,
        step: width * 2,
        is_bigendian: false,
        data: decoded.data,
      },
      rgba,
      { colorMode: 'colormap', colorMap: 'turbo' },
    );

    let zeroCount = 0;
    let zeroDarkBlue = 0;
    let minDepth = Infinity;
    let maxDepth = 0;
    let minIndex = -1;
    let maxIndex = -1;
    for (let i = 0; i < width * height; i++) {
      const value = view.getUint16(i * 2, true);
      const o = i * 4;
      if (value === 0) {
        zeroCount++;
        if (isDarkBlue(rgba[o]!, rgba[o + 1]!, rgba[o + 2]!)) zeroDarkBlue++;
      }
      if (value >= DEFAULT_DEPTH_16UC1_COLOR_MIN && value <= DEFAULT_DEPTH_16UC1_COLOR_MAX) {
        if (value < minDepth) {
          minDepth = value;
          minIndex = i;
        }
        if (value > maxDepth) {
          maxDepth = value;
          maxIndex = i;
        }
      }
    }

    expect(zeroCount).toBeGreaterThan(0);
    expect(zeroDarkBlue / zeroCount).toBeGreaterThan(0.9);
    expect(minIndex).toBeGreaterThanOrEqual(0);
    expect(maxIndex).toBeGreaterThanOrEqual(0);
    expect(maxDepth - minDepth).toBeGreaterThan(500);

    const convert = getColorConverter(
      { ...DEFAULT_RAW_IMAGE_DECODE_OPTIONS, colorMode: 'colormap', colorMap: 'turbo' },
      DEFAULT_DEPTH_16UC1_COLOR_MIN,
      DEFAULT_DEPTH_16UC1_COLOR_MAX,
    );
    const nearPx = { r: 0, g: 0, b: 0, a: 0 };
    const farPx = { r: 0, g: 0, b: 0, a: 0 };
    convert(nearPx, minDepth);
    convert(farPx, maxDepth);
    expect(Math.abs(nearPx.g - farPx.g)).toBeGreaterThan(0.05);
    expect(Math.abs(nearPx.b - farPx.b)).toBeGreaterThan(0.05);
  });
});
