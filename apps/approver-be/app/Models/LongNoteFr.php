<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LongNoteFr extends Model
{
    use HasFactory;

    protected $table = 'long_note_fr';

    protected $fillable = [
        'fr_id',
        'user_id',
        'remark'
    ];

    public function fr()
    {
        return $this->belongsTo(Fr::class, 'fr_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
