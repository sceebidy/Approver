<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoItemline extends Model
{
    use HasFactory;

    protected $table = 'po_itemline';

    protected $fillable = [
        'po_id',
        'deskripsi',
        'satuan',
        'qty',
        'harga_satuan',
        'spec'
    ];

    public function po()
    {
        return $this->belongsTo(Po::class, 'po_id');
    }
}
