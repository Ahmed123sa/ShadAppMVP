<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public Payment $payment;

    public function __construct(Payment $payment)
    {
        $this->payment = $payment;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'تم رفض الدفعة: ' . number_format($this->payment->amount, 2) . ' ر.س',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: view('emails.payment-rejected', ['payment' => $this->payment])->render(),
        );
    }
}
