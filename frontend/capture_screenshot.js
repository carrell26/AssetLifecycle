import { chromium } from "playwright";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  // Login
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle" });

  // Navigate to export
  await page.goto("http://127.0.0.1:5000/export/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Dark Mode Screenshot
  await page.screenshot({ path: "export_page_dark.png" });
  console.log("Captured export_page_dark.png");

  // Toggle to Light Mode
  const themeBtn = page.locator('button[title*="Mode"], header button:has(.material-symbols-outlined)').first();
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: "export_page_light.png" });
    console.log("Captured export_page_light.png");
  }

  await browser.close();
}

capture();
