const { chromium } = require("playwright");

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log("=== PENGUJIAN BROWSER KELOLA USER & REGISTER ===");

  // 1. Verifikasi Halaman Login (tidak ada link Daftar)
  console.log("\n1. Memeriksa Halaman Login (/auth/login)...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const loginContent = await page.content();
  const hasRegisterLink = loginContent.includes('href="/auth/register"') || loginContent.includes('Daftar sekarang');
  console.log(`  Verifikasi link register di Login: ${hasRegisterLink ? 'GAGAL (Masih ada)' : 'BERHASIL (Sudah bersih)'}`);
  await page.screenshot({ path: "login_no_register.png" });

  // 2. Verifikasi akses langsung ke /auth/register diarahkan ke login
  console.log("\n2. Memeriksa Akses Langsung ke /auth/register...");
  await page.goto("http://127.0.0.1:5000/auth/register", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  console.log(`  URL saat ini setelah akses /auth/register: ${page.url()}`);

  // 3. Login sebagai Super Admin
  console.log("\n3. Login sebagai Super Admin...");
  await page.goto("http://127.0.0.1:5000/auth/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', "adminasset@gmail.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 4. Buka Menu Kelola User
  console.log("\n4. Membuka Menu Kelola User (/auth/admin/users)...");
  await page.goto("http://127.0.0.1:5000/auth/admin/users", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Periksa Sidebar: tidak boleh ada 'Daftarkan Karyawan'
  const navItems = await page.$$eval("nav a", els => els.map(e => e.textContent.trim()));
  console.log("  Navigasi Sidebar saat ini:", navItems);
  const hasDaftarkanKaryawan = navItems.some(item => item.includes("Daftarkan Karyawan"));
  console.log(`  Sidebar Daftarkan Karyawan: ${hasDaftarkanKaryawan ? 'GAGAL (Masih ada)' : 'BERHASIL (Sudah dihapus)'}`);

  await page.screenshot({ path: "kelola_user_table.png", fullPage: true });
  console.log("  Screenshot tabel pengguna tersimpan: kelola_user_table.png");

  // 5. Klik Tombol "Daftarkan User"
  console.log("\n5. Menekan Tombol Daftarkan User...");
  await page.click('#btn-daftarkan-user');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: "daftarkan_user_form.png", fullPage: true });
  console.log("  Screenshot formulir pendaftaran tersimpan: daftarkan_user_form.png");

  // 6. Isi Formulir Daftarkan User Baru (Teknisi)
  console.log("\n6. Mengisi Formulir Pendaftaran Teknisi...");
  // Pilih role Teknisi
  await page.click('text=Teknisi');
  await page.fill('#reg-name', 'Rizky Teknisi Browser');
  await page.fill('#reg-email', 'rizky_tek_browser@telkom.co.id');
  await page.selectOption('#reg-district', 'PALU2');
  await page.fill('#reg-password', 'TeknisiAman123!');
  await page.fill('#reg-confirm-password', 'TeknisiAman123!');
  await page.click('button:has-text("Daftarkan User Sekarang")');
  await page.waitForTimeout(2500);

  await page.screenshot({ path: "after_user_registered.png", fullPage: true });
  console.log("  Screenshot setelah user didaftarkan tersimpan: after_user_registered.png");

  // 7. Buka Modal Detail
  console.log("\n7. Membuka Modal Detail Pengguna...");
  const detailButtons = await page.$$('button[title="Lihat Detail Akun"]');
  if (detailButtons.length > 0) {
    await detailButtons[0].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "user_detail_modal.png" });
    console.log("  Screenshot modal detail tersimpan: user_detail_modal.png");
    // Tutup modal
    await page.click('button:has-text("Tutup")');
    await page.waitForTimeout(500);
  }

  // 8. Buka Modal Reset Password
  console.log("\n8. Membuka Modal Reset Password...");
  const resetButtons = await page.$$('button[title="Reset Password Akun"]');
  if (resetButtons.length > 0) {
    await resetButtons[0].click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "user_reset_password_modal.png" });
    console.log("  Screenshot modal reset password tersimpan: user_reset_password_modal.png");
    // Tutup modal
    await page.click('button:has-text("Batal")');
    await page.waitForTimeout(500);
  }

  // 9. Akses /auth/admin/register-karyawan harus redirect ke /auth/admin/users
  console.log("\n9. Menguji redirect /auth/admin/register-karyawan...");
  await page.goto("http://127.0.0.1:5000/auth/admin/register-karyawan", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  console.log(`  URL hasil pengalihan: ${page.url()}`);

  await browser.close();
  console.log("\n=== SELURUH PENGUJIAN BROWSER SELESAI DENGAN SUKSES ===");
}

run().catch(err => {
  console.error("Terjadi kesalahan pengujian browser:", err);
  process.exit(1);
});
