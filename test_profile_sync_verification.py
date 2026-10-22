"""
Test Script: Verifikasi Sinkronisasi Profil dan Konsistensi Identitas Pengguna
Menguji menggunakan database asli (instance/database.db) dan akun nyata:
- adminasset@gmail.com (Role: admin)
- adhang@gmail.com (Role: karyawan_tif)
- ocean@gmail.com (Role: teknisi)
"""
import unittest
import json
from app import create_app
from app.extensions import db
from app.models import User, AuditLog


class TestProfileSyncAndConsistency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

    def test_01_avatar_url_property_on_models(self):
        """Pastikan model User memiliki properti avatar_url yang berfungsi baik."""
        with self.app.app_context():
            u1 = User.query.filter_by(email="adminasset@gmail.com").first()
            self.assertIsNotNone(u1, "User adminasset harus ada di database asli")
            self.assertTrue(hasattr(u1, "avatar_url"), "User harus memiliki properti avatar_url")
            # u1 memiliki avatar_path
            self.assertTrue(u1.avatar_url.startswith("/static/avatars/"))

            u5 = User.query.filter_by(email="ocean@gmail.com").first()
            self.assertIsNotNone(u5)
            # u5 tidak memiliki avatar
            self.assertIsNone(u5.avatar_url)

    def test_02_get_api_me_no_mock_fallback(self):
        """Pastikan GET /api/me mengembalikan data database asli tanpa fallback dummy 'Witel Donggala / Palu'."""
        with self.app.app_context():
            u1 = User.query.filter_by(email="adminasset@gmail.com").first()
            orig_district = u1.district  # should be None

        # Login sebagai adminasset
        with self.client.session_transaction() as sess:
            sess["_user_id"] = str(u1.user_id)
            sess["_fresh"] = True

        res = self.client.get("/api/me")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["user"]["name"], u1.name)
        self.assertEqual(data["user"]["email"], u1.email)
        self.assertEqual(data["user"]["role"], "admin")
        # District asli di DB adalah None/kosong, bukan mock 'Witel Donggala / Palu'
        self.assertEqual(data["user"]["district"], orig_district)
        self.assertNotEqual(data["user"]["district"], "Witel Donggala / Palu")

    def test_03_no_edit_profile_api(self):
        """Pastikan endpoint PUT /api/me tidak aktif sesuai batasan permintaan user."""
        with self.app.app_context():
            u = User.query.filter_by(email="adhang@gmail.com").first()

        with self.client.session_transaction() as sess:
            sess["_user_id"] = str(u.user_id)
            sess["_fresh"] = True

        res = self.client.put("/api/me", json={"name": "Adhang Edit"})
        # Karena PUT tidak didaftarkan pada /api/me, status harus 405 Method Not Allowed
        self.assertEqual(res.status_code, 405)

    def test_04_base_html_renders_district_and_no_mock(self):
        """Pastikan Jinja base.html (digunakan oleh /modules/requests) merender profil dari database asli."""
        with self.app.app_context():
            u = User.query.filter_by(email="adhang@gmail.com").first()

        with self.client.session_transaction() as sess:
            sess["_user_id"] = str(u.user_id)
            sess["_fresh"] = True

        res = self.client.get("/modules/requests")
        self.assertEqual(res.status_code, 200)
        html = res.get_data(as_text=True)

        # Harus ada nama akun asli
        self.assertIn(u.name, html)
        # Harus ada tanda chevron expand_more pada trigger profil
        self.assertIn("expand_more", html)
        # Harus ada label District (bukan Regional)
        self.assertIn("District", html)
        self.assertNotIn("Regional", html)
        # Tidak boleh ada hardcoded Chatrin Aurelia
        self.assertNotIn("Chatrin Aurelia", html)
        # Harus ada tombol dropdown dengan container
        self.assertIn("userProfileDropdown", html)
        self.assertIn("toggleProfileDropdown", html)

    def test_05_export_audit_scan_profile_consistency(self):
        """Pastikan halaman Jinja (audit log, scan, mutasi) merender profil konsisten."""
        with self.app.app_context():
            admin = User.query.filter_by(email="adminasset@gmail.com").first()

        with self.client.session_transaction() as sess:
            sess["_user_id"] = str(admin.user_id)
            sess["_fresh"] = True

        for path in ["/audit/", "/ar/scan", "/modules/requests"]:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, f"Path {path} harus merespon 200")
            html = res.get_data(as_text=True)
            self.assertIn(admin.name, html, f"{path} harus memuat nama {admin.name}")
            self.assertIn("expand_more", html, f"{path} harus memuat chevron expand_more")
            self.assertIn("userProfileDropdown", html, f"{path} harus memuat dropdown profil")
            self.assertIn("District", html, f"{path} harus menggunakan label District")
            self.assertNotIn("Edit Profil", html, f"{path} tidak boleh memuat fitur Edit Profil")

        # Dan halaman /export/ menyajikan react_index.html dengan bundle SPA
        res_export = self.client.get("/export/")
        self.assertEqual(res_export.status_code, 200)
        self.assertIn("root", res_export.get_data(as_text=True))


if __name__ == "__main__":
    unittest.main()
