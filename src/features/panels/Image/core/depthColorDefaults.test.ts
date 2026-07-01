import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DEPTH_16UC1_COLOR_MAX,
  DEFAULT_DEPTH_16UC1_COLOR_MIN,
  applyDepthTopicPreset,
  defaultDepthMinValue,
  getDepthColormapDefaults,
  isDepthTopicName,
  resolveDepthColorRange,
} from './depthColorDefaults';
import { defaultImageConfig } from '../defaults';

describe('getDepthColormapDefaults', () => {
  it('returns depth topic preset', () => {
    expect(getDepthColormapDefaults('/camera/depth/image_raw/compressed')).toEqual({
      colorMode: 'colormap',
      colorMap: 'turbo',
      minValue: DEFAULT_DEPTH_16UC1_COLOR_MIN,
      maxValue: DEFAULT_DEPTH_16UC1_COLOR_MAX,
    });
  });

  it('returns wrist preset for non-depth wrist topics', () => {
    expect(getDepthColormapDefaults('/robot/wrist_cam/image')).toMatchObject({
      minValue: 0,
      maxValue: 1000,
    });
  });

  it('returns null for unrelated topics', () => {
    expect(getDepthColormapDefaults('/camera/rgb/image_raw')).toBeNull();
  });
});

describe('resolveDepthColorRange', () => {
  it('uses ROS-style defaults for 16uc1 when unset', () => {
    expect(resolveDepthColorRange('16uc1', {})).toEqual({
      minValue: DEFAULT_DEPTH_16UC1_COLOR_MIN,
      maxValue: DEFAULT_DEPTH_16UC1_COLOR_MAX,
    });
  });

  it('respects explicit user overrides', () => {
    expect(resolveDepthColorRange('16uc1', { minValue: 0, maxValue: 5000 })).toEqual({
      minValue: 0,
      maxValue: 5000,
    });
  });

  it('uses topic preset when topic is provided', () => {
    expect(resolveDepthColorRange('mono16', {}, '/depth/compressed')).toEqual({
      minValue: DEFAULT_DEPTH_16UC1_COLOR_MIN,
      maxValue: DEFAULT_DEPTH_16UC1_COLOR_MAX,
    });
  });
});

describe('isDepthTopicName', () => {
  it('matches common depth topic patterns', () => {
    expect(isDepthTopicName('/camera/aligned_depth_to_color/image_raw')).toBe(true);
    expect(isDepthTopicName('/rgb/image_raw')).toBe(false);
  });
});

describe('defaultDepthMinValue', () => {
  it('returns 200 for depth encodings without an explicit topic preset', () => {
    expect(defaultDepthMinValue('16UC1')).toBe(DEFAULT_DEPTH_16UC1_COLOR_MIN);
  });
});

describe('applyDepthTopicPreset', () => {
  it('merges depth colormap preset when topic matches', () => {
    const next = applyDepthTopicPreset('/camera/depth/compressed', {
      ...defaultImageConfig(),
      topic: '',
      colorMode: 'rgb',
    });
    expect(next.topic).toBe('/camera/depth/compressed');
    expect(next.colorMode).toBe('colormap');
    expect(next.minValue).toBe(DEFAULT_DEPTH_16UC1_COLOR_MIN);
    expect(next.maxValue).toBe(DEFAULT_DEPTH_16UC1_COLOR_MAX);
  });

  it('only updates topic for non-depth sources', () => {
    const base = { ...defaultImageConfig(), colorMode: 'rgb' as const, minValue: 42 };
    const next = applyDepthTopicPreset('/camera/rgb/image_raw', base);
    expect(next).toEqual({ ...base, topic: '/camera/rgb/image_raw' });
  });
});
