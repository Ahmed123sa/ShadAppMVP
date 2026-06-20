<?php

namespace App\Providers;

use App\Events\ContractSent;
use App\Events\ContractClientApproved;
use App\Events\ContractCompanyApproved;
use App\Events\ContractCompleted;
use App\Events\PaymentCreated;
use App\Events\PaymentReviewed;
use App\Events\MeetingCreated;
use App\Events\ApprovalResponded;
use App\Events\ClientCreated;
use App\Listeners\SendContractEmailNotification;
use App\Listeners\SendPaymentEmailNotification;
use App\Listeners\SendMeetingEmailNotification;
use App\Listeners\SendApprovalEmailNotification;
use App\Listeners\SendClientWelcomeEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(ContractSent::class, [SendContractEmailNotification::class, 'handleContractSent']);
        Event::listen(ContractClientApproved::class, [SendContractEmailNotification::class, 'handleClientApproved']);
        Event::listen(ContractCompanyApproved::class, [SendContractEmailNotification::class, 'handleCompanyApproved']);
        Event::listen(ContractCompleted::class, [SendContractEmailNotification::class, 'handleCompleted']);

        Event::listen(PaymentCreated::class, [SendPaymentEmailNotification::class, 'handlePaymentCreated']);
        Event::listen(PaymentReviewed::class, [SendPaymentEmailNotification::class, 'handlePaymentReviewed']);
        Event::listen(MeetingCreated::class, [SendMeetingEmailNotification::class, 'handleMeetingCreated']);
        Event::listen(ApprovalResponded::class, [SendApprovalEmailNotification::class, 'handleApprovalResponded']);
        Event::listen(ClientCreated::class, [SendClientWelcomeEmail::class, 'handleClientCreated']);
    }
}
