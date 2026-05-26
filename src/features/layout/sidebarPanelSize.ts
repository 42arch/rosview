import { readPreferences } from '@/core/preferences/readWritePreferences';
import type { PreferencePersistence } from '@/core/preferences/types';
import {
  LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX,
  SIDEBAR_DEFAULT_PANEL_PERCENT,
  SIDEBAR_MAX_PANEL_PERCENT,
  SIDEBAR_MIN_PANEL_PERCENT,
} from './layoutConstants';

export function clampSidebarPanelPercent(value: number): number {
  return Math.min(SIDEBAR_MAX_PANEL_PERCENT, Math.max(SIDEBAR_MIN_PANEL_PERCENT, value));
}

export function getInitialSidebarPanelPercent(persistence: PreferencePersistence): number {
  if (persistence !== 'localStorage') {
    return SIDEBAR_DEFAULT_PANEL_PERCENT;
  }
  const preferences = readPreferences();
  if (preferences?.sidebarPanelPercent !== undefined) {
    return clampSidebarPanelPercent(preferences.sidebarPanelPercent);
  }
  if (preferences?.sidebarWidth !== undefined) {
    const viewportWidth =
      typeof globalThis === 'undefined' || !('innerWidth' in globalThis) || !globalThis.innerWidth
        ? LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX
        : globalThis.innerWidth;
    return clampSidebarPanelPercent((preferences.sidebarWidth / viewportWidth) * 100);
  }
  return SIDEBAR_DEFAULT_PANEL_PERCENT;
}
