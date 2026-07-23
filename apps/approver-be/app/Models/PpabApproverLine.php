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
        'status',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
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
