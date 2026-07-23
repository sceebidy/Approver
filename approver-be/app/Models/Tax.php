<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use HasFactory;

    protected $table = 'tax';

    protected $fillable = [
        'name',
        'value'
    ];

    public function frItemLineTaxes()
    {
        return $this->hasMany(FrItemLineTax::class, 'tax_id');
    }
}
