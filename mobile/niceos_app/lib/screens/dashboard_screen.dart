import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/census_provider.dart';
import '../providers/intercept_provider.dart';
import '../providers/sync_provider.dart';
import '../theme/brand.dart';
import '../widgets/warm.dart';

/// Dashboard — the rep's day at a glance: mission & objective, live stats and
/// the day's tasks.
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final census = context.watch<CensusProvider>();
    final intercepts = context.watch<InterceptProvider>();
    final sync = context.watch<SyncProvider>();

    return ListView(
      padding: const EdgeInsets.only(bottom: 40),
      children: [
        AppHeader(
          eyebrow: "Field rep · ${auth.demoMode ? 'demo' : 'live'}",
          title: 'Jambo, ${auth.displayName.split(' ').first}',
          subtitle: 'Your mission and objectives for today.',
        ),
        // Mission / objective banner
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Brand.ink,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Eyebrow('Mission', color: Brand.amber),
                const SizedBox(height: 6),
                const Text(
                  'Map every outlet, understand every shopper.',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  'Record outlets and intercepts accurately so the network team can route visits and drive activation.',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
        ),
        // Stats strip
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
          child: Row(
            children: [
              KpiTile('${census.todayCount}', 'Outlets'),
              const SizedBox(width: 10),
              KpiTile('${intercepts.todayCount}', 'Intercepts'),
              const SizedBox(width: 10),
              KpiTile('${sync.pendingCount}', 'To sync'),
            ],
          ),
        ),
        // Objective card
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: WarmCard(
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: const BoxDecoration(color: Brand.amber, shape: BoxShape.circle),
                  child: const Icon(Icons.flag_outlined, color: Brand.ink),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("Today's objective",
                          style: TextStyle(fontWeight: FontWeight.w800, color: Brand.ink, fontSize: 15)),
                      Text('Complete census captures and close your day by 6 PM.',
                          style: TextStyle(color: Brand.inkSoft, fontSize: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SectionTitle('Tasks'),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              _TaskRow(icon: Icons.storefront_outlined, title: 'Census outlets', done: false, active: true),
              _TaskRow(icon: Icons.people_outline, title: 'Run intercepts', done: false, active: true),
              _TaskRow(icon: Icons.flag_outlined, title: 'Close day & submit', done: false),
            ],
          ),
        ),
      ],
    );
  }
}

class _TaskRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool done;
  final bool active;
  const _TaskRow({required this.icon, required this.title, this.done = false, this.active = false});

  @override
  Widget build(BuildContext context) {
    return WarmCard(
      child: Row(
        children: [
          Icon(icon, color: Brand.amberDeep, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, color: Brand.ink, fontSize: 14.5)),
          ),
          if (done)
            const StampTag(StampStatus.visited, label: 'Done')
          else if (active)
            const StampTag(StampStatus.pending, label: 'Now')
          else
            const Eyebrow('Later'),
        ],
      ),
    );
  }
}