<?php

namespace App\Http\Controllers;

use App\Models\Tax;
use App\Models\FrItemLineTax;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxController extends Controller
{
    /**
     * Display a listing of the resource.
     * Accessible by all authenticated users for FR form options.
     */
    public function index(Request $request)
    {
        $taxes = Tax::orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $taxes
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * Restricted to super_admin.
     */
    public function store(Request $request)
    {
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tax,name',
            'value' => 'required|numeric|min:0|max:100',
        ]);

        $tax = Tax::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jenis pajak berhasil ditambahkan.',
            'data' => $tax
        ], 201);
    }

    /**
     * Update the specified resource in storage.
     * Restricted to super_admin.
     */
    public function update(Request $request, $id)
    {
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $tax = Tax::find($id);
        if (!$tax) {
            return response()->json(['success' => false, 'message' => 'Data pajak tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('tax', 'name')->ignore($tax->id)],
            'value' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $tax->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jenis pajak berhasil diperbarui.',
            'data' => $tax
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * Restricted to super_admin.
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()?->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $tax = Tax::find($id);
        if (!$tax) {
            return response()->json(['success' => false, 'message' => 'Data pajak tidak ditemukan.'], 404);
        }

        $usageCount = FrItemLineTax::where('tax_id', $tax->id)->count();
        if ($usageCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Tidak bisa dihapus, masih dipakai di {$usageCount} transaksi"
            ], 422);
        }

        $tax->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jenis pajak berhasil dihapus.'
        ]);
    }
}
