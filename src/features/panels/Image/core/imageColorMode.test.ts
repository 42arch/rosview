import { describe, expect, it } from 'vitest';
import { DEFAULT_RAW_IMAGE_DECODE_OPTIONS, getColorConverter } from './imageColorMode';

describe('getColorConverter turbo', () => {
  it('does not collapse mid-range values to pure green', () => {
    const convert = getColorConverter(
      { ...DEFAULT_RAW_IMAGE_DECODE_OPTIONS, colorMode: 'colormap', colorMap: 'turbo' },
      0,
      10000,
    );
    const px = { r: 0, g: 0, b: 0, a: 0 };
    convert(px, 3537);
    const g = Math.round(px.g * 255);
    const r = Math.round(px.r * 255);
    const b = Math.round(px.b * 255);
    expect(g).toBeLessThan(255);
    expect(r + g + b).toBeGreaterThan(80);
    expect(b).toBeGreaterThan(0);
  });

  it('maps zero to dark blue at the colormap minimum', () => {
    const convert = getColorConverter(
      { ...DEFAULT_RAW_IMAGE_DECODE_OPTIONS, colorMode: 'colormap', colorMap: 'turbo' },
      0,
      10000,
    );
    const px = { r: 0, g: 0, b: 0, a: 0 };
    convert(px, 0);
    expect(Math.round(px.b * 255)).toBeGreaterThan(Math.round(px.g * 255));
    expect(Math.round(px.r * 255)).toBeLessThan(80);
  });
});
