<?php

namespace App\Notifications;

use App\Models\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ContractClientApprovedNotification extends Notification
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
            'title' => 'اعتماد عقد من العميل',
            'message' => 'قام العميل ' . ($this->contract->workspace->client->company_name ?? '') . ' باعتماد العقد: ' . $this->contract->title,
            'workspace_id' => $this->contract->workspace_id,
        ];
    }
}
