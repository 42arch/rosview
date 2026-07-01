/**
 * Default colormap range and topic presets for depth image rendering.
 *
 * 16UC1 compressed depth is typically millimeters. Defaults follow ROS
 * image_view / RViz conventions: min 200 mm filters near-field noise and
 * invalid zeros; max 10000 mm (10 m) spans the full turbo colormap for
 * indoor sensors.
 */

import type { ImageConfig } from '../defaults';
import type { RawImageDecodeOptions } from './imageColorMode';

/** Lower bound (mm) for 16UC1 turbo colormap when unset. */
export const DEFAULT_DEPTH_16UC1_COLOR_MIN = 200;

/** Upper bound (mm) for 16UC1 turbo colormap when unset. */
export const DEFAULT_DEPTH_16UC1_COLOR_MAX = 10000;

/** Default max for 32FC1 float depth (meters). */
export const DEFAULT_DEPTH_32FC1_MAX = 1;

const DEPTH_TOPIC_RE = /depth|aligned_depth|compressed_depth/i;
const WRIST_TOPIC_RE = /wrist|hand|left|right|gripper|eef|end_effector/;

export function normalizedDepthEncoding(encoding: string): string {
  return encoding.trim().toLowerCase();
}

export function is16BitDepthEncoding(encoding: string): boolean {
  const lower = normalizedDepthEncoding(encoding);
  return lower === '16uc1' || lower === 'mono16';
}

export function is32FloatDepthEncoding(encoding: string): boolean {
  return normalizedDepthEncoding(encoding) === '32fc1';
}

export function isDepthScalarEncoding(encoding: string): boolean {
  return is16BitDepthEncoding(encoding) || is32FloatDepthEncoding(encoding);
}

export function isDepthTopicName(topic: string): boolean {
  return DEPTH_TOPIC_RE.test(topic);
}

export interface DepthColormapPreset {
  colorMode: 'colormap';
  colorMap: 'turbo';
  minValue: number;
  maxValue: number;
}

/**
 * Colormap preset inferred from topic name when the user picks a source.
 * Returns null for generic RGB or unknown topics.
 */
export function getDepthColormapDefaults(topic: string): DepthColormapPreset | null {
  const tp = topic.trim().toLowerCase();
  if (!tp) {
    return null;
  }

  const isDepthTopic = isDepthTopicName(tp);
  const isWrist = !isDepthTopic && WRIST_TOPIC_RE.test(tp);
  const base = { colorMode: 'colormap' as const, colorMap: 'turbo' as const };

  if (isDepthTopic) {
    return { ...base, minValue: DEFAULT_DEPTH_16UC1_COLOR_MIN, maxValue: DEFAULT_DEPTH_16UC1_COLOR_MAX };
  }
  if (isWrist) {
    return { ...base, minValue: 0, maxValue: 1000 };
  }
  return null;
}

export function defaultDepthMinValue(encoding: string, topic?: string): number {
  const topicPreset = topic ? getDepthColormapDefaults(topic) : null;
  if (topicPreset) {
    return topicPreset.minValue;
  }
  if (is16BitDepthEncoding(encoding)) {
    return DEFAULT_DEPTH_16UC1_COLOR_MIN;
  }
  return 0;
}

export function defaultDepthMaxValue(encoding: string, topic?: string): number {
  const topicPreset = topic ? getDepthColormapDefaults(topic) : null;
  if (topicPreset) {
    return topicPreset.maxValue;
  }
  if (is32FloatDepthEncoding(encoding)) {
    return DEFAULT_DEPTH_32FC1_MAX;
  }
  if (is16BitDepthEncoding(encoding)) {
    return DEFAULT_DEPTH_16UC1_COLOR_MAX;
  }
  return 65535;
}

/** Resolve effective min/max for colormap decoding, honoring explicit panel settings. */
export function resolveDepthColorRange(
  encoding: string,
  options?: Partial<RawImageDecodeOptions>,
  topic?: string,
): { minValue: number; maxValue: number } {
  return {
    minValue: options?.minValue ?? defaultDepthMinValue(encoding, topic),
    maxValue: options?.maxValue ?? defaultDepthMaxValue(encoding, topic),
  };
}

/** Apply topic-based depth colormap preset when the user selects a new source. */
export function applyDepthTopicPreset(topic: string, config: ImageConfig): ImageConfig {
  const preset = getDepthColormapDefaults(topic);
  if (!preset) {
    return { ...config, topic };
  }
  return {
    ...config,
    topic,
    colorMode: preset.colorMode,
    colorMap: preset.colorMap,
    minValue: preset.minValue,
    maxValue: preset.maxValue,
  };
}
