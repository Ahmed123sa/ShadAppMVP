<?php

namespace App\Listeners;

use App\Events\MeetingCreated;
use App\Mail\MeetingScheduledMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendMeetingEmailNotification
{
    public function handleMeetingCreated(MeetingCreated $event): void
    {
        $meeting = $event->meeting;
        $workspace = $meeting->workspace;
        $client = $workspace?->client;
        $manager = $workspace?->manager;

        if ($client?->email) {
            try {
                Mail::to($client->email)->send(new MeetingScheduledMail($meeting));
            } catch (\Exception $e) {
                Log::warning('Failed to send meeting email to client: ' . $e->getMessage());
            }
        }

        if ($manager?->email) {
            try {
                Mail::to($manager->email)->send(new MeetingScheduledMail($meeting));
            } catch (\Exception $e) {
                Log::warning('Failed to send meeting email to manager: ' . $e->getMessage());
            }
        }
    }
}
