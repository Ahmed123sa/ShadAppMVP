<?php

namespace App\Listeners;

use App\Events\PaymentCreated;
use App\Events\PaymentReviewed;
use App\Mail\PaymentCreatedMail;
use App\Mail\PaymentApprovedMail;
use App\Mail\PaymentRejectedMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendPaymentEmailNotification
{
    public function handlePaymentCreated(PaymentCreated $event): void
    {
        $payment = $event->payment;
        $manager = $payment->workspace?->manager;

        if ($manager?->email) {
            try {
                Mail::to($manager->email)->send(new PaymentCreatedMail($payment));
            } catch (\Exception $e) {
                Log::warning('Failed to send payment created email: ' . $e->getMessage());
            }
        }
    }

    public function handlePaymentReviewed(PaymentReviewed $event): void
    {
        $payment = $event->payment;
        $client = $payment->client;
        $mail = $event->action === 'approved'
            ? new PaymentApprovedMail($payment)
            : new PaymentRejectedMail($payment);

        if ($client?->email) {
            try {
                Mail::to($client->email)->send($mail);
            } catch (\Exception $e) {
                Log::warning('Failed to send payment review email: ' . $e->getMessage());
            }
        }
    }
}
