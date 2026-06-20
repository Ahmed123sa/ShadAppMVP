import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ContractsPage extends StatefulWidget {
  const ContractsPage({super.key});

  @override
  State<ContractsPage> createState() => _ContractsPageState();
}

class _ContractsPageState extends State<ContractsPage> {
  final _api = ApiClient();
  List<dynamic> _contracts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.get('/workspaces/1/contracts');
      setState(() => _contracts = data['contracts'] as List<dynamic>);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _action(int id, String action) async {
    await _api.post('/contracts/$id/client-action', {'action': action});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_contracts.isEmpty) return const Center(child: Text('لا توجد عقود'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _contracts.length,
      itemBuilder: (context, i) {
        final c = _contracts[i] as Map<String, dynamic>;
        final status = c['status'] as String? ?? '';
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c['title'] as String? ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('القيمة: ${c['value']} ر.س', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 4),
              Text('الحالة: $status', style: TextStyle(color: Colors.grey.shade600)),
              if (status == 'sent')
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(children: [
                    Expanded(child: FilledButton(onPressed: () => _action(c['id'], 'approved'), child: const Text('اعتماد'))),
                    const SizedBox(width: 12),
                    Expanded(child: OutlinedButton(onPressed: () => _action(c['id'], 'rejected'), child: const Text('رفض'))),
                  ]),
                ),
            ]),
          ),
        );
      },
    );
  }
}
