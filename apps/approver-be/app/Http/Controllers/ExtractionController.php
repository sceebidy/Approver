<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PythonExtractorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ExtractionController extends Controller
{
    protected $extractorService;

    public function __construct(PythonExtractorService $extractorService)
    {
        $this->extractorService = $extractorService;
    }

    /**
     * Handle the incoming document extraction request.
     * Juga menyimpan PDF asli ke storage agar bisa di-stamp nantinya.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function extract(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB PDF
        ]);

        $file = $request->file('file');
        
        $extractedData = $this->extractorService->extract($file);

        if (!$extractedData) {
            return response()->json([
                'message' => 'Failed to extract data from document. Please ensure the Python API is running.',
            ], 500);
        }

        // Simpan PDF asli ke storage/app/source-documents/
        $dirPath = storage_path('app/source-documents');
        if (!file_exists($dirPath)) {
            mkdir($dirPath, 0755, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName) . '_' . time() . '.pdf';
        $file->move($dirPath, $safeName);
        $storedPath = "source-documents/{$safeName}";

        return response()->json([
            'message' => 'Document extracted successfully',
            'data' => $extractedData,
            'source_pdf_path' => $storedPath,
        ]);
    }
}
