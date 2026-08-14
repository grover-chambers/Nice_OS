import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../services/supabase_service.dart';
import '../services/sync_service.dart';

/// How often to attempt a background flush while the app is open and the
/// device is online. Combined with the connectivity-triggered flush, this
/// guarantees captures reach the server shortly after they are made without
/// the user opening the sync screen.
const Duration kAutoFlushInterval = Duration(seconds: 45);

class SyncProvider extends ChangeNotifier {
  SyncProvider({bool demoMode = false}) : _demoMode = demoMode {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final online = results != ConnectivityResult.none;
      _online = online;
      if (online && !_demoMode) {
        flush();
      } else {
        notifyListeners();
      }
    });

    _autoTimer = Timer.periodic(kAutoFlushInterval, (_) {
      if (!_demoMode && _online && _syncing == false) {
        flush();
      }
    });
  }

  Timer? _autoTimer;
  StreamSubscription<ConnectivityResult>? _connectivitySub;

  @override
  void dispose() {
    _autoTimer?.cancel();
    _connectivitySub?.cancel();
    super.dispose();
  }

  final bool _demoMode;
  final SupabaseService _supabase = SupabaseService.instance;
  final _uuid = const Uuid();

  bool _online = true;
  bool _syncing = false;
  String _deviceId = '';

  bool get isOnline => _online;
  bool get isSyncing => _syncing;
  int get pendingCount => syncService.pendingCount;

  Future<String> _getDeviceId() async {
    if (_deviceId.isNotEmpty) return _deviceId;
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString('device_id');
    if (id == null) {
      id = _uuid.v4();
      await prefs.setString('device_id', id);
    }
    _deviceId = id;
    return id;
  }

  Future<void> flush() async {
    if (_syncing) return;
    if (!_online) return;
    _syncing = true;
    notifyListeners();
    try {
      if (_demoMode) {
        // Demo mode keeps everything in the local queue; a supervisor could
        // export the pending rows without a live backend.
        await Future.delayed(const Duration(milliseconds: 100));
        return;
      }
      final deviceId = await _getDeviceId();
      await syncService.flush(onPush: (entity, rows) async {
        final res = await _supabase.pushSync(deviceId: deviceId, batch: [
          {'entity': entity, 'rows': rows},
        ]);
        if (res is Map && res['error'] != null) {
          return {'error': res['error']};
        }
        return res is Map ? Map<String, dynamic>.from(res) : {'applied': 0};
      });
      await syncService.purgeSynced();
    } catch (_) {
      // Network or auth failure — entries stay queued for the next flush.
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }
  Future<void> forceSync() => flush();
}

final SyncProvider syncProvider = SyncProvider();
