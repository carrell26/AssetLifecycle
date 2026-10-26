import os
import sys
import unittest
import tempfile
from datetime import datetime

from app import create_app
from app.extensions import db
from app.models import (
    User,
    Location,
    DeviceType,
    Device,
    SlotDefinition,
    ModuleType,
    Module,
    ModulePosition,
    ModuleMovement,
    ModuleRequest,
    RequestApproval,
    AuditLog,
)
from app.modules.audit.routes import verify_chain


class TestDirectModuleMutation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create isolated temporary database file
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.db_path = os.path.join(cls.temp_dir.name, "test_isolated.db")

        test_config = {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{cls.db_path}",
            "WTF_CSRF_ENABLED": False,
            "SECRET_KEY": "test-direct-mutation-secret-key",
        }
        cls.app = create_app(test_config=test_config)
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()
            cls.seed_data()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.engine.dispose()
        try:
            cls.temp_dir.cleanup()
        except Exception:
            pass

    @classmethod
    def seed_data(cls):
        # 1. Users
        admin = User(name="Super Admin", email="admin@test.com", role="admin", status="aktif")
        admin.set_password("admin123")

        tif = User(name="Karyawan TIF", email="tif@test.com", role="karyawan_tif", status="aktif")
        tif.set_password("tif123")

        teknisi = User(name="Teknisi Lapangan", email="teknisi@test.com", role="teknisi", status="aktif")
        teknisi.set_password("teknisi123")

        db.session.add_all([admin, tif, teknisi])

        # 2. Locations
        loc_gmb = Location(nama_lokasi="STO Gambir", district="Gambir", alamat="Jakarta")
        loc_plu = Location(nama_lokasi="STO Palu", district="Palu", alamat="Sulawesi Tengah")
        db.session.add_all([loc_gmb, loc_plu])
        db.session.flush()

        # 3. Device Types & Slots
        dev_type = DeviceType(nama_tipe="7750 SR-7", vendor="Nokia", deskripsi="Service Router")
        db.session.add(dev_type)
        db.session.flush()

        slot1 = SlotDefinition(device_type_id=dev_type.device_type_id, nomor_slot="1", nama_slot="Slot 1")
        slot2 = SlotDefinition(device_type_id=dev_type.device_type_id, nomor_slot="2", nama_slot="Slot 2")
        db.session.add_all([slot1, slot2])
        db.session.flush()

        # 4. Devices
        dev1 = Device(nama_perangkat="PE-GMB-01", hostname="PE-GMB-01", device_type_id=dev_type.device_type_id, location_id=loc_gmb.location_id, status="aktif")
        dev2 = Device(nama_perangkat="PE-PLU-01", hostname="PE-PLU-01", device_type_id=dev_type.device_type_id, location_id=loc_plu.location_id, status="aktif")
        db.session.add_all([dev1, dev2])
        db.session.flush()

        # 5. Module Types
        card_type = ModuleType(nama_tipe="10G-BASE-CARD", vendor="Nokia", deskripsi="Card Utama 10G")
        sfp_type = ModuleType(nama_tipe="SFP-10G-LR", vendor="Nokia", deskripsi="Transceiver SFP+ 10G LR")
        db.session.add_all([card_type, sfp_type])
        db.session.flush()

        # 6. Modules
        # Card module currently installed on dev1, slot 1
        card1 = Module(serial_number="CARD-SN-001", unit_part_number="PN-CARD-001", module_type_id=card_type.module_type_id, kondisi="AKTIF")
        # SFP Transceiver module currently co-existing on dev1, slot 1, port 1
        sfp1 = Module(serial_number="SFP-SN-001", unit_part_number="PN-SFP-001", module_type_id=sfp_type.module_type_id, kondisi="AKTIF")
        # Spare SFP module without active position
        sfp_spare = Module(serial_number="SFP-SN-002", unit_part_number="PN-SFP-002", module_type_id=sfp_type.module_type_id, kondisi="IDLE")
        # Second card module for conflict testing
        card2 = Module(serial_number="CARD-SN-002", unit_part_number="PN-CARD-002", module_type_id=card_type.module_type_id, kondisi="IDLE")

        db.session.add_all([card1, sfp1, sfp_spare, card2])
        db.session.flush()

        # 7. Initial Active Positions
        pos_card1 = ModulePosition(
            module_id=card1.modul_id,
            device_id=dev1.device_id,
            slot_definition_id=slot1.slot_definition_id,
            shelf="1",
            port=None,
            status="aktif",
            installed_at=datetime.utcnow(),
        )
        pos_sfp1 = ModulePosition(
            module_id=sfp1.modul_id,
            device_id=dev1.device_id,
            slot_definition_id=slot1.slot_definition_id,
            shelf="1",
            port="1",
            status="aktif",
            installed_at=datetime.utcnow(),
        )
        db.session.add_all([pos_card1, pos_sfp1])
        db.session.commit()

        # Cache IDs
        cls.admin_id = admin.user_id
        cls.tif_id = tif.user_id
        cls.teknisi_id = teknisi.user_id
        cls.dev1_id = dev1.device_id
        cls.dev2_id = dev2.device_id
        cls.slot1_id = slot1.slot_definition_id
        cls.slot2_id = slot2.slot_definition_id
        cls.card1_id = card1.modul_id
        cls.sfp1_id = sfp1.modul_id
        cls.sfp_spare_id = sfp_spare.modul_id
        cls.card2_id = card2.modul_id
        cls.card_type_id = card_type.module_type_id
        cls.sfp_type_id = sfp_type.module_type_id

    def login(self, email, password):
        return self.client.post("/auth/login-api", json={"email": email, "password": password})

    def logout(self):
        return self.client.get("/auth/logout", follow_redirects=True)

    # =========================================================================
    # 1. Super Admin dapat melakukan mutasi langsung (POST /api/modules/move)
    # =========================================================================
    def test_01_super_admin_direct_mutation(self):
        self.login("admin@test.com", "admin123")
        payload = {
            "module_id": self.card1_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "",
            "keterangan": "Mutasi darurat Super Admin ke PE-PLU-01",
        }
        res = self.client.post("/api/modules/move", json=payload)
        self.assertEqual(res.status_code, 200, f"Response: {res.get_json()}")
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("berhasil dipindahkan", data.get("message"))
        self.logout()

    # =========================================================================
    # 2. Karyawan TIF dapat melakukan mutasi langsung tanpa approval
    # =========================================================================
    def test_02_karyawan_tif_direct_mutation_without_approval(self):
        self.login("tif@test.com", "tif123")
        # Move sfp1 (currently in dev1 slot 1) to dev2 slot 1 port 1
        payload = {
            "module_id": self.sfp1_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "1",
            "keterangan": "Mutasi SFP oleh Karyawan TIF tanpa approval",
        }
        res = self.client.post("/api/modules/move", json=payload)
        self.assertEqual(res.status_code, 200, f"Response: {res.get_json()}")
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.logout()

    # =========================================================================
    # 3. Teknisi ditolak dengan HTTP 403 ketika mencoba operasi penulisan
    # =========================================================================
    def test_03_teknisi_rejected_with_403(self):
        self.login("teknisi@test.com", "teknisi123")
        payload = {
            "module_id": self.card1_id,
            "to_device_id": self.dev1_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "",
        }
        res = self.client.post("/api/modules/move", json=payload)
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertFalse(data.get("success"))
        self.assertIn("Teknisi hanya memiliki akses melihat data", data.get("error", ""))
        self.logout()

    # =========================================================================
    # 4. Mutasi berhasil memperbarui posisi aktif dengan benar
    # =========================================================================
    def test_04_active_position_updated_correctly(self):
        with self.app.app_context():
            # Check card1 active position: should be dev2, slot1, status='aktif'
            active_cards = ModulePosition.query.filter_by(module_id=self.card1_id, status="aktif").all()
            self.assertEqual(len(active_cards), 1, "Harus tepat ada 1 posisi aktif")
            self.assertEqual(active_cards[0].device_id, self.dev2_id)

            # Check old position was marked 'dilepas'
            released_positions = ModulePosition.query.filter_by(module_id=self.card1_id, status="dilepas").all()
            self.assertGreaterEqual(len(released_positions), 1)
            self.assertEqual(released_positions[0].device_id, self.dev1_id)

    # =========================================================================
    # 5. Riwayat menyimpan posisi asal, tujuan, waktu, dan aktor yang benar
    # =========================================================================
    def test_05_movement_ledger_integrity(self):
        with self.app.app_context():
            latest_mv = ModuleMovement.query.filter_by(module_id=self.sfp1_id).order_by(ModuleMovement.tanggal.desc()).first()
            self.assertIsNotNone(latest_mv)
            self.assertEqual(latest_mv.from_device_id, self.dev1_id)
            self.assertEqual(latest_mv.to_device_id, self.dev2_id)
            self.assertEqual(latest_mv.jenis_perubahan, "pindah")
            self.assertEqual(latest_mv.actor.name, "Karyawan TIF")
            self.assertIsNotNone(latest_mv.tanggal)

    # =========================================================================
    # 6. Port, shelf, slot, dan klasifikasi CARD/TRANSCEIVER divalidasi benar
    # =========================================================================
    def test_06_classification_and_port_validation(self):
        self.login("tif@test.com", "tif123")
        # Moving a Transceiver (sfp_spare) WITHOUT a valid port must be rejected
        payload_no_port = {
            "module_id": self.sfp_spare_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "",  # Empty port for TRANSCEIVER
        }
        res = self.client.post("/api/modules/move", json=payload_no_port)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data.get("success"))
        self.assertIn("wajib memiliki nomor Port", data.get("error", ""))
        self.logout()

    # =========================================================================
    # 7. Konflik posisi yang tidak valid ditolak
    # =========================================================================
    def test_07_invalid_position_conflict_rejected(self):
        self.login("admin@test.com", "admin123")
        # Try to move card2 into dev2, slot 1, shelf 1 (already occupied by card1)
        payload_conflict = {
            "module_id": self.card2_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "",
        }
        res = self.client.post("/api/modules/move", json=payload_conflict)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertFalse(data.get("success"))
        self.assertIn("sudah ditempati Card aktif lain", data.get("error", ""))
        self.logout()

    # =========================================================================
    # 8. Penempatan transceiver yang valid tidak ditolak oleh slot CARD
    # =========================================================================
    def test_08_transceiver_coexistence_allowed(self):
        self.login("admin@test.com", "admin123")
        # dev2 slot 1 has card1 and sfp1 on port 1. Placing sfp_spare on port 2 should SUCCEED
        payload_valid_sfp = {
            "module_id": self.sfp_spare_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "2",
            "keterangan": "Penempatan SFP spare di port 2",
        }
        res = self.client.post("/api/modules/move", json=payload_valid_sfp)
        self.assertEqual(res.status_code, 200, f"Response: {res.get_json()}")
        data = res.get_json()
        self.assertTrue(data.get("success"))

        # But trying to place ANOTHER transceiver on port 2 must be rejected
        with self.app.app_context():
            # Create a 3rd SFP
            sfp3 = Module(serial_number="SFP-SN-003", unit_part_number="PN-SFP-003", module_type_id=self.sfp_type_id, kondisi="IDLE")
            db.session.add(sfp3)
            db.session.commit()
            sfp3_id = sfp3.modul_id

        payload_conflict_port = {
            "module_id": sfp3_id,
            "to_device_id": self.dev2_id,
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "2",  # Already occupied by sfp_spare
        }
        res_conflict = self.client.post("/api/modules/move", json=payload_conflict_port)
        self.assertEqual(res_conflict.status_code, 400)
        self.assertIn("Port 2", res_conflict.get_json().get("error", ""))
        self.logout()

    # =========================================================================
    # 9. Kegagalan operasi menyebabkan rollback tanpa perubahan parsial
    # =========================================================================
    def test_09_atomic_rollback_on_failure(self):
        self.login("tif@test.com", "tif123")
        with self.app.app_context():
            initial_pos_count = ModulePosition.query.count()
            initial_mv_count = ModuleMovement.query.count()
            initial_audit_count = AuditLog.query.count()

        # Send invalid payload (e.g. non-existent target device)
        invalid_payload = {
            "module_id": self.card2_id,
            "to_device_id": 999999,  # Non-existent
            "to_slot": "1",
            "to_shelf": "1",
            "to_port": "",
        }
        res = self.client.post("/api/modules/move", json=invalid_payload)
        self.assertEqual(res.status_code, 404)

        with self.app.app_context():
            after_pos_count = ModulePosition.query.count()
            after_mv_count = ModuleMovement.query.count()
            after_audit_count = AuditLog.query.count()
            self.assertEqual(initial_pos_count, after_pos_count, "Rollback: Jumlah posisi tidak boleh berubah")
            self.assertEqual(initial_mv_count, after_mv_count, "Rollback: Tidak boleh ada movement parsial")
            self.assertEqual(initial_audit_count, after_audit_count, "Rollback: Tidak boleh ada audit log parsial")
        self.logout()

    # =========================================================================
    # 10. Mutasi baru tidak membuat permintaan atau persetujuan baru
    # =========================================================================
    def test_10_no_approval_records_created(self):
        with self.app.app_context():
            req_count = ModuleRequest.query.count()
            appr_count = RequestApproval.query.count()
            self.assertEqual(req_count, 0, "Mutasi langsung tidak boleh membuat ModuleRequest")
            self.assertEqual(appr_count, 0, "Mutasi langsung tidak boleh membuat RequestApproval")

    # =========================================================================
    # 11. Edit Modul (PUT /api/modules/<id>) tetap bekerja sesuai perilaku existing
    # =========================================================================
    def test_11_edit_module_remains_functional(self):
        self.login("admin@test.com", "admin123")
        payload = {
            "serial_number": "CARD-SN-002-UPDATED",
            "unit_part_number": "PN-CARD-002-REV2",
            "kondisi": "AKTIF",
        }
        res = self.client.put(f"/api/modules/{self.card2_id}", json=payload)
        self.assertEqual(res.status_code, 200, f"Response: {res.get_json()}")
        data = res.get_json()
        self.assertTrue(data.get("success"))

        with self.app.app_context():
            m = Module.query.get(self.card2_id)
            self.assertEqual(m.serial_number, "CARD-SN-002-UPDATED")
            self.assertEqual(m.unit_part_number, "PN-CARD-002-REV2")
        self.logout()

    # =========================================================================
    # 12. Export XLSX/CSV tetap menghasilkan riwayat dan nama aktor yang benar
    # =========================================================================
    def test_12_export_history_and_actors(self):
        self.login("admin@test.com", "admin123")
        res_csv = self.client.get("/export/download?format=csv")
        self.assertEqual(res_csv.status_code, 200)
        csv_content = res_csv.data.decode("utf-8-sig")
        self.assertIn("Serial Number", csv_content)
        self.assertIn("CARD-SN-001", csv_content)
        self.assertIn("Karyawan TIF", csv_content)

        # Also test XLSX
        res_xlsx = self.client.get("/export/download?format=xlsx")
        self.assertEqual(res_xlsx.status_code, 200)
        self.assertTrue(len(res_xlsx.data) > 1000)
        self.logout()

    # =========================================================================
    # 13. Fitur dashboard, perangkat, lokasi, Scan, impor, pengguna tidak regresi
    # =========================================================================
    def test_13_non_regression_core_features(self):
        self.login("admin@test.com", "admin123")
        # Dashboard stats
        res_stats = self.client.get("/api/dashboard/stats")
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.get_json()
        self.assertIn("kpi", stats)
        self.assertIn("total_devices", stats["kpi"])
        self.assertIn("total_mutasi", stats["kpi"])
        self.assertGreaterEqual(stats["kpi"]["total_mutasi"], 1)

        # Device endpoints
        res_dev = self.client.get("/api/devices")
        self.assertEqual(res_dev.status_code, 200)

        # Location endpoints
        res_loc = self.client.get("/api/locations")
        self.assertEqual(res_loc.status_code, 200)

        # Module Movements API endpoint
        res_mv = self.client.get("/api/module-movements")
        self.assertEqual(res_mv.status_code, 200)
        mv_data = res_mv.get_json()
        self.assertTrue(mv_data.get("success"))
        self.assertGreaterEqual(len(mv_data.get("items", [])), 1)

        # Audit endpoint
        res_audit = self.client.get("/audit/")
        self.assertIn(res_audit.status_code, [200, 302])

        # Scan endpoint
        res_scan = self.client.get("/ar/")
        self.assertIn(res_scan.status_code, [200, 302])
        self.logout()

    # =========================================================================
    # 14. Hash chain audit log tetap valid setelah mutasi uji
    # =========================================================================
    def test_14_audit_log_hash_chain_validity(self):
        with self.app.app_context():
            is_valid, broken_id = verify_chain()
            self.assertTrue(is_valid, f"Hash chain audit log harus valid! Broken at: {broken_id}")
            self.assertIsNone(broken_id)

            # Check that MODULE_MUTATION audit entries exist
            mutation_logs = AuditLog.query.filter_by(aksi="MODULE_MUTATION").all()
            self.assertGreaterEqual(len(mutation_logs), 2)
            for log in mutation_logs:
                self.assertIsNotNone(log.hash)
                self.assertIsNotNone(log.actor)

    # =========================================================================
    # 15. Halaman Mutasi Modul React SPA dapat dibuka & memuat data aktual
    # =========================================================================
    def test_15_react_spa_mutasi_modul_page(self):
        self.login("tif@test.com", "tif123")
        # Access /modules/requests - should serve react_index.html with 200 OK
        res = self.client.get("/modules/requests")
        self.assertEqual(res.status_code, 200)
        html = res.data.decode("utf-8")
        self.assertIn("/static/dist/", html)
        self.assertIn("root", html)
        self.logout()


if __name__ == "__main__":
    unittest.main(verbosity=2)
