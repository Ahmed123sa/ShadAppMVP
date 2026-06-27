<?php

use App\Models\User;
use App\Models\Client;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return $user instanceof User && (int) $user->id === (int) $id;
});

Broadcast::channel('App.Models.Client.{id}', function ($client, $id) {
    return $client instanceof Client && (int) $client->id === (int) $id;
});
