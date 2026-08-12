import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RetailerProvider extends ChangeNotifier {
  final SupabaseClient _client = Supabase.instance.client;
  final _retailers = <Retailer>[].obs;
  Retailer? _currentRetailer;

  List<Retailer> get retailers => _retailers;
  Retailer? get currentRetailer => _currentRetailer;

  RetailerProvider() {
    _loadRetailers();
  }

  Future<void> _loadRetailers() async {
    try {
      final response = await _client.from('retailers').select();
      _retailers.clear();
      for (final r in response) {
        _retailers.add(Retailer.fromJson(r));
      }
      notifyListeners();
    } catch (e) {
      // Handle error silently or show in UI
    }
  }

  Future<void> addRetailer(Retailer retailer) async {
    try {
      final json = retailer.toJson();
      final response = await _client.from('retailers').insert(json);
      final newRetailer = Retailer.fromJson(response.first);
      _retailers.add(newRetailer);
      notifyListeners();
    } catch (e) {
      // Handle error
    }
  }

  Future<void> updateRetailer(Retailer retailer) async {
    try {
      final json = retailer.toJson();
      await _client.from('retailers').update(json).match(id: retailer.id);
      final index =
          _retailers.indexWhere((r) => r.id == retailer.id);
      if (index != -1) {
        _retailers[index] = retailer;
        notifyListeners();
      }
    } catch (e) {
      // Handle error
    }
  }

  Future<void> deleteRetailer(String id) async {
    await _client.from('retailers').delete().match(id: id);
    _retailers.removeWhere((r) => r.id == id);
    notifyListeners();
  }
}

/// Global retailer provider instance.
final RetailerProvider retailerProvider = RetailerProvider();