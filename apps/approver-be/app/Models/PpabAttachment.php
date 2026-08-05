<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabAttachment extends Model
{
    use HasFactory;

    protected $table = 'ppab_attachment';

    protected $fillable = [
        'ppab_id',
        'filename',
        'original_name',
        'file_size',
        'mime_type',
    ];

    public function ppab()
    {
        return $this->belongsTo(Ppab::class, 'ppab_id');
    }
}
