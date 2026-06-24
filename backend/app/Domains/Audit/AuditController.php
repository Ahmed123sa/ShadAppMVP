<?php

namespace App\Domains\Audit;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user')
            ->latest()
            ->take(200)
            ->get();

        return response()->json(['logs' => $logs]);
    }

    public function reports(Request $request): JsonResponse
    {
        $clientModel = \App\Models\Client::query();
        $paymentModel = \App\Models\Payment::query();
        $contractModel = \App\Models\Contract::query();

        $user = $request->user();
        $isAM = $user instanceof \App\Models\User && $user->isAccountManager();

        if ($isAM) {
            $clientModel->where('manager_id', $user->id);
            $paymentModel->whereIn('client_id', $clientModel->pluck('id'));
        }

        $data = [
            'total_clients' => (clone $clientModel)->count(),
            'active_workspaces' => \App\Models\Workspace::where('status', 'active')->count(),
            'pending_payments' => (clone $paymentModel)->where('status', 'pending')->count(),
            'pending_approvals' => \App\Models\Approval::where('status', 'pending')->count(),
            'recent_logins' => AuditLog::where('action', 'login')->whereDate('created_at', today())->count(),
            'contracts_by_status' => \App\Models\Contract::selectRaw('status, count(*) as count')
                ->groupBy('status')->pluck('count', 'status'),
            'payments_by_month' => \App\Models\Payment::select('amount', 'created_at')
                ->get()->groupBy(fn($p) => $p->created_at->format('Y-m'))
                ->map(fn($items) => (float) $items->sum('amount')),
            'approval_stats' => [
                'approved' => \App\Models\Approval::where('status', 'approved')->count(),
                'rejected' => \App\Models\Approval::where('status', 'rejected')->count(),
                'pending' => \App\Models\Approval::where('status', 'pending')->count(),
            ],
        ];

        return response()->json($data);
    }
}
