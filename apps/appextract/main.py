import tempfile
import os
import json

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import Response
# pyrefly: ignore [missing-import]
import pdfplumber

from parsers.detector import parse_document
from parsers.stamper import stamp_pdf, ApproverStamp

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
    approvers_json: str = Form(..., description="JSON array data approver"),
):
    """
    Stamp tanda tangan digital ke PDF asli.
    
    Menerima:
    - file: PDF asli (multipart file upload)
    - approvers_json: JSON string berisi array of approver data, contoh:
      [
        {
          "role": "Manajer/Kabag IT",
          "name": "John Doe",
          "jabatan": "Manager IT",
          "signed_at": "28/07/2026 10:30",
          "verify_url": "https://example.com/verify/ppab/1/1?token=abc123"
        }
      ]
    
    Returns: PDF file yang sudah di-stamp (application/pdf)
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=422, detail="File harus berformat PDF")

    try:
        approvers_data = json.loads(approvers_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"approvers_json bukan JSON valid: {str(e)}")

    if not isinstance(approvers_data, list) or len(approvers_data) == 0:
        raise HTTPException(status_code=422, detail="approvers_json harus berisi array minimal 1 approver")

    # Parse approver data
    approvers = []
    for a in approvers_data:
        approvers.append(ApproverStamp(
            role=a.get("role", "Approver"),
            name=a.get("name", "Unknown"),
            jabatan=a.get("jabatan", ""),
            signed_at=a.get("signed_at", ""),
            verify_url=a.get("verify_url", ""),
        ))

    # Baca PDF asli
    source_pdf_bytes = await file.read()

    try:
        stamped_pdf_bytes = stamp_pdf(source_pdf_bytes, approvers)
    except Exception as e:
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
