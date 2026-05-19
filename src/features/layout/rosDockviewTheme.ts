import type { DockviewTheme } from 'dockview-core';

/**
 * ROSView Dockview chrome themes.
 * Keep built-in `dockview-theme-*` for Dockview defaults, and layer `ros-dockview-theme-*`
 * for explicit light/dark tab-strip tokens (see index.css).
 *
 * v6 theme properties:
 * - colorScheme: lets panel content adapt to light/dark
 * - dndPanelOverlay: 'group' covers the entire group (tab bar + content) for more visible drop feedback
 * - dndOverlayBorder: prominent border on the drop target overlay
 */
export const rosDockviewThemeLight: DockviewTheme = {
  name: 'rosview-light',
  className: 'dockview-theme-light ros-dockview-theme-light',
  colorScheme: 'light',
  dndPanelOverlay: 'group',
  dndOverlayBorder: '2px solid rgba(33, 150, 243, 0.7)',
  tabAnimation: 'smooth',
  dndTabIndicator: 'line',
};

export const rosDockviewThemeDark: DockviewTheme = {
  name: 'rosview-dark',
  className: 'dockview-theme-dark ros-dockview-theme-dark',
  colorScheme: 'dark',
  dndPanelOverlay: 'group',
  dndOverlayBorder: '2px solid rgba(33, 150, 243, 0.75)',
  tabAnimation: 'smooth',
  dndTabIndicator: 'line',
};
