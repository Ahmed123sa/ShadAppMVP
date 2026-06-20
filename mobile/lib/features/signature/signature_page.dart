import 'package:flutter/material.dart';
import '../../core/api_client.dart';

class SignaturePage extends StatefulWidget {
  const SignaturePage({super.key});

  @override
  State<SignaturePage> createState() => _SignaturePageState();
}

class _SignaturePageState extends State<SignaturePage> {
  final _api = ApiClient();
  final List<Offset> _points = [];
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('التوقيع الإلكتروني')),
      body: Column(children: [
        Expanded(
          child: GestureDetector(
            onPanUpdate: (details) => setState(() => _points.add(details.localPosition)),
            onPanEnd: (_) => setState(() => _points.add(Offset.zero)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Container(
                margin: const EdgeInsets.all(16),
                decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(12)),
                child: CustomPaint(
                  painter: _SignaturePainter(_points),
                  size: Size.infinite,
                ),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Expanded(
              child: OutlinedButton(onPressed: () => setState(() => _points.clear()), child: const Text('إعادة')),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: FilledButton(
                onPressed: _saving ? null : () async {
                  setState(() => _saving = true);
                  try {
                    await _api.post('/clients/1/sign', {'signature': 'signature-data-encoded'});
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حفظ التوقيع')));
                    Navigator.pop(context);
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('خطأ: $e')));
                  } finally { setState(() => _saving = false); }
                },
                child: _saving ? const CircularProgressIndicator(strokeWidth: 2) : const Text('حفظ التوقيع'),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset> points;
  _SignaturePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != Offset.zero && points[i + 1] != Offset.zero) {
        canvas.drawLine(points[i], points[i + 1], paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
