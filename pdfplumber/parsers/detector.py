from . import purchase_order, purchase_order_v2, mis, ppab


def detect_doc_type(text: str) -> str:
    """Deteksi jenis dokumen berdasarkan kata kunci di teksnya."""
    upper_squished = text.upper().replace(" ", "")

    if "MATERIALISSUEDSLIP" in upper_squished:
        return "MIS"
    if "PPAB" in upper_squished or "PEMAKAIANANGGARANBELANJA" in upper_squished:
        return "PPAB"
    if "PURCHASEORDER" in upper_squished:
        # Ada 2 template PO yang beda struktur, dibedakan lewat penanda unik:
        # varian 1 (INL) pakai "PONo:", varian 2 (SAP/PTPN) pakai "NoPO:"
        if "NOPO:" in upper_squished:
            return "PURCHASE_ORDER_V2"
        return "PURCHASE_ORDER"
    return "UNKNOWN"


def parse_document(text: str) -> dict:
    doc_type = detect_doc_type(text)
    if doc_type == "PURCHASE_ORDER":
        return purchase_order.parse(text)
    elif doc_type == "PURCHASE_ORDER_V2":
        return purchase_order_v2.parse(text)
    elif doc_type == "MIS":
        return mis.parse(text)
    elif doc_type == "PPAB":
        return ppab.parse(text)
    else:
        return {"doc_type": "UNKNOWN", "raw_text": text}
