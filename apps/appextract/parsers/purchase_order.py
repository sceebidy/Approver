import re
from .utils import clean_num


def _extract_po_approval(layout_text: str, vendor_nama: str = "Pihak Supplier / Vendor") -> dict:
    from .utils import extract_roles_dynamically
    roles = extract_roles_dynamically(layout_text, ["acceptedby", "preparedby", "checkedby", "approvedby"])
    
    if len(roles) >= 4:
        return {
            "accepted_by": vendor_nama,
            "prepared_by": roles[1],
            "checked_by": roles[2],
            "approved_by": roles[3]
        }
    
    # Fallback jika ekstraksi dinamis gagal
    return {
        "accepted_by": vendor_nama,
        "prepared_by": "",
        "checked_by": "",
        "approved_by": ""
    }


def parse(text: str, layout_text: str = "") -> dict:
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
    data["approval_roles"] = _extract_po_approval(layout_text, vendor_nama)

    return data
