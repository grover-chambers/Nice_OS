import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/retailer_model.dart';
import '../providers/retailer_provider.dart';
import '../providers/sync_provider.dart';
import '../theme/brand.dart';
import '../widgets/warm.dart';

/// Visits — the rep's route of outlets identified from census work. Each stop
/// opens the GPS-verified check-in / visit flow.
class VisitsScreen extends StatefulWidget {
  const VisitsScreen({super.key});

  @override
  State<VisitsScreen> createState() => _VisitsScreenState();
}

class _VisitsScreenState extends State<VisitsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RetailerProvider>().loadRetailers();
      context.read<SyncProvider>().flush();
    });
  }

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();
    final retailers = context.watch<RetailerProvider>().retailers;

    return RefreshIndicator(
      onRefresh: () => context.read<RetailerProvider>().loadRetailers(),
      child: ListView(
        padding: const EdgeInsets.only(bottom: 40),
        children: [
          AppHeader(
            eyebrow: "Today's route",
            title: 'Visits',
            subtitle: '${retailers.length} outlet(s) identified from census',
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 6, 20, 6),
            child: Row(
              children: [
                KpiTile('${retailers.length}', 'Stops'),
                const SizedBox(width: 10),
                const KpiTile('0', 'Visited', numberColor: Brand.stampGreen),
                const SizedBox(width: 10),
                KpiTile('${retailers.length}', 'Pending', numberColor: Brand.amberDeep),
              ],
            ),
          ),
          const SectionTitle("Today's stops, in order"),
          if (retailers.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: WarmCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('No outlets assigned yet.',
                        style: TextStyle(fontWeight: FontWeight.w700, color: Brand.ink)),
                    const SizedBox(height: 6),
                    const Text(
                      'Complete census work to identify outlets; they appear here as visits once a route is assigned.',
                      style: TextStyle(color: Brand.inkSoft, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    Eyebrow('${sync.pendingCount} pending · ${sync.isOnline ? 'online' : 'offline'}'),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  for (var i = 0; i < retailers.length; i++) _StopTile(index: i, retailer: retailers[i]),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StopTile extends StatelessWidget {
  final int index;
  final Retailer retailer;
  const _StopTile({required this.index, required this.retailer});

  @override
  Widget build(BuildContext context) {
    return WarmCard(
      onTap: () => Navigator.pushNamed(context, '/check-in', arguments: retailer.id),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Brand.card,
              border: Border.all(color: Brand.ink, width: 2),
              shape: BoxShape.circle,
            ),
            child: Text('${index + 1}',
                style: const TextStyle(fontFamily: Brand.fontMono, fontWeight: FontWeight.w800, fontSize: 13, color: Brand.ink)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(retailer.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: Brand.ink)),
                const SizedBox(height: 2),
                Text(retailer.ward, style: const TextStyle(color: Brand.inkSoft, fontSize: 12)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Brand.inkSoft),
        ],
      ),
    );
  }
}