const { chromium } = require("playwright");
const path = require("path");

const ARTIFACT_DIR = "C:/Users/MSI GAMING/.gemini/antigravity-ide/brain/020dfb92-0d04-4730-a9ea-0c16b3f2749f";

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("=== BROWSER VERIFICATION: FASE 1 (CARD & SFP SEPARATION) ===");

  // 1. Login
  console.log("1. Logging in...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Dashboard KPI
  console.log("2. Checking Dashboard KPI...");
  await page.goto("http://127.0.0.1:5000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "dashboard_kpi_phase1.png") });
  console.log("  -> Dashboard screenshot saved: dashboard_kpi_phase1.png");

  // 3. Modules Page
  console.log("3. Checking Modules Inventory Page...");
  await page.goto("http://127.0.0.1:5000/modules", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "modules_all_assets_phase1.png") });
  console.log("  -> Modules 'Semua Aset' screenshot saved: modules_all_assets_phase1.png");

  // 4. Click 'Card Utama' Tab
  console.log("4. Switching to 'Card Utama' Tab...");
  const cardTab = await page.getByRole("button", { name: "Card Utama" });
  if (await cardTab.count() > 0) {
    await cardTab.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "modules_cards_tab_phase1.png") });
    console.log("  -> Modules 'Card Utama' tab screenshot saved: modules_cards_tab_phase1.png");
  } else {
    console.log("  Warning: Card Utama tab not found by text");
  }

  // 5. Click 'Transceiver SFP' Tab
  console.log("5. Switching to 'Transceiver SFP' Tab...");
  const sfpTab = await page.getByRole("button", { name: "Transceiver SFP" });
  if (await sfpTab.count() > 0) {
    await sfpTab.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "modules_sfp_tab_phase1.png") });
    console.log("  -> Modules 'Transceiver SFP' tab screenshot saved: modules_sfp_tab_phase1.png");
  } else {
    console.log("  Warning: Transceiver SFP tab not found by text");
  }

  // 6. Test Detail Modal on first item
  console.log("6. Opening Detail Modal...");
  const detailBtn = await page.locator('button[title="Detail Modul"]').first();
  if (await detailBtn.count() > 0) {
    await detailBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "module_detail_modal_phase1.png") });
    console.log("  -> Detail modal screenshot saved: module_detail_modal_phase1.png");
  }

  console.log("=== BROWSER VERIFICATION COMPLETED SUCCESSFULLY ===");
  await browser.close();
}

verify().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
