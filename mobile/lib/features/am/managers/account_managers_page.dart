import 'package:flutter/material.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';
import '../../../core/widgets/shad_logo.dart';

class AccountManagersPage extends StatefulWidget {
  const AccountManagersPage({super.key});

  @override
  State<AccountManagersPage> createState() => _AccountManagersPageState();
}

class _AccountManagersPageState extends State<AccountManagersPage> {
  final _api = ApiClient();
  List<dynamic> _managers = [];
  bool _loading = true;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _errorMsg = null; });
    try {
      final data = await _api.get('/account-managers');
      _managers = data['managers'] as List<dynamic>? ?? [];
    } catch (e) {
      _errorMsg = 'فشل تحميل المديرين';
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _create() async {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة مدير حساب جديد'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
            controller: nameCtrl,
            decoration: const InputDecoration(labelText: 'الاسم', hintText: 'Mohamed Ali'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: emailCtrl,
            decoration: const InputDecoration(labelText: 'البريد الإلكتروني', hintText: 'manager@domain.com'),
            keyboardType: TextInputType.emailAddress,
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('إضافة')),
        ],
      ),
    );
    if (result != true || nameCtrl.text.trim().isEmpty || emailCtrl.text.trim().isEmpty) return;

    try {
      final res = await _api.post('/account-managers', {
        'name': nameCtrl.text.trim(),
        'email': emailCtrl.text.trim(),
      });
      final creds = res['credentials'] as Map<String, dynamic>?;
      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('تم إنشاء المدير'),
          content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('البريد: ${creds?['email'] ?? ''}'),
            const SizedBox(height: 4),
            Text('كلمة المرور: ${creds?['password'] ?? ''}'),
          ]),
          actions: [
            ElevatedButton(onPressed: () => Navigator.pop(ctx), child: const Text('حسناً')),
          ],
        ),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل إنشاء المدير')));
    }
  }

  Future<void> _delete(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('حذف مدير'),
        content: Text('هل أنت متأكد من حذف "$name"؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('حذف')),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await _api.delete('/account-managers/$id');
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حذف المدير')));
    }
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
            const Text('إدارة المديرين', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, fontFamily: 'PlayfairDisplay')),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: _create),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _errorMsg != null
          ? Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text(_errorMsg!, style: const TextStyle(color: ShadColors.error)),
                const SizedBox(height: 12),
                ElevatedButton(onPressed: _load, child: const Text('إعادة المحاولة')),
              ]),
            )
          : _managers.isEmpty
            ? Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.people_outline, size: 56, color: ShadColors.textDisabled),
                  const SizedBox(height: 16),
                  const Text('لا يوجد مديرين بعد', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: ShadColors.textPrimary)),
                  const SizedBox(height: 8),
                  const Text('اضغط على + لإضافة مدير جديد', style: TextStyle(fontSize: 14, color: ShadColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _create,
                    icon: const Icon(Icons.person_add, size: 18),
                    label: const Text('إضافة مدير'),
                  ),
                ]),
              )
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _managers.length,
                  itemBuilder: (_, i) {
                    final m = _managers[i] as Map<String, dynamic>;
                    final name = m['name'] as String? ?? '';
                    final email = m['email'] as String? ?? '';
                    final mgrId = m['id'] as int;
                    final clientCount = m['managed_clients_count'] as int? ?? 0;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: ShadColors.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: ShadColors.cardBorder),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: ShadColors.black,
                          child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(color: ShadColors.textPrimary, fontWeight: FontWeight.bold, fontFamily: 'Archivo')),
                        ),
                        title: Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: ShadColors.textPrimary, fontFamily: 'Archivo')),
                        subtitle: Text('$email · $clientCount عميل', style: TextStyle(fontSize: 11, color: ShadColors.textSecondary, fontFamily: 'Archivo')),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, size: 20, color: ShadColors.error),
                          onPressed: () => _delete(mgrId, name),
                        ),
                      ),
                    );
                  },
                ),
              ),
    );
  }
}
