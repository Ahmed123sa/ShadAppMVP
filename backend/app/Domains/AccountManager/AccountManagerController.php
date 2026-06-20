<?php

namespace App\Domains\AccountManager;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AccountManagerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $managers = User::where('role', User::ROLE_ACCOUNT_MANAGER)
            ->when($request->user()->isSuperAdmin(), fn($q) => $q->where('super_admin_id', $request->user()->id))
            ->withCount('managedClients')
            ->latest()
            ->get();

        return response()->json(['managers' => $managers]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
        ]);

        $password = Str::random(12);

        $manager = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $password,
            'role' => User::ROLE_ACCOUNT_MANAGER,
            'super_admin_id' => $request->user()->id,
        ]);

        AuditLog::create([
            'auditable_type' => User::class,
            'auditable_id' => $manager->id,
            'user_id' => $request->user()->id,
            'action' => 'account_manager.created',
            'metadata' => ['email' => $manager->email],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'manager' => $manager,
            'credentials' => ['email' => $manager->email, 'password' => $password],
        ], 201);
    }

    public function update(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== User::ROLE_ACCOUNT_MANAGER) {
            return response()->json(['message' => 'المستخدم ليس مدير حسابات'], 422);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $manager->id,
        ]);

        $manager->update($request->only(['name', 'email']));

        AuditLog::create([
            'auditable_type' => User::class,
            'auditable_id' => $manager->id,
            'user_id' => $request->user()->id,
            'action' => 'account_manager.updated',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['manager' => $manager->fresh()]);
    }

    public function destroy(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== User::ROLE_ACCOUNT_MANAGER) {
            return response()->json(['message' => 'المستخدم ليس مدير حسابات'], 422);
        }

        $manager->delete();

        AuditLog::create([
            'auditable_type' => User::class,
            'auditable_id' => $manager->id,
            'user_id' => $request->user()->id,
            'action' => 'account_manager.deleted',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'تم حذف مدير الحسابات']);
    }
}
