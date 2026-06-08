import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../services/huhu_api.dart';
import '../services/iap_purchase_service.dart';
import '../services/store_url_launcher.dart';
import '../services/ui_strings.dart';
import '../widgets/friends_panel.dart';
import 'privacy_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.api,
    this.characterId,
  });

  final HuhuApi api;
  final String? characterId;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _apiController = TextEditingController();
  final _displayNameController = TextEditingController();
  bool _saving = false;
  Map<String, dynamic>? _profile;
  String? _profileError;
  List<Map<String, dynamic>> _locales = [];
  String? _uiLocale;
  late final IapPurchaseService _iap = IapPurchaseService(widget.api);
  bool? _storeAvailable;
  String? _iapStatusLine;
  String? _economyRulesLine;
  String? _supportSummaryLine;
  List<Map<String, dynamic>> _coinPacks = [];
  Map<String, dynamic>? _catalogPricing;
  final Map<String, Map<String, dynamic>> _subscriptionTierEntitlements = {};
  final Map<String, String> _subscriptionTierLabels = {};
  final Map<String, String> _subscriptionTierDisplayNames = {};
  String? _subscriptionTiersPrompt;
  Map<String, String>? _storeUrls;

  @override
  void initState() {
    super.initState();
    _apiController.text = widget.api.baseUrl;
    _loadProfile();
    _loadLocales();
    _checkStore();
    _loadIapStatus();
    _loadEconomyRules();
    _loadSubscriptionTierCatalog();
    _iap.syncProductCatalog();
  }

  Future<void> _loadSubscriptionTierCatalog() async {
    final locale = _uiLocale ?? _profile?['locale'] as String? ?? 'zh-TW';
    try {
      final config = await widget.api.getClientConfig(locale: locale);
      final prompt = config['subscriptionTiersPrompt'] as String?;
      final tiers = config['subscriptionTiers'] as List<dynamic>? ?? [];
      final entMap = <String, Map<String, dynamic>>{};
      final labelMap = <String, String>{};
      final displayMap = <String, String>{};
      for (final row in tiers) {
        final m = row as Map<String, dynamic>;
        final tier = m['tier'] as String?;
        final ent = m['entitlements'] as Map<String, dynamic>?;
        final label = m['entitlementsLabel'] as String?;
        final display = m['tierDisplayName'] as String?;
        if (tier != null && ent != null) entMap[tier] = ent;
        if (tier != null && label != null && label.isNotEmpty) {
          labelMap[tier] = label;
        }
        if (tier != null && display != null && display.isNotEmpty) {
          displayMap[tier] = display;
        }
      }
      final urls = config['storeUrls'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _subscriptionTierEntitlements
          ..clear()
          ..addAll(entMap);
        _subscriptionTierLabels
          ..clear()
          ..addAll(labelMap);
        _subscriptionTierDisplayNames
          ..clear()
          ..addAll(displayMap);
        _subscriptionTiersPrompt =
            prompt != null && prompt.isNotEmpty ? prompt : null;
        if (urls != null) {
          _storeUrls = {
            'support': urls['support'] as String? ?? '',
            'privacy': urls['privacy'] as String? ?? '',
          };
        }
      });
      final apiErrors = config['apiErrors'] as Map<String, dynamic>?;
      if (apiErrors != null) {
        UiStrings.instance.setApiErrors(
          apiErrors.map((k, v) => MapEntry(k, v.toString())),
        );
      }
    } catch (_) {}
  }

  String _formatTierEntitlements(Map<String, dynamic>? ent) {
    if (ent == null) return '';
    final u = UiStrings.instance;
    final parts = <String>[];
    if (ent['unlimitedStamina'] == true) {
      parts.add(u.t('tierEntUnlimitedStamina'));
    }
    if (ent['voice'] == true) {
      parts.add(u.t('tierEntVoice'));
    }
    final mem = ent['memoryRetrievalLimit'];
    final tok = ent['maxReplyTokens'];
    if (mem is num) {
      parts.add(u.t('tierEntMemory', vars: {'n': '$mem'}));
    }
    if (tok is num) {
      parts.add(u.t('tierEntReply', vars: {'n': '$tok'}));
    }
    final chars = ent['maxCharacters'];
    if (chars is num) {
      parts.add(u.t('tierEntCharacters', vars: {'n': '$chars'}));
    }
    if (ent['premiumContent'] == true) {
      parts.add(u.t('tierEntPremium'));
    }
    return parts.join(' · ');
  }

  Future<void> _loadEconomyRules() async {
    try {
      final e = await widget.api.getMetaEconomy();
      if (!mounted) return;
      setState(() => _economyRulesLine = _formatEconomyRules(e));
    } catch (_) {}
  }

  Future<void> _loadSupportResources() async {
    final locale = _uiLocale ?? _profile?['locale'] as String? ?? 'zh-TW';
    try {
      final resources = await widget.api.getSupportResources(locale: locale);
      if (!mounted) return;
      final crisis = resources['crisis'] as Map<String, dynamic>?;
      final lines = (crisis?['lines'] as List<dynamic>?)?.cast<String>() ?? [];
      setState(() {
        _supportSummaryLine = lines.isNotEmpty
            ? lines.first
            : resources['privacyReminder'] as String?;
      });
    } catch (_) {}
  }

  Future<void> _openStoreUrl(String? url) async {
    final ok = await openStoreUrl(url);
    if (!mounted || ok) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(UiStrings.instance.t('actionFailed'))),
    );
  }

  Future<void> _showSupportDialog() async {
    final locale = _uiLocale ?? _profile?['locale'] as String? ?? 'zh-TW';
    final u = UiStrings.instance;
    try {
      final resources = await widget.api.getSupportResources(locale: locale);
      if (!mounted) return;
      final crisis = resources['crisis'] as Map<String, dynamic>?;
      final wellness = resources['wellness'] as Map<String, dynamic>?;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(u.t('supportResources')),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (resources['privacyReminder'] != null) ...[
                  Text(resources['privacyReminder'] as String),
                  const SizedBox(height: 12),
                ],
                if (crisis != null) ...[
                  Text(
                    crisis['title'] as String? ?? '',
                    style: Theme.of(ctx).textTheme.titleSmall,
                  ),
                  for (final line in (crisis['lines'] as List<dynamic>? ?? [])
                      .cast<String>())
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(line),
                    ),
                  const SizedBox(height: 12),
                ],
                if (wellness != null) ...[
                  Text(
                    wellness['title'] as String? ?? '',
                    style: Theme.of(ctx).textTheme.titleSmall,
                  ),
                  for (final line in (wellness['lines'] as List<dynamic>? ?? [])
                      .cast<String>())
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(line),
                    ),
                ],
              ],
            ),
          ),
          actions: [
            if (_storeUrls?['support']?.isNotEmpty == true)
              TextButton(
                onPressed: () => _openStoreUrl(_storeUrls!['support']),
                child: Text(u.t('openSupportPage')),
              ),
            if (_storeUrls?['privacy']?.isNotEmpty == true)
              TextButton(
                onPressed: () => _openStoreUrl(_storeUrls!['privacy']),
                child: Text(u.t('openPrivacyPolicy')),
              ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(u.t('cancel')),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  Future<void> _loadStoreCatalog() async {
    final locale = _uiLocale ?? _profile?['locale'] as String? ?? 'zh-TW';
    try {
      final data = await widget.api.getStoreCatalog(locale: locale);
      final catalog = data['catalog'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _coinPacks = (catalog?['coinPacks'] as List<dynamic>?)
                ?.map((e) => Map<String, dynamic>.from(e as Map))
                .toList() ??
            [];
        _catalogPricing = catalog?['pricing'] as Map<String, dynamic>?;
      });
    } catch (_) {}
  }

  String _coinPackLabel(String pack) {
    for (final p in _coinPacks) {
      if (p['pack'] == pack) {
        return '+${p['coins']} · ${p['price']} ${p['currency']}';
      }
    }
    const fallback = {'small': '50', 'medium': '150', 'large': '400'};
    return fallback[pack] ?? pack;
  }

  String _localTierName(String tier) {
    switch (tier) {
      case 'lite':
        return UiStrings.instance.t('tierNameLite');
      case 'basic':
        return UiStrings.instance.t('tierNameBasic');
      case 'premium':
        return UiStrings.instance.t('tierNamePremium');
      default:
        return tier;
    }
  }

  String _tierLabel(String tier) {
    final name = _subscriptionTierDisplayNames[tier] ?? _localTierName(tier);
    final ent = _subscriptionTierLabels[tier] ??
        _formatTierEntitlements(_subscriptionTierEntitlements[tier]);
    final p = _catalogPricing;
    if (p == null) return ent.isNotEmpty ? '$name · $ent' : name;
    final price = p[tier];
    final currency = p['currency'];
    if (price != null && currency != null) {
      final base = '$name · $price $currency';
      return ent.isNotEmpty ? '$base · $ent' : base;
    }
    return ent.isNotEmpty ? '$name · $ent' : name;
  }

  String _formatEconomyRules(Map<String, dynamic> e) {
    final s = e['stamina'] as Map<String, dynamic>?;
    final c = e['coins'] as Map<String, dynamic>?;
    final recoverMin =
        (((s?['recoverIntervalMs'] as num?) ?? 600000) / 60000).round();
    final lines = <String>[
      '${UiStrings.instance.t('economyRulesTitle')}:',
      '${UiStrings.instance.t('stamina')} ${s?['max'] ?? 50} max, '
          'text -${s?['costText'] ?? 1}, voice -${s?['costVoice'] ?? 3}, '
          'image -${s?['costImage'] ?? 2}, +1/$recoverMin min',
      '${UiStrings.instance.t('coins')}: long -${c?['longMode'] ?? 5}, '
          'exciting -${c?['excitingMode'] ?? 10}, '
          'check-in +${c?['dailyCheckin'] ?? 5}',
    ];
    return lines.join('\n');
  }

  Future<void> _loadIapStatus() async {
    try {
      final data = await widget.api.getIapReadiness();
      final r = data['readiness'] as Map<String, dynamic>?;
      if (r == null || !mounted) return;
      final ios = (r['ios'] as Map<String, dynamic>?)?['configured'] == true;
      final androidMap = r['android'] as Map<String, dynamic>?;
      final androidPlay = androidMap?['playApi'] == true;
      final androidPkg = androidMap?['packageName'] == true;
      final androidLabel =
          androidPlay ? '✓' : (androidPkg ? '~' : '—');
      setState(() {
        _iapStatusLine =
            'Store IAP: iOS ${ios ? '✓' : '—'} · Android $androidLabel';
      });
    } catch (_) {}
  }

  Future<void> _checkStore() async {
    final ok = await _iap.storeAvailable;
    if (!mounted) return;
    setState(() => _storeAvailable = ok);
  }

  Future<void> _loadLocales() async {
    try {
      final list = await widget.api.getLocales();
      if (!mounted) return;
      setState(() => _locales = list);
    } catch (_) {}
  }

  Future<void> _loadProfile() async {
    try {
      final me = await widget.api.getMe();
      final loc = me['locale'] as String?;
      if (loc != null && loc.isNotEmpty) {
        await UiStrings.instance.load(widget.api.baseUrl, locale: loc);
      }
      if (!mounted) return;
      setState(() {
        _profile = me;
        _uiLocale = loc ?? UiStrings.instance.locale;
        _profileError = null;
        _displayNameController.text =
            me['displayName'] as String? ?? '';
      });
      await _loadStoreCatalog();
      await _loadSupportResources();
      await _loadSubscriptionTierCatalog();
    } catch (e) {
      if (!mounted) return;
      setState(() => _profileError = e.toString());
    }
  }

  Future<void> _changeLocale(String locale) async {
    setState(() => _saving = true);
    try {
      await widget.api.patchLocale(locale);
      await UiStrings.instance.load(widget.api.baseUrl, locale: locale);
      if (!mounted) return;
      setState(() => _uiLocale = locale);
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _iap.dispose();
    _apiController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  String _formatPlanSummary(Map<String, dynamic>? me) {
    if (me == null) return '';
    final plan = me['plan'] as Map<String, dynamic>?;
    if (plan == null) return '';
    final tierRaw = me['subscriptionTier'] ?? plan['tier'] ?? 'free';
    final tier = (me['subscriptionTierDisplayName'] as String?) ??
        (tierRaw == 'free'
            ? UiStrings.instance.t('tierNameFree')
            : (_subscriptionTierDisplayNames[tierRaw as String] ?? tierRaw));
    final pricing = plan['pricing'] as Map<String, dynamic>?;
    final region = plan['pricingRegion'] ?? '';
    final expires = plan['subscriptionExpiresAt'] as String?;
    final expired = plan['subscriptionExpired'] == true;
    final days = plan['subscriptionDaysRemaining'];
    final expiryText = expires == null
        ? ''
        : expired
            ? UiStrings.instance.t('subscriptionExpired')
            : (days != null && (days as num) > 0)
                ? UiStrings.instance.t('daysRemaining', vars: {'days': '$days'})
                : '';
    final priceText = pricing == null
        ? ''
        : '\n${UiStrings.instance.t('subscribePppHint', vars: {
            'region': '$region',
            'lite': _subscriptionTierDisplayNames['lite'] ?? _localTierName('lite'),
            'litePrice': '${pricing['lite']}',
            'basic': _subscriptionTierDisplayNames['basic'] ?? _localTierName('basic'),
            'basicPrice': '${pricing['basic']}',
            'premium':
                _subscriptionTierDisplayNames['premium'] ?? _localTierName('premium'),
            'premiumPrice': '${pricing['premium']}',
            'currency': '${pricing['currency']}',
          })}';
    final ent = plan['entitlements'] as Map<String, dynamic>?;
    final entLabel = ent == null ? '' : _formatTierEntitlements(ent);
    final entText = entLabel.isEmpty ? '' : '\n$entLabel';
    return '${UiStrings.instance.t('plan')} $tier$expiryText$priceText$entText';
  }

  Future<void> _saveApiBase() async {
    final nextBase = _apiController.text.trim();
    if (kReleaseMode && isLocalDevApiUrl(nextBase)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Release 版請使用 $kProductionApiBaseUrl',
          ),
        ),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('huhu_api_base', nextBase);
      widget.api.baseUrl = nextBase;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(UiStrings.instance.t('saveApiHint'))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _dailyCheckin() async {
    try {
      final r = await widget.api.claimDailyCheckin();
      if (!mounted) return;
      final coins = '${r['coinsAwarded']}';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            UiStrings.instance.t('dailyCheckinReward', vars: {'coins': coins}),
          ),
        ),
      );
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${UiStrings.instance.t('checkinFailed')}：$msg')),
      );
    }
  }

  Future<void> _claimOfferwall() async {
    setState(() => _saving = true);
    try {
      final r = await widget.api.claimOfferwall();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            UiStrings.instance.t(
              'offerwallReward',
              vars: {'coins': '${r['coinsAwarded']}'},
            ),
          ),
        ),
      );
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _subscribe(String tier) async {
    setState(() => _saving = true);
    try {
      final r = await _iap.purchaseSubscription(tier);
      if (!mounted) return;
      final economy = r['economy'] as Map<String, dynamic>?;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${_localTierName(tier)} · ${economy?['coins'] ?? '-'}',
          ),
        ),
      );
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${UiStrings.instance.t('subscribeFailed')}：$msg'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openFriends() async {
    await showHuhuFriendsDialog(context, api: widget.api);
  }

  Future<void> _saveDisplayName() async {
    final name = _displayNameController.text.trim();
    if (name.isEmpty) return;
    setState(() => _saving = true);
    try {
      await widget.api.patchDisplayName(name);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(UiStrings.instance.t('displayNameSaved'))),
      );
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString().contains('invalid_display_name')
          ? UiStrings.instance.t('invalidDisplayName')
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _buyCoins(String pack) async {
    setState(() => _saving = true);
    try {
      final r = await _iap.purchaseCoins(pack);
      if (!mounted) return;
      final economy = r['economy'] as Map<String, dynamic>?;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${UiStrings.instance.t('coins')}: ${economy?['coins'] ?? '-'}',
          ),
        ),
      );
      await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${UiStrings.instance.t('subscribeFailed')}：$msg'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _restorePurchases() async {
    setState(() => _saving = true);
    try {
      final count = await _iap.restorePurchases();
      if (!mounted) return;
      final msg = count > 0
          ? UiStrings.instance.t(
              'restorePurchasesDone',
              vars: {'count': '$count'},
            )
          : UiStrings.instance.t('restorePurchasesNone');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg)),
      );
      if (count > 0) await _loadProfile();
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : '$e';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${UiStrings.instance.t('restorePurchasesFailed')}：$msg',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = UiStrings.instance;
    return Scaffold(
      appBar: AppBar(title: Text(u.t('settings'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_profileError != null)
            Text(
              _profileError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            )
          else if (_profile != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatPlanSummary(_profile),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    if (_iapStatusLine != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _iapStatusLine!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                    if (_economyRulesLine != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _economyRulesLine!,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          const SizedBox(height: 8),
          TextField(
            controller: _displayNameController,
            maxLength: 32,
            decoration: InputDecoration(
              labelText: u.t('displayNameLabel'),
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 4),
          OutlinedButton(
            onPressed: _saving ? null : _saveDisplayName,
            child: Text(u.t('save')),
          ),
          if (_locales.isNotEmpty && _uiLocale != null) ...[
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              initialValue: _uiLocale,
              decoration: InputDecoration(
                labelText: u.t('localeLabel'),
                border: const OutlineInputBorder(),
              ),
              items: [
                for (final l in _locales)
                  DropdownMenuItem<String>(
                    value: l['id'] as String,
                    child: Text(l['label'] as String? ?? l['id'] as String),
                  ),
              ],
              onChanged: _saving ? null : (v) => v != null ? _changeLocale(v) : null,
            ),
          ],
          const SizedBox(height: 8),
          TextField(
            controller: _apiController,
            decoration: InputDecoration(
              labelText: u.t('apiBaseUrl'),
              hintText: 'http://10.0.2.2:3000',
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _saving ? null : _saveApiBase,
            child: Text(_saving ? u.t('saving') : u.t('save')),
          ),
          const Divider(height: 32),
          ListTile(
            title: Text(u.t('friendsBtn')),
            trailing: const Icon(Icons.chevron_right),
            onTap: _saving ? null : _openFriends,
          ),
          ListTile(
            title: Text(u.t('supportResources')),
            subtitle: _supportSummaryLine != null
                ? Text(
                    _supportSummaryLine!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  )
                : null,
            trailing: const Icon(Icons.chevron_right),
            onTap: _saving ? null : _showSupportDialog,
          ),
          OutlinedButton(
            onPressed: _dailyCheckin,
            child: Text(u.t('dailyCheckin')),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: _saving ? null : _claimOfferwall,
            child: Text(u.t('offerwall')),
          ),
          if (widget.characterId != null) ...[
            const Divider(height: 32),
            ListTile(
              title: Text(u.t('privacyData')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PrivacyScreen(
                      api: widget.api,
                      characterId: widget.characterId!,
                    ),
                  ),
                );
              },
            ),
            OutlinedButton(
              onPressed: () async {
                try {
                  final md = await widget.api.exportConversation(
                    widget.characterId!,
                  );
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        u.t('exportSuccess', vars: {'chars': '${md.length}'}),
                      ),
                    ),
                  );
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${u.t('exportFailed')}：$e'),
                    ),
                  );
                }
              },
              child: Text(u.t('exportChat')),
            ),
          ],
          const Divider(height: 32),
          Text(u.t('subscribe'), style: Theme.of(context).textTheme.titleMedium),
          if (_subscriptionTiersPrompt != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 8),
              child: Text(
                _subscriptionTiersPrompt!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          if (_storeAvailable != null)
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 8),
              child: Text(
                _storeAvailable == true
                    ? 'App Store / Google Play'
                    : u.t('devSubscribe'),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final tier in ['lite', 'basic', 'premium'])
                OutlinedButton(
                  onPressed: _saving ? null : () => _subscribe(tier),
                  child: Text(_tierLabel(tier)),
                ),
            ],
          ),
          if (_storeAvailable == true) ...[
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _saving ? null : _restorePurchases,
              child: Text(u.t('restorePurchases')),
            ),
          ],
          const SizedBox(height: 16),
          Text(u.t('coins'), style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final pack in ['small', 'medium', 'large'])
                OutlinedButton(
                  onPressed: _saving ? null : () => _buyCoins(pack),
                  child: Text(_coinPackLabel(pack)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
