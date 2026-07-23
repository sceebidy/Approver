<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FsApprover extends Model
{
    use HasFactory;

    protected $table = 'fs_approver';

    protected $fillable = [
        'fs_id',
        'approver_id',
        'role',
        'status',
        'update_date_time'
    ];

    protected $casts = [
        'update_date_time' => 'datetime',
    ];

    public function fundSettlement()
    {
        return $this->belongsTo(FundSettlement::class, 'fs_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
