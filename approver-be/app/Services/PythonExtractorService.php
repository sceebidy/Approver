<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PythonExtractorService
{
    /**
     * Send the uploaded document to the Python API for extraction.
     *
     * @param UploadedFile $file
     * @return array|null The extracted data, or null on failure.
     */
    public function extract(UploadedFile $file): ?array
    {
        $pythonApiUrl = env('PYTHON_API_URL', 'http://127.0.0.1:8000');
        $endpoint = rtrim($pythonApiUrl, '/') . '/convert';

        try {
            // Send the file as a multipart request
            $response = Http::attach(
                'file', file_get_contents($file->getRealPath()), $file->getClientOriginalName()
            )->post($endpoint);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Python API error: ' . $response->body());
            return null;

        } catch (\Exception $e) {
            Log::error('Failed to connect to Python API: ' . $e->getMessage());
            return null;
        }
    }
}
