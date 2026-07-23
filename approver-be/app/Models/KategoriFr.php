<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KategoriFr extends Model
{
    use HasFactory;

    protected $table = 'kategori_fr';

    protected $fillable = [
        'nama',
        'min_app',
        'seksi_id',
        'max_ammount'
    ];

    public function approverKategoriFr()
    {
        return $this->hasMany(ApproverKategoriFr::class, 'kategori_fr_id');
    }

    public function frs()
    {
        return $this->hasMany(Fr::class, 'kategori_fr_id');
    }
}
