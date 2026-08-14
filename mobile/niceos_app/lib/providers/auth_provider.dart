import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../services/messaging.dart';

/// Lightweight view of the signed-in user that works in both Supabase mode
/// and offline demo mode (no network, no Supabase project configured).
class AppUser {
  final String id;
  final String? email;
  final String? fullName;

  const AppUser({required this.id, this.email, this.fullName});
}

class AuthProvider extends ChangeNotifier {
  AuthProvider({bool demoMode = false}) : _demoMode = demoMode {
    if (_demoMode) return;
    try {
      final client = Supabase.instance.client;
      _user = _toAppUser(client.auth.currentUser);
      client.auth.onAuthStateChange.listen((data) {
        _user = _toAppUser(data.session?.user);
        notifyListeners();
      });
    } catch (_) {
      // Supabase not initialized (missing config) — fall back to demo mode so
      // the app remains usable without a backend.
      _demoMode = true;
    }
  }

  bool _demoMode;
  bool _loading = false;
  String? _error;
  AppUser? _user;

  bool get demoMode => _demoMode;
  AppUser? get currentUser => _user;
  bool get isLoading => _loading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  /// V1: the OTP entry screen is not built yet, so password login grants full
  /// access. Flip this when `auth-otp` / `auth-verify-otp` ship.
  bool get isOTPVerified => true;

  String get displayName => _user?.fullName ?? _user?.email ?? 'Field Rep';

  Future<void> signIn(String email, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      if (_demoMode) {
        // Offline demo: accept any credentials, act as a demo field rep.
        _user = AppUser(id: 'demo-rep', email: email, fullName: 'Demo Field Rep');
        notifyListeners();
        return;
      }
      final client = Supabase.instance.client;
      final data =
          await client.auth.signInWithPassword(email: email, password: password);
      _user = _toAppUser(data.user);
      if (_user != null) {
        messaging.sendOTP(_user!.email ?? '');
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    if (!_demoMode) {
      try {
        await Supabase.instance.client.auth.signOut();
      } catch (_) {}
    }
    _user = null;
    notifyListeners();
  }

  AppUser? _toAppUser(User? user) {
    if (user == null) return null;
    return AppUser(
      id: user.id,
      email: user.email,
      fullName: user.userMetadata?['full_name'] as String?,
    );
  }
}

extension AuthProviderX on AuthProvider {
  bool get canAccessFeatures => isAuthenticated && isOTPVerified;
}
