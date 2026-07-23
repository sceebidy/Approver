<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FsItemLine extends Model
{
    use HasFactory;

    protected $table = 'fs_item_line';

    protected $fillable = [
        'fs_id',
        'deskripsi',
        'total',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function fundSettlement()
    {
        return $this->belongsTo(FundSettlement::class, 'fs_id');
    }
}
