<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentCreatedNotification extends Notification
{
    use Queueable;

    public Payment $payment;

    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
    }

    public function via($notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'payment_created',
            'payment_id' => $this->payment->id,
            'amount' => $this->payment->amount,
            'message' => "تم إنشاء دفعة جديدة: {$this->payment->amount} ر.س",
        ];
    }

    public function toFcm($notifiable): array
    {
        return [
            'title' => 'دفعة جديدة',
            'body' => "تم إنشاء دفعة بقيمة {$this->payment->amount} ر.س",
            'data' => [
                'type' => 'payment',
                'id' => (string) $this->payment->id,
            ],
        ];
    }
}
