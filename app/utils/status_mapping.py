"""
Mapping status peralatan dari format data lapangan (kolom EquipmentServiceState
di Excel mentor) ke format sederhana yang dipakai sistem (RUSAK/IDLE/AKTIF).

Keputusan: skema database TETAP sederhana (cuma 3 nilai), data mentah
"diterjemahkan" pas proses import -- bukan menambah kompleksitas ke skema.
"""

EQUIPMENT_STATUS_MAP = {
    "IS-NR": "AKTIF",
    "IS-ANR": "AKTIF",
    "OOS-AU": "RUSAK",
    "OOS-AUMA": "RUSAK",
    "OOS-MA": "RUSAK",
    "N/A": "IDLE",
    "NOT APPLICABLE": "IDLE",
}


def map_equipment_status(raw_value):
    """Terima nilai mentah dari Excel (boleh None), kembalikan salah satu dari RUSAK/IDLE/AKTIF."""
    if not raw_value:
        return "IDLE"
    key = str(raw_value).strip().upper()
    return EQUIPMENT_STATUS_MAP.get(key, "IDLE")    