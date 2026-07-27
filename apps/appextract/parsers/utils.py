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

import re

def extract_roles_dynamically(layout_text: str, required_keywords: list) -> list:
    if not layout_text:
        return []
        
    lines = [l for l in layout_text.split('\n') if l.strip()]
    idx = -1
    for i, line in enumerate(lines):
        cleaned = re.sub(r'\s+', '', line).lower()
        if all(kw.lower() in cleaned for kw in required_keywords):
            idx = i
            break
            
    if idx == -1:
        return []
        
    names_line = lines[idx + 1] if idx + 1 < len(lines) else ""
    jabatan_line = lines[idx + 2] if idx + 2 < len(lines) else ""
    
    names = [x.strip() for x in re.split(r'\s{2,}', names_line.strip()) if x.strip()]
    jabatans = [x.strip() for x in re.split(r'\s{2,}', jabatan_line.strip()) if x.strip()]
    
    roles = []
    max_len = max(len(names), len(jabatans))
    for i in range(max_len):
        n = names[i] if i < len(names) else ""
        j = jabatans[i] if i < len(jabatans) else ""
        
        if n and j:
            roles.append(f"{n} ({j})")
        elif n:
            roles.append(n)
        elif j:
            roles.append(f"({j})")
            
    return roles
