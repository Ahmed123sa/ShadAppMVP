import 'package:flutter/material.dart';
import '../../core/api_client.dart';
import '../auth/login_page.dart';
import '../contracts/contracts_page.dart';
import '../payments/payments_page.dart';
import '../chat/chat_page.dart';
import '../approvals/approvals_page.dart';
import '../meetings/meetings_page.dart';
import '../signature/signature_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final _api = ApiClient();
  Map<String, dynamic>? _client;
  Map<String, dynamic>? _workspace;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final token = await _api.getToken();
    if (token == null) return;
    try {
      final data = await _api.post('/auth/client/login', {});
    } catch (_) {}
  }

  Future<void> _logout() async {
    await _api.clearToken();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginPage()));
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _HomeTab(api: _api),
      const ContractsPage(),
      const PaymentsPage(),
      const ChatPage(),
      const ApprovalsPage(),
      const MeetingsPage(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('ShadApp'),
        actions: [IconButton(icon: const Icon(Icons.logout), onPressed: _logout)],
      ),
      body: pages[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (i) => setState(() => _selectedIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'الرئيسية'),
          NavigationDestination(icon: Icon(Icons.description), label: 'العقود'),
          NavigationDestination(icon: Icon(Icons.payment), label: 'الدفع'),
          NavigationDestination(icon: Icon(Icons.chat), label: 'المحادثة'),
          NavigationDestination(icon: Icon(Icons.check_circle), label: 'الموافقات'),
          NavigationDestination(icon: Icon(Icons.videocam), label: 'الاجتماعات'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  final ApiClient api;
  const _HomeTab({required this.api});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(child: ListTile(title: const Text('التوقيع الإلكتروني'), subtitle: const Text('قم برسم أو رفع توقيعك'), trailing: const Icon(Icons.edit), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignaturePage())))),
        Card(child: ListTile(title: const Text('رفع إثبات دفع'), trailing: const Icon(Icons.upload_file), onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentsPage())))),
        Card(child: ListTile(title: const Text('المستندات المطلوبة'), trailing: const Icon(Icons.folder))),
      ],
    );
  }
}
