<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabItem extends Model
{
    use HasFactory;

    protected $table = 'ppab_item';

    protected $fillable = [
        'ppab_id',
        'deskripsi',
        'satuan',
        'qty',
        'harga_satuan',
        'kategori',
        'currency'
    ];

    public function ppab()
    {
        return $this->belongsTo(Ppab::class, 'ppab_id');
    }

    public function lineSpecs()
    {
        return $this->hasMany(PpabItemLineSpec::class, 'ppab_item_line_id');
    }
}
