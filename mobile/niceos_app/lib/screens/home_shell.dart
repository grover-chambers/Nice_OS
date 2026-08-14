import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../domain/typology.dart';
import '../models/outlet_model.dart';
import '../providers/census_provider.dart';
import '../providers/intercept_provider.dart';
import 'consumer_intercept_flow.dart';
import 'outlet_census_flow.dart';
import 'submissions_screen.dart';
import 'today_screen.dart';

/// Home shell: Today | Census | Intercepts | Submissions.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CensusProvider>().init();
      context.read<InterceptProvider>().init();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [
          TodayScreen(),
          CensusTab(),
          InterceptTab(),
          SubmissionsScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.today),
            label: 'Today',
          ),
          NavigationDestination(
            icon: Icon(Icons.storefront),
            label: 'Census',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            label: 'Intercepts',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            label: 'Submissions',
          ),
        ],
      ),
    );
  }
}

class CensusTab extends StatelessWidget {
  const CensusTab({super.key});

  @override
  Widget build(BuildContext context) {
    final census = context.watch<CensusProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Outlet Census'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${census.todayCount} today',
                style: const TextStyle(color: Colors.grey),
              ),
            ),
          ),
        ],
      ),
      body: census.capturedOutlets.isEmpty
          ? const Center(child: Text('No outlets captured yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: census.capturedOutlets.length,
              itemBuilder: (ctx, i) => _OutletTile(outlet: census.capturedOutlets[i]),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          census.resetDraft();
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const OutletCensusFlow()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('New Census'),
      ),
    );
  }
}

class _OutletTile extends StatelessWidget {
  final OutletModel outlet;
  const _OutletTile({required this.outlet});

  @override
  Widget build(BuildContext context) {
    final d = DateFormat('dd MMM HH:mm');
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: CircleAvatar(
          child: Icon(outlet.channel == Channel.traditionalTrade
              ? Icons.storefront
              : Icons.store),
        ),
        title: Text(outlet.businessName),
        subtitle: Text(
          '${outlet.channel.label} · ${outlet.outletType.label}\n'
          '${outlet.ward} · ${d.format(outlet.createdAt.toLocal())}',
        ),
        isThreeLine: true,
        trailing: const Icon(Icons.check_circle, color: Colors.green),
      ),
    );
  }
}

class InterceptTab extends StatelessWidget {
  const InterceptTab({super.key});

  @override
  Widget build(BuildContext context) {
    final intercepts = context.watch<InterceptProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Consumer Intercepts'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '${intercepts.todayCount} today',
                style: const TextStyle(color: Colors.grey),
              ),
            ),
          ),
        ],
      ),
      body: intercepts.capturedIntercepts.isEmpty
          ? const Center(child: Text('No intercepts captured yet'))
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: intercepts.capturedIntercepts.length,
              itemBuilder: (ctx, i) {
                final it = intercepts.capturedIntercepts[i];
                final d = DateFormat('dd MMM HH:mm');
                return Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                    title: Text('${it.ward} · ${it.channelContextCode}'),
                    subtitle: Text(
                      'Household ${it.householdSizeBand ?? '—'} · '
                      'unaided ${it.unaidedBrandsAware.length} · '
                      'aided ${it.aidedBrandsAware.length}\n'
                      '${d.format(it.capturedAt.toLocal())}',
                    ),
                    isThreeLine: true,
                    trailing: const Icon(Icons.check_circle, color: Colors.green),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ConsumerInterceptFlow()),
        ),
        icon: const Icon(Icons.add),
        label: const Text('New Intercept'),
      ),
    );
  }
}
