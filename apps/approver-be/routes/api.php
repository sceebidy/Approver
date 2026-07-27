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

// Public Routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Portal API proxy routes
    Route::get('/portal/employees', [PortalController::class, 'employees']);
    Route::get('/portal/grades', [PortalController::class, 'grades']);
    Route::get('/portal/organization-units', [PortalController::class, 'organizationUnits']);
    Route::get('/portal/placements', [PortalController::class, 'placements']);

    // Submission routes
    Route::post('/submissions', [\App\Http\Controllers\SubmissionController::class, 'create']);
    Route::get('/submissions/pending', [\App\Http\Controllers\SubmissionController::class, 'pendingApprovals']);
    Route::post('/submissions/{type}/{lineId}/approve', [\App\Http\Controllers\SubmissionController::class, 'approve']);
    Route::post('/submissions/{type}/{lineId}/reject', [\App\Http\Controllers\SubmissionController::class, 'reject']);

    // PPAB
    Route::get('/ppab',  [PpabController::class, 'index']);
    Route::post('/ppab', [PpabController::class, 'store']);
    Route::get('/ppab/{id}', [PpabController::class, 'show']);
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
    Route::post('/fr', [FrController::class, 'store']);

    // FS
    Route::get('/fs', [FsController::class, 'index']);
    Route::post('/fs', [FsController::class, 'store']);

    // Signed PDF download (dokumen resmi bertanda tangan digital)
    Route::get('/fs/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'fs');
    Route::get('/ppab/{id}/signed-pdf', [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'ppab');
    Route::get('/po/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'po');
    Route::get('/mis/{id}/signed-pdf',  [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'mis');
    Route::get('/fr/{id}/signed-pdf',   [DocumentSigningController::class, 'downloadSignedPdf'])->defaults('documentType', 'fr');
});

// Existing public routes
Route::post('/process-document', [DocumentController::class, 'process']);
Route::post('/extract-document', [ExtractionController::class, 'extract']);

