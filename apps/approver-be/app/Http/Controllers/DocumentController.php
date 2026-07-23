<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function process(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        
        // Forward the request to the FastAPI microservice on port 8001
        $response = \Illuminate\Support\Facades\Http::attach(
            'file', file_get_contents($file->getRealPath()), $file->getClientOriginalName()
        )->post('http://127.0.0.1:8001/convert');

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'data' => $response->json(),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to process document in microservice',
            'error' => $response->body()
        ], $response->status());
    }
}
