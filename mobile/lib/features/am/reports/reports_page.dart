import 'package:flutter/material.dart';
import '../../am/workspace/reports_tab.dart';
import '../../../core/widgets/shad_logo.dart';

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
  title: Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      const ShadLogo(size: 24, showText: false),
      const SizedBox(width: 8),
      const Text('Reports & Statistics / التقارير والإحصائيات'),
    ],
  ),
),
      body: const ReportsTab(),
    );
  }
}
