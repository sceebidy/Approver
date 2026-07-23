<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PpabItemLineSpec extends Model
{
    use HasFactory;

    protected $table = 'ppab_item_line_spec';

    protected $fillable = [
        'ppab_item_line_id',
        'deskripsi'
    ];

    public function ppabItem()
    {
        return $this->belongsTo(PpabItem::class, 'ppab_item_line_id');
    }
}
