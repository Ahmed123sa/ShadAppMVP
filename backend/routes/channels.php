<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('workspace.{id}', function ($user, $id) {
    return true;
});
