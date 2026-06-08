import 'package:flutter/material.dart';

import '../services/huhu_api.dart';
import '../services/store_url_launcher.dart';
import '../services/ui_strings.dart';

class PrivacyScreen extends StatefulWidget {
  const PrivacyScreen({
    super.key,
    required this.api,
    required this.characterId,
    this.onAccountDeleted,
  });

  final HuhuApi api;
  final String characterId;
  final VoidCallback? onAccountDeleted;

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  bool _busy = false;
  String? _supportReminder;
  Map<String, String>? _storeUrls;
  List<Map<String, dynamic>> _memories = [];
  final _u = UiStrings.instance;

  @override
  void initState() {
    super.initState();
    _loadSupportResources();
    _loadStoreUrls();
    _loadMemories();
  }

  Future<void> _loadStoreUrls() async {
    try {
      final me = await widget.api.getMe();
      final loc = me['locale'] as String?;
      final config = await widget.api.getClientConfig(locale: loc);
      final urls = config['storeUrls'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        if (urls == null) {
          _storeUrls = null;
          return;
        }
        _storeUrls = {
          'support': urls['support'] as String? ?? '',
          'privacy': urls['privacy'] as String? ?? '',
        };
      });
    } catch (_) {}
  }

  Future<void> _openStoreUrl(String? url) async {
    final ok = await openStoreUrl(url);
    if (!mounted || ok) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_u.t('actionFailed'))),
    );
  }

  Future<void> _loadMemories() async {
    try {
      final items = await widget.api.listMemories(widget.characterId);
      if (!mounted) return;
      setState(() => _memories = items);
    } catch (_) {
      if (!mounted) return;
      setState(() => _memories = []);
    }
  }

  Future<void> _loadSupportResources() async {
    try {
      final me = await widget.api.getMe();
      final loc = me['locale'] as String?;
      final resources = await widget.api.getSupportResources(locale: loc);
      if (!mounted) return;
      setState(() {
        _supportReminder = resources['privacyReminder'] as String?;
      });
    } catch (_) {}
  }

  Future<void> _confirm(
    String titleKey,
    String messageKey,
    Future<void> Function() action,
  ) async {
    final title = _u.t(titleKey);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(_u.t(messageKey)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(_u.t('cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_u.t('confirm')),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_u.t('actionDone', vars: {'action': title})),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${_u.t('actionFailed')}：$e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_u.t('privacyData'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            _u.t('privacyIntro'),
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (_supportReminder != null && _supportReminder!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              _supportReminder!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.secondary,
                  ),
            ),
          ],
          const SizedBox(height: 16),
          Text(
            _u.t('memoryFragmentsTitle'),
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          if (_memories.isEmpty)
            Text(
              _u.t('memoryFragmentsEmpty'),
              style: Theme.of(context).textTheme.bodySmall,
            )
          else
            ..._memories.map(
              (m) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(
                    m['preview']?.toString() ?? '',
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: _u.t('memoryDeleteBtn'),
                    onPressed: _busy
                        ? null
                        : () => _confirm(
                              'memoryDeleteBtn',
                              'memoryDeleteConfirm',
                              () async {
                                await widget.api.deleteMemory(
                                  widget.characterId,
                                  m['id'] as String,
                                );
                                await _loadMemories();
                              },
                            ),
                  ),
                ),
              ),
            ),
          if (_storeUrls != null) ...[
            const SizedBox(height: 24),
            if (_storeUrls!['privacy']?.isNotEmpty == true)
              OutlinedButton.icon(
                onPressed:
                    _busy ? null : () => _openStoreUrl(_storeUrls!['privacy']),
                icon: const Icon(Icons.open_in_new),
                label: Text(_u.t('openPrivacyPolicy')),
              ),
            if (_storeUrls!['support']?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed:
                    _busy ? null : () => _openStoreUrl(_storeUrls!['support']),
                icon: const Icon(Icons.support_agent_outlined),
                label: Text(_u.t('openSupportPage')),
              ),
            ],
          ],
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _confirm(
                      'resetRelationshipTitle',
                      'resetRelationshipMsg',
                      () => widget.api.resetRelationship(widget.characterId),
                    ),
            child: Text(_u.t('resetRelationshipBtn')),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _confirm(
                      'clearRagTitle',
                      'clearRagMsg',
                      () async {
                        await widget.api.clearMemories(widget.characterId);
                        await _loadMemories();
                      },
                    ),
            child: Text(_u.t('clearRagBtn')),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _busy
                ? null
                : () => _confirm(
                      'clearMessagesTitle',
                      'clearMessagesMsg',
                      () => widget.api.clearMessages(widget.characterId),
                    ),
            child: Text(_u.t('clearMessagesBtn')),
          ),
          const SizedBox(height: 12),
          FilledButton.tonal(
            onPressed: _busy
                ? null
                : () => _confirm(
                      'deleteAccountTitle',
                      'deleteAccountMsg',
                      () async {
                        await widget.api.deleteAccountData();
                        widget.onAccountDeleted?.call();
                        if (context.mounted) {
                          Navigator.of(context).popUntil((r) => r.isFirst);
                        }
                      },
                    ),
            child: Text(_u.t('deleteAccountBtn')),
          ),
        ],
      ),
    );
  }
}
