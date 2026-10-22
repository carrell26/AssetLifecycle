const { chromium } = require("playwright");

async function testProfile() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  console.log("1. Logging in as adminasset@gmail.com...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log("2. Verifying Dashboard Topbar Profile...");
  await page.goto("http://127.0.0.1:5000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Capture Dashboard topbar
  await page.screenshot({ path: "dashboard_topbar.png" });
  console.log("-> Captured dashboard_topbar.png");

  // Click profile trigger on Dashboard
  console.log("3. Opening Dashboard profile dropdown...");
  const dashboardProfileBtn = page.locator('header button:has(img)').first();
  await dashboardProfileBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "dashboard_profile_dropdown.png" });
  console.log("-> Captured dashboard_profile_dropdown.png");

  // Check District text inside dropdown
  const dropdownText = await page.textContent('body');
  console.log("Dashboard Dropdown has 'District':", dropdownText.includes("District"));
  console.log("Dashboard Dropdown has 'Regional':", dropdownText.includes("Regional"));

  // Click Edit Profil button
  console.log("4. Testing Edit Profil Modal...");
  const editProfileBtn = page.locator('button:has-text("Edit Profil")');
  if (await editProfileBtn.isVisible()) {
    await editProfileBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "edit_profile_modal.png" });
    console.log("-> Captured edit_profile_modal.png");

    // Select District PALU1 and submit
    await page.selectOption('select', 'PALU1');
    await page.click('button:has-text("Simpan Perubahan")');
    await page.waitForTimeout(1200);

    // Reopen dropdown to verify instant update
    await dashboardProfileBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "dashboard_profile_updated.png" });
    console.log("-> Captured dashboard_profile_updated.png");
  }

  // Navigate to Mutasi Modul (/modules/requests)
  console.log("5. Navigating to Mutasi Modul (/modules/requests)...");
  await page.goto("http://127.0.0.1:5000/modules/requests", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "mutasi_modul_topbar.png" });
  console.log("-> Captured mutasi_modul_topbar.png");

  // Click profile trigger on Mutasi Modul
  console.log("6. Opening Mutasi Modul profile dropdown...");
  const mutasiProfileBtn = page.locator('#profileTriggerBtn');
  await mutasiProfileBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "mutasi_modul_profile_dropdown.png" });
  console.log("-> Captured mutasi_modul_profile_dropdown.png");

  // Reset district via API
  console.log("7. Cleaning up test data back to None...");
  await page.evaluate(async () => {
    await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Admin Asset", district: "" })
    });
  });

  await browser.close();
  console.log("All browser tests completed successfully!");
}

testProfile().catch(console.error);
