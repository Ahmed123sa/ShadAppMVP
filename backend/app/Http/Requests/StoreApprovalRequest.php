<?php

namespace App\Http\Requests;

use App\Models\Approval;
use Illuminate\Foundation\Http\FormRequest;

class StoreApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Approval::class);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|max:102400',
        ];
    }
}
