import tempfile
import os

from fastapi import FastAPI, UploadFile, File, HTTPException
import pdfplumber

from parsers.detector import parse_document

app = FastAPI(title="PDF to JSON Microservice")


def pdf_to_json(file_path: str) -> dict:
    with pdfplumber.open(file_path) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    return parse_document(full_text)


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


@app.get("/health")
def health():
    return {"status": "ok"}
