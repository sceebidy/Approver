<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoApproverLine extends Model
{
    use HasFactory;

    protected $table = 'po_approver_line';

    protected $fillable = [
        'po_id',
        'approver_id',
        'status',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    public function po()
    {
        return $this->belongsTo(Po::class, 'po_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
