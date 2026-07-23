import re


def parse(text: str) -> dict:
    data = {"doc_type": "MIS"}

    m = re.search(r"MIS\s*:\s*(\d+)", text)
    data["mis_no"] = m.group(1) if m else None

    m = re.search(r"Required\s*:\s*(\S+)", text)
    data["required_for"] = m.group(1) if m else None

    m = re.search(r"Date\.\s*:\s*(\d{2}/\d{2}/\d{4})(\d{2}:\d{2}:\d{2})", text)
    data["date"] = m.group(1) if m else None
    data["time"] = m.group(2) if m else None

    m = re.search(r"Section\s*:\s*(\S+)", text)
    data["section"] = m.group(1) if m else None

    item_pattern = re.compile(
        r"^(\d+)\s+(.+?)\s+(UNT|EA|PCS|SET)\s+([\d.,]+)\s*$",
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
                if nxt and not re.match(r"^\d+\s", nxt) and "Requested" not in nxt:
                    desc = f"{desc}{nxt}"
            items.append({
                "no": int(m.group(1)),
                "description": desc.strip(),
                "unit": m.group(3),
                "qty_raw": m.group(4),
            })
    data["items"] = items

    lines_stripped = [l.strip() for l in text.split("\n") if l.strip()]
    approval = {}
    try:
        idx = lines_stripped.index("Requested/ReceivedBy CheckedBy IssuedBy ApprovedBy")
        names_line = lines_stripped[idx + 1] if idx + 1 < len(lines_stripped) else ""
        jabatan_line = lines_stripped[idx + 2] if idx + 2 < len(lines_stripped) else ""
        approval = {"baris_nama": names_line, "baris_jabatan": jabatan_line}
    except ValueError:
        pass
    data["approval"] = approval

    return data
