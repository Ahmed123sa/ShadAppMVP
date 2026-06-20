<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentReviewedNotification extends Notification
{
    use Queueable;

    public Payment $payment;
    public string $action;

    public function __construct(Payment $payment, string $action)
    {
        $this->payment = $payment;
        $this->action = $action;
    }

    public function via($notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase($notifiable): array
    {
        $status = $this->action === 'approved' ? 'تم اعتمادها' : 'تم رفضها';
        return [
            'type' => 'payment_reviewed',
            'payment_id' => $this->payment->id,
            'action' => $this->action,
            'amount' => $this->payment->amount,
            'message' => "الدفعة {$this->payment->amount} ر.س {$status}",
        ];
    }

    public function toFcm($notifiable): array
    {
        $status = $this->action === 'approved' ? 'مقبولة' : 'مرفوضة';
        return [
            'title' => 'مراجعة دفعة',
            'body' => "الدفعة {$this->payment->amount} ر.س {$status}",
            'data' => [
                'type' => 'payment',
                'id' => (string) $this->payment->id,
            ],
        ];
    }
}
