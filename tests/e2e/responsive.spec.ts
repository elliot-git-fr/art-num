import { expect, test } from '@playwright/test';

test('desktop and large desktop prioritize the canvas', async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 2560, height: 1440 }]) {
    await page.setViewportSize(viewport); await page.goto('/');
    await expect(page.locator('.mobile-nav')).toBeHidden();
    await expect(page.locator('.left-panel')).toBeVisible(); await expect(page.locator('.right-panel')).toBeVisible();
    const canvas = await page.locator('.canvas-wrap').boundingBox();
    expect(canvas).not.toBeNull(); expect(canvas!.width).toBeGreaterThan(viewport.width * .5); expect(canvas!.height).toBeGreaterThan(viewport.height * .75);
  }
});

test('tablet portrait uses on-demand panels', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 }); await page.goto('/');
  await expect(page.locator('.studio')).toHaveAttribute('data-layout', 'tablet-portrait');
  await expect(page.locator('.mobile-nav')).toBeVisible(); await expect(page.locator('.left-panel')).toBeHidden();
  await page.getByRole('button', { name: 'Art', exact: true }).click(); await expect(page.locator('.left-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Parameters' }).click(); await expect(page.locator('.right-panel')).toBeVisible(); await expect(page.locator('.left-panel')).toBeHidden();
  await page.getByRole('button', { name: 'Parameters' }).click(); await expect(page.locator('.right-panel')).toBeHidden();
});

test('mobile drawers are touch-sized and never overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await expect(page.locator('.studio')).toHaveAttribute('data-layout', 'mobile-portrait');
  const buttons = page.locator('.mobile-nav button'); expect(await buttons.count()).toBe(5);
  for (const button of await buttons.all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Colors' }).click(); await expect(page.locator('.palette-section')).toBeVisible();
  await page.getByRole('button', { name: 'Presets' }).click(); await expect(page.locator('.preset-list')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('layers can be added, selected, composited and managed',async({page})=>{await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.getByRole('button',{name:'Add Layer'}).click();await page.locator('.add-layer-select').selectOption('flow');await page.locator('[data-action="confirm-add-layer"]').click();await expect(page.locator('.layer-item')).toHaveCount(2);const active=page.locator('.layer-item.active');await active.locator('[data-layer-opacity]').evaluate((element:HTMLInputElement)=>{element.value='.42';element.dispatchEvent(new Event('input',{bubbles:true}));});await active.locator('[data-layer-blend]').selectOption('screen');await active.getByRole('button',{name:/Hide/}).click();await expect(active.getByRole('button',{name:/Show/})).toBeVisible();await active.getByRole('button',{name:/Show/}).click();await active.getByRole('button',{name:/Solo/}).click();await active.getByRole('button',{name:/Duplicate/}).click();await expect(page.locator('.layer-item')).toHaveCount(3);});

test('layers drawer is available on mobile',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await page.getByRole('button',{name:'Layers',exact:true}).click();await expect(page.locator('.layers-panel')).toBeVisible();await expect(page.locator('.canvas-wrap')).toBeVisible();});

test('orientation changes resize a live canvas without errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const before = await page.locator('canvas').evaluate(element => { const canvas=element as HTMLCanvasElement; return { width: canvas.width, height: canvas.height }; });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.studio')).toHaveAttribute('data-layout', 'mobile-landscape');
  const after = await page.locator('canvas').evaluate(element => { const canvas=element as HTMLCanvasElement; return { width: canvas.width, height: canvas.height }; });
  expect(after.width).toBeGreaterThan(0); expect(after.height).toBeGreaterThan(0); expect(after).not.toEqual(before);
  await page.locator('canvas').dispatchEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 100, clientY: 100, buttons: 1, pressure: .5 });
  await page.locator('canvas').dispatchEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 120, clientY: 110, buttons: 0, pressure: 0 });
  expect(errors).toEqual([]);
});
