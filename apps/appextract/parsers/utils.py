import re


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


def clean_name(s: str) -> str:
    """Bersihkan nama dari noise (titik-titik placeholder, tanda kurung, underscore, dll)."""
    if not s:
        return ""
    s = s.strip()
    # Hapus leading/trailing tanda kurung, titik, garis bawah
    s = re.sub(r'^[(\[\s_.-]+|[)(\]\s_.-]+$', '', s)
    if re.match(r'^[\s_.-]+$', s) or len(s) < 2:
        return ""
    return s.strip()


def _find_segments(line: str) -> list:
    """
    Pecah baris menjadi segmen-segmen berdasarkan gap >= 2 spasi.
    Setiap segmen = (start_pos, end_pos, text).
    Kata-kata yang dipisahkan 1 spasi tetap tergabung dalam 1 segmen.
    """
    segments = []
    for m in re.finditer(r'(\S+(?:\s(?!\s)\S+)*)', line):
        segments.append((m.start(), m.end(), m.group()))
    return segments


def _is_placeholder_line(line: str) -> bool:
    """Cek apakah baris ini baris placeholder (titik-titik, garis bawah, dll)."""
    stripped = line.strip()
    if not stripped:
        return False
    content = re.sub(r'[\s().\-_]+', '', stripped)
    return len(content) < 2


def _get_placeholder_centers(line: str) -> list:
    """
    Hitung center position dari tiap blok placeholder individual.
    Mencocokkan setiap (.....), (______), dll secara terpisah meskipun
    jaraknya hanya 1 spasi.
    """
    centers = []
    for m in re.finditer(r'\([._\-]+\)', line):
        centers.append((m.start() + m.end()) / 2.0)

    # Fallback: jika tidak cocok dengan pattern (.....), coba split segment biasa
    if not centers:
        for m in re.finditer(r'(\S+(?:\s(?!\s)\S+)*)', line):
            centers.append((m.start() + m.end()) / 2.0)

    return centers


def _assign_segments_to_columns(segments: list, col_centers: list, n_cols: int) -> list:
    """
    Assign setiap segmen teks ke kolom terdekat berdasarkan jarak
    center segmen ke center kolom.
    Mengembalikan list of string, satu per kolom.
    """
    result = [""] * n_cols
    for seg_start, seg_end, seg_text in segments:
        seg_center = (seg_start + seg_end) / 2.0
        best_col = 0
        best_dist = abs(seg_center - col_centers[0])
        for ci in range(1, n_cols):
            dist = abs(seg_center - col_centers[ci])
            if dist < best_dist:
                best_dist = dist
                best_col = ci
        if result[best_col]:
            result[best_col] += " " + seg_text
        else:
            result[best_col] = seg_text
    return result


def extract_roles_dynamically(layout_text: str, required_keywords: list) -> list:
    """
    Ekstrak nama dan jabatan dari layout_text PDF berdasarkan posisi kolom.

    Strategi:
    1. Cari baris header yang mengandung semua required_keywords.
    2. Tentukan center position tiap keyword di header.
    3. Jika ada baris placeholder (....) di bawah header, gunakan center tiap
       blok placeholder sebagai referensi kolom (bisa lebih banyak dari keyword).
    4. Baris-baris nama & jabatan dipecah menjadi segmen berdasarkan gap 2+ spasi.
    5. Tiap segmen di-assign ke kolom terdekat berdasarkan center position.

    Pendekatan ini menjaga nama panjang tetap utuh karena nama yang dipisahkan
    hanya 1 spasi (internal space) tetap menjadi 1 segmen, dan hanya segmen utuh
    yang dipindahkan ke kolom terdekat.
    """
    if not layout_text:
        return []

    lines = layout_text.split('\n')
    idx = -1
    header_line_str = ""

    for i, line in enumerate(lines):
        if not line.strip():
            continue
        cleaned = re.sub(r'\s+', '', line).lower()
        if all(kw.lower() in cleaned for kw in required_keywords):
            idx = i
            header_line_str = line
            break

    if idx == -1:
        return []

    header_lower = header_line_str.lower()

    # Cari posisi setiap keyword di baris header
    kw_matches = []
    for kw in required_keywords:
        pattern = kw.lower().replace("by", r"\s*by").replace("/", r"\s*/\s*")
        m = re.search(pattern, header_lower)
        if m:
            kw_matches.append((m.start(), m.end(), kw))
        else:
            first_word = kw.split("by")[0].split("/")[0]
            m = re.search(r'\b' + re.escape(first_word), header_lower)
            if m:
                kw_matches.append((m.start(), m.end(), kw))

    kw_matches.sort(key=lambda x: x[0])

    if not kw_matches:
        return []

    n_cols = len(kw_matches)
    col_centers = [(start + end) / 2.0 for start, end, _ in kw_matches]

    # Scan baris di bawah header
    placeholder_centers = None
    actual_n_cols = n_cols
    candidate_lines = []

    for line in lines[idx + 1:]:
        if not line.strip():
            continue
        if _is_placeholder_line(line):
            if placeholder_centers is None:
                ph_centers = _get_placeholder_centers(line)
                if len(ph_centers) >= n_cols:
                    placeholder_centers = ph_centers
                    actual_n_cols = len(ph_centers)
            continue
        if re.search(r'\b(date|tgl|tanggal)\s*:', line, re.IGNORECASE):
            continue
        candidate_lines.append(line)
        if len(candidate_lines) >= 2:
            break

    # Gunakan placeholder centers jika tersedia dan lebih banyak kolom dari keyword
    if placeholder_centers and len(placeholder_centers) > n_cols:
        active_centers = placeholder_centers
        active_n_cols = actual_n_cols
    else:
        active_centers = col_centers
        active_n_cols = n_cols

    names_line = candidate_lines[0] if len(candidate_lines) > 0 else ""
    jabatan_line = candidate_lines[1] if len(candidate_lines) > 1 else ""

    # Pecah menjadi segmen, lalu assign ke kolom terdekat
    name_segments = _find_segments(names_line)
    jabatan_segments = _find_segments(jabatan_line)

    names = _assign_segments_to_columns(name_segments, active_centers, active_n_cols)
    jabatans = _assign_segments_to_columns(jabatan_segments, active_centers, active_n_cols)

    # Bersihkan nama
    names = [clean_name(n) for n in names]
    jabatans = [clean_name(j) for j in jabatans]

    roles = []
    for i in range(active_n_cols):
        n = names[i]
        j = jabatans[i]

        if n and j:
            roles.append(f"{n} ({j})")
        elif n:
            roles.append(n)
        elif j:
            roles.append(f"({j})")
        else:
            roles.append("")

    return roles
