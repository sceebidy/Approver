<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PortalController extends Controller
{
    /**
     * Forward request to Portal API
     */
    private function forwardRequest(Request $request, $endpoint)
    {
        $portalUrl = rtrim(env('PORTAL_API_URL', 'https://portal.inl.co.id'), '/');
        $internalToken = env('SSO_INTERNAL_TOKEN');
        
        $response = Http::withHeaders([
            'x-internal' => $internalToken,
            'Accept' => 'application/json'
        ])->get("{$portalUrl}/api/sso/{$endpoint}", $request->query());

        return response()->json($response->json(), $response->status());
    }

    public function employees(Request $request)
    {
        return $this->forwardRequest($request, 'employees');
    }

    public function grades(Request $request)
    {
        return $this->forwardRequest($request, 'grades');
    }

    public function organizationUnits(Request $request)
    {
        return $this->forwardRequest($request, 'organization-units');
    }

    public function placements(Request $request)
    {
        return $this->forwardRequest($request, 'placements');
    }
}
