import re


def parse(text: str, layout_text: str = "") -> dict:
    data = {"doc_type": "MIS"}

    m = re.search(r"MIS\s*:\s*(\d+)", text)
    data["nomor_mis"] = m.group(1) if m else None

    m = re.search(r"Required\s*:\s*(\S+)", text)
    data["required_for"] = m.group(1) if m else None

    m = re.search(r"Date\.\s*:\s*(\d{2}/\d{2}/\d{4})(\d{2}:\d{2}:\d{2})", text)
    data["tgl_mis"] = m.group(1) if m else None
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
                "desc": desc.strip(),
                "satuan": m.group(3),
                "qty": m.group(4),
            })
    data["items"] = items

    from .utils import extract_roles_dynamically
    roles = extract_roles_dynamically(layout_text, ["requested/receivedby", "checkedby", "issuedby", "approvedby"])
    
    if len(roles) >= 5:
        data["approval_roles"] = {
            "requestor": roles[0],
            "checker": roles[1],
            "issuer": roles[2],
            "approver": f"{roles[3]}, {roles[4]}"
        }
    elif len(roles) >= 4:
        data["approval_roles"] = {
            "requestor": roles[0],
            "checker": roles[1],
            "issuer": roles[2],
            "approver": roles[3]
        }
    else:
        # Fallback if it fails
        data["approval_roles"] = {
            "requestor": "",
            "checker": "",
            "issuer": "",
            "approver": ""
        }
    
    return data
