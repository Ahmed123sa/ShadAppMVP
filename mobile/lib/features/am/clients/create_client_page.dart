import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/shad_logo.dart';
import 'package:shadapp_client/generated/app_localizations.dart';
 
class CreateClientPage extends StatefulWidget {
  const CreateClientPage({super.key});

  @override
  State<CreateClientPage> createState() => _CreateClientPageState();
}

class _CreateClientPageState extends State<CreateClientPage> {
  final _api = ApiClient();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _personController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _countryController = TextEditingController();
  final _industryController = TextEditingController();
  final _passwordController = TextEditingController();
  final _valueController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isBusiness = true;
  bool _autoPassword = true;
  bool _passwordVisible = false;
  bool _saving = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final res = await _api.post('/clients', {
        'company_name': _nameController.text.trim(),
        'contact_person': _personController.text.trim(),
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'country': _countryController.text.trim(),
        'industry': _industryController.text.trim(),
        if (_valueController.text.trim().isNotEmpty) 'contract_value': double.tryParse(_valueController.text),
        'client_type': _isBusiness ? 'business' : 'individual',
        'notes': _notesController.text.trim(),
        if (!_autoPassword) 'password': _passwordController.text.trim(),
        'send_email': true,
      });
      final creds = res['credentials'] as Map<String, dynamic>?;
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('تم إنشاء العميل'),
            content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('بيانات الدخول:'),
              const SizedBox(height: 8),
              Text('البريد: ${creds?['email'] ?? ''}'),
              const SizedBox(height: 4),
              Text('كلمة المرور: ${creds?['password'] ?? ''}'),
            ]),
            actions: [
              ElevatedButton(onPressed: () { Navigator.pop(ctx); context.pop(true); }, child: const Text('حسناً')),
            ],
          ),
        );
      }
    } on ValidationException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.clientCreateFailed)));
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _personController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _countryController.dispose();
    _industryController.dispose();
    _passwordController.dispose();
    _valueController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
  title: Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      const ShadLogo(size: 24, showText: false),
      const SizedBox(width: 8),
      Text(AppLocalizations.of(context)!.createClientTitle),
    ],
  ),
),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.companyName, hintText: AppLocalizations.of(context)!.companyNameHint),
              validator: (v) => v == null || v.trim().isEmpty ? AppLocalizations.of(context)!.companyNameRequired : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _personController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.contactPerson, hintText: AppLocalizations.of(context)!.contactPersonHint),
              validator: (v) => v == null || v.trim().isEmpty ? AppLocalizations.of(context)!.contactPersonRequired : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _emailController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.email, hintText: AppLocalizations.of(context)!.emailHint),
              keyboardType: TextInputType.emailAddress,
              textDirection: TextDirection.ltr,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return AppLocalizations.of(context)!.emailRequired;
                if (!v.contains('@')) return AppLocalizations.of(context)!.emailInvalid;
                return null;
              },
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.phone, hintText: AppLocalizations.of(context)!.phoneHint),
              keyboardType: TextInputType.phone,
              textDirection: TextDirection.ltr,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return AppLocalizations.of(context)!.phoneRequired;
                if (v.trim().length < 10) return AppLocalizations.of(context)!.phoneMinLength;
                return null;
              },
            ),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(
                child: Text('كلمة المرور', style: ShadTypography.inputLabel),
              ),
              Row(mainAxisSize: MainAxisSize.min, children: [
                Text('تلقائي', style: TextStyle(fontSize: 12, color: ShadColors.textSecondary, fontFamily: 'NotoSansArabic')),
                Switch(
                  value: _autoPassword,
                  activeTrackColor: ShadColors.crimson,
                  onChanged: (v) => setState(() => _autoPassword = v),
                ),
              ]),
            ]),
            if (!_autoPassword) ...[
              const SizedBox(height: 8),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'كلمة المرور',
                  hintText: 'أدخل كلمة المرور',
                  suffixIcon: IconButton(
                    icon: Icon(_passwordVisible ? Icons.visibility_off : Icons.visibility, size: 18),
                    onPressed: () => setState(() => _passwordVisible = !_passwordVisible),
                  ),
                ),
                obscureText: !_passwordVisible,
                textDirection: TextDirection.ltr,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'كلمة المرور مطلوبة';
                  if (v.trim().length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
                  return null;
                },
              ),
            ],
            const SizedBox(height: 14),
            TextFormField(
              controller: _countryController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.country, hintText: AppLocalizations.of(context)!.countryHint),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _industryController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.industry, hintText: AppLocalizations.of(context)!.industryHint),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _valueController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.contractValue, prefixText: '${AppLocalizations.of(context)!.contracts} '),
              keyboardType: TextInputType.number,
              // optional field
            ),
            const SizedBox(height: 14),
            Text(AppLocalizations.of(context)!.clientType, style: ShadTypography.inputLabel),
            const SizedBox(height: 8),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: true, label: Text('Business'), icon: Icon(Icons.business, size: 16)),
                ButtonSegment(value: false, label: Text('Individual'), icon: Icon(Icons.person, size: 16)),
              ],
              selected: {_isBusiness},
              onSelectionChanged: (s) => setState(() => _isBusiness = s.first),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _notesController,
              decoration: InputDecoration(labelText: AppLocalizations.of(context)!.notes, hintText: AppLocalizations.of(context)!.notesHint),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                    : Text(AppLocalizations.of(context)!.createClient),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

