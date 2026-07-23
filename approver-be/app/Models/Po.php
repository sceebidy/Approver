<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Po extends Model
{
    use HasFactory;

    protected $table = 'po';

    protected $fillable = [
        'user_id',
        'nomor_po',
        'nomor_ppab',
        'vendor'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function itemLines()
    {
        return $this->hasMany(PoItemline::class, 'po_id');
    }

    public function subtotals()
    {
        return $this->hasMany(PoSubtotal::class, 'po_id');
    }

    public function approverLines()
    {
        return $this->hasMany(PoApproverLine::class, 'po_id');
    }
}
