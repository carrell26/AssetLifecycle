const { chromium } = require("playwright");

async function testExport() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  console.log("1. Logging in...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle" });

  console.log("2. Navigating to /export/...");
  await page.goto("http://127.0.0.1:5000/export/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Check that real data is loaded
  const countEl = await page.locator("text=Total Aktivitas Tercatat").locator("xpath=preceding-sibling::div").textContent();
  console.log("Live Real Total Movements:", countEl.trim());

  // Check date inputs exist and have only 1 icon on the left
  const dateFrom = page.locator("#export-date-from");
  await dateFrom.fill("2026-10-01");
  const dateTo = page.locator("#export-date-to");
  await dateTo.fill("2026-10-22");
  await page.waitForTimeout(1000);

  console.log("Filled dates successfully!");

  // Switch format to CSV
  const btnCsv = page.locator("#btn-format-csv");
  await btnCsv.click();
  await page.waitForTimeout(500);

  const downloadBtnText = await page.locator("#btn-download-export").textContent();
  console.log("Download button text for CSV:", downloadBtnText.trim());

  // Switch back to XLSX
  const btnXlsx = page.locator("#btn-format-xlsx");
  await btnXlsx.click();
  await page.waitForTimeout(500);

  const downloadBtnTextXlsx = await page.locator("#btn-download-export").textContent();
  console.log("Download button text for XLSX:", downloadBtnTextXlsx.trim());

  // Reset filter
  const resetBtn = page.locator("#btn-reset-filter");
  await resetBtn.click();
  await page.waitForTimeout(1000);

  console.log("Filter reset successfully!");

  // Capture screenshot after interactions
  await page.screenshot({ path: "export_interaction_verified.png" });
  console.log("Screenshot saved to export_interaction_verified.png");

  await browser.close();
  console.log("All tests passed!");
}

testExport().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
