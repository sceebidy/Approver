<?php

namespace App\Http\Controllers;

use App\Models\Mis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class MisController extends Controller
{
    public function index()
    {
        $items = \App\Models\Mis::with(['user:id,name', 'approverLines'])
            ->latest()
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'nomor_mis'  => $m->nomor_mis,
                'tgl_mis'    => $m->tgl_mis,
                'user_id'    => $m->user_id,
                'user_name'  => $m->user?->name,
                'created_at' => $m->created_at,
                'status'     => 'pending',
                'can_cancel' => !$m->approverLines->contains('status', 'approved'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomor_mis' => 'required|string|max:255|unique:mis,nomor_mis',
            'tgl_mis' => 'required|string',
            'user_id' => 'nullable|integer|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.desc' => 'required|string',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.qty' => 'required|numeric',
            'items.*.remark' => 'nullable|string',
            'approver_lines' => 'nullable|array',
            'approver_lines.*.approver_id' => 'required|integer|exists:users,id',
            'approver_lines.*.role' => 'required|string|in:requestor,checker,issuer,approver',
            'approver_lines.*.status' => 'nullable|string|in:pending,approval,rejected',
            'approver_lines.*.timestamp' => 'nullable|date',
        ]);

        $tglMis = $this->parseMisDate($data['tgl_mis']);
        if (!$tglMis) {
            return response()->json([
                'success' => false,
                'message' => 'Format tgl_mis harus dd/mm/YYYY atau YYYY-mm-dd.',
            ], 422);
        }

        $userId = auth()->id() ?? ($data['user_id'] ?? null);
        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terautentikasi. Silakan login terlebih dahulu.',
            ], 401);
        }

        $mis = DB::transaction(function () use ($data, $userId, $tglMis) {
            $mis = Mis::create([
                'user_id' => $userId,
                'nomor_mis' => $data['nomor_mis'],
                'tgl_mis' => $tglMis->format('Y-m-d'),
            ]);

            foreach ($data['items'] as $item) {
                $mis->itemLines()->create([
                    'desc' => $item['desc'],
                    'satuan' => $item['satuan'],
                    'qty' => $item['qty'],
                    'remark' => $item['remark'] ?? null,
                ]);
            }

            if (!empty($data['approver_lines'])) {
                foreach ($data['approver_lines'] as $line) {
                    $mis->approverLines()->create([
                        'approver_id' => $line['approver_id'],
                        'role' => $line['role'],
                        'status' => $line['status'] ?? 'pending',
                        'timestamp' => $line['timestamp'] ?? null,
                    ]);
                }
            }

            return $mis->load('itemLines', 'approverLines');
        });

        return response()->json([
            'success' => true,
            'data' => $mis,
        ], 201);
    }

    public function destroy($id)
    {
        $mis = Mis::with('approverLines')->findOrFail($id);

        $hasApproved = $mis->approverLines()->where('status', 'approved')->exists();

        if ($hasApproved) {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan tidak dapat dihapus karena sudah ada approval yang disetujui.'
            ], 409);
        }

        DB::transaction(function () use ($mis) {
            $mis->approverLines()->delete();
            $mis->itemLines()->delete();
            $mis->delete();
        });

        return response()->json(['success' => true, 'message' => 'Pengajuan MIS berhasil dihapus.']);
    }

    private function parseMisDate(string $date)
    {
        foreach (['d/m/Y', 'Y-m-d'] as $format) {
            try {
                return Carbon::createFromFormat($format, $date);
            } catch (\Exception $e) {
                continue;
            }
        }

        return null;
    }
}
