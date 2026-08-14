import 'package:flutter/foundation.dart';

/// Messaging facade for OTP / order-intent notifications.
///
/// V1 ships without a WhatsApp/email gateway SDK, so these helpers log the
/// intent and return false; callers fall back to their next channel. The
/// production path is the server-side `auth-otp` edge function, which is
/// invoked by the auth flow (see supabase/functions/auth-otp).
class MessagingService {
  Future<bool> sendWhatsApp(String phone, String message) async {
    debugPrint('[messaging] WhatsApp to $phone: $message');
    return false;
  }

  Future<bool> sendEmail(String email, String subject, String body) async {
    debugPrint('[messaging] Email to $email - $subject');
    return false;
  }

  /// Send the 2FA verification code. V1 generates the code client-side and
  /// logs it; the production path is the `auth-otp` edge function.
  Future<void> sendOTP(String email) async {
    final code = (100000 + DateTime.now().millisecondsSinceEpoch % 900000).toString();
    debugPrint('[messaging] OTP for $email: $code');
  }
}

final MessagingService messaging = MessagingService();
