<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mis extends Model
{
    use HasFactory;

    protected $table = 'mis';

    protected $fillable = [
        'user_id',
        'nomor_mis',
        'tgl_mis'
    ];

    protected $casts = [
        'tgl_mis' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function itemLines()
    {
        return $this->hasMany(MisItemLine::class, 'mis_id');
    }

    public function approverLines()
    {
        return $this->hasMany(MisApproverLine::class, 'mis_id');
    }
}
