class Retailer {
  final String id;
  final String name;
  final String? ownerName;
  final String? phone;
  final double latitude;
  final double longitude;
  final String? businessType;
  final String? businessSize;
  final String status;
  final String territoryId;
  final int targetVisitFrequencyDays;
  final DateTime? lastVisitAt;

  Retailer({
    required this.id,
    required this.name,
    this.ownerName,
    this.phone,
    required this.latitude,
    required this.longitude,
    this.businessType,
    this.businessSize,
    required this.status,
    required this.territoryId,
    this.targetVisitFrequencyDays = 7,
    this.lastVisitAt,
  });

  factory Retailer.fromJson(Map<String, dynamic> json) {
    return Retailer(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerName: json['owner_name'] as String?,
      phone: json['phone'] as String?,
      latitude: (json['location']['coordinates'][1] as num).toDouble(),
      longitude: (json['location']['coordinates'][0] as num).toDouble(),
      businessType: json['business_type'] as String?,
      businessSize: json['business_size'] as String?,
      status: json['status'] as String,
      territoryId: json['territory_id'] as String,
      targetVisitFrequencyDays: json['target_visit_frequency_days'] as int? ?? 7,
      lastVisitAt: json['last_visit_at'] != null
          ? DateTime.parse(json['last_visit_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'owner_name': ownerName,
      'phone': phone,
      'location': {
        'type': 'Point',
        'coordinates': [longitude, latitude],
      },
      'business_type': businessType,
      'business_size': businessSize,
      'status': status,
      'territory_id': territoryId,
      'target_visit_frequency_days': targetVisitFrequencyDays,
      'last_visit_at': lastVisitAt?.toIso8601String(),
    };
  }
}