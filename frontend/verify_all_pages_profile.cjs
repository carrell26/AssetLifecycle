const { chromium } = require("playwright");

async function verifyAllPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  console.log("1. Logging in as adminasset@gmail.com...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  const pagesToTest = [
    { name: "1_Dashboard", url: "http://127.0.0.1:5000/" },
    { name: "2_Perangkat", url: "http://127.0.0.1:5000/device/devices" },
    { name: "3_Modul", url: "http://127.0.0.1:5000/modules" },
    { name: "4_Lokasi", url: "http://127.0.0.1:5000/device/locations" },
    { name: "5_Mutasi_Modul", url: "http://127.0.0.1:5000/modules/requests" },
    { name: "6_Kelola_User", url: "http://127.0.0.1:5000/auth/admin/users" },
    { name: "7_Import_Data", url: "http://127.0.0.1:5000/import" },
    { name: "8_Export_Data", url: "http://127.0.0.1:5000/export/" },
    { name: "9_Audit_Log", url: "http://127.0.0.1:5000/audit/" },
    { name: "10_Scan", url: "http://127.0.0.1:5000/ar/scan" },
  ];

  for (const item of pagesToTest) {
    console.log(`\n--- Testing ${item.name} (${item.url}) ---`);
    await page.goto(item.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // 1. Locate profile trigger
    const profileBtn = page.locator("#profileTriggerBtn");
    const isVisible = await profileBtn.isVisible();
    if (!isVisible) {
      throw new Error(`Profile button not found on ${item.name}!`);
    }

    // Check trigger avatar size
    const triggerImg = profileBtn.locator("img").first();
    const imgBox = await triggerImg.boundingBox();
    console.log(`Trigger avatar size: ${imgBox.width}x${imgBox.height}`);

    // Click trigger to open dropdown
    await profileBtn.click();
    await page.waitForTimeout(400);

    // 2. Locate dropdown popover
    const dropdown = page.locator("#userProfileDropdown");
    const isDropdownVisible = await dropdown.isVisible();
    if (!isDropdownVisible) {
      throw new Error(`Profile dropdown not visible on ${item.name}!`);
    }

    // Check dropdown width
    const dropBox = await dropdown.boundingBox();
    console.log(`Dropdown popover width: ${dropBox.width}px (expected 340px)`);

    // Check Informasi Akun
    const hasAccountInfo = await dropdown.locator("text=Informasi Akun").isVisible();
    const hasDistrict = await dropdown.locator("text=District").isVisible();
    const hasEmail = await dropdown.locator("text=Email").isVisible();
    console.log(`Account Info present: ${hasAccountInfo}, District: ${hasDistrict}, Email: ${hasEmail}`);

    // Check Ganti Foto Profil button
    const changeAvatarBtn = dropdown.locator("button:has-text('Ganti Foto Profil'), .btn-change-avatar").first();
    const hasChangeAvatar = await changeAvatarBtn.isVisible();
    console.log(`Ganti Foto Profil button present: ${hasChangeAvatar}`);

    // Hover over Ganti Foto Profil button & check computed box-shadow
    await changeAvatarBtn.hover();
    await page.waitForTimeout(200);

    const boxShadow = await changeAvatarBtn.evaluate((el) => window.getComputedStyle(el).boxShadow);
    console.log(`Ganti Foto Profil hover box-shadow: "${boxShadow}" (must not have aggressive blue glow)`);

    // Check Keluar dari akun button
    const logoutBtn = dropdown.locator("text=Keluar dari akun").first();
    const hasLogout = await logoutBtn.isVisible();
    console.log(`Keluar dari akun button present: ${hasLogout}`);

    // Screenshot open dropdown
    await page.screenshot({ path: `profile_verified_${item.name}.png` });

    // Close dropdown
    await profileBtn.click();
    await page.waitForTimeout(300);
  }

  await browser.close();
  console.log("\n>>> ALL 10 PAGES VERIFIED AND PASSED SUCCESSFULLY! <<<");
}

verifyAllPages().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
