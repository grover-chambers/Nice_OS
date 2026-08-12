import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/retailer_provider.dart';
import '../providers/sync_provider.dart';
import '../widgets/sync_badge.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final sync = context.watch<SyncProvider>();
    final retailer = context.watch<RetailerProvider>().currentRetailer;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Today'),
        actions: [
          syncBadge(context),
          const Icon(Icons.logout),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // KPI Cards
              const KPICard(
                title: 'Coverage',
                value: '84%',
                subtitle: '7 of 12 territories active',
              ),
              const KPICard(
                title: 'Today\'s Visits',
                value: '3 of 5',
                subtitle: '2 completed, 1 pending',
              ),
              const SizedBox(height: 24),
              
              // Route card
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today),
                      const SizedBox(width: 8),
                      Text(
                        'Route: Wanjiru Route',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      Text(
                        '3/12 stops visited',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Retailer list
              const Text(
                'Today\'s Retailers',
                style: TextStyle(fontWeight: FontSize: 18, color: Colors.grey),
              ),
              const RetailerList(),
              const SizedBox(height: 24),
              
              // Sync status
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Sync Status',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '3 pending · Last sync: 2 min ago',
                        style: TextStyle(color: Colors.grey),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        child: const Text('Force Sync'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/check-in'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class KPICard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;

  const KPICard({
    required this.title,
    required this.value,
    required this.subtitle,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: Colors.grey)),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      );
    }
  }
}

class RetailerList extends StatelessWidget {
  const RetailerList({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 3, // placeholder
      itemBuilder: (context, index) {
        return ListTile(
          leading: const Icon(Icons.store),
          title: const Text('Wanjiru Kiosk'),
          subtitle: const Text('Tier A, duka'),
          trailing: const Icon(Icons.arrow_right_alt),
        );
      },
    );
  }
}