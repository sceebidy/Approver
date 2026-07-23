<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FsAttachment extends Model
{
    use HasFactory;

    protected $table = 'fs_attachment';

    protected $fillable = [
        'fs_id',
        'filename'
    ];

    public function fundSettlement()
    {
        return $this->belongsTo(FundSettlement::class, 'fs_id');
    }
}
