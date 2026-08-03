"""
PDF Stamper Module
==================
Menambahkan stamp tanda tangan digital (QR code + label)
ke PDF asli dokumen procurement (PPAB, PO, MIS, dll).

Menggunakan pdfplumber secara dinamis untuk mendeteksi posisi 
kotak tanda tangan (berdasarkan kata 'Tgl' dan garis tabel) pada halaman PDF.
"""

import io
from typing import List, Optional, Tuple
from dataclasses import dataclass

# pyrefly: ignore [missing-import]
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import pdfplumber
import qrcode


@dataclass
class ApproverStamp:
    """Data untuk satu stamp approver."""
    role: str
    name: str
    jabatan: str
    signed_at: str
    verify_url: str
    role_index: int = 0


@dataclass
class VerfAnggaranStamp:
    """Data untuk stamp verifikasi anggaran."""
    no_ppab: str = ""
    sumber_rek: str = ""
    beban_rek: str = ""
    rkap_1_tahun: float = 0.0
    realisasi: float = 0.0
    permintaan: float = 0.0
    sisa_anggaran: float = 0.0
    verifier_name: str = ""
    verifier_signed_at: str = ""
    verify_url: str = ""


def format_rp(val) -> str:
    try:
        num = float(val)
        return f"Rp {num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return f"Rp {val}"


def _generate_qr_image(data: str, size: int = 120) -> io.BytesIO:
    """Generate QR code image sebagai BytesIO PNG."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    return buf


def _detect_signature_boxes_from_pdf(source_pdf_bytes: bytes, page_idx: int = -1) -> Tuple[List[float], float, float]:
    """
    Secara dinamis mendeteksi koordinat X pusat kolom dan Y range (top/bottom) 
    dari kotak tanda tangan di halaman PDF menggunakan pdfplumber.
    
    Mendukung template khusus untuk:
    - PPAB (Permintaan Pemakaian Anggaran Belanja - Landscape/Header Top Box)
    - MIS (Material Issued Slip - Portrait/Mid-Top Header Box)
    - PO V1 (Purchase Order INL - Portrait/Bottom Box)
    - PO V2 (Purchase Order SAP/PTPN - Portrait/Fixed Box)
    
    Returns:
        (column_centers, box_top_y, box_bottom_y) dalam koordinat ReportLab (0 di bawah).
    """
    try:
        with pdfplumber.open(io.BytesIO(source_pdf_bytes)) as pdf:
            if not pdf.pages:
                raise ValueError("PDF tidak memiliki halaman")
                
            actual_page_idx = page_idx if page_idx >= 0 else len(pdf.pages) + page_idx
            if actual_page_idx < 0 or actual_page_idx >= len(pdf.pages):
                actual_page_idx = len(pdf.pages) - 1
                
            page = pdf.pages[actual_page_idx]
            page_height = float(page.height)
            page_width = float(page.width)
            
            # Extract text dari seluruh dokumen untuk menentukan jenis dokumen secara akurat
            full_text = "\n".join(p.extract_text() or "" for p in pdf.pages)
            upper_squished = full_text.upper().replace(" ", "")
            
            # 1. PO V2 (Purchase Order SAP / PTPN Varian)
            if "PURCHASEORDER" in upper_squished and "NOPO:" in upper_squished:
                column_centers = [149.10, 319.38, 418.38, 517.38]
                box_top_y = page_height - 435.60
                box_bottom_y = page_height - 496.80
                return column_centers, box_top_y, box_bottom_y

            words = page.extract_words()

            # 2. MIS (Material Issued Slip)
            if "MATERIALISSUEDSLIP" in upper_squished or ("MIS" in upper_squished and any(k in upper_squished for k in ["REQUESTED/RECEIVEDBY", "CHECKEDBY", "ISSUEDBY"])):
                header_words = [w for w in words if any(k in w['text'].lower() for k in ['requested', 'checkedby', 'issuedby', 'approvedby'])]
                if header_words:
                    header_bottom = max(w['bottom'] for w in header_words)
                    
                    lines = page.lines
                    h_lines = [l for l in lines if l['top'] >= header_bottom - 2 and abs(l['top'] - l['bottom']) < 2]
                    h_lines = sorted(h_lines, key=lambda l: l['top'])
                    
                    if h_lines:
                        first_h = h_lines[0]['top']
                        if abs(first_h - header_bottom) < 15:
                            box_top_pdf = first_h + 2.0
                            remaining_h = [l for l in h_lines if l['top'] > box_top_pdf + 20]
                            if remaining_h:
                                box_bottom_pdf = remaining_h[0]['top'] - 1.0
                            else:
                                box_bottom_pdf = box_top_pdf + 68.0
                        else:
                            box_top_pdf = header_bottom + 6.0
                            box_bottom_pdf = h_lines[0]['top'] - 1.0
                    else:
                        box_top_pdf = header_bottom + 8.0
                        box_bottom_pdf = box_top_pdf + 68.0
                        
                    box_top_y = page_height - box_top_pdf
                    box_bottom_y = page_height - box_bottom_pdf
                    
                    v_lines = [l for l in lines if l['top'] <= box_top_pdf + 10 and l['bottom'] >= box_bottom_pdf - 10 and abs(l['x0'] - l['x1']) < 2]
                    v_lines = sorted(v_lines, key=lambda l: l['x0'])
                    
                    unique_x = []
                    for vl in v_lines:
                        if not unique_x or abs(vl['x0'] - unique_x[-1]) > 5:
                            unique_x.append(vl['x0'])
                            
                    if len(unique_x) >= 2:
                        column_centers = [(unique_x[i] + unique_x[i+1]) / 2.0 for i in range(len(unique_x) - 1)]
                        return column_centers, box_top_y, box_bottom_y
                    
                    return [80.8, 188.5, 296.2, 403.9, 511.6], box_top_y, box_bottom_y
                return [80.8, 188.5, 296.2, 403.9, 511.6], page_height - 272.0, page_height - 340.0

            # 3. PPAB (Permintaan Pemakaian Anggaran Belanja)
            if "PPAB" in upper_squished or "PEMAKAIANANGGARANBELANJA" in upper_squished:
                tgl_words = [w for w in words if 'tgl' in w['text'].lower()]
                tgl_words = sorted(tgl_words, key=lambda w: w['x0'])
                
                if len(tgl_words) >= 1:
                    levels = {}
                    for w in tgl_words:
                        matched_level = None
                        for lvl in levels:
                            if abs(w['top'] - lvl) < 15:
                                matched_level = lvl
                                break
                        if matched_level is None:
                            levels[w['top']] = [w]
                        else:
                            levels[matched_level].append(w)
                    
                    best_level = max(levels.keys(), key=lambda k: len(levels[k]))
                    best_words = sorted(levels[best_level], key=lambda w: w['x0'])
                    
                    box_top_pdf = max(w['bottom'] for w in best_words) + 1.5
                    
                    lines = page.lines
                    h_lines = [l for l in lines if l['top'] > box_top_pdf and abs(l['top'] - l['bottom']) < 2]
                    h_lines = sorted(h_lines, key=lambda l: l['top'])
                    
                    if h_lines:
                        box_bottom_pdf = h_lines[0]['top'] - 1.0
                    else:
                        box_bottom_pdf = box_top_pdf + 55.0
                        
                    box_top_y = page_height - box_top_pdf
                    box_bottom_y = page_height - box_bottom_pdf
                    
                    if len(best_words) >= 4:
                        column_centers = []
                        for i, w in enumerate(best_words):
                            x_start = w['x0'] - 5.0
                            x_end = best_words[i+1]['x0'] - 5.0 if i < len(best_words) - 1 else page_width - 12.0
                            column_centers.append((x_start + x_end) / 2.0)
                        return column_centers, box_top_y, box_bottom_y
                        
                return [104.0, 295.0, 504.0, 715.0], page_height - 152.0, page_height - 218.0

            # 4. PO V1 (Purchase Order INL Varian 1)
            if "PURCHASEORDER" in upper_squished:
                sig_words = [w for w in words if any(k in w['text'].lower() for k in ['acceptedby', 'preparedby', 'checkedby', 'approvedby', 'supplier', 'vendor'])]
                sig_words = [w for w in sig_words if w['top'] > page_height * 0.5]
                if sig_words:
                    header_bottom = max(w['bottom'] for w in sig_words)
                    box_top_pdf = header_bottom + 2.0
                    box_bottom_pdf = box_top_pdf + 60.0
                    box_top_y = page_height - box_top_pdf
                    box_bottom_y = page_height - box_bottom_pdf
                    return [85.0, 226.7, 368.6, 510.5], box_top_y, box_bottom_y
                return [85.0, 226.7, 368.6, 510.5], page_height - 576.0, page_height - 635.0

    except Exception as e:
        import logging
        logging.warning(f"Gagal deteksi dinamis posisi tanda tangan: {e}")
        
    # Fallback default jika deteksi dinamis gagal
    try:
        with pdfplumber.open(io.BytesIO(source_pdf_bytes)) as pdf:
            page = pdf.pages[page_idx if page_idx >= 0 else len(pdf.pages) + page_idx]
            page_width = float(page.width)
    except Exception:
        page_width = 841.92 # Default to landscape
        
    if page_width > 700:
        return [104.0, 295.0, 504.0, 715.0], 443.0, 377.0
    else:
        return [85.0, 226.7, 368.6, 510.5], 266.0, 206.0


def _create_stamp_overlay(
    page_width: float,
    page_height: float,
    approvers: List[ApproverStamp],
    column_centers: List[float],
    box_top_y: float,
    box_bottom_y: float,
    verf_anggaran: Optional[VerfAnggaranStamp] = None,
) -> io.BytesIO:
    """
    Buat overlay PDF dengan stamp approver di bagian bawah dan/atau stamp verifikasi anggaran.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(page_width, page_height))
    
    if not approvers and not verf_anggaran:
        c.save()
        buf.seek(0)
        return buf

    qr_size = 40.0
    label_font_size = 5.5
    gap = 5.0
    total_content_height = qr_size + gap + label_font_size
    box_height = abs(box_top_y - box_bottom_y)
    
    # Hitung posisi Y agar QR code & label di dalam kotak (center secara vertikal)
    start_y = box_top_y - ((box_height - total_content_height) / 2.0)
    qr_y = start_y - qr_size
    label_y = qr_y - gap - (label_font_size / 2.0)

    # Mapping for PPAB/PO/MIS approval roles to physical columns (0-indexed)
    if page_width > 700:
        # PPAB / Landscape documents (4 columns: 0=pelaksanaan, 1=diperiksa #1, 2=diperiksa #2, 3=anggaran)
        role_col_mapping = {
            "pelaksanaan_disetujui_oleh": [0],
            "pelaksanaan disetujui oleh": [0],
            "diperiksa_oleh": [1, 2],
            "diperiksa oleh": [1, 2],
            "checked_by": [1, 2],
            "checked by": [1, 2],
            "anggaran_disetujui_oleh": [3],
            "anggaran disetujui oleh": [3],
            "requestor": [0],
            "checker": [1],
            "issuer": [2],
            "approver": [3, 4],
        }
    else:
        # PO / MIS / Portrait documents
        role_col_mapping = {
            "accepted_by": [0],
            "accepted by": [0],
            "prepared_by": [1],
            "prepared by": [1],
            "checked_by": [2],
            "checked by": [2],
            "approved_by": [3],
            "approved by": [3],
            "requested_received_by": [0],
            "requested/receivedby": [0],
            "requested received by": [0],
            "issued_by": [2],
            "issued by": [2],
        }
    
    # Track how many people are in each physical column so we can stack if necessary
    col_occupancy = {}
    fallback_idx = 0

    final_approvers = []
    for approver in approvers:
        role_key = approver.role.lower().strip() if approver.role else ""
        final_approvers.append((approver, role_key))
            
    role_counts = {}

    is_po_v2 = (len(column_centers) == 4 and abs(column_centers[0] - 149.10) < 1.0 and abs(column_centers[2] - 418.38) < 1.0)
    internal_approvers = [a for a in final_approvers if a[1] not in ["accepted_by", "accepted by"]]
    num_internal = len(internal_approvers)

    for approver, role_key in final_approvers:
        if is_po_v2:
            if role_key in ["accepted_by", "accepted by"]:
                col_idx = 0
            else:
                if num_internal == 1:
                    col_idx = 2  # Center of purchaser box
                else:
                    po_v2_role_map = {
                        "prepared_by": 1,
                        "prepared by": 1,
                        "checked_by": 2,
                        "checked by": 2,
                        "approved_by": 3,
                        "approved by": 3
                    }
                    col_idx = po_v2_role_map.get(role_key, 2)
        elif role_key in role_col_mapping:
            allowed_cols = role_col_mapping[role_key]
            r_idx = getattr(approver, 'role_index', None)
            if r_idx is not None and isinstance(r_idx, int) and 0 <= r_idx < len(allowed_cols):
                col_idx = allowed_cols[r_idx]
            else:
                count = role_counts.get(role_key, 0)
                col_idx = allowed_cols[min(count, len(allowed_cols) - 1)]
                role_counts[role_key] = count + 1
        else:
            col_idx = fallback_idx % max(len(column_centers), 1)
            fallback_idx += 1
            
        if col_idx < len(column_centers):
            col_center_x = column_centers[col_idx]
        else:
            col_center_x = column_centers[-1] + 100

        # Check occupancy to offset Y if multiple people share the same column
        occupancy = col_occupancy.get(col_idx, 0)
        col_occupancy[col_idx] = occupancy + 1
        
        # If there are multiple people in the same column, offset them horizontally slightly or vertically.
        current_qr_y = qr_y
        current_label_y = label_y
        if occupancy > 0:
            col_center_x += (occupancy * 15)
            current_qr_y += (occupancy * 15)
            current_label_y += (occupancy * 15)

        # -- QR Code --
        qr_x = col_center_x - qr_size / 2.0
        
        try:
            qr_img_buf = _generate_qr_image(approver.verify_url)
            qr_img = ImageReader(qr_img_buf)
            c.drawImage(qr_img, qr_x, current_qr_y, width=qr_size, height=qr_size)
        except Exception:
            c.setStrokeColor(HexColor("#CCCCCC"))
            c.rect(qr_x, current_qr_y, qr_size, qr_size)
            c.setFont("Helvetica", 5)
            c.drawCentredString(col_center_x, current_qr_y + qr_size / 2, "QR Code")
        
        # -- Teks "Ditandatangani secara elektronik" --
        c.setFont("Helvetica", label_font_size)
        c.setFillColor(HexColor("#059669"))
        c.drawCentredString(col_center_x, current_label_y, "Ditandatangani secara elektronik")
    
    # If budget verification stamp is provided, draw red stamp table below signature boxes
    if verf_anggaran:
        _draw_verf_anggaran_red_stamp(c, page_width, page_height, verf_anggaran, box_bottom_y, column_centers)

    c.save()
    buf.seek(0)
    return buf


def _draw_verf_anggaran_red_stamp(
    c: canvas.Canvas,
    page_width: float,
    page_height: float,
    verf: VerfAnggaranStamp,
    box_bottom_y: float,
    column_centers: List[float],
):
    """
    Draw a clean, right-aligned, red-outlined Budget Verification stamp table.
    - Outer border: Red outline (#DC2626)
    - Header background: White (#FFFFFF)
    - Title & Labels: Red (#B91C1C)
    - Data values: Black (#000000)
    - Signature & QR Code: Placed at the bottom of the data table.
    """
    box_width = 240.0
    box_height = 182.0
    
    # 1. Rapat Kanan (Right Aligned to right margin 36pt)
    start_x = page_width - 36.0 - box_width
    if start_x < 20.0:
        start_x = 20.0

    # 2. Position Y below signature boxes
    top_y = box_bottom_y - 10.0
    bottom_y = top_y - box_height
    
    # Jika di bawah tidak cukup tempat (spill bottom), posisikan rapat kanan sejajar area tanda tangan
    if bottom_y < 15.0:
        top_y = max(box_bottom_y + 180.0, page_height - 30.0)
        bottom_y = top_y - box_height

    red_color = HexColor("#B91C1C")
    red_border = HexColor("#DC2626")
    black_color = HexColor("#000000")
    white_bg = HexColor("#FFFFFF")
    
    # 3. Outer Box Background (White) & Outline (Red)
    c.setFillColor(white_bg)
    c.setStrokeColor(red_border)
    c.setLineWidth(1.2)
    c.rect(start_x, bottom_y, box_width, box_height, stroke=1, fill=1)

    # 4. Title Header (White BG with Red Text & Bottom Border)
    header_height = 18.0
    header_y = top_y - header_height
    c.setStrokeColor(red_border)
    c.setLineWidth(0.8)
    c.line(start_x, header_y, start_x + box_width, header_y)

    c.setFillColor(red_color)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(start_x + (box_width / 2.0), header_y + 5.0, "VERIFIKASI ANGGARAN")

    # 5. Data Rows (Red Labels, Black Data Values)
    rows = [
        ("No. PPAB", str(verf.no_ppab or "-")),
        ("Sumber Rek", str(verf.sumber_rek or "-").upper()),
        ("Beban Rek", str(verf.beban_rek or "-")),
        ("RKAP 1 Tahun", format_rp(verf.rkap_1_tahun)),
        ("Realisasi s/d saat ini", format_rp(verf.realisasi)),
        ("Permintaan", format_rp(verf.permintaan)),
        ("Sisa Anggaran", format_rp(verf.sisa_anggaran)),
    ]

    curr_y = header_y - 11.5
    row_gap = 12.0

    for label, val in rows:
        # Label (Warna Merah)
        c.setFont("Helvetica-Bold", 6.8)
        c.setFillColor(red_color)
        c.drawString(start_x + 8.0, curr_y, label)
        c.drawString(start_x + 102.0, curr_y, ":")

        # Value (Warna Hitam)
        c.setFont("Helvetica-Bold" if "Rp" in val or label == "No. PPAB" else "Helvetica", 6.8)
        c.setFillColor(black_color)

        # Truncate value if too long to avoid overflowing box
        val_str = str(val)
        if len(val_str) > 28:
            val_str = val_str[:26] + "..."
        c.drawString(start_x + 108.0, curr_y, val_str)

        curr_y -= row_gap

    # 6. Signature Section at the Bottom
    sig_top_y = curr_y + 3.0
    c.setStrokeColor(red_border)
    c.setLineWidth(0.8)
    c.line(start_x, sig_top_y, start_x + box_width, sig_top_y)

    sig_center_x = start_x + (box_width / 2.0)

    # Sig Title (Red)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(red_color)
    c.drawCentredString(sig_center_x, sig_top_y - 9.0, "TANDA TANGAN VERIFIKATOR")

    # QR Code Image
    qr_size = 35.0
    qr_x = sig_center_x - (qr_size / 2.0)
    qr_y = sig_top_y - 46.0

    if verf.verify_url:
        try:
            qr_img_buf = _generate_qr_image(verf.verify_url)
            qr_img = ImageReader(qr_img_buf)
            c.drawImage(qr_img, qr_x, qr_y, width=qr_size, height=qr_size)
        except Exception:
            c.setStrokeColor(HexColor("#CCCCCC"))
            c.rect(qr_x, qr_y, qr_size, qr_size)

    # Text "Ditandatangani secara elektronik" (Red)
    c.setFont("Helvetica-Bold", 5.2)
    c.setFillColor(red_color)
    c.drawCentredString(sig_center_x, qr_y - 6.0, "Ditandatangani secara elektronik")

    # Verifier Name & Signed Timestamp (Black)
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(black_color)
    v_name = str(verf.verifier_name or "Verifikator")
    if len(v_name) > 30:
        v_name = v_name[:28] + "..."
    c.drawCentredString(sig_center_x, qr_y - 13.0, v_name)

    if verf.verifier_signed_at:
        c.setFont("Helvetica", 5.5)
        c.setFillColor(black_color)
        c.drawCentredString(sig_center_x, qr_y - 20.0, str(verf.verifier_signed_at))


def stamp_pdf(
    source_pdf_bytes: bytes,
    approvers: List[ApproverStamp],
    verf_anggaran: Optional[VerfAnggaranStamp] = None,
    stamp_area_height: float = 80,
) -> bytes:
    """
    Stamp tanda tangan digital ke PDF asli.
    """
    reader = PdfReader(io.BytesIO(source_pdf_bytes))
    writer = PdfWriter()
    
    last_page_idx = len(reader.pages) - 1
    
    column_centers, box_top_y, box_bottom_y = _detect_signature_boxes_from_pdf(
        source_pdf_bytes, page_idx=last_page_idx
    )
    
    for i, page in enumerate(reader.pages):
        if i == last_page_idx:
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            
            overlay_buf = _create_stamp_overlay(
                page_width=page_width,
                page_height=page_height,
                approvers=approvers,
                column_centers=column_centers,
                box_top_y=box_top_y,
                box_bottom_y=box_bottom_y,
                verf_anggaran=verf_anggaran,
            )
            
            overlay_reader = PdfReader(overlay_buf)
            if len(overlay_reader.pages) > 0:
                page.merge_page(overlay_reader.pages[0])
        
        writer.add_page(page)
    
    output_buf = io.BytesIO()
    writer.write(output_buf)
    output_buf.seek(0)
    return output_buf.getvalue()
