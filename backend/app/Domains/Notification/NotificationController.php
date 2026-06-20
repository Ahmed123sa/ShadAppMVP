<?php

namespace App\Domains\Notification;

use App\Models\Client;
use App\Models\MobileNotificationToken;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;

class NotificationController extends Controller
{
    public function registerToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'required|in:ios,android',
        ]);

        $user = $request->user() ?? $request->user('sanctum:client');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        MobileNotificationToken::updateOrCreate(
            [
                'tokenable_id' => $user->id,
                'tokenable_type' => get_class($user),
            ],
            [
                'token' => $request->token,
                'device_type' => $request->device_type,
            ]
        );

        return response()->json(['message' => 'Token registered']);
    }

    public function sendFcm(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'title' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        $client = Client::findOrFail($request->client_id);
        $fcmKey = config('services.fcm.server_key');

        if (!$fcmKey) {
            return response()->json(['message' => 'FCM not configured'], 501);
        }

        $response = Http::withToken($fcmKey)->post('https://fcm.googleapis.com/fcm/send', [
            'to' => '/topics/client-' . $client->id,
            'notification' => ['title' => $request->title, 'body' => $request->body],
        ]);

        return response()->json(['sent' => $response->successful()]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'notifications' => $user?->notifications()->latest()->take(20)->get() ?? [],
            'unread_count' => $user?->unreadNotifications()->count() ?? 0,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user?->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['message' => 'done']);
    }
}
