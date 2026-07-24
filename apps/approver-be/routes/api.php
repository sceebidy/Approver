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

// Public Routes
Route::get('/auth/csrf', [AuthController::class, 'csrf']);
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

    // Existing routes (might need auth later, but keep as is for now)
    Route::post('/process-document', [DocumentController::class, 'process']);
    Route::post('/extract-document', [ExtractionController::class, 'extract']);
});
