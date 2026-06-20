<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContractCompanyApprovedNotification extends Notification
{
    use Queueable;

    public Contract $contract;

    public function __construct(Contract $contract)
    {
        $this->contract = $contract;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'contract_id' => $this->contract->id,
            'title' => 'تم اعتماد العقد نهائياً',
            'message' => 'تم اعتماد العقد ' . $this->contract->title . ' من الطرفين. يمكنك الآن الدفع.',
            'workspace_id' => $this->contract->workspace_id,
        ];
    }
}
