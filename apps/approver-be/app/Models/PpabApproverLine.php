<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabApproverLine extends Model
{
    use HasFactory;

    protected $table = 'ppab_approver_line';

    protected $fillable = [
        'ppab_id',
        'approver_id',
        'role',
        'status',
        'timestamp',
        'is_verifier',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'is_verifier' => 'boolean',
    ];

    public function ppab()
    {
        return $this->belongsTo(Ppab::class, 'ppab_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
