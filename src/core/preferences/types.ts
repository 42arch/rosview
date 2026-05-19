export type RosViewLanguageCode = 'en' | 'zh' | 'ja';

/** Persisted theme: light/dark only (navbar); `system` is resolved at runtime, not stored yet. */
export type RosViewPersistedTheme = 'light' | 'dark';

export type RosViewUiTheme = 'light' | 'dark' | 'system';

export const ROS_VIEW_PREFERENCE_SCHEMA_VERSION = 1 as const;

export type RosViewPreferencesV1 = {
  schemaVersion: typeof ROS_VIEW_PREFERENCE_SCHEMA_VERSION;
  theme?: RosViewPersistedTheme;
  language?: RosViewLanguageCode;
  sidebarWidth?: number;
  sidebarPanelPercent?: number;
  autoDataQualityScan?: boolean;
};

export type PreferencePersistence = 'localStorage' | 'off';
