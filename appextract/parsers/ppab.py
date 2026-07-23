import re
from .utils import clean_num


def parse(text: str) -> dict:
    data = {"doc_type": "PPAB"}

    m = re.search(r"Nomor:\s*(\d+)", text)
    data["nomor_ppab"] = m.group(1) if m else None

    m = re.search(r"Kebun/Unit:\s*:\s*(\S+)", text)
    data["kebun_unit"] = m.group(1) if m else None

    m = re.search(r"RencanaSelesai\s*:\s*([\d.]+)", text)
    data["rencana_selesai"] = m.group(1) if m else None

    m = re.search(r"SumberAnggaran\s*:\s*([^\n]+)", text)
    data["sumber_anggaran"] = m.group(1).strip() if m else None

    item_pattern = re.compile(
        r"^(\d+)\s+(.+?)\s+(EA|PCS|UNIT|UNT|SET)\s+(\d+)\s+([\d.,]+)\s+Rp\.\s*([\d.,]+)\s*$",
        re.MULTILINE,
    )
    items = []
    for m in item_pattern.finditer(text):
        item = {
            "no": int(m.group(1)),
            "deskripsi": m.group(2).strip(),
            "satuan": m.group(3),
            "qty": int(m.group(4)),
            "harga_satuan": clean_num(m.group(5)),
            "jumlah": clean_num(m.group(6)),
        }
        start = m.end()
        next_item = item_pattern.search(text, start)
        chunk = text[start: next_item.start() if next_item else start + 400]
        detail = {}
        for k, v in re.findall(r"([A-Z_]+)\s*:\s*(.+)", chunk):
            detail[k.lower()] = v.strip()
        if detail:
            item["detail_lisensi"] = detail
        items.append(item)
    data["items"] = items

    m = re.search(r"JumlahExcl\.PPN11%\s*:\s*Rp\.?\s*([\d.,]+)", text)
    data["jumlah_excl_ppn"] = clean_num(m.group(1)) if m else None

    m = re.search(r"^PPN11%\s*:\s*Rp\.?\s*([\d.,]+)", text, re.MULTILINE)
    data["ppn_11_persen"] = clean_num(m.group(1)) if m else None

    m = re.search(r"JumlahIncl\.PPN\s*11%\s*:\s*Rp\.?\s*([\d.,]+)", text)
    data["jumlah_incl_ppn"] = clean_num(m.group(1)) if m else None

    data["approval_roles"] = {
        "pelaksanaan_disetujui_oleh": "Manajer/Kabag IT",
        "diperiksa_oleh": "Kepala Bagian Akuntansi dan Keuangan",
        "anggaran_disetujui_oleh": "SEVP Operation/SEVP Business Support, SEVP Business Support/Direktur",
    }

    return data
