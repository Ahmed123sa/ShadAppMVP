<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SubUser extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'password', 'client_id'];

    protected $hidden = ['password'];

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
