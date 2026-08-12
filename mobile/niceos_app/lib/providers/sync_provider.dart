import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/sync_service.dart';

class SyncProvider extends ChangeNotifier {
  SyncProvider() {
    _initConnectivityListener();
  }

  final SyncService _syncService = SyncService();

  /// Called when the widget is added to the tree.
  void _initConnectivityListener() {
    Connectivity().onConnectivityChanged.listen((ConnectivityResult result) {
      // When online, attempt to flush the sync queue
      if (result != ConnectivityResult.none) {
        _flushSyncQueue();
      }
    });
  }

  /// Flush the sync queue by calling the sync-push edge function.
  Future<void> _flushSyncQueue() async {
    // In a full implementation, this would call the sync-push function
    // with the pending items from the Hive box.
    // For now, we just notify listeners.
    notifyListeners();
  }

  /// Get the count of pending (unsynced) items.
  int get pendingCount => syncService.pendingCount;

  /// Whether the device is currently online.
  bool get isOnline => SyncService.instance.pendingSyncBox.isNotEmpty;

  /// Force a manual sync trigger.
  Future<void> forceSync() async {
    await _flushSyncQueue();
    notifyListeners();
  }
}

/// Global sync provider instance.
final SyncProvider syncProvider = SyncProvider();