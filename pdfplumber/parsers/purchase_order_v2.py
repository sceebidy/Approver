import re
from .utils import clean_num


def parse(text: str) -> dict:
    data = {"doc_type": "PURCHASE_ORDER_V2"}

    m = re.search(r"NoPO\s*:\s*(\d+)", text)
    data["no_po"] = m.group(1) if m else None

    m = re.search(r"DocumentDate\s*:\s*([\d/]+)", text)
    data["document_date"] = m.group(1) if m else None

    m = re.search(r"DeliveryDate\s*:\s*([\d/]+)", text)
    data["delivery_date"] = m.group(1) if m else None

    m = re.search(r"Vendor/Supplying\s*:\s*(.+)", text)
    data["vendor_nama"] = m.group(1).strip() if m else None

    m = re.search(r"Alamat\s*:\s*(.+)", text)
    data["vendor_alamat"] = m.group(1).strip() if m else None

    m = re.search(r"Telephone&mail\s*:\s*(.+)", text)
    data["vendor_kontak"] = m.group(1).strip() if m else None

    lines = text.split("\n")
    main_pattern = re.compile(
        r"^(\d+)\s+(.+?)\s+(\d+)\s+(AU|EA|PCS|UNIT|UNT|SET)\s+Rp\s+([\d.,]+)\s+Rp\s+([\d.,]+)$"
    )
    sub_pattern = re.compile(
        r"^-(.+?)\s+(\d+)\s+(AU|EA|PCS|UNIT|UNT|SET)\s+Rp\s+([\d.,]+)$"
    )

    def _collect_desc(start_idx, base_desc):
        """Gabung baris deskripsi lanjutan sampai ketemu baris item lain / '-' / kosong."""
        desc = base_desc
        j = start_idx
        while j < len(lines):
            nxt = lines[j].strip()
            if nxt == "-" or not nxt or main_pattern.match(nxt) or sub_pattern.match(nxt):
                break
            desc += nxt
            j += 1
        return desc.strip(), j

    items = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = main_pattern.match(line)
        if m:
            desc, next_i = _collect_desc(i + 1, m.group(2))
            items.append({
                "no": int(m.group(1)),
                "deskripsi": desc,
                "qty": int(m.group(3)),
                "satuan": m.group(4),
                "harga_per_unit": clean_num(m.group(5)),
                "jumlah": clean_num(m.group(6)),
            })
            i = next_i
            continue
        m2 = sub_pattern.match(line)
        if m2:
            desc, next_i = _collect_desc(i + 1, m2.group(1))
            items.append({
                "sub_item": True,
                "deskripsi": desc,
                "qty": int(m2.group(2)),
                "satuan": m2.group(3),
                "harga_per_unit": clean_num(m2.group(4)),
            })
            i = next_i
            continue
        i += 1
    data["items"] = items

    m = re.search(r"SubTotal\s+Rp\s+([\d.,]+)", text)
    data["sub_total"] = clean_num(m.group(1)) if m else None

    m = re.search(r"NetValue\s+Rp\s+([\d.,]+)", text)
    data["net_value"] = clean_num(m.group(1)) if m else None

    m = re.search(r"PPN\s+Rp\s+([\d.,]+)", text)
    data["ppn"] = clean_num(m.group(1)) if m else None

    m = re.search(r"(?<!Sub)Total\s+Rp\s+([\d.,]+)", text)
    data["total"] = clean_num(m.group(1)) if m else None

    return data
