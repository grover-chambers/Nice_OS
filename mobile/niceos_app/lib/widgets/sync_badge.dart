import 'package:flutter/material.dart';
import '../providers/sync_provider.dart';

class SyncBadge extends StatelessWidget {
  const SyncBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();
    return PopupMenuButton<int>(
      icon: const Icon(Icons.cloud_download),
      onSelected: (value) {
        // Handle sync menu selection
      },
      itemBuilder: (context) => const [
        PopupMenuItem(
          value: 1,
          child: Text('Force Sync'),
        ),
        PopupMenuItem(
          value: 2,
          child: Text('View History'),
        ),
      ],
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.amber[700],
      padding: const EdgeInsets.all(8.0),
      child: const Row(
        children: [
          Icon(Icons.wifi_off, color: Colors.white),
          SizedBox(width: 8),
          Text(
            'Offline mode - data will sync when online',
            style: TextStyle(color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class GPSSLockIndicator extends StatelessWidget {
  final bool isLocked;
  const GPSSLockIndicator({super.key, required this.isLocked});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      color: isLocked ? Colors.green : Colors.red,
      child: Text(
        isLocked ? 'GPS Locked' : 'Searching...',
        style: const TextStyle(color: Colors.white, fontSize: 12),
      ),
    );
  }
}

class RetailerList extends StatelessWidget {
  const RetailerList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 3,
      itemBuilder: (context, index) {
        return ListTile(
          leading: const Icon(Icons.store),
          title: const Text('Wanjiru Kiosk'),
          subtitle: const Text('Tier A, duka'),
          trailing: const Icon(Icons.arrow_right_alt),
        );
      },
    );
  }
}