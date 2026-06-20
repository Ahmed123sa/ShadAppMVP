import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ApprovalsPage extends StatefulWidget {
  const ApprovalsPage({super.key});

  @override
  State<ApprovalsPage> createState() => _ApprovalsPageState();
}

class _ApprovalsPageState extends State<ApprovalsPage> {
  final _api = ApiClient();
  List<dynamic> _approvals = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.get('/workspaces/1/approvals');
      setState(() => _approvals = data['approvals'] as List<dynamic>);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _respond(int id, String action) async {
    await _api.post('/approvals/$id/respond', {'action': action, 'signature': 'approved'});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_approvals.isEmpty) return const Center(child: Text('لا توجد طلبات موافقة'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _approvals.length,
      itemBuilder: (context, i) {
        final a = _approvals[i] as Map<String, dynamic>;
        final status = a['status'] as String? ?? '';
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('طلب موافقة #${a['reference_no']}', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('الحالة: $status', style: TextStyle(color: Colors.grey.shade600)),
              if (status == 'pending')
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(children: [
                    Expanded(child: FilledButton(onPressed: () => _respond(a['id'], 'approved'), child: const Text('موافقة'))),
                    const SizedBox(width: 12),
                    Expanded(child: OutlinedButton(onPressed: () => _respond(a['id'], 'rejected'), child: const Text('رفض'))),
                  ]),
                ),
            ]),
          ),
        );
      },
    );
  }
}
