import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  SupabaseService._();

  static final SupabaseService instance = SupabaseService._();

  late final SupabaseClient client;

  Future init() async {
    client = Supabase.instance.client;
    await client.storage.getBucketNames();
  }

  // Auth
  Future signInWithEmailAndPassword(String email, String password) async {
    return await client.auth.signInWithPassword(email: email, password: password);
  }

  Future signInWithOTP(String email) async {
    // Trigger OTP sent via email/WhatsApp; user enters code separately
    return await client.auth.signInWithOtp(email: email);
  }

  Future signOut() async {
    return await client.auth.signOut();
  }

  // Sync
  Future pushSync(String entity, List<dynamic> rows) async {
    final supabase = supabaseServiceInstance;
    final res = await supabase.functions.rpc('sync_apply', params: {
      'p_entity': entity,
      'p_rows': rows,
    });
    return res;
  }

  Future pullSync(String since, List<String> entities) async {
    final supabase = supabaseServiceInstance;
    final res = await supabase.functions.rpc('sync_pull', params: {
      'since': since,
      'entities': entities.join(','),
    });
    return res;
  }

  // Verification
  Future verifyVisitPhotos(String visitId) async {
    final supabase = supabaseServiceInstance;
    return await supabase.functions.rpc('verify_visit_photos', params: {'visit_id': visitId});
  }

  // 2FA
  Future sendOTP(String email) async {
    final supabase = supabaseServiceInstance;
    return await supabase.functions.rpc('auth-otp', params: {'email': email});
  }

  Future verifyOTP(String code) async {
    final supabase = supabaseServiceInstance;
    return await supabase.functions.rpc('auth-verify-otp', params: {'code': code});
  }

  // Photos
  Future uploadPhoto(String path, List<int> imageBytes) async {
    final bucket = await client.storage.from('shelf-photos').upload(path, imageBytes);
    return bucket;
  }

  Future getPublicUrl(String path) async {
    return await client.storage.from('shelf-photos').getPublicUrl(path);
  }

  // Retailer
  Future<List> getRetailers({String? repId, String? zone}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('retailers');
    if (repId != null) query = query.eq('rep_id', repId);
    if (zone != null) query = query.eq('zone', zone);
    return await select('*').from(query);
  }

  Future upsertRetailer(dynamic data) async {
    final supabase = supabaseServiceInstance;
    return await client.from('retailers').upsert(data).select();
  }

  // Orders
  Future<List> getOrderIntents({String? repId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('order_intents');
    if (repId != null) query = query.eq('rep_id', repId);
    return await select('*').from(query);
  }

  // Competitors
  Future<List> getCompetitorObservations({String? repId, String? retailerId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('competitor_observations');
    if (repId != null) query = query.eq('rep_id', repId);
    if (retailerId != null) query = query.eq('retailer_id', retailerId);
    return await select('*').from(query);
  }

  // Stock observations
  Future<List> getStockObservations({String? visitId, String? retailerId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('stock_observations');
    if (visitId != null) query = query.eq('visit_id', visitId);
    if (retailerId != null) query = query.eq('retailer_id', retailerId);
    return await select('*').from(query);
  }

  // Health scores
  Future<List> getHealthScores({String? retailerId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('health_scores');
    if (retailerId != null) query = query.eq('retailer_id', retailerId);
    return await select('*').from(query);
  }

  // Routes
  Future<List> getRoutes({String? repId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('routes');
    if (repId != null) query = query.eq('rep_id', repId);
    return await select('*').from(query);
  }

  // Visits
  Future<List> getVisits({String? repId, String? retailerId}) async {
    final supabase = supabaseServiceInstance;
    final query = client.from('visits');
    if (repId != null) query = query.eq('rep_id', repId);
    if (retailerId != null) query = query.eq('retailer_id', retailerId);
    return await select('*').from(query);
  }

  // Ward data from bundled asset
  Future getWardPolygons() async {
    // Returns the bundled territory_wards.json
    // In production, this would be an asset load
    return [];
  }
}

final SupabaseService supabaseServiceInstance = SupabaseService();