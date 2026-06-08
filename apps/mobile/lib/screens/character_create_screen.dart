import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/huhu_api.dart';
import '../services/ui_strings.dart';

class CharacterCreateScreen extends StatefulWidget {
  const CharacterCreateScreen({super.key, required this.api});

  final HuhuApi api;

  @override
  State<CharacterCreateScreen> createState() => _CharacterCreateScreenState();
}

class _CharacterCreateScreenState extends State<CharacterCreateScreen> {
  final _name = TextEditingController();
  final _personality = TextEditingController();
  final _backstory = TextEditingController();
  final _speakingStyle = TextEditingController();
  List<Map<String, dynamic>> _presets = [];
  List<Map<String, dynamic>> _locales = [];
  String? _presetId;
  String _locale = 'zh-TW';
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadPresets();
  }

  @override
  void dispose() {
    _name.dispose();
    _personality.dispose();
    _backstory.dispose();
    _speakingStyle.dispose();
    super.dispose();
  }

  Future<void> _loadPresets() async {
    try {
      final results = await Future.wait([
        widget.api.getPresets(),
        widget.api.getLocales(),
        widget.api.getClientConfig(),
      ]);
      _presets = results[0] as List<Map<String, dynamic>>;
      _locales = results[1] as List<Map<String, dynamic>>;
      final config = results[2] as Map<String, dynamic>;
      final apiErrors = config['apiErrors'] as Map<String, dynamic>?;
      if (apiErrors != null) {
        UiStrings.instance.setApiErrors(
          apiErrors.map((k, v) => MapEntry(k, v.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyPreset(String id) {
    Map<String, dynamic>? p;
    for (final row in _presets) {
      if (row['id'] == id) {
        p = row;
        break;
      }
    }
    if (p == null) return;
    _name.text = p['name'] as String? ?? '';
    _personality.text = p['personality'] as String? ?? '';
    _backstory.text = p['backstory'] as String? ?? '';
    _speakingStyle.text = p['speakingStyle'] as String? ?? '';
    final loc = p['locale'] as String?;
    if (loc != null && loc.isNotEmpty) _locale = loc;
  }

  Future<void> _create() async {
    setState(() => _saving = true);
    try {
      final id = _presetId != null && _presetId!.isNotEmpty
          ? await widget.api.createFromPreset(
              _presetId!,
              locale: _locale,
            )
          : await widget.api.createCharacter(
              name: _name.text.trim(),
              personality: _personality.text.trim(),
              backstory: _backstory.text.trim(),
              speakingStyle: _speakingStyle.text.trim(),
              locale: _locale,
            );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('huhu_characterId', id);
      if (!mounted) return;
      Navigator.of(context).pop(id);
    } catch (e) {
      if (!mounted) return;
      final msg = e is HuhuApiException
          ? UiStrings.instance.apiErrorMessage(e.message)
          : e.toString();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${UiStrings.instance.t('createFailed')}：$msg'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(UiStrings.instance.t('createCharacter'))),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                DropdownButtonFormField<String?>(
                  initialValue: _presetId,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('officialPreset'),
                    border: const OutlineInputBorder(),
                  ),
                  items: [
                    DropdownMenuItem<String?>(
                      value: null,
                      child: Text(UiStrings.instance.t('customPreset')),
                    ),
                    for (final p in _presets)
                      DropdownMenuItem<String?>(
                        value: p['id'] as String,
                        child: Text(p['name'] as String? ?? ''),
                      ),
                  ],
                  onChanged: (v) {
                    setState(() {
                      _presetId = v;
                      if (v != null) _applyPreset(v);
                    });
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _locale,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('chatLocale'),
                    border: const OutlineInputBorder(),
                  ),
                  items: [
                    for (final l in _locales)
                      DropdownMenuItem<String>(
                        value: l['id'] as String,
                        child: Text(l['label'] as String? ?? l['id'] as String),
                      ),
                  ],
                  onChanged: (v) {
                    if (v != null) setState(() => _locale = v);
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _name,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('name'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _personality,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('personality'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _backstory,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('backstory'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _speakingStyle,
                  decoration: InputDecoration(
                    labelText: UiStrings.instance.t('speakingStyle'),
                    border: const OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _saving ? null : _create,
                  child: Text(
                    _saving
                        ? UiStrings.instance.t('creating')
                        : UiStrings.instance.t('createAndSwitch'),
                  ),
                ),
              ],
            ),
    );
  }
}
