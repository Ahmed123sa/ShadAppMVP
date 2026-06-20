<!DOCTYPE html>
<html dir="rtl"><body style="font-family: sans-serif; line-height: 1.6;">
<h2>تم رفض الدفعة</h2>
<p>السلام عليكم،</p>
<p>تم رفض الدفعة بقيمة {{ number_format($payment->amount, 2) }} ر.س.</p>
@if($payment->notes)
<p>السبب: {{ $payment->notes }}</p>
@endif
<p>تاريخ الرفض: {{ $payment->reviewed_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i') }}</p>
</body></html>
