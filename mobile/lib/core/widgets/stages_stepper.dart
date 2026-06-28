import 'package:flutter/material.dart';
import '../theme.dart';

class StageStep {
  final String status;
  final String label;
  final IconData icon;
  const StageStep({required this.status, required this.label, required this.icon});
}

class StagesStepper extends StatelessWidget {
  final String currentStatus;
  final List<StageStep> steps;

  const StagesStepper({super.key, required this.currentStatus, required this.steps});

  @override
  Widget build(BuildContext context) {
    final currentIndex = steps.indexWhere((s) => s.status == currentStatus);
    final activeIndex = currentIndex >= 0 ? currentIndex : 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ShadColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ShadColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (int i = 0; i < steps.length; i++)
            _buildStep(context, i, activeIndex),
        ],
      ),
    );
  }

  Widget _buildStep(BuildContext context, int index, int activeIndex) {
    final step = steps[index];
    final isCompleted = index < activeIndex;
    final isActive = index == activeIndex;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isCompleted
                  ? ShadColors.success.withAlpha(30)
                  : isActive
                      ? ShadColors.gold.withAlpha(30)
                      : ShadColors.cardBorder,
              border: Border.all(
                color: isCompleted
                    ? ShadColors.success
                    : isActive ? ShadColors.gold : ShadColors.textDisabled,
                width: isActive ? 2 : 1,
              ),
            ),
            child: Icon(
              isCompleted ? Icons.check : step.icon,
              size: 14,
              color: isCompleted
                  ? ShadColors.success
                  : isActive ? ShadColors.gold : ShadColors.textDisabled,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              step.label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isCompleted || isActive
                    ? ShadColors.text
                    : ShadColors.textDisabled,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
