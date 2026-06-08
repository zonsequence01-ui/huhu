import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../services/huhu_api.dart';
import '../services/ui_strings.dart';
import '../services/voice_player.dart';
import '../services/voice_recorder.dart';
import '../widgets/affection_meter.dart';
import '../widgets/friends_panel.dart';
import 'settings_screen.dart';
import 'character_create_screen.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _api = HuhuApi();
  final _ui = UiStrings.instance;
  final _voicePlayer = VoicePlayer();
  final _voiceRecorder = VoiceRecorder();
  final _imagePicker = ImagePicker();
  bool _recordingVoice = false;
  final _controller = TextEditingController();
  final _scroll = ScrollController();
  final _messages = <_ChatBubble>[];

  bool _loading = true;
  String? _characterId;
  String? _userId;
  String _mode = 'simple';
  bool _voiceMode = false;
  Map<String, dynamic>? _economy;
  Map<String, dynamic>? _economyRules;
  Map<String, dynamic>? _offerwallMeta;
  Map<String, dynamic>? _relationship;
  List<Map<String, dynamic>> _characters = [];
  String? _chatPrivacyReminder;
  bool _chatPrivacyDismissed = true;
  String? _clientConfigLocale;
  Map<String, String> _tierDisplayNames = {};

  @override
  void initState() {
    super.initState();
    _init();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    _voicePlayer.dispose();
    _voiceRecorder.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final apiBase = prefs.getString('huhu_api_base');
      _api.baseUrl = resolveStoredApiBase(
        apiBase,
        defaultBase: _api.baseUrl,
        releaseMode: kReleaseMode,
      );
      if (apiBase != null &&
          apiBase.isNotEmpty &&
          !isApiBaseOverrideAllowed(apiBase, releaseMode: kReleaseMode)) {
        await prefs.remove('huhu_api_base');
      }
      var token = prefs.getString('huhu_token');
      _characterId = prefs.getString('huhu_characterId');

      if (token == null) {
        final boot = await _api.bootstrap();
        token = boot['token'] as String;
        _userId = boot['userId'] as String?;
        await prefs.setString('huhu_token', token);
        if (_userId != null) await prefs.setString('huhu_userId', _userId!);
      } else {
        _userId = prefs.getString('huhu_userId');
      }
      _api.setToken(token);
      await _ui.load(_api.baseUrl);
      _chatPrivacyDismissed =
          prefs.getBool('huhu_chat_privacy_dismissed') ?? false;
      await _loadClientConfigMeta();
      await _ensureAgeConfirmed();

      if (_characterId == null) {
        final me = await _api.getMe();
        final loc = me['locale'] as String? ?? _ui.locale;
        final meta = await _api.getDefaultCharacter(locale: loc);
        _characterId = await _api.createFromPreset(
          meta['presetId'] as String,
          locale: meta['locale'] as String? ?? loc,
        );
        await prefs.setString('huhu_characterId', _characterId!);
        _messages.add(
          _ChatBubble(
            text: meta['greeting'] as String? ?? _ui.t('defaultGreeting', vars: {'name': ''}),
            isUser: false,
          ),
        );
      } else {
        await _loadHistory();
      }
      await _refreshProfile();
      await _loadCharacters();
    } catch (e) {
      _messages.add(
        _ChatBubble(text: '${_ui.t('connectionFailed')}：$e', isUser: false),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadClientConfigMeta() async {
    try {
      final me = await _api.getMe();
      final loc = me['locale'] as String?;
      if (loc == _clientConfigLocale &&
          (_economyRules != null || _offerwallMeta != null)) {
        return;
      }
      final config = await _api.getClientConfig(locale: loc);
      _clientConfigLocale = loc;
      _economyRules = config['economy'] as Map<String, dynamic>? ?? {};
      _offerwallMeta = config['offerwall'] as Map<String, dynamic>?;
      final tiers = config['subscriptionTiers'] as List<dynamic>? ?? [];
      _tierDisplayNames = {
        for (final row in tiers)
          if (row is Map<String, dynamic> &&
              row['tier'] != null &&
              row['tierDisplayName'] != null)
            row['tier'] as String: row['tierDisplayName'] as String,
      };
      final apiErrors = config['apiErrors'] as Map<String, dynamic>?;
      if (apiErrors != null) {
        _ui.setApiErrors(
          apiErrors.map((k, v) => MapEntry(k, v.toString())),
        );
      }
      if (!_chatPrivacyDismissed) {
        final resources = config['supportResources'] as Map<String, dynamic>?;
        _chatPrivacyReminder = resources?['privacyReminder'] as String?;
      }
      if (mounted) setState(() {});
    } catch (_) {
      try {
        _economyRules = await _api.getMetaEconomy();
      } catch (_) {}
      try {
        _offerwallMeta = await _api.getMetaOfferwall();
      } catch (_) {}
    }
  }

  Future<void> _ensureAgeConfirmed() async {
    final me = await _api.getMe();
    final loc = me['locale'] as String?;
    if (loc != null && loc.isNotEmpty) {
      await _ui.load(_api.baseUrl, locale: loc);
    }
    if (me['ageConfirmed'] == true || me['ageGateRequired'] != true) return;
    if (!mounted) return;
    final year = DateTime.now().year - 20;
    final controller = TextEditingController(text: '$year');
    final ok = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(_ui.t('ageTitle')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_ui.t('ageBody')),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: _ui.t('birthYear'),
                border: const OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_ui.t('ageConfirm')),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final birthYear = int.tryParse(controller.text.trim());
    controller.dispose();
    if (birthYear == null) return;
    await _api.confirmAge(birthYear);
  }

  Future<void> _confirmDeleteMessage(int index) async {
    if (_characterId == null || index < 0 || index >= _messages.length) return;
    final m = _messages[index];
    final id = m.messageId;
    if (id == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(_ui.t('deleteMessageBtn')),
        content: Text(_ui.t('deleteMessageConfirm')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(_ui.t('cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(_ui.t('deleteMessageBtn')),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _api.deleteMessage(_characterId!, id);
      setState(() => _messages.removeAt(index));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  Future<void> _loadHistory() async {
    final rows = await _api.getMessages(_characterId!);
    _messages.clear();
    for (final row in rows) {
      final media = row['media'] as Map<String, dynamic>?;
      final safety = row['safety'] as Map<String, dynamic>?;
      _messages.add(
        _ChatBubble(
          text: row['content'] as String,
          isUser: row['role'] == 'user',
          messageId: row['id'] as String?,
          safety: safety?['flagged'] == true,
          characterCorrected: row['characterCorrected'] == true,
          imageBase64: media?['imageBase64'] as String?,
          imageMimeType: media?['mimeType'] as String?,
        ),
      );
    }
  }

  Future<void> _pickAndSendPhoto() async {
    if (_characterId == null) return;
    final messenger = ScaffoldMessenger.of(context);
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1280,
      imageQuality: 85,
    );
    if (picked == null) return;
    final bytes = await picked.readAsBytes();
    if (bytes.length > 2 * 1024 * 1024) {
      messenger.showSnackBar(SnackBar(content: Text(_ui.t('photoTooLarge'))));
      return;
    }
    if (!mounted) return;
    final caption = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final ctrl = TextEditingController();
        return AlertDialog(
          title: Text(_ui.t('photoCaption')),
          content: TextField(
            controller: ctrl,
            decoration: InputDecoration(hintText: _ui.t('photoCaption')),
            maxLines: 2,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, ''),
              child: Text(_ui.t('cancel')),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: Text(_ui.t('send')),
            ),
          ],
        );
      },
    );
    if (caption == null) return;
    final mime = picked.mimeType ?? 'image/jpeg';
    final b64 = base64Encode(bytes);
    setState(() {
      _messages.add(
        _ChatBubble(
          text: caption.isEmpty ? _ui.t('attachPhoto') : caption,
          isUser: true,
          imageBase64: b64,
          imageMimeType: mime,
        ),
      );
      _messages.add(
        _ChatBubble(text: _ui.t('typing'), isUser: false, typing: true),
      );
    });
    _scrollToEnd();
    try {
      final result = await _api.sendChat(
        characterId: _characterId!,
        content: caption,
        mode: _mode,
        messageType: 'image',
        imageBase64: b64,
        imageMimeType: mime,
      );
      setState(() {
        _messages.removeLast();
        _tagLastUserMessageId(result['userMessageId'] as String?);
        _messages.add(_assistantBubbleFromChat(result));
        _economy = result['economy'] as Map<String, dynamic>?;
        _relationship = result['relationship'] as Map<String, dynamic>?;
      });
    } catch (e) {
      setState(() {
        if (_messages.isNotEmpty && _messages.last.typing) {
          _messages.removeLast();
        }
        _messages.add(_ChatBubble(text: '（$e）', isUser: false));
      });
    }
    _scrollToEnd();
  }

  Future<void> _loadCharacters() async {
    if (_userId == null) {
      final me = await _api.getMe();
      _userId = me['id'] as String?;
    }
    if (_userId == null) return;
    _characters = await _api.listCharacters(_userId!);
    if (_characterId != null &&
        !_characters.any((c) => c['id'] == _characterId) &&
        _characters.isNotEmpty) {
      _characterId = _characters.first['id'] as String;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('huhu_characterId', _characterId!);
    }
  }

  Future<void> _switchCharacter(String picked) async {
    if (picked == _characterId) return;
    final prefs = await SharedPreferences.getInstance();
    _characterId = picked;
    await prefs.setString('huhu_characterId', picked);
    _messages.clear();
    await _loadHistory();
    await _refreshProfile();
    if (mounted) setState(() {});
  }

  Future<void> _pickCharacter() async {
    if (_userId == null) {
      final me = await _api.getMe();
      _userId = me['id'] as String?;
    }
    if (_userId == null) return;
    final chars = await _api.listCharacters(_userId!);
    if (!mounted) return;
    final picked = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            for (final c in chars)
              ListTile(
                title: Text(c['name'] as String? ?? '角色'),
                subtitle: Text(c['personality'] as String? ?? ''),
                onTap: () => Navigator.pop(ctx, c['id'] as String),
              ),
          ],
        ),
      ),
    );
    if (picked == null) return;
    await _switchCharacter(picked);
  }

  Future<void> _refreshProfile() async {
    _economy = await _api.getMe();
    _userId ??= _economy?['id'] as String?;
    final loc = _economy?['locale'] as String?;
    if (loc != null && loc.isNotEmpty) {
      await _ui.load(_api.baseUrl, locale: loc);
    }
    final char = await _api.getCharacter(_characterId!);
    _relationship = char['relationship'] as Map<String, dynamic>?;
    if (mounted) setState(() {});
  }

  bool _safetyFlagged(Map<String, dynamic> result) {
    final safety = result['safety'] as Map<String, dynamic>?;
    return safety?['flagged'] == true;
  }

  bool _characterCorrected(Map<String, dynamic>? reply) {
    return reply?['characterCorrected'] == true;
  }

  void _tagLastUserMessageId(String? userMessageId) {
    if (userMessageId == null || userMessageId.isEmpty) return;
    for (var i = _messages.length - 1; i >= 0; i--) {
      final m = _messages[i];
      if (!m.isUser || m.typing) continue;
      _messages[i] = _ChatBubble(
        text: m.text,
        isUser: true,
        messageId: userMessageId,
        safety: m.safety,
        characterCorrected: m.characterCorrected,
        audioBase64: m.audioBase64,
        mimeType: m.mimeType,
        imageBase64: m.imageBase64,
        imageMimeType: m.imageMimeType,
      );
      return;
    }
  }

  _ChatBubble _assistantBubbleFromChat(Map<String, dynamic> result) {
    final reply = result['reply'] as Map<String, dynamic>?;
    final voice = reply?['voice'] as Map<String, dynamic>?;
    final userMedia = reply?['userMedia'] as Map<String, dynamic>?;
    return _ChatBubble(
      text: reply?['content'] as String? ?? '…',
      isUser: false,
      messageId: reply?['id'] as String?,
      safety: _safetyFlagged(result),
      characterCorrected: _characterCorrected(reply),
      audioBase64: voice?['audioBase64'] as String?,
      mimeType: voice?['mimeType'] as String?,
      imageBase64: userMedia?['imageBase64'] as String?,
      imageMimeType: userMedia?['mimeType'] as String?,
    );
  }

  Future<void> _sendVoiceRecording() async {
    if (_characterId == null) return;
    setState(() {
      _messages.add(_ChatBubble(text: _ui.t('recording'), isUser: true));
      _messages.add(
        _ChatBubble(text: _ui.t('typing'), isUser: false, typing: true),
      );
    });
    _scrollToEnd();
    try {
      final audio = await _voiceRecorder.stop();
      if (audio == null) {
        setState(() {
          _messages.removeLast();
          _messages.removeLast();
        });
        return;
      }
      final result = await _api.sendChat(
        characterId: _characterId!,
        content: '',
        mode: _mode,
        messageType: 'voice',
        voiceAudioBase64: audio.base64,
        voiceMimeType: audio.mimeType,
      );
      setState(() {
        _messages.removeLast();
        _tagLastUserMessageId(result['userMessageId'] as String?);
        _messages.add(_assistantBubbleFromChat(result));
        _economy = result['economy'] as Map<String, dynamic>?;
        _relationship = result['relationship'] as Map<String, dynamic>?;
      });
      final last = _messages.last;
      if (last.audioBase64 != null) {
        await _voicePlayer.playBase64(
          last.audioBase64!,
          mimeType: last.mimeType ?? 'audio/mpeg',
        );
      }
    } catch (e) {
      setState(() {
        if (_messages.isNotEmpty && _messages.last.typing) {
          _messages.removeLast();
        }
        _messages.add(
          _ChatBubble(text: '（${_formatChatError(e)}）', isUser: false),
        );
      });
    }
    _scrollToEnd();
  }

  String _formatChatError(Object e) {
    if (e is HuhuApiException) {
      return _ui.apiErrorMessage(
        e.message,
        tierForVoice: _tierDisplayNames['basic'],
      );
    }
    return e.toString();
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (_characterId == null) return;
    if (_voiceMode && text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_ui.t('holdToRecord'))),
      );
      return;
    }
    if (text.isEmpty) return;
    _controller.clear();
    final messageType = _voiceMode ? 'voice' : 'text';
    setState(() {
      _messages.add(_ChatBubble(text: text, isUser: true));
      _messages.add(
        _ChatBubble(text: _ui.t('typing'), isUser: false, typing: true),
      );
    });
    _scrollToEnd();

    try {
      final result = await _api.sendChat(
        characterId: _characterId!,
        content: text,
        mode: _mode,
        messageType: messageType,
      );
      setState(() {
        _messages.removeLast();
        _tagLastUserMessageId(result['userMessageId'] as String?);
        _messages.add(_assistantBubbleFromChat(result));
        _economy = result['economy'] as Map<String, dynamic>?;
        _relationship = result['relationship'] as Map<String, dynamic>?;
      });
      final last = _messages.last;
      if (last.audioBase64 != null) {
        await _voicePlayer.playBase64(
          last.audioBase64!,
          mimeType: last.mimeType ?? 'audio/mpeg',
        );
      }
    } catch (e) {
      setState(() {
        _messages.removeLast();
        _messages.add(
          _ChatBubble(text: '（${_formatChatError(e)}）', isUser: false),
        );
      });
    }
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _staminaText() {
    final display = _economy?['staminaDisplay'] as Map<String, dynamic>?;
    if (display?['unlimited'] == true) return '${_ui.t('stamina')} ∞';
    return '${_ui.t('stamina')} ${_economy?['stamina'] ?? '-'}/${display?['max'] ?? 50}';
  }

  String _voiceTooltip() {
    final tier =
        _tierDisplayNames['basic'] ?? _ui.t('tierNameBasic');
    return _voiceMode
        ? _ui.t('voiceModeOn', vars: {'tier': tier})
        : _ui.t('voiceModeOff', vars: {'tier': tier});
  }

  String _offerwallTooltip() {
    final coins = _economyRules?['coins'] as Map<String, dynamic>?;
    final ow = _offerwallMeta;
    final min = coins?['offerwallMin'] ?? ow?['coinsPerReward']?['min'] ?? 1;
    final max = coins?['offerwallMax'] ?? ow?['coinsPerReward']?['max'] ?? 3;
    final cap = ow?['dailyCap'];
    final capText = cap != null ? ' · $cap/day' : '';
    return '${_ui.t('offerwall')} (+$min–$max$capText)';
  }

  String _modeLabel(String mode) {
    final c = _economyRules?['coins'] as Map<String, dynamic>?;
    switch (mode) {
      case 'long':
        return '${_ui.t('modeLong')} (-${c?['longMode'] ?? 5})';
      case 'exciting':
        return '${_ui.t('modeExciting')} (-${c?['excitingMode'] ?? 10})';
      default:
        return _ui.t('modeSimple');
    }
  }

  Future<void> _openDiary() async {
    if (_characterId == null) return;
    final messenger = ScaffoldMessenger.of(context);
    List<Map<String, dynamic>> entries = [];
    try {
      entries = await _api.listDiary(_characterId!);
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!mounted) return;
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (ctx) {
          return Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _ui.t('diary'),
                    style: Theme.of(ctx).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  if (entries.isEmpty)
                    Text(_ui.t('diaryBody'))
                  else
                    ...entries.map((e) {
                      final entryId = e['id'] as String;
                      final title = e['title'] as String?;
                      final body = e['body'] as String? ?? '';
                      return Dismissible(
                        key: ValueKey(entryId),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          color: Theme.of(ctx).colorScheme.errorContainer,
                          padding: const EdgeInsets.only(right: 16),
                          child: Icon(
                            Icons.delete_outline,
                            color: Theme.of(ctx).colorScheme.onErrorContainer,
                          ),
                        ),
                        onDismissed: (_) async {
                          try {
                            await _api.deleteDiary(_characterId!, entryId);
                          } catch (err) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('$err')),
                            );
                          }
                        },
                        child: ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(
                            title?.isNotEmpty == true ? title! : body,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Text(
                            body,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleCtrl,
                    decoration: InputDecoration(
                      labelText: _ui.t('diaryTitle'),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: bodyCtrl,
                    decoration: InputDecoration(
                      labelText: _ui.t('diaryBody'),
                      border: const OutlineInputBorder(),
                    ),
                    minLines: 2,
                    maxLines: 4,
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () async {
                      final body = bodyCtrl.text.trim();
                      if (body.isEmpty) {
                        messenger.showSnackBar(
                          SnackBar(content: Text(_ui.t('diaryEmpty'))),
                        );
                        return;
                      }
                      try {
                        await _api.createDiary(
                          _characterId!,
                          title: titleCtrl.text.trim(),
                          body: body,
                        );
                        if (!ctx.mounted) return;
                        Navigator.of(ctx).pop();
                        if (!mounted) return;
                        messenger.showSnackBar(
                          SnackBar(content: Text(_ui.t('diarySaved'))),
                        );
                      } catch (e) {
                        messenger.showSnackBar(
                          SnackBar(content: Text('$e')),
                        );
                      }
                    },
                    child: Text(_ui.t('save')),
                  ),
                ],
              ),
            ),
          );
        },
      );
    } finally {
      titleCtrl.dispose();
      bodyCtrl.dispose();
    }
  }

  Future<String?> _pickReportReason(BuildContext ctx) {
    const reasons = ['spam', 'harassment', 'inappropriate', 'other'];
    const labelKeys = {
      'spam': 'momentReportReasonSpam',
      'harassment': 'momentReportReasonHarassment',
      'inappropriate': 'momentReportReasonInappropriate',
      'other': 'momentReportReasonOther',
    };
    return showDialog<String>(
      context: ctx,
      builder: (dctx) => SimpleDialog(
        title: Text(_ui.t('momentReportPick')),
        children: [
          for (final r in reasons)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(dctx, r),
              child: Text(_ui.t(labelKeys[r] ?? r)),
            ),
        ],
      ),
    );
  }

  Future<void> _openMoments() async {
    if (_characterId == null) return;
    final messenger = ScaffoldMessenger.of(context);
    final ownedIds = _characters.map((c) => c['id'] as String).toSet();
    if (!mounted) return;
    final bodyCtrl = TextEditingController();
    String? pendingB64;
    String? pendingMime;
    var feedMode = 'mine';
    var publishPublic = false;
    var publishFriends = false;
    List<Map<String, dynamic>> moments = [];
    try {
      moments = await _api.listFeedMoments();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!mounted) return;
    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (ctx) {
          return StatefulBuilder(
            builder: (ctx, setSheetState) {
              Future<void> reloadMoments() async {
                try {
                  final List<Map<String, dynamic>> list;
                  if (feedMode == 'community') {
                    list = await _api.listPublicFeedMoments();
                  } else if (feedMode == 'friends') {
                    list = await _api.listFriendsFeedMoments();
                  } else {
                    list = await _api.listFeedMoments();
                  }
                  if (!ctx.mounted) return;
                  setSheetState(() => moments = list);
                } catch (e) {
                  messenger.showSnackBar(SnackBar(content: Text('$e')));
                }
              }

              return Padding(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _ui.t('moments'),
                        style: Theme.of(ctx).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        feedMode == 'community'
                            ? _ui.t('feedPublicHint')
                            : feedMode == 'friends'
                                ? _ui.t('friendsFeedHint')
                                : _ui.t('feedMomentsHint'),
                        style: Theme.of(ctx).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 8),
                      SegmentedButton<String>(
                        segments: [
                          ButtonSegment(
                            value: 'mine',
                            label: Text(_ui.t('feedTabMine')),
                          ),
                          ButtonSegment(
                            value: 'community',
                            label: Text(_ui.t('feedTabCommunity')),
                          ),
                          ButtonSegment(
                            value: 'friends',
                            label: Text(_ui.t('feedTabFriends')),
                          ),
                        ],
                        selected: {feedMode},
                        onSelectionChanged: (s) {
                          setSheetState(() {
                            feedMode = s.first;
                            moments = [];
                          });
                          reloadMoments();
                        },
                      ),
                      const SizedBox(height: 12),
                      if (moments.isEmpty)
                        Text(
                          feedMode == 'community'
                              ? _ui.t('publicFeedEmpty')
                              : feedMode == 'friends'
                                  ? _ui.t('friendsFeedEmpty')
                                  : _ui.t('momentsListEmpty'),
                        )
                      else
                        ...moments.map((m) {
                          final momentId = m['id'] as String;
                          final charId = m['characterId'] as String;
                          final name = m['characterName'] as String? ?? '';
                          final body = m['body'] as String? ?? '';
                          final media =
                              m['media'] as Map<String, dynamic>?;
                          final canDelete = ownedIds.contains(charId);
                          final canReport =
                              feedMode != 'mine' && !ownedIds.contains(charId);
                          final tile = ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(
                              name.isNotEmpty ? '$name · $body' : body,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            trailing: canReport
                                ? IconButton(
                                    icon: const Icon(Icons.flag_outlined),
                                    tooltip: _ui.t('momentReport'),
                                    onPressed: () async {
                                      final reason =
                                          await _pickReportReason(ctx);
                                      if (reason == null) return;
                                      try {
                                        await _api.reportMoment(
                                          momentId,
                                          reason: reason,
                                        );
                                        if (!ctx.mounted) return;
                                        messenger.showSnackBar(
                                          SnackBar(
                                            content:
                                                Text(_ui.t('momentReported')),
                                          ),
                                        );
                                        await reloadMoments();
                                      } catch (e) {
                                        final msg = e.toString();
                                        messenger.showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              msg.contains('cannot_report_own')
                                                  ? _ui.t('momentReportOwn')
                                                  : '$e',
                                            ),
                                          ),
                                        );
                                      }
                                    },
                                  )
                                : null,
                            subtitle: media?['base64'] != null
                                ? Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Image.memory(
                                      base64Decode(
                                        media!['base64'] as String,
                                      ),
                                      height: 72,
                                      fit: BoxFit.cover,
                                    ),
                                  )
                                : null,
                          );
                          if (!canDelete) return tile;
                          return Dismissible(
                            key: ValueKey(momentId),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              color: Theme.of(ctx).colorScheme.errorContainer,
                              padding: const EdgeInsets.only(right: 16),
                              child: Icon(
                                Icons.delete_outline,
                                color: Theme.of(ctx)
                                    .colorScheme
                                    .onErrorContainer,
                              ),
                            ),
                            onDismissed: (_) async {
                              try {
                                await _api.deleteMoment(charId, momentId);
                                await reloadMoments();
                              } catch (err) {
                                messenger.showSnackBar(
                                  SnackBar(content: Text('$err')),
                                );
                              }
                            },
                            child: tile,
                          );
                        }),
                      const SizedBox(height: 12),
                      TextField(
                        controller: bodyCtrl,
                        decoration: InputDecoration(
                          labelText: _ui.t('momentBody'),
                          border: const OutlineInputBorder(),
                        ),
                        minLines: 2,
                        maxLines: 4,
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(_ui.t('momentPublishFriends')),
                        value: publishFriends,
                        onChanged: (v) => setSheetState(() {
                          publishFriends = v;
                          if (v) publishPublic = false;
                        }),
                      ),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(_ui.t('momentPublishPublic')),
                        value: publishPublic,
                        onChanged: (v) => setSheetState(() {
                          publishPublic = v;
                          if (v) publishFriends = false;
                        }),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await _imagePicker.pickImage(
                            source: ImageSource.gallery,
                            maxWidth: 1280,
                            imageQuality: 85,
                          );
                          if (picked == null) return;
                          final bytes = await picked.readAsBytes();
                          if (bytes.length > 2 * 1024 * 1024) {
                            messenger.showSnackBar(
                              SnackBar(
                                content: Text(_ui.t('photoTooLarge')),
                              ),
                            );
                            return;
                          }
                          setSheetState(() {
                            pendingB64 = base64Encode(bytes);
                            pendingMime = picked.mimeType ?? 'image/jpeg';
                          });
                        },
                        icon: const Icon(Icons.photo_outlined),
                        label: Text(_ui.t('momentPhoto')),
                      ),
                      if (pendingB64 != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Image.memory(
                            base64Decode(pendingB64!),
                            height: 80,
                            fit: BoxFit.cover,
                          ),
                        ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () async {
                          final body = bodyCtrl.text.trim();
                          if (body.isEmpty) {
                            messenger.showSnackBar(
                              SnackBar(content: Text(_ui.t('momentEmpty'))),
                            );
                            return;
                          }
                          try {
                            await _api.createMoment(
                              _characterId!,
                              body: body,
                              imageBase64: pendingB64,
                              imageMimeType: pendingMime,
                              visibility: publishPublic
                                  ? 'public'
                                  : publishFriends
                                      ? 'friends'
                                      : 'private',
                            );
                            if (!ctx.mounted) return;
                            Navigator.of(ctx).pop();
                            if (!mounted) return;
                            messenger.showSnackBar(
                              SnackBar(content: Text(_ui.t('momentSaved'))),
                            );
                          } catch (e) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('$e')),
                            );
                          }
                        },
                        child: Text(_ui.t('send')),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      );
    } finally {
      bodyCtrl.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: _characters.length > 1
            ? DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _characterId,
                  isDense: true,
                  icon: const Icon(Icons.arrow_drop_down, size: 20),
                  items: [
                    for (final c in _characters)
                      DropdownMenuItem(
                        value: c['id'] as String,
                        child: Text(
                          c['name'] as String? ?? _ui.t('switchCharacter'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                  onChanged: _loading
                      ? null
                      : (id) {
                          if (id != null) _switchCharacter(id);
                        },
                ),
              )
            : Text(_ui.t('appTitle')),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () async {
              final id = await Navigator.of(context).push<String>(
                MaterialPageRoute(
                  builder: (_) => CharacterCreateScreen(api: _api),
                ),
              );
              if (id == null || !mounted) return;
              await _loadCharacters();
              await _switchCharacter(id);
              await _loadCharacters();
            },
          ),
          IconButton(
            icon: const Icon(Icons.book_outlined),
            tooltip: _ui.t('diary'),
            onPressed: _openDiary,
          ),
          IconButton(
            icon: const Icon(Icons.dynamic_feed_outlined),
            tooltip: _ui.t('moments'),
            onPressed: _openMoments,
          ),
          IconButton(
            icon: const Icon(Icons.people_outline),
            onPressed: _pickCharacter,
          ),
          IconButton(
            icon: const Icon(Icons.group_add_outlined),
            tooltip: _ui.t('friendsBtn'),
            onPressed: () => showHuhuFriendsDialog(context, api: _api),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => SettingsScreen(
                    api: _api,
                    characterId: _characterId,
                  ),
                ),
              );
              if (!mounted) return;
              _clientConfigLocale = null;
              await _loadClientConfigMeta();
            },
          ),
        ],
        bottom: _relationship == null
            ? null
            : PreferredSize(
                preferredSize: const Size.fromHeight(72),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Column(
                    children: [
                      AffectionMeter(
                        stageLabel:
                            _relationship!['stageLabel'] as String? ?? '',
                        percent: _relationship!['percent'] as int? ?? 0,
                        stage: _relationship!['stage'] as String?,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_staminaText()} · ${_ui.t('coins')} ${_economy?['coins'] ?? '-'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_chatPrivacyReminder != null && !_chatPrivacyDismissed)
                  Material(
                    color: Theme.of(context).colorScheme.surfaceContainerHigh,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              _chatPrivacyReminder!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              final p = await SharedPreferences.getInstance();
                              await p.setBool('huhu_chat_privacy_dismissed', true);
                              if (!mounted) return;
                              setState(() => _chatPrivacyDismissed = true);
                            },
                            child: Text(_ui.t('chatPrivacyDismiss')),
                          ),
                        ],
                      ),
                    ),
                  ),
                Expanded(
                  child: ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) {
                      final m = _messages[i];
                      final bubble = Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.sizeOf(context).width * 0.82,
                          ),
                          decoration: BoxDecoration(
                            color: m.isUser
                                ? Theme.of(context).colorScheme.primaryContainer
                                : m.safety
                                    ? Theme.of(context)
                                        .colorScheme
                                        .tertiaryContainer
                                    : m.characterCorrected
                                        ? Theme.of(context)
                                            .colorScheme
                                            .secondaryContainer
                                        : Theme.of(context)
                                            .colorScheme
                                            .surfaceContainerHigh,
                            borderRadius: BorderRadius.circular(16),
                            border: m.safety
                                ? Border.all(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .tertiary,
                                  )
                                : m.characterCorrected
                                    ? Border.all(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .secondary,
                                      )
                                    : null,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (m.imageBase64 != null &&
                                  m.imageMimeType != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.memory(
                                    base64Decode(m.imageBase64!),
                                    width: 200,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              if (m.imageBase64 != null)
                                const SizedBox(height: 6),
                              Text(
                                m.text,
                                style: TextStyle(
                                  fontStyle: m.typing
                                      ? FontStyle.italic
                                      : FontStyle.normal,
                                ),
                              ),
                              if (m.audioBase64 != null &&
                                  m.mimeType != 'text/plain')
                                TextButton.icon(
                                  onPressed: () => _voicePlayer.playBase64(
                                    m.audioBase64!,
                                    mimeType: m.mimeType ?? 'audio/mpeg',
                                  ),
                                  icon: const Icon(Icons.volume_up, size: 18),
                                  label: Text(_ui.t('playVoice')),
                                ),
                            ],
                          ),
                        );
                      if (m.messageId == null || m.typing) {
                        return Align(
                          alignment: m.isUser
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: bubble,
                        );
                      }
                      return Align(
                        alignment: m.isUser
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: GestureDetector(
                          onLongPress: () => _confirmDeleteMessage(i),
                          child: bubble,
                        ),
                      );
                    },
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    child: Row(
                      children: [
                        DropdownButton<String>(
                          value: _mode,
                          items: [
                            DropdownMenuItem(
                              value: 'simple',
                              child: Text(_modeLabel('simple')),
                            ),
                            DropdownMenuItem(
                              value: 'long',
                              child: Text(_modeLabel('long')),
                            ),
                            DropdownMenuItem(
                              value: 'exciting',
                              child: Text(_modeLabel('exciting')),
                            ),
                          ],
                          onChanged: (v) => setState(() => _mode = v!),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _controller,
                            decoration: InputDecoration(
                              hintText: _ui.t('inputPlaceholder'),
                              border: const OutlineInputBorder(),
                              isDense: true,
                            ),
                            onSubmitted: (_) => _send(),
                          ),
                        ),
                        const SizedBox(width: 4),
                        GestureDetector(
                          onLongPressStart: _voiceMode
                              ? (_) async {
                                  final messenger =
                                      ScaffoldMessenger.of(context);
                                  try {
                                    await _voiceRecorder.start();
                                    if (!mounted) return;
                                    setState(() => _recordingVoice = true);
                                  } catch (_) {
                                    if (!mounted) return;
                                    messenger.showSnackBar(
                                      SnackBar(content: Text(_ui.t('micDenied'))),
                                    );
                                  }
                                }
                              : null,
                          onLongPressEnd: _voiceMode
                              ? (_) async {
                                  if (!_recordingVoice) return;
                                  setState(() => _recordingVoice = false);
                                  await _sendVoiceRecording();
                                }
                              : null,
                          child: IconButton(
                            tooltip: _voiceTooltip(),
                            onPressed: () =>
                                setState(() => _voiceMode = !_voiceMode),
                            icon: Icon(
                              _recordingVoice
                                  ? Icons.mic
                                  : (_voiceMode
                                      ? Icons.mic_none_outlined
                                      : Icons.mic_off_outlined),
                              color: _recordingVoice
                                  ? Colors.red
                                  : (_voiceMode
                                      ? Theme.of(context).colorScheme.primary
                                      : null),
                            ),
                          ),
                        ),
                        IconButton(
                          tooltip: _ui.t('attachPhoto'),
                          onPressed: _pickAndSendPhoto,
                          icon: const Icon(Icons.photo_camera_outlined),
                        ),
                        IconButton(
                          tooltip: _offerwallTooltip(),
                          onPressed: () async {
                            final messenger = ScaffoldMessenger.of(context);
                            try {
                              final r = await _api.claimOfferwall();
                              if (!mounted) return;
                              messenger.showSnackBar(
                                SnackBar(
                                  content: Text(
                                    _ui.t(
                                      'offerwallReward',
                                      vars: {
                                        'coins': '${r['coinsAwarded']}',
                                      },
                                    ),
                                  ),
                                ),
                              );
                              await _refreshProfile();
                            } catch (e) {
                              if (!mounted) return;
                              final msg = e is HuhuApiException
                                  ? _ui.apiErrorMessage(e.message)
                                  : '$e';
                              messenger.showSnackBar(
                                SnackBar(content: Text(msg)),
                              );
                            }
                          },
                          icon: const Icon(Icons.monetization_on_outlined),
                        ),
                        IconButton.filled(
                          onPressed: _send,
                          icon: const Icon(Icons.send),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _ChatBubble {
  const _ChatBubble({
    required this.text,
    required this.isUser,
    this.messageId,
    this.typing = false,
    this.safety = false,
    this.characterCorrected = false,
    this.audioBase64,
    this.mimeType,
    this.imageBase64,
    this.imageMimeType,
  });
  final String text;
  final bool isUser;
  final String? messageId;
  final bool typing;
  final bool safety;
  final bool characterCorrected;
  final String? audioBase64;
  final String? mimeType;
  final String? imageBase64;
  final String? imageMimeType;
}
