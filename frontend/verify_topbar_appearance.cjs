const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  console.log("1. Logging in...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  const pagesToTest = [
    { name: "dashboard", url: "http://127.0.0.1:5000/", selector: 'header button:has(img)' },
    { name: "mutasi_modul", url: "http://127.0.0.1:5000/modules/requests", selector: '#profileTriggerBtn' },
    { name: "audit_log", url: "http://127.0.0.1:5000/audit/", selector: '#profileTriggerBtn' },
    { name: "scan", url: "http://127.0.0.1:5000/ar/scan", selector: '#profileTriggerBtn' },
  ];

  for (const item of pagesToTest) {
    console.log(`Checking ${item.name}...`);
    await page.goto(item.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Resting state topbar right area
    const headerRight = page.locator('header > div:last-child');
    await headerRight.screenshot({ path: `topbar_${item.name}_resting.png` });

    // 2. Hover state on profile button
    const btn = page.locator(item.selector).first();
    await btn.hover();
    await page.waitForTimeout(300);
    await headerRight.screenshot({ path: `topbar_${item.name}_hover.png` });

    // Move mouse away
    await page.mouse.move(0, 0);
  }

  await browser.close();
  console.log("Completed capturing all topbar appearances!");
}

run().catch(console.error);
