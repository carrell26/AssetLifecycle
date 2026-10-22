"""
Comprehensive Automated Test Suite: Kelola User & Removal of Register
Testing all 12 points specified in user request.
"""
import unittest
from app import create_app
from app.extensions import db
from app.models import User, AuditLog, ModuleMovement

class TestKelolaUserVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app.config['WTF_CSRF_ENABLED'] = False
        cls.client = cls.app.test_client()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def login(self, email, password):
        return self.client.post('/auth/login-api', json={
            'email': email,
            'password': password
        })

    def logout(self):
        return self.client.get('/auth/logout', follow_redirects=True)

    # 1. Login dan Logout tetap berfungsi
    def test_01_login_and_logout(self):
        print("\n--- Test 1: Login dan Logout ---")
        res_login = self.login('adminasset@gmail.com', 'admin123')
        self.assertEqual(res_login.status_code, 200)
        self.assertTrue(res_login.get_json()['success'])

        # Check me endpoint
        res_me = self.client.get('/api/me')
        self.assertEqual(res_me.status_code, 200)
        data = res_me.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['email'], 'adminasset@gmail.com')
        self.assertEqual(data['user']['role'], 'admin')

        # Logout
        res_logout = self.logout()
        self.assertEqual(res_logout.status_code, 200)
        res_me_after = self.client.get('/api/me')
        self.assertIn(res_me_after.status_code, [401, 302])
        print("PASS: Login dan logout berfungsi normal.")

    # 2. Halaman Register mandiri tidak lagi dapat digunakan
    def test_02_register_page_disabled(self):
        print("\n--- Test 2: Register Mandiri Dinonaktifkan ---")
        # GET /auth/register should redirect to login
        res_get = self.client.get('/auth/register', follow_redirects=False)
        self.assertIn(res_get.status_code, [302, 301])
        self.assertIn('/auth/login', res_get.headers.get('Location', ''))

        # POST /auth/register-api should be 403 Forbidden
        res_api = self.client.post('/auth/register-api', json={
            'name': 'Self Registered',
            'email': 'self@telkom.co.id',
            'password': 'password123',
            'district': 'PALU1',
            'terms': True
        })
        self.assertEqual(res_api.status_code, 403)
        api_data = res_api.get_json()
        self.assertFalse(api_data['success'])
        self.assertIn('dinonaktifkan', api_data.get('error', '').lower())
        print("PASS: Pendaftaran mandiri berhasil dinonaktifkan.")

    # 3. Admin dapat membuka Kelola User dan melihat daftar akun
    def test_03_admin_view_users(self):
        print("\n--- Test 3: Admin Kelola User dan Daftar Akun ---")
        self.login('adminasset@gmail.com', 'admin123')
        
        # HTML Route
        res_page = self.client.get('/auth/admin/users')
        self.assertEqual(res_page.status_code, 200)

        # API Route
        res_api = self.client.get('/api/admin/users')
        self.assertEqual(res_api.status_code, 200)
        data = res_api.get_json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['users'], list)
        self.assertGreater(len(data['users']), 0)
        print(f"PASS: Admin berhasil melihat {len(data['users'])} akun.")

    # 4 & 5. Admin dapat membuat akun Karyawan TIF dan Teknisi via Daftarkan User
    def test_04_05_admin_create_users(self):
        print("\n--- Test 4 & 5: Admin Membuat Akun Karyawan TIF dan Teknisi ---")
        self.login('adminasset@gmail.com', 'admin123')

        # Clean existing test users if any
        for email in ['test_karyawan_t2@telkom.co.id', 'test_teknisi_t2@telkom.co.id']:
            u = User.query.filter_by(email=email).first()
            if u:
                AuditLog.query.filter_by(user_id=u.user_id).delete()
                db.session.delete(u)
        db.session.commit()

        # Create Karyawan TIF
        res_kt = self.client.post('/api/admin/users', json={
            'name': 'Test Karyawan TIF Dua',
            'email': 'test_karyawan_t2@telkom.co.id',
            'role': 'karyawan_tif',
            'district': 'PALU1',
            'password': 'PasswordKaryawan123!'
        })
        self.assertEqual(res_kt.status_code, 201)
        data_kt = res_kt.get_json()
        self.assertTrue(data_kt['success'])
        self.assertEqual(data_kt['user']['role'], 'karyawan_tif')
        self.assertEqual(data_kt['user']['status'], 'aktif')

        # Create Teknisi
        res_tek = self.client.post('/api/admin/users', json={
            'name': 'Test Teknisi Dua',
            'email': 'test_teknisi_t2@telkom.co.id',
            'role': 'teknisi',
            'district': 'DONGGALA',
            'password': 'PasswordTeknisi123!'
        })
        self.assertEqual(res_tek.status_code, 201)
        data_tek = res_tek.get_json()
        self.assertTrue(data_tek['success'])
        self.assertEqual(data_tek['user']['role'], 'teknisi')
        self.assertEqual(data_tek['user']['status'], 'aktif')

        print("PASS: Admin berhasil membuat akun Karyawan TIF dan Teknisi dengan status langsung aktif.")

    # 6. Password awal tersimpan sebagai hash, bukan teks biasa
    def test_06_password_stored_as_hash(self):
        print("\n--- Test 6: Verifikasi Password Hash di Database ---")
        u = User.query.filter_by(email='test_karyawan_t2@telkom.co.id').first()
        self.assertIsNotNone(u)
        self.assertNotEqual(u.password, 'PasswordKaryawan123!')
        self.assertTrue(u.password.startswith('scrypt:') or u.password.startswith('pbkdf2:'))
        self.assertTrue(u.check_password('PasswordKaryawan123!'))
        print("PASS: Password tersimpan sebagai hash yang aman (bukan plain text).")

    # 7. Password tidak muncul pada daftar, detail, maupun respons API
    def test_07_no_password_in_api(self):
        print("\n--- Test 7: Password Tidak Muncul di Respons API ---")
        self.login('adminasset@gmail.com', 'admin123')

        # List
        res_list = self.client.get('/api/admin/users')
        data_list = res_list.get_json()
        self.assertTrue(data_list['success'])
        for u in data_list['users']:
            self.assertNotIn('password', u)
            self.assertNotIn('password_hash', u)

        # Detail
        u_db = User.query.filter_by(email='test_karyawan_t2@telkom.co.id').first()
        res_detail = self.client.get(f'/api/admin/users/{u_db.user_id}')
        data_detail = res_detail.get_json()
        self.assertTrue(data_detail['success'])
        self.assertNotIn('password', data_detail['user'])
        self.assertNotIn('password_hash', data_detail['user'])
        print("PASS: Password dan hash tidak pernah terekspos di API.")

    # 8. Admin dapat melihat detail, mengedit, dan mereset password
    def test_08_admin_edit_user(self):
        print("\n--- Test 8: Admin Edit Pengguna ---")
        self.login('adminasset@gmail.com', 'admin123')
        u_db = User.query.filter_by(email='test_karyawan_t2@telkom.co.id').first()

        # Update
        res_edit = self.client.put(f'/api/admin/users/{u_db.user_id}', json={
            'name': 'Test Karyawan TIF Dua Updated',
            'email': 'test_karyawan_t2@telkom.co.id',
            'role': 'karyawan_tif',
            'district': 'PARIGI',
            'status': 'aktif'
        })
        self.assertEqual(res_edit.status_code, 200)
        data_edit = res_edit.get_json()
        self.assertTrue(data_edit['success'])

        u_refreshed = User.query.get(u_db.user_id)
        self.assertEqual(u_refreshed.name, 'Test Karyawan TIF Dua Updated')
        self.assertEqual(u_refreshed.district, 'PARIGI')
        print("PASS: Admin berhasil memperbarui data akun pengguna.")

    # 9. Fitur Reset Password berfungsi, password lama diganti hash baru
    def test_09_reset_password(self):
        print("\n--- Test 9: Fitur Reset Password ---")
        self.login('adminasset@gmail.com', 'admin123')
        u_db = User.query.filter_by(email='test_karyawan_t2@telkom.co.id').first()

        res_reset = self.client.post(f'/api/admin/users/{u_db.user_id}/reset-password', json={
            'new_password': 'BrandNewPassword456!'
        })
        self.assertEqual(res_reset.status_code, 200)
        data_reset = res_reset.get_json()
        self.assertTrue(data_reset['success'])

        # Verify old password no longer works, new password works
        self.logout()
        res_fail = self.login('test_karyawan_t2@telkom.co.id', 'PasswordKaryawan123!')
        self.assertEqual(res_fail.status_code, 401)

        res_ok = self.login('test_karyawan_t2@telkom.co.id', 'BrandNewPassword456!')
        self.assertEqual(res_ok.status_code, 200)
        res_me_ok = self.client.get('/api/me')
        self.assertEqual(res_me_ok.status_code, 200)
        print("PASS: Reset password sukses, password lama ditolak, password baru berhasil digunakan.")

    # 10. Karyawan TIF dan Teknisi tidak dapat mengakses endpoint pengelolaan akun (HTTP 403)
    def test_10_non_admin_forbidden(self):
        print("\n--- Test 10: Otorisasi Backend Non-Admin Ditolak 403 ---")
        # Test as Karyawan TIF
        self.logout()
        res_tif_login = self.login('adhang@gmail.com', 'adhang123')
        self.assertEqual(res_tif_login.status_code, 200)
        res_kt = self.client.get('/api/admin/users')
        self.assertEqual(res_kt.status_code, 403)

        res_kt_post = self.client.post('/api/admin/users', json={'name': 'Hacker'})
        self.assertEqual(res_kt_post.status_code, 403)

        # Test as Teknisi
        self.logout()
        res_tek_login = self.login('ocean@gmail.com', 'ocean123')
        self.assertEqual(res_tek_login.status_code, 200)
        res_tek = self.client.get('/api/admin/users')
        self.assertEqual(res_tek.status_code, 403)

        res_tek_reset = self.client.post('/api/admin/users/1/reset-password', json={'new_password': 'abc'})
        self.assertEqual(res_tek_reset.status_code, 403)

        print("PASS: Karyawan TIF dan Teknisi ditolak dengan HTTP 403 saat mengakses endpoint kelola akun.")

    # 11. Penghapusan akun menangani relasi database dengan aman
    def test_11_safe_deletion(self):
        print("\n--- Test 11: Penghapusan Akun Aman & Proteksi Relasi DB ---")
        self.login('adminasset@gmail.com', 'admin123')

        # 11a. Admin cannot delete themselves
        admin_u = User.query.filter_by(email='adminasset@gmail.com').first()
        res_self = self.client.delete(f'/api/admin/users/{admin_u.user_id}')
        self.assertEqual(res_self.status_code, 400)
        self.assertIn('sendiri', res_self.get_json()['error'])

        # 11b. User with activity history cannot be hard deleted
        adhang = User.query.filter_by(email='adhang@gmail.com').first()
        self.assertIsNotNone(adhang)
        res_del_protected = self.client.delete(f'/api/admin/users/{adhang.user_id}')
        self.assertEqual(res_del_protected.status_code, 400)
        self.assertIn('riwayat', res_del_protected.get_json()['error'])

        # 11c. User with NO activity can be safely deleted
        res_create = self.client.post('/api/admin/users', json={
            'name': 'Clean User To Delete',
            'email': 'clean_delete@telkom.co.id',
            'role': 'teknisi',
            'district': 'BUOL',
            'password': 'CleanPassword123!'
        })
        clean_id = res_create.get_json()['user']['user_id']
        res_del_clean = self.client.delete(f'/api/admin/users/{clean_id}')
        self.assertEqual(res_del_clean.status_code, 200)
        self.assertIsNone(User.query.get(clean_id))

        print("PASS: Proteksi penghapusan akun dan integritas relasi DB berjalan sempurna.")

    # 12. Daftarkan Karyawan redirect ke Kelola User
    def test_12_register_karyawan_redirect(self):
        print("\n--- Test 12: Redirect Daftarkan Karyawan ke Kelola User ---")
        self.login('adminasset@gmail.com', 'admin123')
        res = self.client.get('/auth/admin/register-karyawan', follow_redirects=False)
        self.assertIn(res.status_code, [302, 301])
        self.assertIn('/auth/admin/users', res.headers.get('Location', ''))
        print("PASS: /auth/admin/register-karyawan otomatis mengarah ke /auth/admin/users.")

if __name__ == '__main__':
    unittest.main()
