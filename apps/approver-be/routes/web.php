<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DocumentSigningController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Halaman verifikasi publik (QR Code scan) — throttled untuk mencegah brute-force token
Route::middleware('throttle:20,1')->get(
    '/verify/{documentType}/{documentId}/{approverLineId}',
    [DocumentSigningController::class, 'verify']
)->name('document.verify');
