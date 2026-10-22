const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("1. Menguji Login Super Admin...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "super_admin_view.png", fullPage: true });
  console.log("  Foto dashboard Super Admin tersimpan: super_admin_view.png");

  // Periksa sidebar teks
  const adminNav = await page.$$eval("nav a", els => els.map(e => e.textContent.trim()));
  console.log("  Nav items Super Admin:", adminNav);

  // Logout
  await page.goto("http://127.0.0.1:5000/auth/logout");
  await page.waitForTimeout(1000);

  console.log("2. Menguji Login Karyawan TIF...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adhang@gmail.com");
  await page.fill('input[type="password"]', "adhang123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "karyawan_tif_view.png", fullPage: true });
  console.log("  Foto dashboard Karyawan TIF tersimpan: karyawan_tif_view.png");

  const tifNav = await page.$$eval("nav a", els => els.map(e => e.textContent.trim()));
  console.log("  Nav items Karyawan TIF:", tifNav);

  // Logout
  await page.goto("http://127.0.0.1:5000/auth/logout");
  await page.waitForTimeout(1000);

  console.log("3. Menguji Login Teknisi...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "ocean@gmail.com");
  await page.fill('input[type="password"]', "ocean123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "teknisi_view.png", fullPage: true });
  console.log("  Foto dashboard Teknisi tersimpan: teknisi_view.png");

  const tekNav = await page.$$eval("nav a", els => els.map(e => e.textContent.trim()));
  console.log("  Nav items Teknisi:", tekNav);

  await browser.close();
  console.log("Pengujian browser selesai.");
}

run().catch(err => {
  console.error("Browser test error:", err);
  process.exit(1);
});
