<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PortalController extends Controller
{
    /**
     * Forward request to Portal SSO API.
     */
    private function forwardRequest(Request $request, string $endpoint)
    {
        $portalUrl = rtrim(env('PORTAL_API_URL', 'https://portal.inl.co.id'), '/');
        $internalToken = env('SSO_INTERNAL_TOKEN');

        if (!$internalToken) {
            Log::warning('SSO_INTERNAL_TOKEN is not configured');
            return response()->json([
                'success' => false,
                'message' => 'SSO internal token belum dikonfigurasi di server.',
            ], 503);
        }

        $http = Http::withHeaders([
            'x-internal' => $internalToken,
            'Accept' => 'application/json',
        ]);

        if (app()->environment('local')) {
            $http = $http->withoutVerifying();
        }

        $response = $http->get("{$portalUrl}/api/sso/{$endpoint}", $request->query());

        if ($response->failed()) {
            Log::error("Portal SSO {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return response()->json($response->json(), $response->status());
    }

    public function employees(Request $request)
    {
        $response = $this->forwardRequest($request, 'employees');

        if ($response->getStatusCode() >= 400) {
            return $response;
        }

        $json = $response->getData(true);
        $list = $this->extractEmployeeList($json);
        $normalized = array_values(array_filter(array_map([$this, 'normalizeEmployee'], $list)));

        // Filter by own unit if requested
        if ($request->query('filter_own_unit') == '1' && auth()->check()) {
            $userUnit = auth()->user()->unit_nama;
            if ($userUnit) {
                $normalized = array_values(array_filter($normalized, function ($emp) use ($userUnit) {
                    return isset($emp['unitNama']) && strtolower(trim($emp['unitNama'])) === strtolower(trim($userUnit));
                }));
            }
        }

        return response()->json([
            'success' => true,
            'data' => $normalized,
        ]);
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

    private function extractEmployeeList($raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        if ($this->isList($raw)) {
            return $raw;
        }

        if (isset($raw['data']) && is_array($raw['data'])) {
            if ($this->isList($raw['data'])) {
                return $raw['data'];
            }

            if (isset($raw['data']['data']) && is_array($raw['data']['data'])) {
                return $raw['data']['data'];
            }
        }

        return [];
    }

    private function isList(array $value): bool
    {
        if ($value === []) {
            return true;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }

    private function normalizeEmployee($emp): ?array
    {
        if (!is_array($emp)) {
            return null;
        }

        $grade = is_array($emp['grade'] ?? null) ? $emp['grade'] : [];
        $unit = is_array($emp['unit'] ?? null) ? $emp['unit'] : [];
        $penempatan = is_array($emp['penempatanArea'] ?? null)
            ? $emp['penempatanArea']
            : (is_array($emp['penempatan'] ?? null) ? $emp['penempatan'] : []);

        $id = $emp['id'] ?? $emp['employeeId'] ?? $emp['employee_id'] ?? null;
        $namaLengkap = $emp['namaLengkap'] ?? $emp['nama_lengkap'] ?? $emp['name'] ?? null;

        if (!$id || !$namaLengkap) {
            return null;
        }

        return [
            'id' => (string) $id,
            'employeeId' => (string) ($emp['employeeId'] ?? $emp['employee_id'] ?? $id),
            'namaLengkap' => (string) $namaLengkap,
            'jabatan' => $emp['jabatan'] ?? $emp['role'] ?? $emp['position'] ?? null,
            'gradeLevel' => $grade['level'] ?? $emp['gradeLevel'] ?? null,
            'gradeKode' => $grade['kode'] ?? $grade['nama'] ?? $emp['gradeKode'] ?? null,
            'unitNama' => $unit['nama'] ?? $emp['unitNama'] ?? $emp['unit_nama'] ?? null,
            'unitKode' => $unit['kode'] ?? $unit['code'] ?? $emp['unitKode'] ?? $emp['unit_kode'] ?? null,
            'penempatanNama' => $penempatan['nama'] ?? $emp['penempatanNama'] ?? null,
            'email' => $emp['email'] ?? null,
        ];
    }
}
