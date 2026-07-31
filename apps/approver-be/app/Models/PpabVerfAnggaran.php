<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabVerfAnggaran extends Model
{
    use HasFactory;

    protected $table = 'ppab_verf_anggaran';

    protected $fillable = [
        'ppab_id',
        'no_ppab',
        'sumber_rek',
        'beban_rek',
        'rkap_1_tahun',
        'realisasi',
        'permintaan',
        'sisa_anggaran',
    ];

    public function ppab()
    {
        return $this->belongsTo(Ppab::class, 'ppab_id');
    }
}
