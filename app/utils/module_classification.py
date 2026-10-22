"""
Utility klasifikasi aset modul: membedakan Card Utama (Line Card, Controller, Common Equipment)
dan Optical Transceiver (SFP, QSFP, CFP, XFP) secara konsisten dan dinamis.

Aturan Dual-Factor:
1. Faktor Tipe: Apakah tipe modul terdaftar dalam KNOWN_TRANSCEIVERS atau cocok dengan pola nama optik.
2. Faktor Port: Apakah record posisi menempati sub-port (port IS NOT NULL dan bukan empty/strip).
"""

KNOWN_TRANSCEIVERS = {
    "Q28LR4D",
    "C4ACO",
    "C2DCO4",
    "SXI64.1",
    "S10GB-LR",
    "E100G",
}

OPTICAL_TOKENS = (
    "SFP",
    "QSFP",
    "CFP",
    "XFP",
    "LR4",
    "SR4",
    "ER4",
    "ZR4",
    "DCO",
    "ACO",
    "Q28",
    "C4A",
    "C2D",
)


def has_valid_port(port_val) -> bool:
    """Memeriksa apakah nilai port merepresentasikan sub-port nyata (bukan kosong/0/tanda hubung)."""
    if port_val is None:
        return False
    s = str(port_val).strip()
    return s != "" and s != "-" and s != "0" and s.lower() not in ("none", "null")


def matches_transceiver_type(unit_type_name: str) -> bool:
    """Memeriksa apakah nama tipe modul terdaftar atau cocok dengan pola transceiver optik."""
    if not unit_type_name:
        return False
    t_clean = unit_type_name.strip().upper()
    if t_clean in KNOWN_TRANSCEIVERS:
        return True
    return any(tok in t_clean for tok in OPTICAL_TOKENS)


def is_transceiver(unit_type_name: str, port_val) -> bool:
    """
    Menentukan apakah suatu posisi/modul merupakan Transceiver SFP.
    Dual-Factor: Memerlukan kecocokan tipe DAN keberadaan nilai port.
    """
    return matches_transceiver_type(unit_type_name) and has_valid_port(port_val)


def get_asset_category(unit_type_name: str, port_val) -> str:
    """Mengembalikan label kategori aset: 'TRANSCEIVER' atau 'CARD'."""
    return "TRANSCEIVER" if is_transceiver(unit_type_name, port_val) else "CARD"
