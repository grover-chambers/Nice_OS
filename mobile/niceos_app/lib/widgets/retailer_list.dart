import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/retailer_provider.dart';
import '../models/retailer_model.dart';

class RetailerList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final retailers = context.watch<RetailerProvider>().retailers;

    if (retailers.isEmpty) {
      return const Center(child: Text('No retailers in this route'));
    }

    return ListView.builder(
      itemCount: retailers.length,
      itemBuilder: (context, index) {
        final retailer = retailers[index];
        return ListTile(
          title: Text(retailer.name),
          subtitle: Text(retailer.status),
          trailing: Icon(
            retailer.status == 'active'
                ? Icons.check_circle
                : Icons.circle,
            color: retailer.status == 'active'
                ? Colors.green
                : Colors.grey,
          ),
          onTap: () {/* navigate to visit capture */},
        );
      },
    );
  }
}