const { expect, test } = require('@playwright/test');
const {
  acceptDisclaimer,
  expectCanvasToFillViewport,
  expectHeaderHonorsSafeArea,
  openSite,
  openStaticLayoutSite,
} = require('./ui-helpers');

test('mobile header clears the iOS safe area', async ({ page }) => {
  await openStaticLayoutSite(page);
  await expectHeaderHonorsSafeArea(page);
});

test('mobile scene taps do not throw runtime errors', async ({ page }) => {
  const runtimeErrors = await openSite(page);

  await acceptDisclaimer(page);
  await expectCanvasToFillViewport(page);
  await page.touchscreen.tap(200, 300);
  await page.waitForTimeout(100);

  expect(runtimeErrors).toEqual([]);
});
