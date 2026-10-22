const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "C:/Users/MSI GAMING/.gemini/antigravity-ide/brain/020dfb92-0d04-4730-a9ea-0c16b3f2749f";

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("=== BROWSER VERIFICATION: RESTORED ORIGINAL DESIGN ===");

  // 1. Login
  console.log("1. Logging in...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Dashboard KPI
  console.log("2. Capturing Dashboard KPI (Restored Design)...");
  await page.goto("http://127.0.0.1:5000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "dashboard_kpi_restored.png") });
  console.log("  -> Dashboard screenshot saved: dashboard_kpi_restored.png");

  // 3. Modules Page
  console.log("3. Capturing Modules Page (Restored Design)...");
  await page.goto("http://127.0.0.1:5000/modules", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "modules_page_restored.png") });
  console.log("  -> Modules screenshot saved: modules_page_restored.png");

  // 4. Open Detail Modul Modal
  console.log("4. Testing Detail Module Modal (Restored Design)...");
  const detailBtn = await page.locator('button[title="Detail Modul"]').first();
  if (await detailBtn.count() > 0) {
    await detailBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "module_detail_restored.png") });
    console.log("  -> Module detail modal screenshot saved: module_detail_restored.png");
    await page.locator('button:has-text("Tutup")').click();
    await page.waitForTimeout(500);
  }

  // 5. Devices Page
  console.log("5. Testing Devices Page and Detail Perangkat...");
  await page.goto("http://127.0.0.1:5000/device/devices", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "devices_page_restored.png") });
  console.log("  -> Devices page screenshot saved: devices_page_restored.png");

  // 6. Open Detail Perangkat for Palu 1
  console.log("6. Opening Detail Perangkat for Palu 1...");
  const devDetailBtn = await page.locator('button[title*="Detail Perangkat"]').first();
  if (await devDetailBtn.count() > 0) {
    await devDetailBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "device_detail_modal_restored.png") });
    console.log("  -> Device detail modal screenshot saved: device_detail_modal_restored.png");
  }

  console.log("=== BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===");
  await browser.close();
}

verify().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
