const { expect, test } = require('@playwright/test');
const {
  acceptDisclaimer,
  expectPanelClearsShopButton,
  openSite,
} = require('./ui-helpers');

test('wide desktop menu panels clear the shop button', async ({ page }) => {
  const runtimeErrors = [];

  for (const viewport of [
    { width: 2560, height: 180 },
    { width: 5120, height: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    runtimeErrors.push(...await openSite(page));

    await acceptDisclaimer(page);

    await page.locator('#aboutButton').evaluate(button => button.click());
    await expect(page.locator('#about')).toBeVisible();
    await expectPanelClearsShopButton(page, '#about');

    await page.locator('#contactButton').evaluate(button => button.click());
    await expect(page.locator('#contact')).toBeVisible();
    await expectPanelClearsShopButton(page, '#contact');
  }

  expect(runtimeErrors).toEqual([]);
});
