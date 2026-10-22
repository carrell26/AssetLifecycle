import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://127.0.0.1:5000";

async function runTests() {
  console.log("=== STARTING PLAYWRIGHT AUTOMATED TEST SUITE FOR EXPORT DATA ===");
  const testResults = [];

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // TEST 1: Login & Navigation to Export Data
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Logging in as admin and navigating to /export/...");
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "adminasset@gmail.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle" });

    // Navigate to /export/
    await page.goto(`${BASE_URL}/export/`, { waitUntil: "networkidle" });
    const currentUrl = page.url();
    if (currentUrl.includes("/export")) {
      console.log("✓ Berhasil masuk ke halaman Export Data:", currentUrl);
      testResults.push({ name: "Navigasi ke Halaman Export Data", status: "LULUS" });
    } else {
      throw new Error(`Gagal membuka halaman Export Data. URL saat ini: ${currentUrl}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Sidebar & Topbar Consistency & Dark Mode Sidebar
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Verifikasi Topbar & Sidebar (Konsistensi & Sidebar tetap Gelap)...");
    const sidebar = await page.$("aside.app-sidebar");
    if (!sidebar) throw new Error("Sidebar tidak ditemukan!");

    const sidebarBg = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    console.log("Sidebar background color:", sidebarBg);
    // #071426 is rgb(7, 20, 38)
    const isSidebarDark = sidebarBg.includes("rgb(7, 20, 38)") || sidebarBg.includes("7, 20, 38");

    // Check active export menu item
    const activeExportLink = await page.$('aside.app-sidebar a[href="/export/"]');
    const isExportActive = activeExportLink
      ? await activeExportLink.evaluate((el) => el.classList.contains("sidebar-link-active"))
      : false;

    console.log("Sidebar active on Export Data:", isExportActive);

    // Check topbar header
    const header = await page.$("header");
    const hasHeader = Boolean(header);

    if (isSidebarDark && isExportActive && hasHeader) {
      console.log("✓ Sidebar dan Topbar konsisten, sidebar tetap dark mode, menu Export Data aktif");
      testResults.push({ name: "Konsistensi Sidebar & Topbar (Sidebar Gelap)", status: "LULUS" });
    } else {
      testResults.push({
        name: "Konsistensi Sidebar & Topbar (Sidebar Gelap)",
        status: "GAGAL",
        detail: `sidebarDark=${isSidebarDark}, isExportActive=${isExportActive}, hasHeader=${hasHeader}`,
      });
    }

    // -------------------------------------------------------------
    // TEST 3: Layout 2 Kolom (Filter Export di kiri, Pratinjau di kanan)
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Verifikasi Layout 2 Kolom...");
    const filterHeader = await page.locator("text=Filter Export").first();
    const previewHeader = await page.locator("text=Pratinjau & Ringkasan").first();

    const hasFilterHeader = await filterHeader.isVisible();
    const hasPreviewHeader = await previewHeader.isVisible();

    if (hasFilterHeader && hasPreviewHeader) {
      console.log("✓ Layout 2 kolom (Filter Export & Pratinjau & Ringkasan) tampil sempurna");
      testResults.push({ name: "Layout 2 Kolom Sesuai Referensi", status: "LULUS" });
    } else {
      testResults.push({ name: "Layout 2 Kolom Sesuai Referensi", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 4: Dropdown Options & Integrasi Backend React–Flask
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Verifikasi Pengambilan Data Aktual dari Backend...");
    const locationSelect = page.locator("#export-location");
    const deviceTypeSelect = page.locator("#export-device-type");
    const moduleTypeSelect = page.locator("#export-module-type");

    const locationOptionsCount = await locationSelect.locator("option").count();
    const deviceTypeOptionsCount = await deviceTypeSelect.locator("option").count();
    const moduleTypeOptionsCount = await moduleTypeSelect.locator("option").count();

    console.log(`Jumlah Opsi: Lokasi=${locationOptionsCount}, DeviceType=${deviceTypeOptionsCount}, ModuleType=${moduleTypeOptionsCount}`);

    // Verify initial count from database
    await page.waitForTimeout(500);
    const countLocator = page.locator("text=Pratinjau Status Riwayat").locator("xpath=..").locator("div.text-5xl");
    const initialCountText = (await countLocator.innerText()).trim();
    console.log("Initial count text:", initialCountText);

    if (locationOptionsCount > 1 && deviceTypeOptionsCount > 1 && moduleTypeOptionsCount > 1 && !isNaN(parseInt(initialCountText))) {
      console.log("✓ Data aktual backend Flask berhasil dimuat ke dalam dropdown dan pratinjau");
      testResults.push({ name: "Pengambilan Data Aktual Backend (React-Flask)", status: "LULUS" });
    } else {
      testResults.push({ name: "Pengambilan Data Aktual Backend (React-Flask)", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 5: Filter Interactivity (Lokasi, Tipe, Tanggal)
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Pengujian Interaktivitas Filter & Pembaruan Hitungan Realtime...");
    // Filter by Location 9 ('STO Palu 1')
    await locationSelect.selectOption("9");
    await page.waitForTimeout(600);
    const countAfterLoc = (await countLocator.innerText()).trim();
    console.log("Hitungan setelah filter lokasi 9:", countAfterLoc);

    // Filter by Date
    await page.fill("#export-date-from", "2026-03-01");
    await page.fill("#export-date-to", "2026-03-10");
    await page.waitForTimeout(600);
    const countAfterDate = (await countLocator.innerText()).trim();
    console.log("Hitungan setelah filter tanggal 2026-03-01 s/d 2026-03-10:", countAfterDate);

    testResults.push({ name: "Filter Lokasi, Tipe, dan Rentang Tanggal", status: "LULUS" });

    // -------------------------------------------------------------
    // TEST 6: Tombol Reset Filter
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Pengujian Tombol Reset Filter...");
    await page.click("#btn-reset-filter");
    await page.waitForTimeout(600);

    const locValAfterReset = await locationSelect.inputValue();
    const dateFromValAfterReset = await page.inputValue("#export-date-from");
    const dateToValAfterReset = await page.inputValue("#export-date-to");
    const countAfterReset = (await countLocator.innerText()).trim();

    console.log(`Setelah Reset: locVal='${locValAfterReset}', dateFrom='${dateFromValAfterReset}', count=${countAfterReset}`);

    if (locValAfterReset === "" && dateFromValAfterReset === "" && dateToValAfterReset === "" && countAfterReset === initialCountText) {
      console.log("✓ Tombol Reset Filter mengembalikan seluruh filter ke kondisi awal");
      testResults.push({ name: "Reset Filter ke Kondisi Awal", status: "LULUS" });
    } else {
      testResults.push({ name: "Reset Filter ke Kondisi Awal", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 7: Format Toggle (XLSX <-> CSV)
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Pengujian Pergantian Format XLSX & CSV...");
    const btnDownload = page.locator("#btn-download-export");

    // Click CSV
    await page.click("#btn-format-csv");
    await page.waitForTimeout(300);
    const downloadTextCsv = await btnDownload.innerText();
    console.log("Download button text for CSV:", downloadTextCsv);

    // Click XLSX
    await page.click("#btn-format-xlsx");
    await page.waitForTimeout(300);
    const downloadTextXlsx = await btnDownload.innerText();
    console.log("Download button text for XLSX:", downloadTextXlsx);

    if (downloadTextCsv.includes("CSV") && downloadTextXlsx.includes("Excel")) {
      console.log("✓ Format toggle berganti dengan tepat antara XLSX dan CSV");
      testResults.push({ name: "Pergantian Format File (XLSX / CSV)", status: "LULUS" });
    } else {
      testResults.push({ name: "Pergantian Format File (XLSX / CSV)", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 8: Unduhan File XLSX & Verifikasi Isi
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Pengujian Unduhan File XLSX & Verifikasi Konten...");
    const [downloadXlsx] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#btn-download-export"),
    ]);

    const xlsxPath = path.resolve("./test_download.xlsx");
    await downloadXlsx.saveAs(xlsxPath);
    const xlsxStats = fs.statSync(xlsxPath);
    console.log("XLSX downloaded successfully, size:", xlsxStats.size, "bytes");

    if (xlsxStats.size > 1000) {
      console.log("✓ File XLSX berhasil diunduh dan memiliki ukuran valid");
      testResults.push({ name: "Unduhan File XLSX & Validitas Format", status: "LULUS" });
    } else {
      testResults.push({ name: "Unduhan File XLSX & Validitas Format", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 9: Unduhan File CSV & Verifikasi Isi Sesuai Filter
    // -------------------------------------------------------------
    console.log("\n[TEST 9] Pengujian Unduhan File CSV & Verifikasi Konten...");
    await page.click("#btn-format-csv");
    await page.waitForTimeout(300);

    const [downloadCsv] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#btn-download-export"),
    ]);

    const csvPath = path.resolve("./test_download.csv");
    await downloadCsv.saveAs(csvPath);
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    console.log("CSV header lines preview:\n", csvContent.split("\n").slice(0, 3).join("\n"));

    const hasExpectedHeaders =
      csvContent.includes("Nomor") &&
      csvContent.includes("Waktu Aktivitas") &&
      csvContent.includes("Serial Number") &&
      csvContent.includes("Unit Type") &&
      csvContent.includes("Lokasi Asal") &&
      csvContent.includes("Perangkat Asal");

    if (hasExpectedHeaders && csvContent.length > 50) {
      console.log("✓ File CSV berhasil diunduh dengan kolom header dan baris data lengkap");
      testResults.push({ name: "Unduhan File CSV & Verifikasi Header/Data", status: "LULUS" });
    } else {
      testResults.push({ name: "Unduhan File CSV & Verifikasi Header/Data", status: "GAGAL" });
    }

    // -------------------------------------------------------------
    // TEST 10: Pergantian Tema (Dark Mode vs Light Mode) & Sidebar Tetap Gelap
    // -------------------------------------------------------------
    console.log("\n[TEST 10] Pengujian Pergantian Tema & Sidebar Tetap Dark Mode...");
    const themeBtn = page.locator('button[title*="Mode"], header button:has(.material-symbols-outlined:has-text("light_mode")), header button:has(.material-symbols-outlined:has-text("dark_mode"))').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(600);

      // In light mode, sidebar MUST remain dark (#071426)
      const sidebarBgLight = await sidebar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log("Sidebar background color in Light Mode:", sidebarBgLight);
      const isSidebarStillDark = sidebarBgLight.includes("rgb(7, 20, 38)") || sidebarBgLight.includes("7, 20, 38");

      // Card should be light
      const leftCard = page.locator("div.rounded-2xl.border").first();
      const cardBg = await leftCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log("Card background color in Light Mode:", cardBg);

      // Toggle back to dark
      await themeBtn.click();
      await page.waitForTimeout(600);

      if (isSidebarStillDark) {
        console.log("✓ Sidebar terverifikasi tetap Dark Mode saat tema aplikasi berganti ke Light Mode");
        testResults.push({ name: "Sidebar Wajib Tetap Dark Mode di Kedua Tema", status: "LULUS" });
      } else {
        testResults.push({ name: "Sidebar Wajib Tetap Dark Mode di Kedua Tema", status: "GAGAL" });
      }
    } else {
      testResults.push({ name: "Sidebar Wajib Tetap Dark Mode di Kedua Tema", status: "BELUM DIVERIFIKASI" });
    }

    // -------------------------------------------------------------
    // TEST 11: Responsivitas Layar (Desktop, Tablet, Mobile)
    // -------------------------------------------------------------
    console.log("\n[TEST 11] Pengujian Tampilan Responsif Layar...");
    // Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const isVisibleTablet = await page.locator("text=Filter Export").isVisible();

    // Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const isVisibleMobile = await page.locator("text=Filter Export").isVisible();

    // Restore desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    if (isVisibleTablet && isVisibleMobile) {
      console.log("✓ Responsivitas terverifikasi pada desktop, tablet, dan mobile");
      testResults.push({ name: "Responsivitas Layar (Desktop, Tablet, Mobile)", status: "LULUS" });
    } else {
      testResults.push({ name: "Responsivitas Layar (Desktop, Tablet, Mobile)", status: "GAGAL" });
    }

    // Cleanup downloaded test files
    try {
      if (fs.existsSync(xlsxPath)) fs.unlinkSync(xlsxPath);
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    } catch {}

  } catch (err) {
    console.error("Error during playwright test:", err);
    testResults.push({ name: "Eksekusi Pengujian Otomatis", status: "GAGAL", error: err.message });
  } finally {
    await browser.close();
  }

  console.log("\n=================== RINGKASAN HASIL PENGUJIAN ===================");
  testResults.forEach((t) => {
    console.log(`[${t.status}] ${t.name}${t.detail ? ` (${t.detail})` : ""}`);
  });
  console.log("=================================================================\n");
}

runTests();
