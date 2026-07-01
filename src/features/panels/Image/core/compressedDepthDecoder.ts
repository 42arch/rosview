/**
 * Decode `sensor_msgs/CompressedImage` payloads with `compressedDepth` transport.
 *
 * Layout: optional 12-byte ROS header (quant params) + PNG (16-bit grayscale).
 * Supported encodings: 16UC1 (direct mm samples) and 32FC1 (PNG uint16 dequantized to float).
 */

import { decodeGrayscale16Png, findPngSignatureOffset } from './grayscale16PngDecoder';
import {
  depthEncodingFromFormat,
  isCompressedDepthFormat,
  parseCompressedImageFormat,
  type DepthImageEncoding,
} from './imageTypes';

/** Bytes before PNG in standard ROS compressedDepth messages. */
const ROS_COMPRESSED_DEPTH_HEADER_SIZE = 12;

export interface CompressedDepthHeader {
  compressionFormat: number;
  depthParam: [number, number];
}

/** Raw image bytes ready for the same path as `sensor_msgs/Image`. */
export interface DecodedCompressedDepth {
  encoding: DepthImageEncoding;
  width: number;
  height: number;
  step: number;
  isBigEndian: false;
  data: Uint8Array;
}

export function findPngOffset(data: Uint8Array): number {
  return findPngSignatureOffset(data);
}

export function parseCompressedDepthHeader(data: Uint8Array, pngOffset: number): CompressedDepthHeader {
  if (pngOffset < 4) {
    return { compressionFormat: 0, depthParam: [0, 0] };
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    compressionFormat: view.getInt32(0, true),
    depthParam: [view.getFloat32(4, true), view.getFloat32(8, true)],
  };
}

async function decodePngPayload(data: Uint8Array): Promise<{ width: number; height: number; data: Uint8Array }> {
  const pngOffset = findPngOffset(data);
  if (pngOffset < 0) {
    throw new Error('Compressed depth payload does not contain a PNG signature');
  }
  const decoded = await decodeGrayscale16Png(data.subarray(pngOffset));
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
  };
}

async function decode16uc1(data: Uint8Array): Promise<DecodedCompressedDepth> {
  const { width, height, data: pixelBytes } = await decodePngPayload(data);
  return {
    encoding: '16uc1',
    width,
    height,
    step: width * 2,
    isBigEndian: false,
    data: pixelBytes,
  };
}

async function decode32fc1(data: Uint8Array, header: CompressedDepthHeader): Promise<DecodedCompressedDepth> {
  const { width, height, data: pixelBytes } = await decodePngPayload(data);
  const [depthQuantA, depthQuantB] = header.depthParam;
  const out = new Uint8Array(width * height * 4);
  const outView = new DataView(out.buffer, out.byteOffset, out.byteLength);
  const sampleView = new DataView(pixelBytes.buffer, pixelBytes.byteOffset, pixelBytes.byteLength);

  for (let i = 0; i < width * height; i++) {
    const raw = sampleView.getUint16(i * 2, true);
    let depth = 0;
    if (raw !== 0) {
      depth = depthQuantA / (raw - depthQuantB);
      if (!Number.isFinite(depth)) {
        depth = 0;
      }
    }
    outView.setFloat32(i * 4, depth, true);
  }

  return {
    encoding: '32fc1',
    width,
    height,
    step: width * 4,
    isBigEndian: false,
    data: out,
  };
}

export async function decodeCompressedDepth(data: Uint8Array, format: string): Promise<DecodedCompressedDepth> {
  if (!isCompressedDepthFormat(format)) {
    throw new Error(`Not a compressed depth format: ${format}`);
  }

  const parsed = parseCompressedImageFormat(format);
  if (parsed.depthCodec === 'rvl') {
    throw new Error('RVL compressed depth is not supported yet');
  }

  const encoding = depthEncodingFromFormat(format);
  if (!encoding) {
    throw new Error(`Unsupported compressed depth encoding in format: ${format}`);
  }

  const pngOffset = findPngOffset(data);
  if (pngOffset < 0) {
    throw new Error('Compressed depth payload is missing PNG data');
  }
  if (pngOffset < ROS_COMPRESSED_DEPTH_HEADER_SIZE && data.byteLength < ROS_COMPRESSED_DEPTH_HEADER_SIZE) {
    throw new Error('Compressed depth payload is too small');
  }

  const header = parseCompressedDepthHeader(data, pngOffset);
  if (encoding === '16uc1') {
    return decode16uc1(data);
  }
  return decode32fc1(data, header);
}
