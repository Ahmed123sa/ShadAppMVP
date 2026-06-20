<?php

namespace App\Domains\Payment;

use App\Models\Payment;
use App\Models\Workspace;
use App\Models\AuditLog;
use App\Events\PaymentCreated;
use App\Events\PaymentReviewed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    const BUSINESS_METHODS = ['bank_transfer', 'swift', 'corporate_account'];
    const INDIVIDUAL_METHODS = ['instapay', 'vodafone_cash', 'mobile_wallet'];

    public function index(Workspace $workspace): JsonResponse
    {
        $client = $workspace->client;
        $methods = $client->client_type === 'individual' ? self::INDIVIDUAL_METHODS : self::BUSINESS_METHODS;

        return response()->json([
            'payments' => $workspace->payments()->latest()->get(),
            'available_methods' => $methods,
            'client_type' => $client->client_type,
        ]);
    }

    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        $client = $workspace->client;
        $methods = $client->client_type === 'individual' ? self::INDIVIDUAL_METHODS : self::BUSINESS_METHODS;

        $request->validate([
            'amount' => 'required|numeric|min:0',
            'method_type' => 'required|string|in:' . implode(',', $methods),
            'proof_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'notes' => 'nullable|string',
        ]);

        $proofFileUrl = null;
        if ($request->hasFile('proof_file')) {
            $proofFileUrl = $request->file('proof_file')->store('payment-proofs/workspace-' . $workspace->id, 'public');
        }

        $payment = $workspace->payments()->create([
            'client_id' => $workspace->client_id,
            'amount' => $request->amount,
            'method_type' => $request->method_type,
            'proof_file_url' => $proofFileUrl,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        PaymentCreated::dispatch($payment);

        AuditLog::create([
            'auditable_type' => Payment::class,
            'auditable_id' => $payment->id,
            'action' => 'payment.submitted',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['payment' => $payment], 201);
    }

    public function review(Request $request, Payment $payment): JsonResponse
    {
        if (!in_array($request->user()->role, ['super_admin'], true)) {
            return response()->json(['message' => 'غير مصرح بهذه الإجراء'], 403);
        }

        $request->validate(['action' => 'required|in:approved,rejected']);

        $payment->update([
            'status' => $request->action,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $workspace = $payment->workspace;

        // Force-refresh workspace from DB to avoid stale relationship cache
        $workspace = $workspace->fresh();

        $contractApproved = $workspace->contracts()->whereIn('status', ['completed', 'company_approved'])->exists();
        $paymentApproved = $workspace->payments()->where('status', 'approved')->exists();

        Log::info('Payment review activation check', [
            'payment_id' => $payment->id,
            'action' => $request->action,
            'workspace_id' => $workspace->id,
            'contract_approved' => $contractApproved,
            'payment_approved' => $paymentApproved,
        ]);

        if ($contractApproved && $paymentApproved) {
            $workspace->update(['status' => 'active', 'activated_at' => now()]);
            Log::info('Workspace activated after payment review', ['workspace_id' => $workspace->id]);
        }

        PaymentReviewed::dispatch($payment, $request->action);

        AuditLog::create([
            'auditable_type' => Payment::class,
            'auditable_id' => $payment->id,
            'user_id' => $request->user()->id,
            'action' => 'payment.' . $request->action,
            'ip_address' => $request->ip(),
        ]);

        $workspace->load('payments', 'contracts');

        return response()->json([
            'payment' => $payment->fresh(),
            'workspace' => $workspace,
        ]);
    }
}
