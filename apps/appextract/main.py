import tempfile
import os
import json

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
# pyrefly: ignore [missing-import]
import pdfplumber

from typing import Optional
from parsers.detector import parse_document
from parsers.stamper import stamp_pdf, ApproverStamp, VerfAnggaranStamp

app = FastAPI(title="PDF to JSON Microservice")


def pdf_to_json(file_path: str) -> dict:
    with pdfplumber.open(file_path) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        layout_text = "\n".join(page.extract_text(layout=True) or "" for page in pdf.pages)
    return parse_document(full_text, layout_text)


@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=422, detail="File harus berformat PDF")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        result = pdf_to_json(tmp_path)
    finally:
        os.remove(tmp_path)

    return result


@app.post("/stamp-pdf")
async def stamp_pdf_endpoint(
    file: UploadFile = File(..., description="PDF asli yang akan di-stamp"),
    approvers_json: str = Form("[]", description="JSON array data approver"),
    verf_anggaran_json: Optional[str] = Form(None, description="JSON object data verifikasi anggaran"),
):
    """
    Stamp tanda tangan digital & verifikasi anggaran ke PDF asli.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=422, detail="File harus berformat PDF")

    approvers = []
    if approvers_json and approvers_json.strip():
        try:
            approvers_data = json.loads(approvers_json)
            if isinstance(approvers_data, list):
                for a in approvers_data:
                    approvers.append(ApproverStamp(
                        role=a.get("role", "Approver"),
                        name=a.get("name", "Unknown"),
                        jabatan=a.get("jabatan", ""),
                        signed_at=a.get("signed_at", ""),
                        verify_url=a.get("verify_url", ""),
                        role_index=int(a.get("role_index", 0)),
                    ))
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=422, detail=f"approvers_json bukan JSON valid: {str(e)}")

    verf_stamp = None
    if verf_anggaran_json and verf_anggaran_json.strip():
        try:
            v = json.loads(verf_anggaran_json)
            if isinstance(v, dict):
                verf_stamp = VerfAnggaranStamp(
                    no_ppab=v.get("no_ppab", ""),
                    sumber_rek=v.get("sumber_rek", ""),
                    beban_rek=v.get("beban_rek", ""),
                    rkap_1_tahun=float(v.get("rkap_1_tahun", 0)),
                    realisasi=float(v.get("realisasi", 0)),
                    permintaan=float(v.get("permintaan", 0)),
                    sisa_anggaran=float(v.get("sisa_anggaran", 0)),
                    verifier_name=v.get("verifier_name", "Verifikator"),
                    verifier_signed_at=v.get("verifier_signed_at", ""),
                    verify_url=v.get("verify_url", ""),
                )
        except Exception:
            pass

    source_pdf_bytes = await file.read()

    try:
        stamped_pdf_bytes = stamp_pdf(source_pdf_bytes, approvers, verf_stamp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal stamp PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal stamp PDF: {str(e)}")

    return Response(
        content=stamped_pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "inline; filename=\"stamped.pdf\""
        }
    )


@app.get("/health")
def health():
    return {"status": "ok"}
