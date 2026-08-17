import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/census_provider.dart';
import '../providers/intercept_provider.dart';
import '../providers/sync_provider.dart';
import '../theme/brand.dart';
import '../widgets/warm.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _version = 'v…';

  @override
  void initState() {
    super.initState();
    PackageInfo.fromPlatform().then((info) {
      if (!mounted) return;
      setState(() => _version = 'v${info.version}+${info.buildNumber}');
    }).catchError((_) {
      if (!mounted) return;
      setState(() => _version = 'v?');
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final census = context.watch<CensusProvider>();
    final intercepts = context.watch<InterceptProvider>();
    final sync = context.watch<SyncProvider>();

    final name = auth.displayName;
    final initials = name
        .split(' ')
        .where((p) => p.isNotEmpty)
        .map((p) => p[0])
        .take(2)
        .join()
        .toUpperCase();

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 40),
          children: [
            // Hero
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 34, 20, 20),
              child: Column(
                children: [
                  Container(
                    width: 74,
                    height: 74,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Brand.ink, width: 3),
                      shape: BoxShape.circle,
                    ),
                    child: Transform.rotate(
                      angle: -0.07,
                      child: Text(
                        initials.isEmpty ? 'N' : initials,
                        style: const TextStyle(
                          color: Brand.ink,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          fontFamily: Brand.fontMono,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(name, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Brand.ink)),
                  const SizedBox(height: 3),
                  const Text('Field rep · Offline-first', style: TextStyle(color: Brand.inkSoft, fontSize: 13)),
                ],
              ),
            ),
            // Stats
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  KpiTile('${census.capturedOutlets.length}', 'Outlets'),
                  const SizedBox(width: 10),
                  KpiTile('${intercepts.capturedIntercepts.length}', 'Intercepts'),
                  const SizedBox(width: 10),
                  KpiTile('${sync.pendingCount}', 'To sync'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Details
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: _ProfileRow(keyLabel: 'Role', value: 'Field Rep'),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: _ProfileRow(keyLabel: 'Sync', value: 'Local queue'),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _ProfileRow(keyLabel: 'App', value: _version),
            ),
            // Log out
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: AmberButton(
                'Log out',
                outlined: true,
                color: Brand.card,
                onPressed: () => context.read<AuthProvider>().signOut(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final String keyLabel;
  final String value;
  const _ProfileRow({required this.keyLabel, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Brand.line, width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(keyLabel, style: const TextStyle(color: Brand.inkSoft)),
          Text(value, style: const TextStyle(fontFamily: Brand.fontMono, fontWeight: FontWeight.w700, color: Brand.ink)),
        ],
      ),
    );
  }
}