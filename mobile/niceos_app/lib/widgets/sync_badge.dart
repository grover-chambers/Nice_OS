import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/sync_provider.dart';

class SyncBadge extends StatelessWidget {
  const SyncBadge({super.key});

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          icon: Icon(sync.isSyncing ? Icons.cloud_sync : Icons.cloud_done),
          onPressed: () => context.read<SyncProvider>().forceSync(),
          tooltip: 'Sync now',
        ),
        if (sync.pendingCount > 0)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              child: Text(
                '${sync.pendingCount}',
                style: const TextStyle(color: Colors.white, fontSize: 10),
              ),
            ),
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
