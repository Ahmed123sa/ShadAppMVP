<?php

namespace App\Domains\Workspace;

use App\Models\Workspace;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WorkspaceController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate(['client_id' => 'required|exists:clients,id']);

        $workspace = Workspace::create([
            'client_id' => $request->client_id,
            'manager_id' => $request->user()->id,
        ]);

        AuditLog::create([
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'action' => 'workspace.created',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['workspace' => $workspace], 201);
    }

    public function show(Workspace $workspace): JsonResponse
    {
        $workspace->load([
            'client', 'contracts.clauses', 'payments', 'approvals.certificate',
            'meetings', 'files', 'chatMessages.sender',
        ]);

        return response()->json(['workspace' => $workspace]);
    }

    public function activate(Request $request, Workspace $workspace): JsonResponse
    {
        $workspace->update(['status' => 'active', 'activated_at' => now()]);

        AuditLog::create([
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspace->id,
            'user_id' => $request->user()->id,
            'action' => 'workspace.activated',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['workspace' => $workspace->fresh()]);
    }
}
