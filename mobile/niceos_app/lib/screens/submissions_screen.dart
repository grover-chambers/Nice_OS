import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/daily_submission_model.dart';
import '../providers/auth_provider.dart';
import '../providers/census_provider.dart';
import '../providers/intercept_provider.dart';
import '../providers/submission_provider.dart';

/// DAILY CLOSE — §5. Supervisors review every submission the same evening.
/// The tab shows today's counts, the close action, previous submissions and
/// back-checks due.
class SubmissionsScreen extends StatefulWidget {
  const SubmissionsScreen({super.key});

  @override
  State<SubmissionsScreen> createState() => _SubmissionsScreenState();
}

class _SubmissionsScreenState extends State<SubmissionsScreen> {
  bool _closing = false;

  Future<void> _closeDay() async {
    setState(() => _closing = true);
    final census = context.read<CensusProvider>();
    final submissions = context.read<SubmissionProvider>();
    final repId = context.read<AuthProvider>().currentUser?.id ?? 'demo-rep';

    final rows = census.capturedOutlets
        .map((o) => o.toJson())
        .toList();

    try {
      final sub = await submissions.closeDay(
        repId: repId,
        outletCount: census.todayCount,
        interceptCount: context.read<InterceptProvider>().todayCount,
        outletRows: rows,
      );
      if (!mounted) return;
      final flagMsg = sub.qualityFlags.isEmpty
          ? 'Day closed — no flags raised'
          : 'Day closed — ${sub.qualityFlags.length} flag(s) for review';
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(flagMsg)));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Close failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _closing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final census = context.watch<CensusProvider>();
    final intercepts = context.watch<InterceptProvider>();
    final submissions = context.watch<SubmissionProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Submissions & Quality')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Today',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _Stat(label: 'Outlets', value: '${census.todayCount}'),
                      _Stat(label: 'Intercepts', value: '${intercepts.todayCount}'),
                      _Stat(
                        label: 'Pending sync',
                        value: '${submissions.backChecks.length}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: _closing
                        ? const Center(child: CircularProgressIndicator())
                        : FilledButton.icon(
                            onPressed: census.todayCount == 0 &&
                                    intercepts.todayCount == 0
                                ? null
                                : _closeDay,
                            icon: const Icon(Icons.check),
                            label: const Text('Close Day & Submit'),
                          ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Submissions',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (submissions.submissions.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('No submissions yet', style: TextStyle(color: Colors.grey)),
            )
          else
            for (final s in submissions.submissions) _SubmissionTile(submission: s),
          const SizedBox(height: 24),
          const Text('Back-checks',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (submissions.backChecks.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('No back-checks recorded', style: TextStyle(color: Colors.grey)),
            )
          else
            for (final b in submissions.backChecks)
              ListTile(
                dense: true,
                leading: Icon(
                  b.status == 'passed' ? Icons.verified : Icons.warning_amber,
                  color: b.status == 'passed' ? Colors.green : Colors.orange,
                ),
                title: Text('Back-check · ${b.status}'),
                subtitle: Text(b.discrepancy ?? 'No discrepancy noted'),
              ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}

class _SubmissionTile extends StatelessWidget {
  final DailySubmissionModel submission;
  const _SubmissionTile({required this.submission});

  @override
  Widget build(BuildContext context) {
    final d = DateFormat('dd MMM yyyy');
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: const Icon(Icons.fact_check),
        title: Text(
          '${d.format(DateTime.parse(submission.submissionDate))} · '
          '${submission.outletCount} outlets · '
          '${submission.interceptCount} intercepts',
        ),
        subtitle: Text(
          submission.qualityFlags.isEmpty
              ? 'No flags'
              : submission.qualityFlags.map((f) => '• $f').join('\n'),
          style: TextStyle(
            color: submission.qualityFlags.isEmpty ? Colors.green : Colors.orange,
            fontSize: 12,
          ),
        ),
        isThreeLine: submission.qualityFlags.isNotEmpty,
        trailing: Chip(
          label: Text(submission.status),
          labelStyle: const TextStyle(fontSize: 12),
        ),
      ),
    );
  }
}
