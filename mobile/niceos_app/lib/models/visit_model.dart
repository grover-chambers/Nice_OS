class Visit {
  final String id;
  final String retailerId;
  final String userId;
  final DateTime checkInAt;
  final DateTime? checkOutAt;
  final double gpsLat;
  final double gpsLng;
  final double? gpsAccuracy;
  final String outcome;
  final String? notes;

  Visit({
    required this.id,
    required this.retailerId,
    required this.userId,
    required this.checkInAt,
    this.checkOutAt,
    required this.gpsLat,
    required this.gpsLng,
    this.gpsAccuracy,
    this.outcome = 'completed',
    this.notes,
  });

  factory Visit.fromJson(Map<String, dynamic> json) {
    return Visit(
      id: json['id'] as String,
      retailerId: json['retailer_id'] as String,
      userId: json['user_id'] as String,
      checkInAt: DateTime.parse(json['check_in_at'] as String),
      checkOutAt: json['check_out_at'] != null
          ? DateTime.parse(json['check_out_at'] as String)
          : null,
      gpsLat: (json['gps_lat'] as num).toDouble(),
      gpsLng: (json['gps_lng'] as num).toDouble(),
      gpsAccuracy: json['gps_accuracy'] != null
          ? (json['gps_accuracy'] as num).toDouble()
          : null,
      outcome: json['outcome'] as String? ?? 'completed',
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'retailer_id': retailerId,
      'user_id': userId,
      'check_in_at': checkInAt.toIso8601String(),
      'check_out_at': checkOutAt?.toIso8601String(),
      'gps_lat': gpsLat,
      'gps_lng': gpsLng,
      'gps_accuracy': gpsAccuracy,
      'outcome': outcome,
      'notes': notes,
    };
  }
}