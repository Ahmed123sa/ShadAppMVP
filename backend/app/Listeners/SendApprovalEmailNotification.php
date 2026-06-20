<?php

namespace App\Listeners;

use App\Events\ApprovalResponded;
use App\Mail\ApprovalCertificateMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendApprovalEmailNotification
{
    public function handleApprovalResponded(ApprovalResponded $event): void
    {
        $approval = $event->approval;
        $workspace = $approval->workspace;
        $requester = $approval->requester;
        $client = $workspace?->client;

        if ($requester?->email) {
            try {
                Mail::to($requester->email)->send(new ApprovalCertificateMail($approval));
            } catch (\Exception $e) {
                Log::warning('Failed to send approval email to requester: ' . $e->getMessage());
            }
        }

        if ($client?->email) {
            try {
                Mail::to($client->email)->send(new ApprovalCertificateMail($approval));
            } catch (\Exception $e) {
                Log::warning('Failed to send approval email to client: ' . $e->getMessage());
            }
        }
    }
}
