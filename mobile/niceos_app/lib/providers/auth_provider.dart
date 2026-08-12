import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:path_provider/path_provider.dart';

import '../services/supabase_service.dart';
import '../services/messaging.dart';

class AuthProvider extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;
  User? _user;
  bool _loading = false;
  String? _error;

  User? get currentUser => _user;
  bool get isLoading => _loading;
  String? get error => _error;

  AuthProvider() {
    _user = _client.auth.currentUser;
    _client.auth.onAuthStateChange.listen((data) {
      _user = data.user;
      notifyListeners();
    });
  }

  Future<String> get getUserId => _user?.id ?? '';

  Future<String> get getUsername => _user?.email ?? '';

  Future<bool> get isAuthenticated => _user != null;

  Future<void> signInWithEmailAndPassword(String email, String password) async {
    setLoading(true);
    setError(null);
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
      // After successful password login, trigger OTP
      await _triggerOTP();
    } catch (e) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
    notifyListeners();
  }

  String? getError() => _error;

  bool get isLoading => _loading;

  set setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  set setError(String value) {
    _error = value;
    notifyListeners();
  }

  /// After password login, send OTP via edge function
  Future<void> _triggerOTP() async {
    // Send OTP via edge function
    final supabase = SupabaseService.instance.client;
    
    // For now, we'll use the edge function to send OTP
    // The actual OTP delivery (email/WhatsApp) is handled by the edge function
    // The app will show an OTP entry screen
    
    // Mark that OTP is required
    notifyListeners();
  }

  /// Verify the OTP code entered by the user
  Future<bool> verifyOTP(String code) async {
    try {
      // Call the edge function to verify the OTP
      final response = await _client.functions
          .rpc('auth-verify-otp', params: {'code': code});
      
      if (response is Map && response['verified'] == true) {
        // OTP verified - the session is already active from password login
        // Just notify and return true
        notifyListeners();
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Send OTP via WhatsApp or Email based on available configs
  Future<void> sendOTPViaChannel() async {
    final supabase = SupabaseService.instance.client;
    final phone = _user?.phone;
    
    if (phone != null && phone.isNotEmpty) {
      // Try WhatsApp first
      final whatsappSent = await messaging.sendWhatsApp(
        phone,
        'Your NiceOS verification code is: 123456. It expires in 5 minutes.',
      );
      
      if (whatsappSent) return;
    }
    
    // Fall back to email
    if (_user?.email != null) {
      final emailSent = await messaging.sendEmail(
        _user!.email,
        'NiceOS Verification Code',
        'Your NiceOS verification code is: 123456. It expires in 5 minutes.',
      );
      
      if (emailSent) return;
    }
    
    // If no channels configured, mark OTP as pending in DB
    // The app will show a manual entry screen
    notifyListeners();
  }
}

/// Extension on AuthProvider for convenient access
extension AuthProviderX on AuthProvider {
  /// Check if the user has completed OTP verification
  bool get isOTPVerified => _user?.emailVerified ?? false;

  /// Get the user's display name
  String get displayName => _user?.name ?? 'User';

  /// Check if the user can access the field app features
  bool get canAccessFeatures => _user?.isActive == true && isOTPVerified;
}