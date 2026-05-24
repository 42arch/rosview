import { describe, expect, it } from 'vitest';
import { countVisibleFrameObjects } from './previewStatus';

describe('previewStatus', () => {
  it('counts visible frame objects', () => {
    expect(
      countVisibleFrameObjects({
        frameObjects: [
          { object: { visible: true } },
          { object: { visible: false } },
          { object: { visible: true } },
        ],
      }),
    ).toBe(2);
  });
});
