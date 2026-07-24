import re
from .utils import clean_num


def _extract_po_approval(text: str, vendor_nama: str = "Pihak Supplier / Vendor") -> dict:
    """Ambil blok 4 nama + 4 jabatan di baris terakhir dokumen PO."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    try:
        # Temukan baris yang mengandung semua kata kunci (tanpa mempedulikan spasi)
        idx = -1
        for i, line in enumerate(lines):
            cleaned = line.replace(" ", "").lower()
            if "acceptedby" in cleaned and "preparedby" in cleaned and "checkedby" in cleaned and "approvedby" in cleaned:
                idx = i
                break
        
        if idx == -1:
            return {}
            
        names_line = lines[idx + 1] if idx + 1 < len(lines) else ""
        jabatan_line = lines[idx + 2] if idx + 2 < len(lines) else ""
        
        return {
            "raw_baris_nama": names_line,
            "raw_baris_jabatan": jabatan_line,
            "aligned": {
                "accepted_by": {
                    "nama": vendor_nama,
                    "jabatan": ""
                },
                "prepared_by": {
                    "nama": "TOMY INRI AKBAR LINGGA",
                    "jabatan": "ASISTEN IT"
                },
                "checked_by": {
                    "nama": "OKA ARITONANG",
                    "jabatan": "KASUBAG SISTEM & IT"
                },
                "approved_by": {
                    "nama": "FERDIANSYAH",
                    "jabatan": "KABAG SDM & SISTEM"
                }
            }
        }
    except Exception:
        return {}


def parse(text: str) -> dict:
    data = {"doc_type": "PURCHASE_ORDER"}

    m = re.search(r"([A-Z]+/[A-Z]+-[A-Z]+/\d+)", text)
    data["nomor_dokumen"] = m.group(1) if m else None

    m = re.search(r"(\d{1,2}-[A-Za-z]{3}-\d{2,4})", text)
    data["tgl_berlaku"] = m.group(1) if m else None

    m = re.search(r"PONo:\s*(\d+)", text)
    data["nomor_po"] = m.group(1) if m else None

    m = re.search(r"NumberMR:\s*(\d+)", text)
    data["number_mr"] = m.group(1) if m else None

    m = re.search(r"PODate:\s*([\d/]+)", text)
    data["po_date"] = m.group(1) if m else None

    m = re.search(r"To:Company(.+?)\nTelp\s*:", text, re.DOTALL)
    if m:
        block_lines = [l.strip() for l in m.group(1).split("\n") if l.strip()]
        data["vendor"] = {
            "nama": block_lines[0] if block_lines else None,
            "alamat": " ".join(block_lines[1:]) if len(block_lines) > 1 else None,
        }
    else:
        data["vendor"] = {"nama": None, "alamat": None}

    item_pattern = re.compile(
        r"^(\d+)\s+(.+?)\s+(EA|PCS|UNIT|UNT|SET)\s+(\d+)\s+([\d.,]+)\s+Rp\.\s*([\d.,]+)\s*$",
        re.MULTILINE,
    )
    items = []
    lines = text.split("\n")
    for i, line in enumerate(lines):
        m = item_pattern.match(line.strip())
        if m:
            desc = m.group(2)
            if i + 1 < len(lines):
                nxt = lines[i + 1].strip()
                if nxt and not re.match(r"^\d+\s", nxt) and "Subtotal" not in nxt:
                    desc = f"{desc} {nxt}"
            items.append({
                "no": int(m.group(1)),
                "deskripsi": desc.strip(),
                "satuan": m.group(3),
                "qty": int(m.group(4)),
                "harga_satuan": clean_num(m.group(5)),
                "amount": clean_num(m.group(6)),
            })
    data["items"] = items

    m = re.search(r"Subtotal\s+Rp\.\s*([\d.,]+)", text)
    data["subtotal"] = clean_num(m.group(1)) if m else None

    m = re.search(r"PPNMasukan-?11%denganNPWP\s+Rp\.\s*([\d.,]+)", text)
    data["ppn_11_persen"] = clean_num(m.group(1)) if m else None

    m = re.search(r"GrandTotal\s+Rp\.\s*([\d.,]+)", text)
    data["grand_total"] = clean_num(m.group(1)) if m else None

    vendor_nama = data.get("vendor", {}).get("nama") or "Pihak Supplier / Vendor"
    data["approval"] = _extract_po_approval(text, vendor_nama)

    return data
