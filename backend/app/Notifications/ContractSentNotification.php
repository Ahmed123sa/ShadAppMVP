<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContractSentNotification extends Notification
{
    use Queueable;

    public Contract $contract;

    public function __construct(Contract $contract)
    {
        $this->contract = $contract;
    }

    public function via($notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'contract_sent',
            'contract_id' => $this->contract->id,
            'title' => $this->contract->title,
            'message' => "تم إرسال عقد: {$this->contract->title}",
        ];
    }

    public function toFcm($notifiable): array
    {
        return [
            'title' => 'عقد جديد',
            'body' => "تم إرسال عقد {$this->contract->title}",
            'data' => [
                'type' => 'contract',
                'id' => (string) $this->contract->id,
            ],
        ];
    }
}
