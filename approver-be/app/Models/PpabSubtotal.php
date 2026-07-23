<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabSubtotal extends Model
{
    use HasFactory;

    protected $table = 'ppab_subtotal';

    protected $fillable = [
        'ppab_id',
        'deskripsi'
    ];

    public function ppab()
    {
        return $this->belongsTo(Ppab::class, 'ppab_id');
    }
}
