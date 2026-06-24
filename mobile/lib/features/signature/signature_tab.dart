import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class SignatureTab extends StatefulWidget {
  const SignatureTab({super.key});

  @override
  State<SignatureTab> createState() => _SignatureTabState();
}

class _SignatureTabState extends State<SignatureTab> {
  final _api = ApiClient();
  final _textController = TextEditingController();
  final List<List<Offset>> _strokes = [];
  List<Offset> _currentStroke = [];
  bool _saving = false;
  String _mode = 'draw';

  final _boundaryKey = GlobalKey();
  String? _existingSigUrl;
  String? _existingSigText;

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _loadExisting() async {
    try {
      final cid = _api.userId;
      if (cid == null) return;
      final data = await _api.get('/clients/$cid');
      final client = data['client'] as Map<String, dynamic>?;
      final sigData = client?['signature_data'] as String?;
      if (sigData != null && sigData.isNotEmpty) {
        if (sigData.startsWith('http') || sigData.startsWith('/')) {
          setState(() => _existingSigUrl = sigData.startsWith('http') ? sigData : '${_api.baseUrl.replaceAll('/api', '')}$sigData');
        } else {
          setState(() => _existingSigText = sigData);
        }
      }
    } catch (_) {}
  }

  void _clear() => setState(() { _strokes.clear(); _currentStroke.clear(); });

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image);
    if (result != null && result.files.single.path != null) {
      try {
        final bytes = await File(result.files.single.path!).readAsBytes();
        final base64Sig = base64Encode(bytes);
        final cid = _api.userId;
        if (cid == null) return;
        await _api.post('/clients/$cid/sign', {'signature': base64Sig});
        if (mounted) {
          _loadExisting();
        }
      } catch (_) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حفظ التوقيع')));
      }
    }
  }

  Future<void> _saveDrawing() async {
    if (_strokes.isEmpty && _currentStroke.isEmpty) return;
    setState(() => _saving = true);
    try {
      final boundary = _boundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) throw Exception('No boundary');
      final image = await boundary.toImage(pixelRatio: 3);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null) throw Exception('No bytes');
      final pngBytes = byteData.buffer.asUint8List();
      final cid = _api.userId;
      if (cid == null) return;
      final dir = Directory.systemTemp;
      final file = File('${dir.path}/signature_${DateTime.now().millisecondsSinceEpoch}.png');
      await file.writeAsBytes(pngBytes);
      await _api.multipartPost('/clients/$cid/sign', {}, file: file, fileField: 'signature_image');
      if (mounted) {
        _loadExisting();
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حفظ التوقيع')));
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _saveText() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    setState(() => _saving = true);
    try {
      final cid = _api.userId;
      if (cid == null) return;
      await _api.post('/clients/$cid/sign', {'signature': text});
      if (mounted) {
        _loadExisting();
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حفظ التوقيع')));
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        child: Column(children: [
          if (_existingSigUrl != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: ShadColors.card,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ShadColors.cardBorder),
              ),
              child: Column(children: [
                Row(children: [
                  const Icon(Icons.check_circle, size: 16, color: ShadColors.success),
                  const SizedBox(width: 8),
                  Text('التوقيع الحالي', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadColors.textSecondary, fontFamily: 'Archivo')),
                ]),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.network(_existingSigUrl!, height: 60, fit: BoxFit.contain, errorBuilder: (_, __, ___) => const Icon(Icons.error, size: 30)),
                ),
              ]),
            ),
            const SizedBox(height: 16),
          ],
          if (_existingSigText != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: ShadColors.card,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ShadColors.cardBorder),
              ),
              child: Column(children: [
                Row(children: [
                  const Icon(Icons.check_circle, size: 16, color: ShadColors.success),
                  const SizedBox(width: 8),
                  Text('التوقيع الحالي', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: ShadColors.textSecondary, fontFamily: 'Archivo')),
                ]),
                const SizedBox(height: 8),
                Text(_existingSigText!, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w400, color: ShadColors.textPrimary, fontFamily: 'DancingScript')),
              ]),
            ),
            const SizedBox(height: 16),
          ],
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _modeChip('draw', 'رسم', Icons.brush),
            const SizedBox(width: 8),
            _modeChip('text', 'نص', Icons.text_fields),
          ]),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.image, size: 18),
              label: const Text('رفع صورة توقيع'),
              style: OutlinedButton.styleFrom(
                foregroundColor: ShadColors.primary,
                side: const BorderSide(color: ShadColors.primary),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (_mode == 'draw') ...[
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: ShadColors.black,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ShadColors.cardBorder),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: GestureDetector(
                  onPanStart: (_) => setState(() => _currentStroke = []),
                  onPanUpdate: (details) {
                    setState(() => _currentStroke.add(details.localPosition));
                  },
                  onPanEnd: (_) => setState(() { _strokes.add(List.from(_currentStroke)); _currentStroke = []; }),
                  child: RepaintBoundary(
                    key: _boundaryKey,
                    child: CustomPaint(
                      painter: _SignaturePainter(strokes: _strokes, currentStroke: _currentStroke),
                      size: const Size(double.infinity, 200),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _clear,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('مسح'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ShadColors.textSecondary,
                    side: const BorderSide(color: ShadColors.cardBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _saving ? null : _saveDrawing,
                  icon: _saving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.save, size: 18),
                  label: const Text('حفظ التوقيع'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadColors.crimson,
                    foregroundColor: ShadColors.textOnCrimson,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ]),
          ],
          if (_mode == 'text') ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: ShadColors.black,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: ShadColors.cardBorder),
              ),
              child: TextField(
                controller: _textController,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w400, color: ShadColors.textPrimary, fontFamily: 'DancingScript'),
                decoration: const InputDecoration(
                  hintText: 'اكتب توقيعك',
                  hintStyle: TextStyle(color: ShadColors.textDisabled, fontSize: 20),
                  border: InputBorder.none,
                ),
                maxLines: 1,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _saving ? null : _saveText,
                icon: _saving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save, size: 18),
                label: const Text('حفظ التوقيع'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ShadColors.crimson,
                  foregroundColor: ShadColors.textOnCrimson,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _modeChip(String value, String label, IconData icon) {
    final selected = _mode == value;
    return GestureDetector(
      onTap: () => setState(() => _mode = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? ShadColors.crimson : ShadColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? ShadColors.crimson : ShadColors.cardBorder),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 18, color: selected ? ShadColors.textOnCrimson : ShadColors.textSecondary),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selected ? ShadColors.textOnCrimson : ShadColors.textSecondary, fontFamily: 'NotoSansArabic')),
        ]),
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<List<Offset>> strokes;
  final List<Offset> currentStroke;

  _SignaturePainter({required this.strokes, required this.currentStroke});

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = ShadColors.cardBorder.withAlpha(40);
    for (double x = 0; x < size.width; x += 20) {
      for (double y = 0; y < size.height; y += 20) {
        canvas.drawCircle(Offset(x, y), 1, bgPaint);
      }
    }

    final paint = Paint()
      ..color = ShadColors.gold
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    for (final stroke in strokes) {
      _drawStroke(canvas, stroke, paint);
    }
    _drawStroke(canvas, currentStroke, paint);
  }

  void _drawStroke(Canvas canvas, List<Offset> points, Paint paint) {
    for (int i = 0; i < points.length - 1; i++) {
      canvas.drawLine(points[i], points[i + 1], paint);
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}
