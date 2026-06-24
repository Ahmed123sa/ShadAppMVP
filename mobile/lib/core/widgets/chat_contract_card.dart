import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import 'package:shadapp_client/generated/app_localizations.dart';
import 'status_badge.dart';

class ChatContractCard extends StatelessWidget {
  final Map<String, dynamic> contract;
  final bool isClient;
  final VoidCallback onViewClauses;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  const ChatContractCard({
    super.key,
    required this.contract,
    required this.isClient,
    required this.onViewClauses,
    this.onApprove,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final status = contract['status'] as String? ?? '';
    final clauses = contract['clauses'] as List<dynamic>? ?? [];
    final showActions = isClient && status == 'sent';

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: ShadColors.primary, width: 2),
        borderRadius: BorderRadius.circular(12),
        color: ShadColors.card,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.description, color: ShadColors.primary, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(contract['title'] ?? '', style: ShadTypography.cardTitle),
                    const SizedBox(height: 2),
                    Text('${contract['value'] ?? 0} SAR • ${clauses.length} ${AppLocalizations.of(context)!.contracts}',
                      style: ShadTypography.cardBody.copyWith(color: ShadColors.textSecondary)),
                  ],
                ),
              ),
              StatusBadge(status: status, fontSize: 10),
            ]),
            if (['client_approved', 'company_approved', 'completed'].contains(status) && contract['pdf_url'] != null) ...[
              const SizedBox(height: 4),
              InkWell(
                onTap: () async {
                  final uri = Uri.tryParse(contract['pdf_url'] as String);
                  if (uri != null && await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.picture_as_pdf, size: 14, color: ShadColors.error),
                  const SizedBox(width: 4),
                  Text(
                    status == 'client_approved' ? '📄 عرض العقد الموقع' : '📄 تحميل العقد النهائي',
                    style: ShadTypography.cardBody.copyWith(color: ShadColors.primary, decoration: TextDecoration.underline, fontSize: 11),
                  ),
                ]),
              ),
            ],
            const SizedBox(height: 8),
            Row(children: [
              TextButton.icon(
                onPressed: onViewClauses,
                icon: const Icon(Icons.list_alt, size: 18),
                label: Text(AppLocalizations.of(context)!.viewClauses),
              ),
              const Spacer(),
              if (showActions) ...[
                ElevatedButton(
                  onPressed: onApprove,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ShadColors.success,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    textStyle: ShadTypography.cardBody.copyWith(fontWeight: FontWeight.w600),
                  ),
                  child: Text(AppLocalizations.of(context)!.approve),
                ),
                const SizedBox(width: 6),
                OutlinedButton(
                  onPressed: onReject,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ShadColors.error,
                    side: const BorderSide(color: ShadColors.error),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    textStyle: ShadTypography.cardBody.copyWith(fontWeight: FontWeight.w600),
                  ),
                  child: Text(AppLocalizations.of(context)!.reject),
                ),
              ],
            ]),
          ],
        ),
      ),
    );
  }
}
