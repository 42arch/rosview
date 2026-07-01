/**
 * PNG scanline reconstruction for 16-bit grayscale (color type 0).
 *
 * ROS `compressedDepth` PNGs use 2 bytes per pixel. Sub/Avg/Paeth filters must
 * reference the previous *pixel* (2 bytes), not the previous byte — otherwise
 * decoded depth values show horizontal striping.
 */

const GRAYSCALE_16_BPP = 2;

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterNone(currentLine: Uint8Array, newLine: Uint8Array, bytesPerLine: number): void {
  for (let i = 0; i < bytesPerLine; i++) {
    newLine[i] = currentLine[i]!;
  }
}

function unfilterSub(
  currentLine: Uint8Array,
  newLine: Uint8Array,
  bytesPerLine: number,
  bytesPerPixel: number,
): void {
  let i = 0;
  for (; i < bytesPerPixel; i++) {
    newLine[i] = currentLine[i]!;
  }
  for (; i < bytesPerLine; i++) {
    newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xff;
  }
}

function unfilterUp(
  currentLine: Uint8Array,
  newLine: Uint8Array,
  prevLine: Uint8Array,
  bytesPerLine: number,
): void {
  if (prevLine.length === 0) {
    for (let i = 0; i < bytesPerLine; i++) {
      newLine[i] = currentLine[i]!;
    }
    return;
  }
  for (let i = 0; i < bytesPerLine; i++) {
    newLine[i] = (currentLine[i] + prevLine[i]) & 0xff;
  }
}

function unfilterAverage(
  currentLine: Uint8Array,
  newLine: Uint8Array,
  prevLine: Uint8Array,
  bytesPerLine: number,
  bytesPerPixel: number,
): void {
  let i = 0;
  if (prevLine.length === 0) {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = currentLine[i]!;
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] = (currentLine[i] + (newLine[i - bytesPerPixel] >> 1)) & 0xff;
    }
    return;
  }
  for (; i < bytesPerPixel; i++) {
    newLine[i] = (currentLine[i] + (prevLine[i] >> 1)) & 0xff;
  }
  for (; i < bytesPerLine; i++) {
    newLine[i] =
      (currentLine[i] + ((newLine[i - bytesPerPixel] + prevLine[i]) >> 1)) & 0xff;
  }
}

function unfilterPaeth(
  currentLine: Uint8Array,
  newLine: Uint8Array,
  prevLine: Uint8Array,
  bytesPerLine: number,
  bytesPerPixel: number,
): void {
  let i = 0;
  if (prevLine.length === 0) {
    for (; i < bytesPerPixel; i++) {
      newLine[i] = currentLine[i]!;
    }
    for (; i < bytesPerLine; i++) {
      newLine[i] = (currentLine[i] + newLine[i - bytesPerPixel]) & 0xff;
    }
    return;
  }
  for (; i < bytesPerPixel; i++) {
    newLine[i] = (currentLine[i] + prevLine[i]) & 0xff;
  }
  for (; i < bytesPerLine; i++) {
    newLine[i] =
      (currentLine[i] +
        paethPredictor(
          newLine[i - bytesPerPixel],
          prevLine[i],
          prevLine[i - bytesPerPixel],
        )) &
      0xff;
  }
}

/**
 * Reconstruct raw scanlines from inflated PNG image data (one filter byte per row).
 * Returns little-endian 16-bit sample bytes suitable for `decodeRawImage`.
 */
export function unfilter16BitGrayscaleScanlines(
  inflated: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const bytesPerLine = width * GRAYSCALE_16_BPP;
  const expectedLen = height * (1 + bytesPerLine);
  if (inflated.byteLength !== expectedLen) {
    throw new Error(
      `PNG inflated length ${inflated.byteLength} !== expected ${expectedLen}`,
    );
  }

  const out = new Uint8Array(height * bytesPerLine);
  const empty = new Uint8Array(0);
  let prevLine = empty;
  let offset = 0;

  for (let row = 0; row < height; row++) {
    const filterType = inflated[offset++];
    const currentLine = inflated.subarray(offset, offset + bytesPerLine);
    offset += bytesPerLine;
    const newLine = out.subarray(row * bytesPerLine, (row + 1) * bytesPerLine);

    switch (filterType) {
      case 0:
        unfilterNone(currentLine, newLine, bytesPerLine);
        break;
      case 1:
        unfilterSub(currentLine, newLine, bytesPerLine, GRAYSCALE_16_BPP);
        break;
      case 2:
        unfilterUp(currentLine, newLine, prevLine, bytesPerLine);
        break;
      case 3:
        unfilterAverage(currentLine, newLine, prevLine, bytesPerLine, GRAYSCALE_16_BPP);
        break;
      case 4:
        unfilterPaeth(currentLine, newLine, prevLine, bytesPerLine, GRAYSCALE_16_BPP);
        break;
      default:
        throw new Error(`Unsupported PNG filter type: ${filterType}`);
    }
    prevLine = newLine;
  }

  // PNG stores 16-bit samples big-endian; RawImage decode expects little-endian.
  for (let i = 0; i < out.length; i += 2) {
    const t = out[i];
    out[i] = out[i + 1]!;
    out[i + 1] = t;
  }

  return out;
}
