<?php

namespace App\Notifications;

use App\Models\MobileNotificationToken;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class FcmChannel
{
    public function send($notifiable, Notification $notification): void
    {
        $data = $notification->toFcm($notifiable);

        $tokens = MobileNotificationToken::where('tokenable_id', $notifiable->id)
            ->where('tokenable_type', get_class($notifiable))
            ->pluck('token');

        $fcmKey = config('services.fcm.server_key');
        if (!$fcmKey || $tokens->isEmpty()) {
            return;
        }

        foreach ($tokens as $token) {
            Http::withToken($fcmKey)->post('https://fcm.googleapis.com/fcm/send', [
                'to' => $token,
                'notification' => [
                    'title' => $data['title'],
                    'body' => $data['body'],
                ],
                'data' => $data['data'] ?? [],
            ]);
        }
    }
}
