import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../dashboard/dashboard_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _api = ApiClient();
  String? _error;
  bool _loading = false;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.post('/auth/client/login', {
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
      });
      await _api.setToken(data['token']);
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardPage()));
    } catch (e) {
      setState(() => _error = 'بيانات الدخول غير صحيحة');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('ShadApp', style: Theme.of(context).textTheme.headlineLarge?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('منصة إدارة العلاقات والموافقات', style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.grey)),
              const SizedBox(height: 48),
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                  child: Text(_error!, style: TextStyle(color: Colors.red.shade700)),
                ),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'البريد الإلكتروني', border: OutlineInputBorder()),
                keyboardType: TextInputType.emailAddress,
                textDirection: TextDirection.ltr,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'كلمة المرور', border: OutlineInputBorder()),
                obscureText: true,
                textDirection: TextDirection.ltr,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('تسجيل الدخول'),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
