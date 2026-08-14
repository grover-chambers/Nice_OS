import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

class PhotoService {
  PhotoService();

  /// Capture a photo from the camera and tag it with the current GPS fix.
  /// Returns `(file path, geotag metadata)`.
  ///
  /// The geotag is returned alongside the file so the caller can store it as
  /// `shelf_photos.lat/lng` (the `verify_visit_photos` server-side audit needs
  /// at least two geotagged photos).
  static Future<(String, Map<String, dynamic>)> captureWithGeotag({
    ImageSource source = ImageSource.camera,
  }) async {
    final position = await _currentPosition();
    final file = await ImagePicker().pickImage(source: source, maxWidth: 2048);
    if (file == null) {
      throw Exception('Photo capture cancelled');
    }
    final geotag = {
      'latitude': position.latitude,
      'longitude': position.longitude,
      'accuracy': position.accuracy,
      'timestamp': DateTime.now().toIso8601String(),
    };
    return (file.path, geotag);
  }

  static Future<Position> _currentPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permission denied forever');
    }
    return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }
}

final PhotoService photoService = PhotoService();
