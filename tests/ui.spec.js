const { expect, test } = require('@playwright/test');
const {
  acceptDisclaimer,
  expectCanvasToFillViewport,
  expectDisclaimerDoesNotJumpWithOverlayHeight,
  expectLoadingOverlayCoversMobileOverscan,
  expectNoOverlap,
  expectedWorkTitles,
  freezeCanvasAfterFrames,
  hideCanvasForOverlayScreenshot,
  hideUiForCanvasScreenshot,
  openSite,
} = require('./ui-helpers');

test('visual baseline for disclosure and menu overlays', async ({ page }) => {
  const runtimeErrors = await openSite(page);

  await expectLoadingOverlayCoversMobileOverscan(page);
  await expectDisclaimerDoesNotJumpWithOverlayHeight(page);
  await expect(page).toHaveScreenshot('disclaimer.png', {
    animations: 'disabled',
  });

  await acceptDisclaimer(page);
  await expectCanvasToFillViewport(page);
  await freezeCanvasAfterFrames(page);
  const uiHider = await hideUiForCanvasScreenshot(page);
  await expect(page).toHaveScreenshot('scene-canvas.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.002,
  });
  await uiHider.evaluate(style => style.remove());

  await page.locator('#aboutButton').click();
  await expect(page.locator('#aboutButton')).toHaveClass(/focused/);
  await expect(page.locator('#about')).toBeVisible();
  await expect(page.locator('#contact')).toBeHidden();
  await expectNoOverlap(page, '#about', '#shopButton');
  const canvasHider = await hideCanvasForOverlayScreenshot(page);
  await expect(page).toHaveScreenshot('about-overlay.png', {
    animations: 'disabled',
  });

  await page.locator('#contactButton').click();
  await expect(page.locator('#contactButton')).toHaveClass(/focused/);
  await expect(page.locator('#contact')).toBeVisible();
  await expect(page.locator('#about')).toBeHidden();
  await expect(page.locator('#subscribeInput')).toBeVisible();
  await expectNoOverlap(page, '#contact', '#shopButton');
  await expect(page).toHaveScreenshot('contact-overlay.png', {
    animations: 'disabled',
  });
  await canvasHider.evaluate(style => style.remove());

  expect(runtimeErrors).toEqual([]);
});

test('selected works data renders into the UI', async ({ page }) => {
  const runtimeErrors = await openSite(page);

  await expect(page.locator('.workItem')).toHaveCount(6);
  await expect(page.locator('.workItem img')).toHaveCount(6);

  const titles = await page.locator('.workItem').evaluateAll(items => items.map(item => item.dataset.title));
  const imageAlts = await page.locator('.workItem img').evaluateAll(images => images.map(image => image.alt));

  expect(titles.sort()).toEqual([...expectedWorkTitles].sort());
  expect(imageAlts.sort()).toEqual([...expectedWorkTitles].sort());

  expect(runtimeErrors).toEqual([]);
});
