import 'package:hive/hive.dart';

/// Minimal v1 sync queue: stores pending outgoing payloads in a Hive box and
/// exposes the items that still need to be flushed.
///
/// Shape contract (kept consistent between enqueue / markSynced):
/// each entry is a Map with keys:
///   - id      String (the local row id being synced — caller-supplied)
///   - payload dynamic (the entity row to push)
///   - synced  bool
///   - created_at String (ISO-8601)
class SyncService {
  SyncService._();

  static final SyncService instance = SyncService._();

  late Box<Map> _pendingSyncBox;

  Future<void> init() async {
    _pendingSyncBox = await Hive.openBox<Map>('pending_sync');
  }

  Box<Map> get pendingSyncBox => _pendingSyncBox;

  /// Enqueue a payload keyed by its local row id. If an entry with the same id
  /// already exists, it is replaced (last-write-wins on the local queue).
  Future<void> enqueueSync(String id, Object data) async {
    await _pendingSyncBox.put(id, {
      'id': id,
      'payload': data,
      'synced': false,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  /// Mark the entry for [id] as synced. The entry is left in the box (so we
  /// can inspect history) but [pendingItems] will exclude it.
  Future<void> markSynced(String id) async {
    final existing = _pendingSyncBox.get(id);
    if (existing == null) return;
    await _pendingSyncBox.put(id, {
      ...existing,
      'synced': true,
    });
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

  List<Map<String, dynamic>> get pendingItems {
    return _pendingSyncBox.values
        .whereType<Map>()
        .where((v) => v['synced'] != true)
        .map((v) => Map<String, dynamic>.from(v))
        .toList();
  }

  int get pendingCount => pendingItems.length;
}
