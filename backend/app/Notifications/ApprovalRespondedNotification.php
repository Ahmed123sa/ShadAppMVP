<?php

namespace App\Notifications;

use App\Models\Approval;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApprovalRespondedNotification extends Notification
{
    use Queueable;

    public Approval $approval;

    public function __construct(Approval $approval)
    {
        $this->approval = $approval;
    }

    public function via($notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase($notifiable): array
    {
        $status = $this->approval->status === 'approved' ? 'تم الموافقة' : ($this->approval->status === 'rejected' ? 'مرفوض' : 'طلب تعديل');
        return [
            'type' => 'approval_responded',
            'approval_id' => $this->approval->id,
            'title' => $this->approval->title,
            'message' => "حالة طلب الموافقة '{$this->approval->title}': {$status}",
        ];
    }

    public function toFcm($notifiable): array
    {
        $status = $this->approval->status === 'approved' ? 'مقبولة' : ($this->approval->status === 'rejected' ? 'مرفوضة' : 'طلب تعديل');
        return [
            'title' => 'رد على طلب موافقة',
            'body' => "طلب الموافقة '{$this->approval->title}' أصبح {$status}",
            'data' => [
                'type' => 'approval',
                'id' => (string) $this->approval->id,
            ],
        ];
    }
}
