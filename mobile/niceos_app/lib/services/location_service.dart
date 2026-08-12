import 'package:geolocator/geolocator.dart';

class LocationService {
  LocationService._();

  /// Request permission and return the current position.
  /// Returns null if permission is denied or location services are disabled.
  Future<Position?> getCurrentPosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      // Location services are not enabled. Ask the user to enable them.
      serviceEnabled = await Geolocator.requestService();
      if (!serviceEnabled) return null;
    }

    // Test permission
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always) {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    }
    return null;
  }

  /// Check if we have GPS permission.
  Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }

  /// Get the GPS accuracy in meters from the last position fix.
  Future<double?> getLastAccuracy() async {
    final position = await Geolocator.getLastKnownPosition(
      accuracy: LocationAccuracy.high,
    );
    return position?.accuracy;
  }

  /// Stabilise GPS: take N samples and return the average position.
  /// Returns null if fewer than minSamples fixes are obtained within maxSeconds.
  Future<(double lat, double lng)?> stabiliseFixes({
    int minSamples = 3,
    int maxSeconds = 15,
  }) async {
    final List<Position> fixes = [];
    final start = DateTime.now();

    while (DateTime.now().difference(start).inSeconds < maxSeconds) {
      final fix = await Geolocator.getCurrentPosition(
        accuracy: LocationAccuracy.high,
      );
      fixes.add(fix);
      if (fixes.length >= minSamples) {
        // Check if all fixes are within a reasonable radius of the average
        final avgLat = fixes.map((f) => f.latitude).reduce((a, b) => a + b) / fixes.length;
        final avgLng = fixes.map((f) => f.longitude).reduce((a, b) => a + b) / fixes.length;
        // Check radius: max distance from average
        final maxRadius = fixes
            .map((f) => _haversineDistance(f.latitude, f.longitude, avgLat, avgLng))
            .reduce((a, b) => a > b ? a : b);
        if (maxRadius <= 10) { // 10 m tolerance
          return (avgLat, avgLng);
        }
      }
      await Future.delayed(const Duration(seconds: 1));
    }
    return null;
  }

  double _haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in metres
    final dLat = (lat2 - lat1) * 3.14159 / 180;
    final dLng = (lng2 - lng1) * 3.14159 / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * 3.14159 / 180) * cos(lat2 * 3.14159 / 180) * sin(dLng / 2) * sin(dLng / 2);
    return 2 * R * asin(sqrt(a));
  }
}

/// Global location service instance.
final LocationService locationService = LocationService();