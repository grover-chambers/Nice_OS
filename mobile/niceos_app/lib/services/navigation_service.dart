import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'package:niceos_app/providers/auth_provider.dart';
import 'package:niceos_app/providers/sync_provider.dart';
import 'package:niceos_app/providers/visit_provider.dart';
import 'package:niceos_app/providers/retailer_provider.dart';
import 'package:niceos_app/screens/login_screen.dart';
import 'package:niceos_app/screens/today_screen.dart';
import 'package:niceos_app/screens/map_screen.dart';
import 'package:niceos_app/screens/sync_screen.dart';
import 'package:niceos_app/screens/settings_screen.dart';

import 'services/supabase_service.dart';
import 'services/navigation_service.dart';

import 'package:flutter/material.dart';

import 'package:dotenv/dotenv.dart' as d;

void main() async {
  // Load environment variables from .env file
  await DotEnv().load();
  
  // Initialize Hive
  await Hive.initFlutter();
  
  // Initialize Supabase
  await Supabase.initialize(
    url: DotEnv().env['SUPABASE_URL'] ?? '',
    anonKey: DotEnv().env['SUPABASE_ANON_KEY'] ?? '',
  );
  
  runApp(const NiceOSApp());
}

class NiceOSApp extends StatelessWidget {
  const NiceOSApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifier(create: (_) => SyncProvider()),
        ChangeNotifier(create: (_) => VisitProvider()),
        ChangeNotifier(create: (_) => RetailerProvider()),
        Provider(create: (_) => SupabaseService.instance),
        Provider(create: (_) => NavigationService()),
      ],
      child: MaterialApp(
        title: 'NiceOS Field App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
          useMaterial3: true,
        ),
        home: const AuthGate(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/today': (context) => const TodayScreen(),
          '/map': (context) => const MapScreen(),
          '/sync': (context) => const SyncScreen(),
          '/settings': (context) => const SettingsScreen(),
        },
      ),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();

  @override
  State<AuthGate> initState() {
    super.initState();
    // Initialize services after widget is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Initialize services
      final supabase = SupabaseService.instance;
      // Initialize sync service
      syncService.init();
    });
  }

  @override
  State<AuthGate> build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    
    // If user is authenticated and OTP verified, show main app
    if (auth.isAuthenticated && auth.isOTPVerified) {
      return const MainApp();
    }
    
    // Otherwise show login
    return const LoginScreen();
  }
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    
    return Scaffold(
      body: IndexedStack(
        index: _getIndex(context),
        children: const [
          TodayScreen(),
          TodayScreen(), // routes
          MapScreen(),
          SyncScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _getIndex(context),
        onTap: (index) => _navigateTo(context, index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.today),
            label: 'Today',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.route),
            label: 'Routes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.map),
            label: 'Map',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sync),
            label: 'Sync',
          ),
        ],
      ),
    );
  }

  int _getIndex(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    // Simple indexing based on whether OTP is verified
    if (!auth.isOTPVerified) return 0; // login
    // For authenticated users, cycle through screens
    // This is a simplified implementation
    return 1; // Default to routes
  }

  void _navigateTo(BuildContext context, int index) {
    // Navigation handled by IndexedStack
  }
}

mixin NavigationService {
  // Navigation helpers
}