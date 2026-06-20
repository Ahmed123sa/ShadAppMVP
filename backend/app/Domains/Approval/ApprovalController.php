<?php

namespace App\Domains\Approval;

use App\Models\Approval;
use App\Models\ApprovalCertificate;
use App\Models\Workspace;
use App\Models\AuditLog;
use App\Events\ApprovalResponded;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class ApprovalController extends Controller
{
    public function index(Workspace $workspace): JsonResponse
    {
        return response()->json(['approvals' => $workspace->approvals()->with('certificate', 'requester')->latest()->get()]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'approvable_type' => 'nullable|string',
            'approvable_id' => 'nullable|integer',
        ]);

        $approval = $workspace->approvals()->create([
            'title' => $request->title,
            'description' => $request->description,
            'approvable_type' => $request->approvable_type ?? 'workspace',
            'approvable_id' => $request->approvable_id ?? $workspace->id,
            'reference_no' => 'APP-' . strtoupper(Str::random(10)),
            'requested_by' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json(['approval' => $approval->load('requester')], 201);
    }

    public function respond(Request $request, Approval $approval): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:approved,rejected,edit_requested',
            'signature' => 'nullable|string',
        ]);

        $approval->update([
            'status' => $request->action === 'approved' ? 'approved' : ($request->action === 'rejected' ? 'rejected' : 'edit_requested'),
            'client_action' => $request->action,
            'signature' => $request->signature,
            'responded_at' => now(),
        ]);

        if ($request->action === 'approved') {
            $certificate = $approval->certificate()->create([
                'pdf_url' => '', // Will be generated async
                'generated_at' => now(),
            ]);
        }

        ApprovalResponded::dispatch($approval);

        AuditLog::create([
            'auditable_type' => Approval::class,
            'auditable_id' => $approval->id,
            'action' => 'approval.' . $request->action,
            'metadata' => ['reference_no' => $approval->reference_no],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['approval' => $approval->fresh()->load('certificate')]);
    }
}
