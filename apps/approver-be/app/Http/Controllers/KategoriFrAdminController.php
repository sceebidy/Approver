<?php

namespace App\Http\Controllers;

use App\Models\KategoriFr;
use App\Models\Fr;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KategoriFrAdminController extends Controller
{
    /**
     * Display a listing of all FR categories.
     * Accessible by authenticated users / admins.
     */
    public function index(Request $request)
    {
        $categories = KategoriFr::orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Store a newly created category.
     * Restricted to super_admin or admin.
     */
    public function store(Request $request)
    {
        $userRole = strtolower($request->user()?->role ?? '');
        if (!in_array($userRole, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'nama'       => 'required|string|max:255|unique:kategori_fr,nama',
            'min_app'    => 'required|integer|min:1|max:10',
            'max_amount' => 'required|numeric|min:0',
            'seksi_id'   => 'nullable|integer',
        ]);

        $category = KategoriFr::create([
            'nama'       => $validated['nama'],
            'min_app'    => $validated['min_app'],
            'max_amount' => $validated['max_amount'],
            'seksi_id'   => $validated['seksi_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori Fund Control berhasil ditambahkan.',
            'data'    => $category
        ], 201);
    }

    /**
     * Update the specified category.
     * Restricted to super_admin or admin.
     */
    public function update(Request $request, $id)
    {
        $userRole = strtolower($request->user()?->role ?? '');
        if (!in_array($userRole, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $category = KategoriFr::find($id);
        if (!$category) {
            return response()->json(['success' => false, 'message' => 'Kategori tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'nama'       => ['required', 'string', 'max:255', Rule::unique('kategori_fr', 'nama')->ignore($category->id)],
            'min_app'    => ['required', 'integer', 'min:1', 'max:10'],
            'max_amount' => ['required', 'numeric', 'min:0'],
            'seksi_id'   => ['nullable', 'integer'],
        ]);

        $category->update([
            'nama'       => $validated['nama'],
            'min_app'    => $validated['min_app'],
            'max_amount' => $validated['max_amount'],
            'seksi_id'   => $validated['seksi_id'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kategori Fund Control berhasil diperbarui.',
            'data'    => $category
        ]);
    }

    /**
     * Remove the specified category.
     * Restricted to super_admin or admin.
     */
    public function destroy(Request $request, $id)
    {
        $userRole = strtolower($request->user()?->role ?? '');
        if (!in_array($userRole, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $category = KategoriFr::find($id);
        if (!$category) {
            return response()->json(['success' => false, 'message' => 'Kategori tidak ditemukan.'], 404);
        }

        $usageCount = Fr::where('kategori_fr_id', $category->id)->count();
        if ($usageCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Kategori tidak dapat dihapus karena masih digunakan di {$usageCount} pengajuan FR."
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori Fund Control berhasil dihapus.'
        ]);
    }
}
