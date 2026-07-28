<?php

namespace App\Http\Controllers;

use App\Models\KategoriFr;
use App\Models\ApproverKategoriFr;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApproverKategoriFrController extends Controller
{
    /**
     * Get all categories and their 4-role mappings.
     */
    public function index(Request $request)
    {
        // Enforce super_admin role check
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $categories = KategoriFr::with('approverKategoriFr.user')->get();

        $data = $categories->map(function ($cat) {
            $mappings = [];
            
            // Standard 4 roles to guarantee they exist in return format
            $roles = ['issued_by', 'checked_by', 'approved_by', 'approved_by_atasan'];
            foreach ($roles as $role) {
                $mapped = $cat->approverKategoriFr->where('role', $role)->first();
                $mappings[$role] = $mapped ? [
                    'user_id' => $mapped->user_id,
                    'name' => $mapped->user?->name ?? 'User #' . $mapped->user_id
                ] : null;
            }

            return [
                'kategori_fr_id' => $cat->id,
                'nama' => $cat->nama,
                'mappings' => $mappings
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Update/Upsert the 4-role mappings for a specific category.
     */
    public function update(Request $request, $kategoriId)
    {
        // Enforce super_admin role check
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'mappings' => 'required|array',
            'mappings.issued_by' => 'nullable|integer|exists:users,id',
            'mappings.checked_by' => 'nullable|integer|exists:users,id',
            'mappings.approved_by' => 'nullable|integer|exists:users,id',
            'mappings.approved_by_atasan' => 'nullable|integer|exists:users,id',
        ]);

        $kategori = KategoriFr::findOrFail($kategoriId);

        DB::transaction(function () use ($request, $kategori) {
            foreach ($request->mappings as $role => $userId) {
                if ($userId) {
                    ApproverKategoriFr::updateOrCreate(
                        [
                            'kategori_fr_id' => $kategori->id,
                            'role' => $role
                        ],
                        [
                            'user_id' => $userId
                        ]
                    );
                } else {
                    ApproverKategoriFr::where('kategori_fr_id', $kategori->id)
                        ->where('role', $role)
                        ->delete();
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Approver mapping updated successfully.'
        ]);
    }

    /**
     * Get all local users available to be selected as approvers.
     */
    public function users(Request $request)
    {
        // Enforce super_admin role check
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $users = User::select('id', 'name', 'email')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $users]);
    }
}
