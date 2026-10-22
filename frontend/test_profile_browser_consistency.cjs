const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  console.log("1. Logging in as adminasset@gmail.com...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // 1. Dashboard
  console.log("2. Capturing Dashboard Profile Dropdown...");
  await page.goto("http://127.0.0.1:5000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const dashTrigger = page.locator('header button:has(img)').first();
  await dashTrigger.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "dashboard_profile_dropdown_verified.png" });
  console.log("-> Saved dashboard_profile_dropdown_verified.png");

  // 2. Mutasi Modul
  console.log("3. Capturing Mutasi Modul Profile Dropdown...");
  await page.goto("http://127.0.0.1:5000/modules/requests", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const mutasiTrigger = page.locator('#profileTriggerBtn');
  await mutasiTrigger.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "mutasi_modul_profile_dropdown_verified.png" });
  console.log("-> Saved mutasi_modul_profile_dropdown_verified.png");

  // 3. Export Data
  console.log("4. Capturing Export Data Profile Dropdown...");
  await page.goto("http://127.0.0.1:5000/export/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const exportTrigger = page.locator('header button:has(img)').first();
  await exportTrigger.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "export_profile_dropdown_verified.png" });
  console.log("-> Saved export_profile_dropdown_verified.png");

  // 4. Audit Log
  console.log("5. Capturing Audit Log Profile Dropdown...");
  await page.goto("http://127.0.0.1:5000/audit/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const auditTrigger = page.locator('#profileTriggerBtn');
  await auditTrigger.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "audit_profile_dropdown_verified.png" });
  console.log("-> Saved audit_profile_dropdown_verified.png");

  // 5. Scan
  console.log("6. Capturing Scan Profile Dropdown...");
  await page.goto("http://127.0.0.1:5000/ar/scan", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const scanTrigger = page.locator('#profileTriggerBtn');
  await scanTrigger.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "scan_profile_dropdown_verified.png" });
  console.log("-> Saved scan_profile_dropdown_verified.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch(console.error);
