import 'dart:async';

import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

/// Result of an update check against the `app_versions` table.
class UpdateCheckResult {
  final bool updateAvailable;
  final int currentVersionCode;
  final String? latestVersion;
  final int? latestVersionCode;
  final String? apkUrl;
  final String? notes;

  const UpdateCheckResult({
    required this.updateAvailable,
    required this.currentVersionCode,
    this.latestVersion,
    this.latestVersionCode,
    this.apkUrl,
    this.notes,
  });
}

/// Checks the rep app's own version against the latest published release and
/// prompts the user to download the new APK when one is available.
class UpdateService {
  static final UpdateService instance = UpdateService._();

  UpdateService._();

  bool _enabled = false;

  /// Enable live update checks. No-op (returns fresh result) in demo mode.
  void configure() => _enabled = true;

  Future<PackageInfo> _info() => PackageInfo.fromPlatform();

  /// Latest manifest row, or null if the table is unreachable/empty.
  Future<Map<String, dynamic>?> _latestRelease() async {
    if (!_enabled) return null;
    try {
      final client = Supabase.instance.client;
      final res = await client
          .from('app_versions')
          .select('version_name,version_code,apk_url,notes,is_latest')
          .eq('is_latest', true)
          .limit(1)
          .maybeSingle()
          .timeout(const Duration(seconds: 8));
      return res;
    } catch (_) {
      // Offline or table missing — treat as no update.
      return null;
    }
  }

  Future<UpdateCheckResult> check() async {
    final info = await _info();
    final code = int.tryParse(info.buildNumber) ?? 1;
    final release = await _latestRelease();
    if (release == null) {
      return UpdateCheckResult(updateAvailable: false, currentVersionCode: code);
    }
    final latestCode = (release['version_code'] as num?)?.toInt() ?? 0;
    return UpdateCheckResult(
      updateAvailable: latestCode > code,
      currentVersionCode: code,
      latestVersion: release['version_name'] as String?,
      latestVersionCode: latestCode,
      apkUrl: release['apk_url'] as String?,
      notes: release['notes'] as String?,
    );
  }

  /// Show an in-app "update available" dialog and, when confirmed, open the
  /// APK download URL so Android can install it.
  Future<void> promptIfAvailable(BuildContext context) async {
    if (!_enabled) return;
    final result = await check();
    if (!result.updateAvailable || result.apkUrl == null || !context.mounted) return;

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Update available'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nice OS v${result.latestVersion} is ready to install.'),
            if (result.notes != null) ...[
              const SizedBox(height: 8),
              Text(result.notes!, style: const TextStyle(fontSize: 12)),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Later'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              launchUrl(Uri.parse(result.apkUrl!), mode: LaunchMode.externalApplication);
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }
}

/// Backfill so `updateService` naming stays consistent across the codebase.
final updateService = UpdateService.instance;