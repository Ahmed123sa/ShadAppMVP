import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class MeetingsPage extends StatefulWidget {
  const MeetingsPage({super.key});

  @override
  State<MeetingsPage> createState() => _MeetingsPageState();
}

class _MeetingsPageState extends State<MeetingsPage> {
  final _api = ApiClient();
  List<dynamic> _meetings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.get('/workspaces/1/meetings');
      setState(() => _meetings = data['meetings'] as List<dynamic>);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_meetings.isEmpty) return const Center(child: Text('لا توجد اجتماعات'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _meetings.length,
      itemBuilder: (context, i) {
        final m = _meetings[i] as Map<String, dynamic>;
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(m['title'] as String? ?? ''),
            subtitle: Text(m['scheduled_at'] as String? ?? ''),
            trailing: m['link'] != null ? IconButton(
              icon: const Icon(Icons.videocam),
              onPressed: () {},
            ) : null,
          ),
        );
      },
    );
  }
}
