<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     * Returning null causes Laravel to throw AuthenticationException → 401 JSON response.
     * (Mengembalikan route('login') akan menyebabkan 500 karena route 'login' tidak terdefinisi di API.)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        // Selalu return null: request API mendapat 401 JSON, bukan redirect
        return null;
    }
}
