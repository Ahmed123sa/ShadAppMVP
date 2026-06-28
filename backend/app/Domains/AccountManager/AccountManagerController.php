<?php

namespace App\Domains\AccountManager;

use App\Models\Client;
use App\Models\User;
use App\Models\AuditLog;
use App\Http\Requests\StoreManagerRequest;
use App\Http\Requests\UpdateManagerRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AccountManagerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $managers = User::where('role', User::ROLE_ACCOUNT_MANAGER)
            ->where('super_admin_id', $user->id)
            ->withCount('managedClients')
            ->latest()
            ->get();

        return response()->json(['managers' => $managers]);
    }

    public function show(Request $request, User $manager): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        if ($manager->role !== User::ROLE_ACCOUNT_MANAGER) {
            return response()->json(['message' => 'المستخدم ليس مدير حسابات'], 422);
        }

        $clients = Client::with('workspace')
            ->where('manager_id', $manager->id)
            ->latest()
            ->get();

        return response()->json(['manager' => $manager, 'clients' => $clients]);
    }

    public function store(StoreManagerRequest $request): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        $password = $request->password ?? Str::random(12);

        $manager = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $password,
            'role' => User::ROLE_ACCOUNT_MANAGER,
            'super_admin_id' => $request->user()->id,
        ]);

        AuditLog::create([
            'auditable_type' => User::class,
            'auditable_id' => $manager->id,
            'user_id' => $request->user()->id,
            'action' => 'account_manager.created',
            'metadata' => ['email' => $manager->email, 'phone' => $manager->phone],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'manager' => $manager,
            'credentials' => ['email' => $manager->email, 'password' => $password],
        ], 201);
    }

    public function update(UpdateManagerRequest $request, User $manager): JsonResponse
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        if ($manager->role !== User::ROLE_ACCOUNT_MANAGER) {
            return response()->json(['message' => 'المستخدم ليس مدير حسابات'], 422);
        }

        $data = $request->only(['name', 'email', 'phone']);
        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }
        $manager->update($data);

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
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

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
