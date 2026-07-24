import 'package:hive/hive.dart';

class SyncService {
  SyncService._();

  static final SyncService instance = SyncService._();

  late Box _pendingSyncBox;

  Future<void> init() async {
    _pendingSyncBox = await Hive.openBox('pending_sync');
  }

  Box get pendingSyncBox => _pendingSyncBox;

  Future<void> enqueueSync(Object data) async {
    final batch = _pendingSyncBox.add({
      'payload': data,
      'synced': false,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<void> markSynced(String id) async {
    final key = _pendingSyncBox.getKeys().firstWhere(
      (k) => _pendingSyncBox.get(k)?['id'] == id,
      orElse: () => null,
    );
    if (key != null) {
      await _pendingSyncBox.put(key, {'synced': true});
    }
  }

  List<Map<String, dynamic>> get pendingItems {
    return _pendingSyncBox.values
        .where((v) => v is Map && v['synced'] != true)
        .cast<Map<String, dynamic>>()
        .toList();
  }
}