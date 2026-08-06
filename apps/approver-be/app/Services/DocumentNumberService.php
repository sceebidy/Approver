<?php

namespace App\Services;

use App\Models\Fr;
use App\Models\FundSettlement;
use App\Models\User;
use Illuminate\Support\Str;

class DocumentNumberService
{
    /**
     * Convert month integer (1-12) to Roman numerals.
     */
    public static function toRoman(int $month): string
    {
        $map = [
            12 => 'XII', 11 => 'XI', 10 => 'X', 9 => 'IX', 8 => 'VIII',
            7 => 'VII', 6 => 'VI', 5 => 'V', 4 => 'IV', 3 => 'III', 2 => 'II', 1 => 'I'
        ];
        return $map[$month] ?? 'I';
    }

    /**
     * Extract or abbreviate Unit Code from user unit_nama or unit_kode.
     */
    public static function extractUnitCode(?User $user): string
    {
        if (!$user) {
            return 'ADM';
        }

        if (!empty($user->unit_kode)) {
            return strtoupper(trim($user->unit_kode));
        }

        $unitNama = trim($user->unit_nama ?? '');
        if (empty($unitNama)) {
            return 'ADM';
        }

        // If unit_nama contains hyphen like "MRS - Maintenance", take "MRS"
        if (str_contains($unitNama, '-')) {
            $parts = explode('-', $unitNama);
            $codeCandidate = trim($parts[0]);
            if (strlen($codeCandidate) >= 2 && strlen($codeCandidate) <= 6) {
                return strtoupper($codeCandidate);
            }
        }

        // If unit_nama is already a short code (e.g., "MRS", "SIH", "IT")
        if (strlen($unitNama) <= 5 && !str_contains($unitNama, ' ')) {
            return strtoupper($unitNama);
        }

        // Generate acronym from uppercase letters or first letters of words
        $words = preg_split('/\s+/', $unitNama);
        $acronym = '';
        foreach ($words as $w) {
            // Ignore common stop words in Indonesian
            if (in_array(strtolower($w), ['dan', '&', 'dan/atau', 'atau', 'of', 'and', 'bagian', 'seksi', 'divisi', 'departemen'])) {
                continue;
            }
            $acronym .= mb_substr($w, 0, 1);
        }

        $result = strtoupper(trim($acronym));
        return !empty($result) ? mb_substr($result, 0, 5) : 'ADM';
    }

    /**
     * Generate dynamic FR document number.
     * Format: {NUMBER}/FRF/{UNIT_CODE}/{ROMAN_MONTH}/{YEAR}
     */
    public static function generateFrNumber(?User $user = null): string
    {
        $count = Fr::count() + 1;
        $formattedSeq = sprintf('%04d', $count);
        $unitCode = self::extractUnitCode($user);
        $romanMonth = self::toRoman((int) date('n'));
        $year = date('Y');

        return "{$formattedSeq}/FRF/{$unitCode}/{$romanMonth}/{$year}";
    }

    /**
     * Generate dynamic FS document number.
     * Format: {NUMBER}/FSF/{UNIT_CODE}/{ROMAN_MONTH}/{YEAR}
     */
    public static function generateFsNumber(?User $user = null): string
    {
        $count = FundSettlement::count() + 1;
        $formattedSeq = sprintf('%04d', $count);
        $unitCode = self::extractUnitCode($user);
        $romanMonth = self::toRoman((int) date('n'));
        $year = date('Y');

        return "{$formattedSeq}/FSF/{$unitCode}/{$romanMonth}/{$year}";
    }
}
