/**
 * Minimal MCAP with 16UC1 compressedDepth CompressedImage messages for E2E.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createIndexedMcapWriter,
  encodeCompressedImageCdr,
  readFixture,
  registerCompressedImageChannel,
  writeExample,
} from './mcap-fixture-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const payload = readFixture('image/compressed-depth-16uc1.bin');
const format = fs.readFileSync(
  path.join(__dirname, '../test-fixtures/image/compressed-depth-16uc1.format.txt'),
  'utf8',
).trim();

const { writer, writable } = await createIndexedMcapWriter();

const channelId = await registerCompressedImageChannel(
  '/camera/realsense2_camera/aligned_depth_to_color/image_raw/compressed_depth',
  writer,
);

const frames = [1_000_000_000n, 2_000_000_000n, 3_000_000_000n];
for (const [idx, ts] of frames.entries()) {
  const stamp = { sec: Number(ts / 1_000_000_000n), nsec: Number(ts % 1_000_000_000n) };
  await writer.addMessage({
    channelId,
    sequence: idx + 1,
    logTime: ts,
    publishTime: ts,
    data: encodeCompressedImageCdr(stamp, format, payload),
  });
}

await writer.end();
writeExample('test_compressed_depth.mcap', writable.getBuffer());
