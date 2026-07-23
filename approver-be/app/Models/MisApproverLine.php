<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MisApproverLine extends Model
{
    use HasFactory;

    protected $table = 'mis_approver_line';

    protected $fillable = [
        'mis_id',
        'approver_id',
        'role',
        'status',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function mis()
    {
        return $this->belongsTo(Mis::class, 'mis_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
