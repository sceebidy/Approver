<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fr extends Model
{
    use HasFactory;

    protected $table = 'fr';

    protected $fillable = [
        'requester_id',
        'seksi_id',
        'kategori_fr_id',
        'currency',
        'request_date_time',
        'number_fr',
        'keterangan',
        'status'
    ];

    protected $casts = [
        'request_date_time' => 'datetime',
    ];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function kategoriFr()
    {
        return $this->belongsTo(KategoriFr::class, 'kategori_fr_id');
    }

    public function itemLines()
    {
        return $this->hasMany(FrItemLine::class, 'fr_id');
    }

    public function approvers()
    {
        return $this->hasMany(FrApprover::class, 'fr_id');
    }

    public function longNotes()
    {
        return $this->hasMany(LongNoteFr::class, 'fr_id');
    }

    public function attachments()
    {
        return $this->hasMany(FrAttachment::class, 'fr_id');
    }

    public function fundSettlements()
    {
        return $this->hasMany(FundSettlement::class, 'fr_id');
    }
}
