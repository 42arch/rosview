import { test, expect } from '@playwright/test';
import { MCAP_COMPRESSED_DEPTH, MCAP_COMPRESSED_DEPTH_URL, requireFixture } from './fixturePaths';
import { attachBrowserDiagnostics, openFixtureByUrl } from './helpers/rosview';

test.describe.configure({ timeout: 120_000 });

test.beforeAll(() => {
  requireFixture(MCAP_COMPRESSED_DEPTH);
});

test('16UC1 compressedDepth CompressedImage decodes without error', async ({ page }) => {
  const diagnostics = attachBrowserDiagnostics(page);
  await openFixtureByUrl(page, MCAP_COMPRESSED_DEPTH_URL, { diagnostics });

  const play = page.getByRole('button', { name: 'Play playback' });
  if (await play.isVisible().catch(() => false)) {
    await play.click();
  }

  await expect(page.getByTestId('image-panel')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Failed to decode frame at index 0|Image decode failed/i)).toHaveCount(0);

  const imageStatus = page.getByTestId('image-panel-status');
  await expect(imageStatus).toBeVisible({ timeout: 90_000 });
  await expect(imageStatus).toHaveText(/640x480.*16uc1/i);

  expect(diagnostics.pageErrors.filter((entry) => /decode frame at index 0|Image decode failed/i.test(entry))).toEqual([]);
  expect(diagnostics.consoleErrors.filter((entry) => /decode frame at index 0|Image decode failed/i.test(entry))).toEqual([]);
});
