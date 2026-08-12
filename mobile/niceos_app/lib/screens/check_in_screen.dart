import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/auth_provider.dart';
import '../providers/sync_provider.dart';
import '../services/location_service.dart';
import '../services/photo_service.dart';

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _gpsFixCount = 0;
  double _gpsAccuracy = 0;
  double _distanceToOutlet = 0;
  bool _isLocked = false;
  bool _isCheckingIn = false;

  @override
  void initState() {
    super.initState();
    _gpsFixCount = 0;
    _checkGPSLock();
  }

  Future<void> _checkGPSLock() async {
    // Get current position
    final position = await LocationService().getCurrentPosition();
    if (position == null) {
      setState(() {
        _gpsAccuracy = 0;
      });
      return;
    }

    final outletLat = 1.2345; // placeholder - would come from outlet data
    final outletLng = 36.7890;
    final distance = _calculateDistance(
        position.latitude, position.longitude, outletLat, outletLng);
    final accuracy = position.accuracy;

    setState(() {
      _gpsAccuracy = accuracy;
      _distanceToOutlet = distance;
    });

    // GPS lock: 5m radius, 3 consecutive fixes with accuracy ≤5m
    if (_gpsFixCount < 3) {
      setState(() {
        _gpsFixCount++;
      });
      // Check after 3 fixes
      if (_gpsFixCount >= 3) {
        setState(() => _isLocked = _gpsFix >= 3 && _gpsAccuracy <= 5);
      }
      // Retry after 2 seconds
      Future.delayed(const Duration(seconds: 2), _checkGPSLock);
    } else if (_isLocked && _gpsAccuracy <= 5) {
      // Locked and accurate - proceed to photo capture
      _proceedToPhotos();
    }
  }

  double _calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula
    const R = 6371000;
    final dLat = (lat2 - lat1) * 3.14159 / 180;
    final dLng = (lng2 - lng1) * 3.14159 / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * 3.14159 / 180) * cos(lat2 * 3.14159 / 180) * sin(dLng / 2) * sin(dLng / 2);
    final c = 2 * asin(sqrt(a));
    return R * c;
  }

  void _proceedToPhotos() {
    setState(() => _isCheckingIn = true);
    // Navigate to photo capture screen
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => const PhotoCaptureScreen(),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Check In'),
      ),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Check In',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              // GPS status
              const Text(
                'GPS Lock Status:',
              ),
              const SizedBox(height: 8),
              Text(
                _isLocked ? 'Locked (5 m)' : 'Searching for GPS lock...',
                style: TextStyle(
                  color: _isLocked ? Colors.green : Colors.orange,
                ),
              ),
              Text(
                'Accuracy: _gpsAccuracy?.toStringAsFixed(1) ?? 'N/A' 'm',
              ),
              const SizedBox(height: 16),
              // Distance to outlet
              const Text(
                'Distance to outlet:',
              ),
              Text(
                _distanceToOutlet > 0
                    ? '${_distanceToOutlet.toStringAsFixed(1)} m'
                    : 'Within 5 m',
                style: TextStyle(
                  color: _distanceToOutlet <= 5 ? Colors.green : Colors.red,
                ),
              ),
              const SizedBox(height: 24),
              // Photo capture button (only show when locked)
              _isLocked
                  ? ElevatedButton.icon(
                      onPressed: _proceedToPhotos,
                      icon: const Icon(Icons.camera),
                      label: const Text('Capture Photos'),
                    )
                  : const Text(
                      'Get GPS lock within 5 m to proceed',
                      style: TextStyle(color: Colors.orange),
                    ),
              const SizedBox(height: 24),
              // Override reason (for when lock fails)
              const Text(
                'If you cannot achieve GPS lock, tap "Override" and provide a reason:',
                style: TextStyle(fontStyle: FontStyle.italic, color: Colors.orange),
              ),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Override reason',
                ),
                onChanged: (value) {
                  // Store override reason
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PhotoCaptureScreen extends StatelessWidget {
  const PhotoCaptureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Capture Photos'),
      ),
      body: Column(
        children: [
          const Text(
            'Take shop front photo',
          ),
          ElevatedButton.icon(
            onPressed: () {
              // Capture photo with geotag
              PhotoService.captureWithGeotag().then((filePathAndGeotag) {
                // Navigate to next step
                Navigator.push(context, MaterialPageRoute(
                  builder: (_) => const NotesScreen(),
                ));
              });
            },
            icon: const Icon(Icons.photo),
            label: const Text('Capture shop front'),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              // Capture shelf photo
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => const ShelfPhotoScreen(),
              ));
            },
            icon: const Icon(Icons.inventory),
            label: const Text('Capture shelf photos'),
          ),
        ],
      ),
    );
  }
}

class NotesScreen extends StatelessWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notes'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add visit notes:'),
            TextFormField(
              decoration: const InputDecoration(
                hintText: 'e.g. Out of stock on Rice, customer busy',
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // Complete visit
                Navigator.pushNamedAndRemoveUntil(
                    context, '/today', (route) => false);
              ),
              child: const Text('Complete Visit'),
            ),
          ],
        ),
      ),
    );
  }
}

class ShelfPhotoScreen extends StatelessWidget {
  const ShelfPhotoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shelf Photos'),
      ),
      body: Column(
        children: const [
          Text('Capture shelf photos (minimum 1 required)'),
          ElevatedButton.icon(
            onPressed: () {
              // Capture shelf photo
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => const NotesScreen(),
              ));
            },
            icon: Icon(Icons.inventory),
            label: Text('Capture shelf photo'),
          ),
        ],
      ),
    );
  }
}