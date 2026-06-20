<?php

namespace App\Models;

use App\Models\FileEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = ['client_id', 'manager_id', 'status', 'activated_at'];

    protected function casts(): array
    {
        return ['activated_at' => 'datetime'];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class);
    }

    public function meetings(): HasMany
    {
        return $this->hasMany(Meeting::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(FileEntry::class);
    }

    public function documentDefinitions(): HasMany
    {
        return $this->hasMany(DocumentDefinition::class);
    }
}
