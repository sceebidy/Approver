<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoSubtotal extends Model
{
    use HasFactory;

    protected $table = 'po_subtotal';

    protected $fillable = [
        'po_id',
        'deskripsi',
        'value',
        'currency'
    ];

    public function po()
    {
        return $this->belongsTo(Po::class, 'po_id');
    }
}
