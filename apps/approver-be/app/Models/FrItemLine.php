<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrItemLine extends Model
{
    use HasFactory;

    protected $table = 'fr_item_line';

    protected $fillable = [
        'fr_id',
        'deskripsi',
        'sub_total',
        'total',
        'time_stamp'
    ];

    protected $casts = [
        'time_stamp' => 'datetime',
    ];

    public function fr()
    {
        return $this->belongsTo(Fr::class, 'fr_id');
    }

    public function itemLineTaxes()
    {
        return $this->hasMany(FrItemLineTax::class, 'fr_item_line_id');
    }
}
