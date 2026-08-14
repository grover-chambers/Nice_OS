import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'providers/auth_provider.dart';
import 'providers/census_provider.dart';
import 'providers/intercept_provider.dart';
import 'providers/retailer_provider.dart';
import 'providers/shift_provider.dart';
import 'providers/submission_provider.dart';
import 'providers/sync_provider.dart';
import 'screens/check_in_screen.dart';
import 'screens/splash_screen.dart';
import 'services/quality_service.dart';
import 'services/supabase_service.dart';
import 'services/sync_service.dart';
import 'services/update_service.dart';
import 'theme/brand.dart';

/// Rejects empty / obviously-placeholder Supabase values so the app never
/// blocks on `Supabase.initialize` against a fake project URL.
bool _isRealConfig(String v) {
  final s = v.trim();
  if (s.isEmpty) return false;
  final lower = s.toLowerCase();
  if (lower.contains('placeholder')) return false;
  if (lower.contains('your-project')) return false;
  if (lower == 'your-anon-key') return false;
  return true;
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  var dotenvLoaded = false;
  try {
    await dotenv.load(fileName: '.env');
    dotenvLoaded = true;
  } catch (_) {
    // .env is optional in dev; credentials can come from --dart-define.
  }

  await Hive.initFlutter();
  await syncService.init();
  await qualityService.init();

  // Read only from dotenv when it actually loaded (web has no .env asset;
  // calling `dotenv.env` otherwise throws NotInitializedError before runApp).
  final url = (dotenvLoaded ? dotenv.env['SUPABASE_URL'] : null) ??
      const String.fromEnvironment('SUPABASE_URL');
  final anonKey = (dotenvLoaded ? dotenv.env['SUPABASE_ANON_KEY'] : null) ??
      const String.fromEnvironment('SUPABASE_ANON_KEY');

  final configured = _isRealConfig(url) && _isRealConfig(anonKey);

  var demoMode = !configured;
  if (configured) {
    try {
      await Supabase.initialize(url: url, publishableKey: anonKey)
          .timeout(const Duration(seconds: 10));
      await SupabaseService.instance.init();
      updateService.configure();
    } catch (_) {
      // Bad/unreachable Supabase config must never leave a blank screen:
      // fall back to offline mode so the app still boots.
      demoMode = true;
    }
  }

  runApp(NiceOSApp(demoMode: demoMode));
}

class NiceOSApp extends StatelessWidget {
  /// [demoMode] runs the app fully offline: no Supabase project needed, all
  /// capture flows work against local Hive boxes + the sync queue.
  final bool demoMode;

  const NiceOSApp({super.key, this.demoMode = false});

  @override
  Widget build(BuildContext context) {
    final shiftProvider = ShiftProvider();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => RetailerProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => SyncProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => CensusProvider(shift: shiftProvider)),
        ChangeNotifierProvider(create: (_) => InterceptProvider(shift: shiftProvider)),
        ChangeNotifierProvider(create: (_) => SubmissionProvider(shift: shiftProvider)),
        ChangeNotifierProvider(create: (_) => shiftProvider),
        Provider<SupabaseService>(create: (_) => SupabaseService.instance),
      ],
      child: MaterialApp(
        title: Brand.appName,
        debugShowCheckedModeBanner: false,
        theme: Brand.theme(),
        home: const SplashScreen(),
        routes: {
          '/check-in': (context) => const CheckInScreen(),
        },
      ),
    );
  }
}
