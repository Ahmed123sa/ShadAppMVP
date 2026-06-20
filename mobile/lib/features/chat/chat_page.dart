import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _api = ApiClient();
  final _controller = TextEditingController();
  List<dynamic> _messages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    try {
      final data = await _api.get('/workspaces/1/chat');
      setState(() => _messages = data['messages'] as List<dynamic>);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _send() async {
    if (_controller.text.trim().isEmpty) return;
    try {
      await _api.post('/workspaces/1/chat', {'message': _controller.text});
      _controller.clear();
      _loadMessages();
    } catch (_) {}
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(
        child: _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: _messages.length,
          reverse: true,
          itemBuilder: (context, i) {
            final m = _messages[_messages.length - 1 - i] as Map<String, dynamic>;
            return Align(
              alignment: Alignment.centerRight,
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.blue.shade100, borderRadius: BorderRadius.circular(12)),
                child: Text(m['message'] as String? ?? ''),
              ),
            );
          },
        ),
      ),
      Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: const InputDecoration(hintText: 'اكتب رسالة...', border: OutlineInputBorder()),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(onPressed: _send, icon: const Icon(Icons.send)),
        ]),
      ),
    ]);
  }
}
