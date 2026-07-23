<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FundSettlement extends Model
{
    use HasFactory;

    protected $table = 'fund_settlement';

    protected $fillable = [
        'requester_id',
        'fr_id',
        'requester_date_time',
        'number_fs',
        'balance',
        'balance_due_to_employee',
        'balance_due_to_company',
        'status'
    ];

    protected $casts = [
        'requester_date_time' => 'datetime',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function fr()
    {
        return $this->belongsTo(Fr::class, 'fr_id');
    }

    public function itemLines()
    {
        return $this->hasMany(FsItemLine::class, 'fs_id');
    }

    public function logNotes()
    {
        return $this->hasMany(LogNoteFs::class, 'fs_id');
    }

    public function approvers()
    {
        return $this->hasMany(FsApprover::class, 'fs_id');
    }

    public function attachments()
    {
        return $this->hasMany(FsAttachment::class, 'fs_id');
    }
}
