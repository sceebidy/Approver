<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PythonExtractorService;
use Illuminate\Http\JsonResponse;

class ExtractionController extends Controller
{
    protected $extractorService;

    public function __construct(PythonExtractorService $extractorService)
    {
        $this->extractorService = $extractorService;
    }

    /**
     * Handle the incoming document extraction request.
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

        return response()->json([
            'message' => 'Document extracted successfully',
            'data' => $extractedData,
        ]);
    }
}
