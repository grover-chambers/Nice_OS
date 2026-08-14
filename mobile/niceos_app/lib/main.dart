import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'providers/auth_provider.dart';
import 'providers/census_provider.dart';
import 'providers/intercept_provider.dart';
import 'providers/retailer_provider.dart';
import 'providers/submission_provider.dart';
import 'providers/sync_provider.dart';
import 'screens/check_in_screen.dart';
import 'screens/root_screen.dart';
import 'services/quality_service.dart';
import 'services/supabase_service.dart';
import 'services/sync_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env is optional in dev; credentials can come from --dart-define.
  }

  await Hive.initFlutter();
  await syncService.init();
  await qualityService.init();

  final url = dotenv.env['SUPABASE_URL'] ?? const String.fromEnvironment('SUPABASE_URL');
  final anonKey =
      dotenv.env['SUPABASE_ANON_KEY'] ?? const String.fromEnvironment('SUPABASE_ANON_KEY');

  final configured = url.isNotEmpty && anonKey.isNotEmpty;

  if (configured) {
    await Supabase.initialize(url: url, publishableKey: anonKey);
    await SupabaseService.instance.init();
  }

  runApp(NiceOSApp(demoMode: !configured));
}

class NiceOSApp extends StatelessWidget {
  /// [demoMode] runs the app fully offline: no Supabase project needed, all
  /// capture flows work against local Hive boxes + the sync queue.
  final bool demoMode;

  const NiceOSApp({super.key, this.demoMode = false});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => RetailerProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => SyncProvider(demoMode: demoMode)),
        ChangeNotifierProvider(create: (_) => CensusProvider()),
        ChangeNotifierProvider(create: (_) => InterceptProvider()),
        ChangeNotifierProvider(create: (_) => SubmissionProvider()),
        Provider<SupabaseService>(create: (_) => SupabaseService.instance),
      ],
      child: MaterialApp(
        title: 'NiceOS',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: const Color(0xFF2563EB),
          useMaterial3: true,
        ),
        home: const RootScreen(),
        routes: {
          '/check-in': (context) => const CheckInScreen(),
        },
      ),
    );
  }
}
