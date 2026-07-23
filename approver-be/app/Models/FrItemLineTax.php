<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrItemLineTax extends Model
{
    use HasFactory;

    protected $table = 'fr_item_line_tax';

    protected $fillable = [
        'fr_item_line_id',
        'tax_id',
        'value',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function frItemLine()
    {
        return $this->belongsTo(FrItemLine::class, 'fr_item_line_id');
    }

    public function tax()
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }
}
