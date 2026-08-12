import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

/// Minimal v1 sync queue: stores pending outgoing payloads in a Hive box
/// and flushes them when online.
class SyncService {
  SyncService._();

  static final SyncService instance = SyncService._();

  late Box<Map<String, dynamic>> _pendingSyncBox;

  Future init() async {
    _pendingSyncBox = await Hive.openBox<Map<String, dynamic>>('pending_sync');
  }

  Box<Map<String, dynamic>> get pendingSyncBox => _pendingSyncBox;

  /// Enqueue a payload keyed by its local row id. If an entry with the same id
  /// already exists, it is replaced (last-write-wins on the local queue).
  Future<void> enqueueSync(String id, Map<String, dynamic> data) async {
    final now = DateTime.now().toIso8601String();
    await _pendingSyncBox.put(id, {
      'id': id,
      'payload': data,
      'synced': false,
      'created_at': now,
    });
  }

  /// Mark the entry for [id] as synced. The entry is left in the box (so we
  /// can inspect history) but [pendingItems] will exclude it.
  Future<void> markSynced(String id) async {
    final existing = _pendingSyncBox.get(id);
    if (existing == null) return;
    await _pendingSyncBox.put(id, {...existing, 'synced': true});
  }

  /// Remove all entries flagged as synced. Call after a successful flush round.
  Future<void> purgeSynced() async {
    final keys = _pendingSyncBox.keys.toList();
    for (final k in keys) {
      final v = _pendingSyncBox.get(k);
      if (v != null && v['synced'] == true) {
        await _pendingSyncBox.delete(k);
      }
    }
  }

  /// Get all entries that have not yet been synced.
  List<Map<String, dynamic>> get pendingItems {
    return _pendingSyncBox.values
        .whereType<Map>()
        .where((v) => v['synced'] != true)
        .map((v) => Map<String, dynamic>.from(v))
        .toList();
  }

  int get pendingCount => pendingItems.length;

  /// Flush all pending items to the server via sync-push.
  /// Returns a map of entity -> applied count + conflicts.
  Future<Map<String, dynamic>> flush({
    required Function(String entity, List<dynamic> rows) onPush,
  }) async {
    final connectivity = await Connectivity.checkConnectivity();
    if (connectivity == ConnectivityState.none) {
      return {'error': 'no_connection', 'flushed': 0};
    }

    final pending = pendingItems;
    if (pending.isEmpty) return {'flushed': 0, 'applied': {}};

    // Group by entity
    final Map<String, List<Map<String, dynamic>>> byEntity = {};
    for (final item in pending) {
      final entity = item['entity'] as String?;
      if (entity == null) continue;
      byEntity.putIfAbsent(entity, () => []).add(item['payload'] as Map<String, dynamic>);
    }

    final results = <String, dynamic>{};
    for (final entity in byEntity.keys) {
      final rows = byEntity[entity]!;
      final result = await onPush(entity, rows);
      results[entity] = result;
    }

    // Mark all as synced after successful push
    for (final item in pending) {
      await markSynced(item['id'] as String);
    }

    return {'flushed': pending.length, 'applied': results};
  }
}

/// Global sync service instance.
final SyncService syncService = SyncService();