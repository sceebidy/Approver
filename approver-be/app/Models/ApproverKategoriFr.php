<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApproverKategoriFr extends Model
{
    use HasFactory;

    protected $table = 'approver_kategori_fr';

    protected $fillable = [
        'kategori_fr_id',
        'user_id'
    ];

    public function kategoriFr()
    {
        return $this->belongsTo(KategoriFr::class, 'kategori_fr_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
