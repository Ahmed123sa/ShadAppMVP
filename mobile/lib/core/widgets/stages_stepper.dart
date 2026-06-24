import 'package:flutter/material.dart';
import '../theme.dart';

class StagesStepper extends StatelessWidget {
  final int currentStage;
  final void Function(int stage)? onStageTap;

  const StagesStepper({super.key, required this.currentStage, this.onStageTap});

  static const stages = [
    _Stage('التوقيع الإلكتروني', Icons.fingerprint),
    _Stage('استلام العقد', Icons.description),
    _Stage('موافقتك', Icons.thumb_up),
    _Stage('اعتماد الشركة', Icons.business),
    _Stage('إثبات الدفع', Icons.payment),
    _Stage('تفعيل المساحة', Icons.rocket_launch),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ShadColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ShadColors.cardBorder),
      ),
      child: Row(
        children: List.generate(stages.length * 2 - 1, (i) {
          if (i.isOdd) {
            final stageIdx = i ~/ 2;
            return Expanded(
              child: Container(
                height: 2,
                decoration: BoxDecoration(
                  color: stageIdx < currentStage ? ShadColors.success : ShadColors.cardBorder,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            );
          }
          final stageIdx = i ~/ 2;
          final stage = stages[stageIdx];
          final done = stageIdx < currentStage;
          final active = stageIdx == currentStage;
          return GestureDetector(
            onTap: onStageTap != null ? () => onStageTap!(stageIdx) : null,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: done
                        ? ShadColors.success.withAlpha(30)
                        : active
                            ? ShadColors.gold.withAlpha(30)
                            : ShadColors.cardBorder,
                    border: Border.all(
                      color: done
                          ? ShadColors.success
                          : active
                              ? ShadColors.gold
                              : ShadColors.textDisabled,
                      width: active ? 2 : 1,
                    ),
                  ),
                  child: Icon(
                    done ? Icons.check : stage.icon,
                    size: 14,
                    color: done
                        ? ShadColors.success
                        : active
                            ? ShadColors.gold
                            : ShadColors.textDisabled,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stage.label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                    color: done
                        ? ShadColors.success
                        : active
                            ? ShadColors.gold
                            : ShadColors.textDisabled,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _Stage {
  final String label;
  final IconData icon;
  const _Stage(this.label, this.icon);
}
