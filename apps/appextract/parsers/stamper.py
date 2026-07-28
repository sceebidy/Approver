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
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def _detect_signature_boxes_from_pdf(source_pdf_bytes: bytes, page_idx: int = -1) -> Tuple[List[float], float, float]:
    """
    Secara dinamis mendeteksi koordinat X pusat kolom dan Y range (top/bottom) 
    dari kotak tanda tangan di halaman PDF menggunakan pdfplumber.
    
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
            
            words = page.extract_words()
            
            # Cari kata 'Tgl' atau 'Tgl:' yang menandai awal kotak tanda tangan
            tgl_words = [w for w in words if 'Tgl' in w['text']]
            tgl_words = sorted(tgl_words, key=lambda w: w['x0'])
            
            if len(tgl_words) >= 1:
                # Top dari kotak tanda tangan (di bawah teks 'Tgl')
                box_top_pdf = max(w['bottom'] for w in tgl_words) + 1.5
                
                # Cari garis horizontal di bawah 'Tgl' sebagai batas bawah kotak tanda tangan
                lines = page.lines
                h_lines = [l for l in lines if l['top'] > box_top_pdf and abs(l['top'] - l['bottom']) < 2]
                h_lines = sorted(h_lines, key=lambda l: l['top'])
                
                if h_lines:
                    box_bottom_pdf = h_lines[0]['top'] - 1.0
                else:
                    # Cari kata 'Batasan' sebagai alternatif pembatas bawah
                    batasan_words = [w for w in words if 'Batasan' in w['text']]
                    if batasan_words:
                        box_bottom_pdf = batasan_words[0]['top'] - 3.0
                    else:
                        box_bottom_pdf = box_top_pdf + 55.0
                
                # Konversi ke koordinat ReportLab (Y=0 di bawah)
                box_top_y = page_height - box_top_pdf
                box_bottom_y = page_height - box_bottom_pdf
                
                # Hitung X centers untuk tiap kolom
                column_centers = []
                for i, w in enumerate(tgl_words):
                    x_start = w['x0'] - 5.0
                    if i < len(tgl_words) - 1:
                        x_end = tgl_words[i+1]['x0'] - 5.0
                    else:
                        # Kolom terakhir
                        x_end = page_width - 12.0
                    column_centers.append((x_start + x_end) / 2.0)
                
                return column_centers, box_top_y, box_bottom_y
                
    except Exception as e:
        import logging
        logging.warning(f"Gagal deteksi dinamis posisi tanda tangan: {e}")

    # Fallback default jika deteksi dinamis gagal
    return [99.18, 289.08, 498.84, 717.12], 222.0, 151.08


def _create_stamp_overlay(
    page_width: float,
    page_height: float,
    approvers: List[ApproverStamp],
    column_centers: List[float],
    box_top_y: float,
    box_bottom_y: float,
) -> io.BytesIO:
    """
    Buat overlay PDF dengan stamp approver di bagian bawah.
    Menampilkan QR Code (ukuran 40pt) dan teks "Ditandatangani secara elektronik" (5.5pt)
    yang diposisikan pas dan sedikit lebih ke atas di dalam kotak tanda tangan.
    """
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(page_width, page_height))
    
    if not approvers:
        c.save()
        buf.seek(0)
        return buf

    qr_size = 40.0
    label_font_size = 5.5
    gap = 5.0
    total_content_height = qr_size + gap + label_font_size
    box_height = abs(box_top_y - box_bottom_y)
    
    # Hitung posisi Y agar QR code & label di dalam kotak, dengan offset ke atas +5pt
    offset_up = 5.0
    start_y = box_top_y - ((box_height - total_content_height) / 2.0) + offset_up
    qr_y = start_y - qr_size
    label_y = qr_y - gap - (label_font_size / 2.0)

    # Mapping for PPAB approval roles to physical columns (0-indexed)
    role_col_mapping = {
        "pelaksanaan_disetujui_oleh": [0],
        "diperiksa_oleh": [1, 2],
        "anggaran_disetujui_oleh": [3],
    }
    
    role_counts = {}
    fallback_idx = 0
    
    # Track how many people are in each physical column so we can stack if necessary
    col_occupancy = {}

    for approver in approvers:
        role_key = approver.role.lower().strip() if approver.role else ""
        
        if role_key in role_col_mapping:
            allowed_cols = role_col_mapping[role_key]
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
        # For a simple fix, we shift vertically by a fraction and shrink the gap, 
        # or we assume they mostly fit the 1-to-1 mapping.
        current_qr_y = qr_y
        current_label_y = label_y
        if occupancy > 0:
            # Shift the next QR code to the right and slightly up if stacked
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
    
    c.save()
    buf.seek(0)
    return buf


def stamp_pdf(
    source_pdf_bytes: bytes,
    approvers: List[ApproverStamp],
    stamp_area_height: float = 80,
) -> bytes:
    """
    Stamp tanda tangan digital ke PDF asli.
    
    Args:
        source_pdf_bytes: Bytes dari PDF asli
        approvers: List data approver yang akan di-stamp
        stamp_area_height: Ignored (posisi dideteksi secara dinamis)
    
    Returns:
        Bytes PDF yang sudah di-stamp
    """
    reader = PdfReader(io.BytesIO(source_pdf_bytes))
    writer = PdfWriter()
    
    last_page_idx = len(reader.pages) - 1
    
    # Deteksi posisi kotak tanda tangan secara dinamis pada halaman terakhir
    column_centers, box_top_y, box_bottom_y = _detect_signature_boxes_from_pdf(
        source_pdf_bytes, page_idx=last_page_idx
    )
    
    # Copy semua halaman
    for i, page in enumerate(reader.pages):
        if i == last_page_idx:
            # Halaman terakhir — tambahkan stamp overlay
            page_width = float(page.mediabox.width)
            page_height = float(page.mediabox.height)
            
            overlay_buf = _create_stamp_overlay(
                page_width=page_width,
                page_height=page_height,
                approvers=approvers,
                column_centers=column_centers,
                box_top_y=box_top_y,
                box_bottom_y=box_bottom_y,
            )
            
            overlay_reader = PdfReader(overlay_buf)
            if len(overlay_reader.pages) > 0:
                page.merge_page(overlay_reader.pages[0])
        
        writer.add_page(page)
    
    output_buf = io.BytesIO()
    writer.write(output_buf)
    output_buf.seek(0)
    return output_buf.getvalue()
