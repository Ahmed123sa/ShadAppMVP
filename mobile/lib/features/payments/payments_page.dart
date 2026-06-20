import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/api_client.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage> {
  final _api = ApiClient();
  final _amountController = TextEditingController();
  final _methodController = TextEditingController();
  bool _uploading = false;

  Future<void> _submitPayment() async {
    if (_amountController.text.isEmpty || _methodController.text.isEmpty) return;
    setState(() => _uploading = true);
    try {
      await _api.post('/workspaces/1/payments', {
        'amount': double.parse(_amountController.text),
        'method_type': _methodController.text,
        'proof_file': 'uploaded-file-url',
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم ربط إثبات الدفع')));
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('خطأ: $e')));
    } finally { setState(() => _uploading = false); }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _methodController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('رفع إثبات الدفع', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),
        TextField(
          controller: _amountController,
          decoration: const InputDecoration(labelText: 'المبلغ', border: OutlineInputBorder()),
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _methodController,
          decoration: const InputDecoration(labelText: 'طريقة الدفع (مثل Instapay, تحويل بنكي)', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 24),
        ListTile(
          leading: const Icon(Icons.upload_file),
          title: const Text('رفع صورة الإثبات'),
          trailing: const Icon(Icons.file_upload),
          onTap: () async {
            final result = await FilePicker.platform.pickFiles();
            if (result != null) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم اختيار الملف')));
            }
          },
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: _uploading ? null : _submitPayment,
            child: _uploading ? const CircularProgressIndicator(strokeWidth: 2) : const Text('إرسال'),
          ),
        ),
      ],
    );
  }
}
