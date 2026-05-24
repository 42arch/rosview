import { describe, expect, it } from 'vitest';
import { parseUrdfDebugConfig } from './schema';

describe('parseUrdfDebugConfig', () => {
  it('parses urdf source settings', () => {
    const config = parseUrdfDebugConfig({
      urdfSourceType: 'topic',
      urdfTopic: '/robot_description',
    });
    expect(config.urdfSourceType).toBe('topic');
    expect(config.urdfTopic).toBe('/robot_description');
  });

  it('defaults to file source for legacy configs', () => {
    const config = parseUrdfDebugConfig({ urdfFileContent: '<robot/>' });
    expect(config.urdfSourceType).toBe('file');
    expect(config.urdfFileContent).toBe('<robot/>');
  });
});
