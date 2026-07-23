<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ppab extends Model
{
    use HasFactory;

    protected $table = 'ppab';

    protected $fillable = [
        'user_id',
        'deskripsi',
        'nomor_ppab'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approverLines()
    {
        return $this->hasMany(PpabApproverLine::class, 'ppab_id');
    }

    public function items()
    {
        return $this->hasMany(PpabItem::class, 'ppab_id');
    }

    public function subtotals()
    {
        return $this->hasMany(PpabSubtotal::class, 'ppab_id');
    }
}
