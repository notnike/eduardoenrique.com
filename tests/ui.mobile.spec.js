const { expect, test } = require('@playwright/test');
const {
  acceptDisclaimer,
  expectCanvasToFillViewport,
  expectHeaderHonorsSafeArea,
  openSite,
} = require('./ui-helpers');

test('mobile header clears the iOS safe area', async ({ page }) => {
  const runtimeErrors = await openSite(page);

  await expectHeaderHonorsSafeArea(page);

  expect(runtimeErrors).toEqual([]);
});

test('mobile scene taps do not throw runtime errors', async ({ page }) => {
  const runtimeErrors = await openSite(page);

  await acceptDisclaimer(page);
  await expectCanvasToFillViewport(page);
  await page.touchscreen.tap(200, 300);
  await page.waitForTimeout(100);

  expect(runtimeErrors).toEqual([]);
});
