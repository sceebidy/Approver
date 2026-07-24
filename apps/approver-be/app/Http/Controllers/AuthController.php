<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Handle SSO Login via Portal
     */
    public function login(Request $request)
    {
        $request->validate([
            'ssoToken' => 'required|string',
            'appId'    => 'required|string',
        ]);

        $portalUrl = env('PORTAL_API_URL');
        
        try {
            // Call Portal SSO Verify
            $response = Http::withoutVerifying()->post("{$portalUrl}/api/sso/verify", [
                'token'  => $request->ssoToken,
                'app_id' => $request->appId,
            ]);

            if ($response->failed()) {
                Log::error('SSO Verify Failed', ['response' => $response->body()]);
                return response()->json([
                    'success' => false,
                    'message' => 'SSO Token invalid or expired.'
                ], 401);
            }

            $responseData = $response->json();
            $portalUser = $responseData['data'] ?? null;

            if (!$portalUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid user data received from portal.'
                ], 401);
            }

            // Upsert User Cache based on email or portal ID
            // Assuming Portal returns 'email' and 'employee' object
            $email = $portalUser['email'];
            $employee = $portalUser['employee'] ?? null;
            
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $employee['namaLengkap'] ?? $portalUser['name'] ?? 'Unknown',
                    'employee_id' => $employee['id'] ?? null,
                    'role' => $portalUser['role'] ?? null,
                    'grade_level' => $employee['grade']['level'] ?? null,
                    'unit_nama' => $employee['unit']['nama'] ?? null,
                    'foto_profil' => $employee['fotoProfil'] ?? null,
                    'penempatan_nama' => $employee['penempatanArea']['nama'] ?? null,
                    'password' => bcrypt(\Illuminate\Support\Str::random(16)), // Fallback password
                ]
            );

            // Session login
            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'employeeId' => $user->employee_id,
                        'email' => $user->email,
                        'name' => $user->name,
                        'role' => $user->role,
                        'unit_nama' => $user->unit_nama,
                        'grade_level' => $user->grade_level,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('SSO Exception', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Internal server error during authentication.'
            ], 500);
        }
    }

    /**
     * Get Current User Profile
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'email' => $request->user()->email,
                'user' => $request->user()
            ]
        ]);
    }

    /**
     * Logout & Revoke Token
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    /**
     * Provide CSRF Token
     */
    public function csrf()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'csrfToken' => csrf_token()
            ]
        ]);
    }
}
