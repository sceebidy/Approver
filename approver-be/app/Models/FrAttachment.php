<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FrAttachment extends Model
{
    use HasFactory;

    protected $table = 'fr_attachment';

    protected $fillable = [
        'fr_id',
        'filename'
    ];

    public function fr()
    {
        return $this->belongsTo(Fr::class, 'fr_id');
    }
}
