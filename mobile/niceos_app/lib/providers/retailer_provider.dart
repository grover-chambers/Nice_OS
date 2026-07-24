import 'package:flutter/material.dart';
import '../models/retailer_model.dart';

class RetailerProvider extends ChangeNotifier {
  final List<Retailer> _retailers = [];

  List<Retailer> get retailers => _retailers;

  void setRetailers(List<Retailer> retailers) {
    _retailers.clear();
    _retailers.addAll(retailers);
    notifyListeners();
  }

  Retailer? getById(String id) {
    return _retailers.firstWhere((r) => r.id == id, orElse: () => _retailers.first);
  }
}