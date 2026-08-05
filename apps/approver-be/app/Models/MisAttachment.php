<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MisAttachment extends Model
{
    use HasFactory;

    protected $table = 'mis_attachment';

    protected $fillable = [
        'mis_id',
        'filename',
        'original_name',
        'file_size',
        'mime_type',
    ];

    public function mis()
    {
        return $this->belongsTo(Mis::class, 'mis_id');
    }
}
