def clean_num(s: str) -> float:
    """'2.486.000' atau '192.822.540,00' -> float"""
    if not s:
        return 0.0
    s = s.strip().replace("Rp.", "").replace("Rp", "").strip()
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0
