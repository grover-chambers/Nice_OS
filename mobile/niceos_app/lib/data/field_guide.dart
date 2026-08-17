library;

/// Field Officer content for the NiceOS app.
/// Field Officer Handbook + individual Field Officer Sheets (13 Aug 2026).
/// This is the content reps carry in the field; it ships with the app so it
/// works offline.

/// Cluster codes: zone -> cluster metadata for the five Market Link clusters.
class ClusterMeta {
  final String code;
  final String name;
  final String lead;
  final bool leadConfirmed;
  final List<String> areas;
  final String localNote;

  const ClusterMeta({
    required this.code,
    required this.name,
    required this.lead,
    required this.leadConfirmed,
    required this.areas,
    required this.localNote,
  });
}

const Map<String, ClusterMeta> kClusters = {
  'Central & CBD': ClusterMeta(
    code: 'ML·C1',
    name: 'Central & CBD',
    lead: 'C1 Cluster Lead',
    leadConfirmed: false,
    areas: [
      'CBD', 'River Road', 'Gikomba', 'Kamukunji', 'Ngara', 'Pangani',
      'Eastleigh', 'Huruma', 'Mathare', 'Korogocho', 'Dandora',
    ],
    localNote:
        'Highest outlet density in Nairobi — work building by building. '
        'Markets (Gikomba, Kamukunji) are busiest early morning and on '
        'market days; schedule them accordingly.',
  ),
  'Northern Belt': ClusterMeta(
    code: 'ML·C2',
    name: 'Northern Belt',
    lead: 'Martin Mutuku',
    leadConfirmed: true,
    areas: [
      'Kasarani', 'Githurai 44 & 45', 'Mwiki', 'Zimmerman', 'Roysambu',
      'Kahawa West', 'Sukari', 'Wendani', 'Thome', 'Garden Estate',
      'Kiambu Road',
    ],
    localNote:
        'Mixed informal and estate trade. Githurai and Mwiki have high '
        'turnover of small dukas; Garden Estate and Kahawa are newer shops — '
        'ask how long they have been open.',
  ),
  'Eastern Corridor': ClusterMeta(
    code: 'ML·C3',
    name: 'Eastern Corridor',
    lead: 'Nicole Githui',
    leadConfirmed: true,
    areas: [
      'Jogoo Road', 'Buruburu', 'Umoja 1 & 2', 'Kayole', 'Komarock',
      'Donholm', 'Kariobangi South', 'Njiru', 'Chokaa', 'Utawala',
      'Mihang\'o',
    ],
    localNote:
        'More small outlets per street than anywhere else — the risk is '
        'counting the same shop twice. Work one side of the street out, the '
        'other side back. Never criss-cross. Shops open monthly in Utawala '
        'and Mihang\'o.',
  ),
  'South & West': ClusterMeta(
    code: 'ML·C4',
    name: 'South & West',
    lead: 'Raphael Kenyatta',
    leadConfirmed: true,
    areas: [
      'Pipeline', 'Embakasi', 'Tassia', 'South B & C', 'Nairobi West',
      'Lang\'ata', 'Kibra', 'Dagoretti', 'Kawangware', 'Westlands',
      'Kangemi',
    ],
    localNote:
        'Two different markets: Pipeline and Kibra are vertical and informal '
        '(work building by building); Westlands and South C are modern trade '
        '— phone and book a time with the branch manager, never approach '
        'shelf staff.',
  ),
  'Thika': ClusterMeta(
    code: 'ML·T1',
    name: 'Thika Regional Base',
    lead: 'Sophie Mbaika',
    leadConfirmed: true,
    areas: [
      'Thika Town', 'Makongeni', 'Ngoingwa', 'Kiganjo', 'Landless',
      'Witeithie', 'Juja', 'Kalimoni', 'Ruiru', 'Kimbo', 'Membley',
    ],
    localNote:
        'A resident base, not a route sweep: start and end in Thika Town and '
        'run one spoke at a time (Superhighway, Garissa Road, Gatundu, '
        'Kilimambogo). Register wholesalers before dukas — flour trade '
        'concentrates through wholesale points.',
  ),
};

/// Per-rep daily targets (from the Field Brief: "The numbers you are held to").
class RepNumbers {
  final int outletsPerDay;
  final int workingBandLow;
  final int workingBandHigh;
  final int coverageDaysPerWave;
  final int perWave;
  final int programmeTotal;

  const RepNumbers({
    required this.outletsPerDay,
    required this.workingBandLow,
    required this.workingBandHigh,
    required this.coverageDaysPerWave,
    required this.perWave,
    required this.programmeTotal,
  });
}

const RepNumbers kRepNumbers = RepNumbers(
  outletsPerDay: 30,
  workingBandLow: 20,
  workingBandHigh: 40,
  coverageDaysPerWave: 24,
  perWave: 720,
  programmeTotal: 1440,
);

/// One section of the Field Guide.
class GuideSection {
  final String title;
  final List<GuideBlock> blocks;

  const GuideSection(this.title, this.blocks);
}

/// A block inside a section. [kind] drives the visual: `clock` for time rows,
/// `quote` for scripts, `rules` for the seven rules, `two` for the
/// always/never columns, `rows` for plain key/value lists.
class GuideBlock {
  final String kind;
  final String label;
  final String body;
  final List<(String, String)> rows;

  const GuideBlock({
    this.kind = 'rows',
    this.label = '',
    this.body = '',
    this.rows = const [],
  });
}

/// The handbook, distilled for the phone. Source: Field Officer Handbook v1.0
/// (13 Aug 2026), Market Link — a Playmax project, for Nice Millers Ltd.
const List<GuideSection> kFieldGuide = [
  GuideSection('What the job is', [
    GuideBlock(
      body:
          'You are building a register of every shop that sells flour across '
          'Nairobi, Kiambu and the Kajiado towns — a verified record with its '
          'exact location, who runs it, what it stocks, and how much it moves.\n\n'
          'You are not selling. You take nothing, offer nothing, promise '
          'nothing.\n\n'
          'A wrong record is worse than a missing one. A guessed shop is '
          'invisible and corrupts everything built on top of it.',
    ),
  ]),
  GuideSection('Your numbers', [
    GuideBlock(
      kind: 'rows',
      rows: [
        ('Target per day', '30 outlets · working band 20–40'),
        ('Coverage days', '6 per week (Mon–Sat)'),
        ('Days per wave', '24 (4 weeks)'),
        ('Per wave', '720 outlets'),
        ('Programme total', '1,440 across both waves'),
      ],
    ),
    GuideBlock(
      body:
          'The margin is thin. At 26 outlets a day instead of 30 the programme '
          'misses its number. That is why the midday count exists — it catches '
          'a slow day while there is still afternoon left to fix it.',
    ),
  ]),
  GuideSection('Your day', [
    GuideBlock(
      kind: 'clock',
      rows: [
        ('06:45', 'Kit check — phone past 90%, power bank, paper forms, ID and vest. At home, not at the first shop.'),
        ('07:15', 'Morning brief — your lead posts the area, the split and your count target.'),
        ('07:45 – 13:00', 'Block A — 18–22 outlets. One side of the street out, the other back. Pin every outlet standing in front of it.'),
        ('13:00 – 13:45', 'Break + midday count — post your running count. If you are behind, say so now.'),
        ('13:45 – 17:15', 'Block B — 10–14 outlets. Keep the last hour for shops closed or busy this morning.'),
        ('17:15 – 18:00', 'Evening review — sync everything, fix flagged records, log revisits, file your report.'),
        ('18:00', 'Close — everything synced. No backlog past 24 hours.'),
      ],
    ),
    GuideBlock(
      body:
          'The evening review is the part people quietly skip — and the part '
          'that makes the six-day week work. Skip it three days running and '
          'your lead is clearing your flags instead of running the cluster.',
    ),
  ]),
  GuideSection('The eight fields', [
    GuideBlock(
      kind: 'rows',
      rows: [
        ('Location', 'GPS pin captured while standing at the door'),
        ('Identity', 'Shop name and type — duka, kiosk, mini-market, supermarket, wholesaler, eatery, posho mill'),
        ('Contact', 'Owner or manager name and a working phone number'),
        ('Proof', 'Shopfront photo with the signage legible'),
        ('Shelf', 'Flour brands stocked and facings — Nice, Unga, Pembe, Capwell, other'),
        ('Volume', 'Monthly offtake in bales'),
        ('Supply', 'Who supplies them — distributor, wholesaler or direct'),
        ('Landmark', 'Nearest landmark, street or estate name, written out'),
      ],
    ),
    GuideBlock(
      kind: 'quote',
      body:
          'No pin, no record. No photo, no record.\n\n'
          'Neither counts toward your daily total. A record nobody can verify '
          'is worth nothing.',
    ),
  ]),
  GuideSection('Opening the conversation', [
    GuideBlock(
      kind: 'quote',
      body:
          '"Habari yako. My name is ___, I work with Market Link. We are '
          'mapping shops in this area so suppliers can serve you better. It '
          'takes about three minutes — is now okay, or should I come back?"',
    ),
    GuideBlock(
      body:
          'Greet in whatever language they greet you in. Give them a way to '
          'say no. If they say come back, write down when and actually come '
          'back.',
    ),
    GuideBlock(
      kind: 'two',
      label: 'Always',
      body:
          'Wait if they are serving a customer.\n'
          'Ask before you photograph. Every time.\n'
          'Carry your ID and wear the vest.\n'
          'Keep it to three or four minutes.\n'
          'Say thank you and leave well, whether they helped or not.',
    ),
    GuideBlock(
      kind: 'two',
      label: 'Never',
      body:
          'Never promise supply, stock, credit, a distributor visit or a '
          'better price.\n'
          'Never criticise Unga, Pembe, Capwell or any brand.\n'
          'Never argue — about price, politics, anything.\n'
          'Never ask for or accept money, goods or a discount. Not even a '
          'soda.\n'
          'Never enter a back room, store or house.\n'
          'Never invent a record. It will be found, and it ends the '
          'engagement.',
    ),
  ]),
  GuideSection('Fallbacks', [
    GuideBlock(
      kind: 'rows',
      rows: [
        ('Shop is closed', 'Log it as closed with the time. It goes on Saturday\'s revisit list. Never skip silently.'),
        ('Owner away', 'Capture what the attendant can answer, mark attendant-sourced, flag for revisit.'),
        ('They refuse', 'Log the refusal and the reason if offered. Thank them, move on. Never push.'),
        ('Hostile crowd', 'Leave immediately and call your lead. Do not finish the record first.'),
        ('"Are you government?"', 'Show ID. Say you work for Market Link, a private company. Offer your lead\'s number.'),
        ('Police stop you', 'Stay calm, do not argue, do not pay anything. Call Laban immediately.'),
        ('Phone dies', 'Switch to the paper form. Enter everything the same evening.'),
        ('No network', 'Keep capturing offline. Sync when signal returns or at end of day. Never tomorrow.'),
        ('GPS will not lock', 'Step into the open, wait thirty seconds. If still failing, record the landmark and street clearly, flag it, tell your lead.'),
        ('Behind at midday', 'Say so at the 13:00 count. Discovering it at 17:00 is too late.'),
        ('Sick', 'Tell your lead before 07:00, not at 09:00.'),
        ('Phone lost/stolen', 'Report same day to your lead and to Ian. It holds shop data — that matters more than the handset.'),
        ('Asked to work outside your area', 'Do not. Call your lead first. Freelancing creates duplicates and wrecks the count.'),
        ('Wholesaler wants to talk business', 'Take their name and number, say someone will call, pass it to your lead the same day. Negotiate nothing.'),
      ],
    ),
  ]),
  GuideSection('Escalation', [
    GuideBlock(
      kind: 'rows',
      rows: [
        ('Now', 'Anything unsafe, hostile, or involving police — lead, then Laban'),
        ('Same day', 'Phone, app or sync failure; lost device — lead, then Ian'),
        ('Same day', 'Running more than 15% below target — lead'),
        ('Before acting', 'Any request to work outside your cluster — lead'),
        ('24 hours', 'A commercial lead from a wholesaler or retailer — lead, then Laban'),
        ('Before 07:00', 'Illness or any day you cannot work — lead'),
      ],
    ),
    GuideBlock(
      kind: 'quote',
      body:
          'Nothing on this sheet — no target, no count, no deadline — is '
          'worth your safety. If an area feels wrong, leave it and call your '
          'lead. You will not be blamed for stopping.',
    ),
  ]),
];
