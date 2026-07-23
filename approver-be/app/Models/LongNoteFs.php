<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LongNoteFs extends Model
{
    use HasFactory;

    protected $table = 'long_note_fs';

    protected $fillable = [
        'fs_id',
        'user_id',
        'remark'
    ];

    public function fundSettlement()
    {
        return $this->belongsTo(FundSettlement::class, 'fs_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
