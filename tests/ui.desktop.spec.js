const { expect, test } = require('@playwright/test');
const {
  expectPanelClearsShopButton,
  openStaticLayoutSite,
  showStaticMenuPanel,
} = require('./ui-helpers');

test('wide desktop menu panels clear the shop button', async ({ page }) => {
  for (const viewport of [
    { width: 2560, height: 180 },
    { width: 5120, height: 1440 },
  ]) {
    await page.setViewportSize(viewport);
    await openStaticLayoutSite(page);

    await showStaticMenuPanel(page, '#aboutButton', '#about');
    await expect(page.locator('#about')).toBeVisible();
    await expectPanelClearsShopButton(page, '#about');

    await showStaticMenuPanel(page, '#contactButton', '#contact');
    await expect(page.locator('#contact')).toBeVisible();
    await expectPanelClearsShopButton(page, '#contact');
  }
});
