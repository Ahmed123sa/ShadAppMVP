import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final _api = ApiClient();
  List<dynamic> _notifications = [];
  int _unreadCount = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.get('/notifications');
      if (!mounted) return;
      setState(() {
        _notifications = data['notifications'] as List<dynamic>? ?? [];
        _unreadCount = data['unread_count'] as int? ?? 0;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(String id) async {
    await _api.post('/notifications/$id/read');
    _load();
  }

  Future<void> _markAllAsRead() async {
    await _api.post('/notifications/read-all');
    _load();
  }

  Future<void> _delete(String id) async {
    await _api.delete('/notifications/$id');
    _load();
  }

  Color _colorForType(String? type) {
    switch (type) {
      case 'contract_sent':
      case 'contract_client_approved':
      case 'contract_company_approved':
      case 'contract_completed':
        return Colors.blue;
      case 'payment_created':
      case 'payment_reviewed':
        return Colors.green;
      case 'approval_requested':
      case 'approval_responded':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'contract_sent':
        return Icons.send;
      case 'contract_client_approved':
        return Icons.person;
      case 'contract_company_approved':
        return Icons.verified;
      case 'contract_completed':
        return Icons.check_circle;
      case 'payment_created':
        return Icons.payment;
      case 'payment_reviewed':
        return Icons.rate_review;
      case 'approval_requested':
        return Icons.approval;
      case 'approval_responded':
        return Icons.reply;
      default:
        return Icons.notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('تحديد الكل كمقروء'),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.notifications_off, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text('لا توجد إشعارات', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final notif = _notifications[index];
                      final data = notif['data'] as Map<String, dynamic>? ?? {};
                      final type = data['type'] as String?;
                      final title = data['title'] as String? ?? '';
                      final message = data['message'] as String? ?? '';
                      final readAt = notif['read_at'];
                      final isUnread = readAt == null;
                      final id = notif['id'] as String? ?? '';
                      final createdAt = notif['created_at'] as String? ?? '';

                      return Dismissible(
                        key: Key(id),
                        direction: DismissDirection.endToStart,
                        onDismissed: (_) => _delete(id),
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: Colors.red,
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        child: Card(
                          color: isUnread ? ShadColors.primary.withAlpha(20) : null,
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: _colorForType(type).withAlpha(30),
                              child: Icon(_iconForType(type), color: _colorForType(type), size: 20),
                            ),
                            title: Text(title, style: TextStyle(fontWeight: isUnread ? FontWeight.bold : FontWeight.normal)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(message),
                                const SizedBox(height: 4),
                                Text(_formatDate(createdAt), style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                              ],
                            ),
                            trailing: isUnread
                                ? Container(width: 10, height: 10, decoration: BoxDecoration(color: ShadColors.primary, shape: BoxShape.circle))
                                : null,
                            onTap: isUnread ? () => _markAsRead(id) : null,
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} د';
      if (diff.inHours < 24) return 'منذ ${diff.inHours} س';
      if (diff.inDays < 7) return 'منذ ${diff.inDays} ي';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return date;
    }
  }
}
