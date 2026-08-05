<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Ppab;
use App\Models\Po;
use App\Models\Mis;
use App\Models\Fr;
use App\Models\FundSettlement;
use App\Models\PpabAttachment;
use App\Models\PoAttachment;
use App\Models\MisAttachment;
use App\Models\FrAttachment;
use App\Models\FsAttachment;
use App\Models\User;

class AttachmentController extends Controller
{
    /**
     * Upload additional attachment file(s) to a document.
     */
    public function uploadAttachment(Request $request, $docType, $id)
    {
        $docType = strtolower($docType);
        if ($docType === 'fund_settlement') {
            $docType = 'fs';
        }

        $user = auth()->user();
        $userIds = [$user->id];
        if (!empty($user->employee_id)) {
            $userIds = array_unique(array_merge($userIds, User::where('employee_id', $user->employee_id)->pluck('id')->toArray()));
        }

        $document = $this->findDocument($docType, $id);
        if (!$document) {
            return response()->json(['success' => false, 'message' => 'Dokumen tidak ditemukan.'], 404);
        }

        // Check authorization (is owner, approver, or admin)
        $isOwner = false;
        $isApprover = false;

        if ($docType === 'fr') {
            $isOwner = in_array($document->requester_id, $userIds);
            $isApprover = $document->approvers()->whereIn('approver_id', $userIds)->exists();
        } elseif ($docType === 'fs') {
            $isOwner = in_array($document->requester_id, $userIds);
            $isApprover = $document->approvers()->whereIn('approver_id', $userIds)->exists();
        } else {
            $isOwner = in_array($document->user_id, $userIds);
            $isApprover = $document->approverLines()->whereIn('approver_id', $userIds)->exists();
        }

        if (!$isOwner && !$isApprover && !in_array(strtolower($user->role ?? ''), ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        $request->validate([
            'attachments'   => 'nullable|array',
            'attachments.*' => 'required|file|max:20480', // Max 20MB per file
            'file'          => 'nullable|file|max:20480',
        ]);

        $files = [];
        if ($request->hasFile('attachments')) {
            $raw = $request->file('attachments');
            $files = is_array($raw) ? $raw : [$raw];
        } elseif ($request->hasFile('file')) {
            $files = [$request->file('file')];
        }

        if (empty($files)) {
            return response()->json(['success' => false, 'message' => 'Tidak ada file lampiran yang diunggah.'], 400);
        }

        $createdRecords = [];
        $folder = "{$docType}-attachments";

        foreach ($files as $file) {
            if (!$file->isValid()) continue;

            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getClientMimeType();

            $storedPath = $file->store($folder, 'local');

            if ($docType === 'ppab') {
                $record = PpabAttachment::create([
                    'ppab_id'       => $document->id,
                    'filename'      => $storedPath,
                    'original_name' => $originalName,
                    'file_size'     => $fileSize,
                    'mime_type'     => $mimeType,
                ]);
            } elseif ($docType === 'po') {
                $record = PoAttachment::create([
                    'po_id'         => $document->id,
                    'filename'      => $storedPath,
                    'original_name' => $originalName,
                    'file_size'     => $fileSize,
                    'mime_type'     => $mimeType,
                ]);
            } elseif ($docType === 'mis') {
                $record = MisAttachment::create([
                    'mis_id'        => $document->id,
                    'filename'      => $storedPath,
                    'original_name' => $originalName,
                    'file_size'     => $fileSize,
                    'mime_type'     => $mimeType,
                ]);
            } elseif ($docType === 'fr') {
                $record = FrAttachment::create([
                    'fr_id'    => $document->id,
                    'filename' => $storedPath,
                ]);
            } elseif ($docType === 'fs') {
                $record = FsAttachment::create([
                    'fs_id'    => $document->id,
                    'filename' => $storedPath,
                ]);
            }

            $createdRecords[] = [
                'id'            => $record->id,
                'filename'      => basename($record->filename),
                'original_name' => $record->original_name ?? basename($record->filename),
                'file_size'     => $record->file_size ?? null,
                'mime_type'     => $record->mime_type ?? null,
                'url'           => url("/api/{$docType}/attachment/{$record->id}"),
                'created_at'    => $record->created_at,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'Lampiran berhasil diunggah.',
            'data'    => $createdRecords,
        ], 201);
    }

    /**
     * Download or view inline attachment file.
     */
    public function downloadAttachment($docType, $attachmentId)
    {
        $docType = strtolower($docType);
        if ($docType === 'fund_settlement') {
            $docType = 'fs';
        }

        $attachment = $this->findAttachmentRecord($docType, $attachmentId);
        if (!$attachment) {
            return response()->json(['success' => false, 'message' => 'Lampiran tidak ditemukan.'], 404);
        }

        $path = storage_path('app/' . $attachment->filename);
        if (!file_exists($path)) {
            return response()->json(['success' => false, 'message' => 'File fisik tidak ditemukan pada server.'], 404);
        }

        $displayName = $attachment->original_name ?? basename($attachment->filename);
        $mime = $attachment->mime_type ?? mime_content_type($path) ?? 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $displayName . '"',
        ]);
    }

    /**
     * Delete an attachment.
     */
    public function deleteAttachment($docType, $attachmentId)
    {
        $docType = strtolower($docType);
        if ($docType === 'fund_settlement') {
            $docType = 'fs';
        }

        $user = auth()->user();
        $attachment = $this->findAttachmentRecord($docType, $attachmentId);
        if (!$attachment) {
            return response()->json(['success' => false, 'message' => 'Lampiran tidak ditemukan.'], 404);
        }

        $path = storage_path('app/' . $attachment->filename);
        if (file_exists($path)) {
            @unlink($path);
        }

        $attachment->delete();

        return response()->json(['success' => true, 'message' => 'Lampiran berhasil dihapus.']);
    }

    private function findDocument(string $docType, int $id)
    {
        return match ($docType) {
            'ppab' => Ppab::find($id),
            'po'   => Po::find($id),
            'mis'  => Mis::find($id),
            'fr'   => Fr::find($id),
            'fs'   => FundSettlement::find($id),
            default => null,
        };
    }

    private function findAttachmentRecord(string $docType, int $attachmentId)
    {
        return match ($docType) {
            'ppab' => PpabAttachment::find($attachmentId),
            'po'   => PoAttachment::find($attachmentId),
            'mis'  => MisAttachment::find($attachmentId),
            'fr'   => FrAttachment::find($attachmentId),
            'fs'   => FsAttachment::find($attachmentId),
            default => null,
        };
    }
}
