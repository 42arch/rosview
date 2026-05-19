import type {
  PreferencePersistence,
  RosViewLanguageCode,
  RosViewPersistedTheme,
  RosViewPreferencesV1,
  RosViewUiTheme,
} from './types';

export type MergeInitialUiPreferencesInput = {
  persistence: PreferencePersistence;
  /** Parent-controlled `theme` (`undefined` means leave that axis unmanaged). */
  propsTheme?: RosViewUiTheme;
  propsLanguage?: RosViewLanguageCode;
  urlTheme?: string | null;
  urlLanguage?: string | null;
  /** Result of `readPreferences()`; pass `null` when `persistence === 'off'`. */
  stored: RosViewPreferencesV1 | null;
};

const UI_THEME = new Set<RosViewUiTheme>(['light', 'dark', 'system']);
const LANG = new Set<RosViewLanguageCode>(['en', 'zh', 'ja']);

function parseUrlTheme(raw: string | null | undefined): RosViewUiTheme | undefined {
  if (raw == null || raw === '') return undefined;
  const v = raw.trim().toLowerCase();
  return UI_THEME.has(v as RosViewUiTheme) ? (v as RosViewUiTheme) : undefined;
}

function parseUrlLanguage(raw: string | null | undefined): RosViewLanguageCode | undefined {
  if (raw == null || raw === '') return undefined;
  const v = raw.trim().toLowerCase().replace(/_/g, '-');
  // BCP-47 style params (e.g. ?lang=zh-CN) map to UI language codes.
  if (v === 'zh' || v === 'zh-cn' || v === 'zhcn' || v.startsWith('zh-cn')) return 'zh';
  if (v === 'ja' || v === 'ja-jp' || v.startsWith('ja-')) return 'ja';
  if (v === 'en' || v === 'en-us' || v === 'en-gb' || v.startsWith('en-')) return 'en';
  return LANG.has(v as RosViewLanguageCode) ? (v as RosViewLanguageCode) : undefined;
}

function storedToUiTheme(t: RosViewPersistedTheme | undefined): RosViewUiTheme | undefined {
  return t;
}

/**
 * Resolution order per key: explicit props > URL > localStorage (if enabled) > defaults.
 * Defaults: `theme = system`, `language = en` (matches RosViewProvider).
 */
export function mergeInitialUiPreferences(input: MergeInitialUiPreferencesInput): {
  theme: RosViewUiTheme;
  language: RosViewLanguageCode;
} {
  const stored = input.persistence === 'localStorage' ? input.stored : null;

  const themeFromProps = input.propsTheme;
  const themeFromUrl = parseUrlTheme(input.urlTheme);
  const themeFromStored = storedToUiTheme(stored?.theme);

  const theme: RosViewUiTheme =
    themeFromProps !== undefined
      ? themeFromProps
      : themeFromUrl !== undefined
        ? themeFromUrl
        : themeFromStored !== undefined
          ? themeFromStored
          : 'system';

  const langFromProps = input.propsLanguage;
  const langFromUrl = parseUrlLanguage(input.urlLanguage);
  const langFromStored = stored?.language;

  const language: RosViewLanguageCode =
    langFromProps !== undefined
      ? langFromProps
      : langFromUrl !== undefined
        ? langFromUrl
        : langFromStored !== undefined
          ? langFromStored
          : 'en';

  return { theme, language };
}

/** Parse `window.location.search` (SPA only); returns empties when not in browser. */
export function readUiPreferenceParamsFromSearch(search: string): {
  urlTheme: string | null;
  urlLanguage: string | null;
} {
  if (typeof search !== 'string' || search === '') {
    return { urlTheme: null, urlLanguage: null };
  }
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return {
      urlTheme: params.get('theme'),
      urlLanguage: params.get('language') ?? params.get('lang'),
    };
  } catch {
    return { urlTheme: null, urlLanguage: null };
  }
}
