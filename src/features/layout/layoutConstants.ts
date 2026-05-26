/**
 * Layout tuning constants
 * =======================
 *
 * Single source of truth for viewer shell dimensions: Dockview tab headers,
 * resizable sidebar bounds, and related responsive breakpoints.
 *
 * **How to change values**
 * - Tab actions: adjust {@link PANEL_TAB_EXPANDED_MIN_WIDTH_PX}.
 * - Sidebar drag limits: adjust `SIDEBAR_*_WIDTH_PX`; panel min/max/default
 *   percentages are derived from {@link LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX}.
 * - Sidebar compact UI: adjust {@link SIDEBAR_COMPACT_MAX_WIDTH_PX} and keep
 *   `src/index.css` `@container sidebar (max-width: …)` in sync.
 *
 * @see PanelTabHeader — tab action compact / expanded toggle
 * @see RosViewContent — resizable sidebar panel
 * @see Sidebar — `[container-name:sidebar]` container queries
 */

// ---------------------------------------------------------------------------
// Dockview panel tab header
// ---------------------------------------------------------------------------

/**
 * Minimum tab row width (px) to show settings, add-panel, and close as icon
 * buttons. Below this width, actions collapse into a single “more” menu.
 */
export const PANEL_TAB_EXPANDED_MIN_WIDTH_PX = 180;

// ---------------------------------------------------------------------------
// Resizable sidebar (RosViewContent ↔ Sidebar)
// ---------------------------------------------------------------------------

/** Default sidebar width on a {@link LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX} viewport. */
export const SIDEBAR_DEFAULT_WIDTH_PX = 288;

/** Minimum draggable sidebar width (px). */
export const SIDEBAR_MIN_WIDTH_PX = 240;

/** Maximum draggable sidebar width (px). */
export const SIDEBAR_MAX_WIDTH_PX = 520;

/**
 * Reference viewport width used to convert sidebar px bounds into
 * `ResizablePanel` percentage min/max/default values. Percentages scale with
 * the actual window while preserving the intended px limits at this width.
 */
export const LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX = 1280;

function sidebarWidthToPanelPercent(widthPx: number): number {
  return (widthPx / LAYOUT_REFERENCE_VIEWPORT_WIDTH_PX) * 100;
}

/** Default sidebar size as a fraction of the main horizontal split (percent). */
export const SIDEBAR_DEFAULT_PANEL_PERCENT = sidebarWidthToPanelPercent(SIDEBAR_DEFAULT_WIDTH_PX);

/** Minimum sidebar size for the resizable split (percent). */
export const SIDEBAR_MIN_PANEL_PERCENT = sidebarWidthToPanelPercent(SIDEBAR_MIN_WIDTH_PX);

/** Maximum sidebar size for the resizable split (percent). */
export const SIDEBAR_MAX_PANEL_PERCENT = sidebarWidthToPanelPercent(SIDEBAR_MAX_WIDTH_PX);

/**
 * Sidebar container-query breakpoint (px). Below this inline width, non-essential
 * sidebar chrome is hidden. Must match `@container sidebar (max-width: …)` in
 * `src/index.css`.
 */
export const SIDEBAR_COMPACT_MAX_WIDTH_PX = 320;
