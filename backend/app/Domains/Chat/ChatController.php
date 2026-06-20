<?php

namespace App\Domains\Chat;

use App\Models\ChatMessage;
use App\Models\Workspace;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        $messages = $workspace->chatMessages()
            ->with('sender')
            ->latest()
            ->take(100)
            ->get()
            ->reverse()
            ->values();

        return response()->json(['messages' => $messages]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $request->validate([
            'message' => 'nullable|string',
            'type' => 'in:text,file',
            'file_url' => 'nullable|string',
            'requires_action' => 'boolean',
        ]);

        $sender = $request->user();
        if (!$sender) {
            Log::warning('Chat: no authenticated sender', [
                'sanctum_guard' => \Illuminate\Support\Facades\Auth::guard('sanctum')->check(),
                'client_guard' => \Illuminate\Support\Facades\Auth::guard('client')->check(),
                'ws_id' => $workspace->id,
            ]);
            return response()->json(['message' => 'غير مصرح'], 401);
        }
        $senderType = get_class($sender);

        Log::info('Chat: message stored', [
            'sender_type' => $senderType,
            'sender_id' => $sender->id,
            'sender_name' => $sender->name ?? $sender->contact_person ?? 'unknown',
            'workspace_id' => $workspace->id,
        ]);

        $message = $workspace->chatMessages()->create([
            'sender_type' => $senderType,
            'sender_id' => $sender->id,
            'message' => $request->message,
            'type' => $request->type ?? 'text',
            'file_url' => $request->file_url,
            'requires_action' => $request->requires_action ?? false,
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json(['message' => $message->load('sender')], 201);
    }

    public function toggleRequireAction(Request $request, ChatMessage $chatMessage): JsonResponse
    {
        $chatMessage->update(['requires_action' => !$chatMessage->requires_action]);

        return response()->json(['message' => $chatMessage->fresh()]);
    }
}
