<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoAttachment extends Model
{
    use HasFactory;

    protected $table = 'po_attachment';

    protected $fillable = [
        'po_id',
        'filename',
        'original_name',
        'file_size',
        'mime_type',
    ];

    public function po()
    {
        return $this->belongsTo(Po::class, 'po_id');
    }
}
