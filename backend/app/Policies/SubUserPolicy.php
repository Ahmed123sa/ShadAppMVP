<?php

namespace App\Policies;

use App\Models\SubUser;
use Illuminate\Auth\Access\HandlesAuthorization;

class SubUserPolicy
{
    use HandlesAuthorization;

    public function create($user): bool
    {
        return $user instanceof \App\Models\User && $user->isAccountManager();
    }

    public function delete($user, SubUser $subUser): bool
    {
        return $user instanceof \App\Models\User && $subUser->client->manager_id === $user->id;
    }
}
