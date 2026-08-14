import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/retailer_provider.dart';
import '../providers/sync_provider.dart';
import '../widgets/retailer_list.dart';
import '../widgets/sync_badge.dart';

class TodayScreen extends StatefulWidget {
  const TodayScreen({super.key});

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
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
    final auth = context.watch<AuthProvider>();
    final sync = context.watch<SyncProvider>();
    final retailers = context.watch<RetailerProvider>().retailers;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Today'),
        actions: [
          const SyncBadge(),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthProvider>().signOut(),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<RetailerProvider>().loadRetailers(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            KPICard(
              title: 'Route',
              value: auth.displayName,
              subtitle: '${retailers.length} outlets assigned',
            ),
            KPICard(
              title: 'Sync',
              value: '${sync.pendingCount}',
              subtitle: sync.isOnline
                  ? (sync.isSyncing ? 'Syncing...' : 'Online')
                  : 'Offline - changes will sync when online',
            ),
            const SizedBox(height: 24),
            const Row(
              children: [
                Icon(Icons.storefront),
                SizedBox(width: 8),
                Text(
                  'Today\'s Outlets',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (retailers.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('No outlets assigned yet')),
              )
            else
              const RetailerList(),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        sync.isSyncing
                            ? 'Syncing...'
                            : '${sync.pendingCount} pending changes',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.read<SyncProvider>().forceSync(),
                      child: const Text('Force Sync'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/check-in'),
        tooltip: 'Check in to an outlet',
        child: const Icon(Icons.add),
      ),
    );
  }
}

class KPICard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;

  const KPICard({
    super.key,
    required this.title,
    required this.value,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.grey)),
            Text(
              value,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
