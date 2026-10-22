const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5000/auth/login');
  await page.fill('input[type="email"]', 'adminasset@gmail.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // 1. Dashboard
  await page.goto('http://127.0.0.1:5000/');
  await page.waitForTimeout(1000);
  const dashBtn = page.locator('header button:has(img)').first();
  const dashInfo = await dashBtn.evaluate(el => ({
    tagName: el.tagName,
    className: el.className,
    backgroundColor: window.getComputedStyle(el).backgroundColor,
    backgroundImage: window.getComputedStyle(el).backgroundImage,
    boxShadow: window.getComputedStyle(el).boxShadow,
    border: window.getComputedStyle(el).border,
    padding: window.getComputedStyle(el).padding,
    margin: window.getComputedStyle(el).margin,
    parentTag: el.parentElement.tagName,
    parentClass: el.parentElement.className,
    parentBg: window.getComputedStyle(el.parentElement).backgroundColor,
    parentShadow: window.getComputedStyle(el.parentElement).boxShadow,
    parentBorder: window.getComputedStyle(el.parentElement).border,
  }));
  console.log('DASHBOARD PROFILE BTN:', JSON.stringify(dashInfo, null, 2));

  // 2. Mutasi Modul
  await page.goto('http://127.0.0.1:5000/modules/requests');
  await page.waitForTimeout(1000);
  const mutasiBtn = page.locator('#profileTriggerBtn');
  const mutasiInfo = await mutasiBtn.evaluate(el => ({
    tagName: el.tagName,
    className: el.className,
    backgroundColor: window.getComputedStyle(el).backgroundColor,
    backgroundImage: window.getComputedStyle(el).backgroundImage,
    boxShadow: window.getComputedStyle(el).boxShadow,
    border: window.getComputedStyle(el).border,
    padding: window.getComputedStyle(el).padding,
    margin: window.getComputedStyle(el).margin,
    parentTag: el.parentElement.tagName,
    parentClass: el.parentElement.className,
    parentBg: window.getComputedStyle(el.parentElement).backgroundColor,
    parentShadow: window.getComputedStyle(el.parentElement).boxShadow,
    parentBorder: window.getComputedStyle(el.parentElement).border,
  }));
  console.log('MUTASI MODUL PROFILE BTN:', JSON.stringify(mutasiInfo, null, 2));

  await browser.close();
})();
