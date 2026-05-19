/** Portal target for Radix overlays when embedded under `#rosview-root`. */
export function getRosViewPortalRoot(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.getElementById('rosview-root') ?? undefined;
}
