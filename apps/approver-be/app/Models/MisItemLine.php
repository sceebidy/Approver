<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MisItemLine extends Model
{
    use HasFactory;

    protected $table = 'mis_item_line';

    protected $fillable = [
        'mis_id',
        'desc',
        'satuan',
        'qty',
        'remark'
    ];

    public function mis()
    {
        return $this->belongsTo(Mis::class, 'mis_id');
    }
}
