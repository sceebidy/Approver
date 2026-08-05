<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExtractionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\PpabController;
use App\Http\Controllers\PoController;
use App\Http\Controllers\MisController;
use App\Http\Controllers\FrController;
use App\Http\Controllers\FsController;
use App\Http\Controllers\DocumentSigningController;
use App\Http\Controllers\ApproverKategoriFrController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\KategoriFrAdminController;

// Public Routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Admin routes
    Route::get('/admin/requests', [\App\Http\Controllers\SubmissionController::class, 'adminRequests']);
    Route::get('/admin/tax', [TaxController::class, 'index']);
    Route::post('/admin/tax', [TaxController::class, 'store']);
    Route::put('/admin/tax/{id}', [TaxController::class, 'update']);
    Route::delete('/admin/tax/{id}', [TaxController::class, 'destroy']);
    Route::get('/admin/kategori-fr', [KategoriFrAdminController::class, 'index']);
    Route::post('/admin/kategori-fr', [KategoriFrAdminController::class, 'store']);
    Route::put('/admin/kategori-fr/{id}', [KategoriFrAdminController::class, 'update']);
    Route::delete('/admin/kategori-fr/{id}', [KategoriFrAdminController::class, 'destroy']);
    // Portal API proxy routes
    Route::get('/portal/employees', [PortalController::class, 'employees']);
    Route::get('/portal/grades', [PortalController::class, 'grades']);
    Route::get('/portal/organization-units', [PortalController::class, 'organizationUnits']);
    Route::get('/portal/placements', [PortalController::class, 'placements']);

    // Submission routes
    Route::post('/submissions', [\App\Http\Controllers\SubmissionController::class, 'create']);
    Route::get('/submissions/pending', [\App\Http\Controllers\SubmissionController::class, 'pendingApprovals']);
    Route::get('/submissions/recent', [\App\Http\Controllers\SubmissionController::class, 'recentDocuments']);
    Route::get('/submissions/history', [\App\Http\Controllers\SubmissionController::class, 'allHistory']);
    Route::post('/submissions/{type}/{lineId}/approve', [\App\Http\Controllers\SubmissionController::class, 'approve']);
    Route::post('/submissions/{type}/{lineId}/reject', [\App\Http\Controllers\SubmissionController::class, 'reject']);

    // PPAB
    Route::get('/ppab',  [PpabController::class, 'index']);
    Route::post('/ppab', [PpabController::class, 'store']);
    Route::get('/ppab/{id}', [PpabController::class, 'show']);
    Route::get('/ppab/{id}/preview-pdf', [PpabController::class, 'previewPdf']);
    Route::post('/ppab/{id}/verf-anggaran', [PpabController::class, 'storeVerfAnggaran']);
    Route::delete('/ppab/{id}', [PpabController::class, 'destroy']);

    // PO
    Route::get('/po',  [PoController::class, 'index']);
    Route::post('/po', [PoController::class, 'store']);
    Route::get('/po/{id}', [PoController::class, 'show']);
    Route::delete('/po/{id}', [PoController::class, 'destroy']);

    // MIS
    Route::get('/mis',  [MisController::class, 'index']);
    Route::post('/mis', [MisController::class, 'store']);
    Route::get('/mis/{id}', [MisController::class, 'show']);
    Route::delete('/mis/{id}', [MisController::class, 'destroy']);

    // FR
    Route::get('/fr', [FrController::class, 'index']);
    Route::get('/fr/categories', [FrController::class, 'categories']);
    Route::get('/fr/approved-list', [FrController::class, 'approvedList']);
    Route::get('/fr/attachment/{id}', [FrController::class, 'downloadAttachment']);
    Route::post('/fr', [FrController::class, 'store']);
    Route::get('/fr/{id}', [FrController::class, 'show']);
    Route::delete('/fr/{id}', [FrController::class, 'destroy']);

    // FS
    Route::get('/fs', [FsController::class, 'index']);
    Route::post('/fs', [FsController::class, 'store']);
    Route::get('/fs/{id}', [FsController::class, 'show']);

    // Signed PDF download (dokumen resmi bertanda tangan digital)
    Route::get('/fs/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'fs');
    Route::get('/ppab/{id}/signed-pdf', [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'ppab');
    Route::get('/po/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'po');
    Route::get('/mis/{id}/signed-pdf',  [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'mis');
    Route::get('/fr/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'fr');

    // Document Attachments (PPAB, PO, MIS, FR, FS)
    Route::post('/{docType}/{id}/attachments', [\App\Http\Controllers\AttachmentController::class, 'uploadAttachment'])->where('docType', 'ppab|po|mis|fr|fs');
    Route::get('/{docType}/attachment/{attachmentId}', [\App\Http\Controllers\AttachmentController::class, 'downloadAttachment'])->where('docType', 'ppab|po|mis|fr|fs');
    Route::delete('/{docType}/attachment/{attachmentId}', [\App\Http\Controllers\AttachmentController::class, 'deleteAttachment'])->where('docType', 'ppab|po|mis|fr|fs');

    // Admin - FR Approver Mapping settings (deactivated - mapping is now manual per submission)
    // Route::get('/admin/approver-kategori-fr', [ApproverKategoriFrController::class, 'index']);
    // Route::put('/admin/approver-kategori-fr/{kategoriId}', [ApproverKategoriFrController::class, 'update']);
    // Route::get('/admin/users', [ApproverKategoriFrController::class, 'users']);
});

// Existing public routes
Route::post('/process-document', [DocumentController::class, 'process']);
Route::post('/extract-document', [ExtractionController::class, 'extract']);

