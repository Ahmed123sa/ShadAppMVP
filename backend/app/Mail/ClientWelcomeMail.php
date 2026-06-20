<?php

namespace App\Mail;

use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public Client $client;
    public string $password;

    public function __construct(Client $client, string $password)
    {
        $this->client = $client;
        $this->password = $password;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'مرحباً بك في ShadApp',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: view('emails.client-welcome', ['client' => $this->client, 'password' => $this->password])->render(),
        );
    }
}
