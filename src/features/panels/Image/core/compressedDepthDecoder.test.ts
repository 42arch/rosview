import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  decodeCompressedDepth,
  findPngOffset,
  parseCompressedDepthHeader,
} from './compressedDepthDecoder';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_16UC1 = path.join(__dirname, '../../../../../test-fixtures/image/compressed-depth-16uc1.bin');
const FIXTURE_32FC1 = path.join(__dirname, '../../../../../test-fixtures/image/compressed-depth-32fc1.bin');
const FIXTURE_FORMAT_16UC1 = '16UC1; compressedDepth';

describe('compressedDepthDecoder', () => {
  it('finds the PNG signature after the ROS header', () => {
    const fixture = fs.readFileSync(FIXTURE_16UC1);
    expect(findPngOffset(fixture)).toBe(12);
  });

  it('decodes a RealSense 16UC1 compressed depth fixture', async () => {
    const fixture = fs.readFileSync(FIXTURE_16UC1);
    const decoded = await decodeCompressedDepth(fixture, FIXTURE_FORMAT_16UC1);

    expect(decoded.encoding).toBe('16uc1');
    expect(decoded.width).toBe(640);
    expect(decoded.height).toBe(480);
    expect(decoded.step).toBe(640 * 2);
    expect(decoded.isBigEndian).toBe(false);

    const view = new DataView(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    expect(view.getUint16(0, true)).toBe(3524);
    expect(view.getUint16(2, true)).toBe(3565);
  });

  it('dequantizes 32FC1 compressed depth PNG payloads', async () => {
    const payload = fs.readFileSync(FIXTURE_32FC1);
    const header = parseCompressedDepthHeader(payload, findPngOffset(payload));
    expect(header.depthParam).toEqual([10, 5]);

    const decoded = await decodeCompressedDepth(payload, '32FC1; compressedDepth');
    expect(decoded.encoding).toBe('32fc1');
    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(1);

    const view = new DataView(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
    expect(view.getFloat32(0, true)).toBeCloseTo(10 / (100 - 5), 5);
    expect(view.getFloat32(4, true)).toBeCloseTo(10 / (200 - 5), 5);
  });

  it('rejects unsupported RVL compressed depth formats', async () => {
    const fixture = fs.readFileSync(FIXTURE_16UC1);
    await expect(decodeCompressedDepth(fixture, '16UC1; compressedDepth rvl')).rejects.toThrow(/RVL/);
  });
});
