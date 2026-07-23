<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrApprover extends Model
{
    use HasFactory;

    protected $table = 'fr_approver';

    protected $fillable = [
        'fr_id',
        'approver_id',
        'status',
        'update_date_time'
    ];

    protected $casts = [
        'update_date_time' => 'datetime',
    ];

    public function fr()
    {
        return $this->belongsTo(Fr::class, 'fr_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
