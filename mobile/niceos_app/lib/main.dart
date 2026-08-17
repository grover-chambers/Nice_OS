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
import 'screens/fatal_config_screen.dart';
import 'screens/splash_screen.dart';
import 'services/quality_service.dart';
import 'services/supabase_service.dart';
import 'services/sync_service.dart';
import 'theme/brand.dart';

/// Rejects empty / obviously-placeholder Supabase values so the app never
/// boots against a fake project URL. Any placeholder (e.g. the
/// `your-...-supabase.co` values in `.env.example`) counts as unconfigured.
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
  if (!configured) {
    // Fail closed: no backend config -> branded fatal screen, never demo mode.
    runApp(const FatalConfigScreen());
    return;
  }

  try {
    await Supabase.initialize(url: url, publishableKey: anonKey)
        .timeout(const Duration(seconds: 10));
    await SupabaseService.instance.init();
  } catch (_) {
    // Bad/unreachable Supabase project -> branded fatal screen, never demo.
    runApp(const FatalConfigScreen());
    return;
  }

  runApp(const NiceOSApp());
}

class NiceOSApp extends StatelessWidget {
  const NiceOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    final shiftProvider = ShiftProvider();
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => RetailerProvider()),
        ChangeNotifierProvider(create: (_) => SyncProvider()),
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