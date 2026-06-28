<?php

namespace App\Domains\SubUser;

use App\Models\SubUser;
use App\Models\Client;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SubUserController extends Controller
{
    public function store(Request $request, Client $client): JsonResponse
    {
        $this->authorize('create', SubUser::class);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:sub_users',
            'password' => 'required|string|min:8|regex:/[A-Za-z]/|regex:/[0-9]/',
        ]);

        $subUser = $client->subUsers()->create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        AuditLog::create([
            'auditable_type' => SubUser::class,
            'auditable_id' => $subUser->id,
            'user_id' => $request->user()?->id,
            'action' => 'sub_user.created',
            'metadata' => ['email' => $subUser->email],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['sub_user' => $subUser], 201);
    }

    public function destroy(Request $request, SubUser $subUser): JsonResponse
    {
        $this->authorize('delete', $subUser);

        $subUser->delete();

        AuditLog::create([
            'auditable_type' => SubUser::class,
            'auditable_id' => $subUser->id,
            'user_id' => $request->user()?->id,
            'action' => 'sub_user.deleted',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'تم حذف المستخدم']);
    }
}
