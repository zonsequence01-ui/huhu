import 'dart:convert';

import 'package:http/http.dart' as http;

class UiStrings {
  UiStrings._();
  static final UiStrings instance = UiStrings._();

  String _locale = 'zh-TW';
  Map<String, String> _strings = _fallbackZhTw;
  Map<String, String> _apiErrors = {};

  String get locale => _locale;

  void setApiErrors(Map<String, String>? errors) {
    _apiErrors = errors ?? {};
  }

  String t(String key, {Map<String, String>? vars}) {
    var text = _strings[key] ?? _fallbackZhTw[key] ?? key;
    if (vars != null) {
      for (final e in vars.entries) {
        text = text.replaceAll('{${e.key}}', e.value);
      }
    }
    return text;
  }

  String apiErrorMessage(String code, {String? tierForVoice}) {
    final cached = _apiErrors[code];
    if (cached != null && cached.isNotEmpty) return cached;
    final tier = tierForVoice ?? t('tierNameBasic');
    switch (code) {
      case 'voice_requires_basic_subscription':
        return t('voiceRequiresBasic', vars: {'tier': tier});
      case 'insufficient_stamina':
        return t('insufficientStamina');
      case 'insufficient_coins':
        return t('insufficientCoins');
      case 'character_limit_reached':
        return t('characterLimitReached');
      case 'character_not_found':
        return t('characterNotFound');
      case 'age_confirmation_required':
        return t('ageConfirmationRequired');
      case 'content_required':
        return t('contentRequired');
      case 'validation_failed':
        return t('validationFailed');
      case 'rate_limited':
        return t('rateLimited');
      default:
        return code;
    }
  }

  Future<void> load(String baseUrl, {String? locale}) async {
    final loc = (locale != null && locale.isNotEmpty) ? locale : 'zh-TW';
    final enc = Uri.encodeComponent(loc);
    final uiFuture =
        http.get(Uri.parse('$baseUrl/v1/meta/ui-strings?locale=$enc'));
    final configFuture =
        http.get(Uri.parse('$baseUrl/v1/meta/client-config?locale=$enc'));
    final results = await Future.wait([uiFuture, configFuture]);

    if (results[0].statusCode == 200) {
      final data = jsonDecode(results[0].body) as Map<String, dynamic>;
      _locale = data['locale'] as String? ?? loc;
      final raw = data['strings'] as Map<String, dynamic>? ?? {};
      _strings = raw.map((k, v) => MapEntry(k, v.toString()));
    }

    if (results[1].statusCode == 200) {
      final data = jsonDecode(results[1].body) as Map<String, dynamic>;
      final config = data['config'] as Map<String, dynamic>? ?? {};
      final apiErrors = config['apiErrors'] as Map<String, dynamic>?;
      if (apiErrors != null) {
        setApiErrors(apiErrors.map((k, v) => MapEntry(k, v.toString())));
      }
    }
  }
}

const _fallbackZhTw = <String, String>{
  'appTitle': '呼呼 Huhu',
  'inputPlaceholder': '輸入訊息…',
  'send': '送出',
  'modeSimple': '簡單',
  'modeLong': '長對話',
  'modeExciting': '心動',
  'stamina': '體力',
  'coins': '呼呼幣',
  'ageTitle': '年齡確認',
  'ageBody': '呼呼 Huhu 僅供年滿 18 歲使用者。',
  'birthYear': '出生年份',
  'ageConfirm': '我確認已滿 18 歲',
  'createCharacter': '建立角色',
  'cancel': '取消',
  'confirm': '確認',
  'create': '建立',
  'settings': '設定',
  'typing': '正在輸入中…',
  'switchCharacter': '切換角色',
  'connectionFailed': '連線失敗',
  'save': '儲存',
  'apiBaseUrl': 'API 位址',
  'localeLabel': '介面語系',
  'selectCharacter': '選擇角色',
  'privacyData': '隱私與資料',
  'playVoice': '播放語音',
  'voiceModeOn': '語音模式開啟（3體力，需 {tier}+）',
  'voiceModeOff': '語音模式（3體力，需 {tier}+）',
  'voiceRequiresBasic': '語音訊息需 {tier} 或以上訂閱',
  'insufficientStamina': '體力不足，請稍候恢復或升級訂閱',
  'insufficientCoins': '呼呼幣不足',
  'characterLimitReached': '角色數量已達上限，請升級訂閱',
  'characterNotFound': '找不到此角色，已為您建立新角色',
  'ageConfirmationRequired': '請先完成年齡確認',
  'contentRequired': '請輸入訊息內容',
  'validationFailed': '請求格式不正確，請檢查後再試',
  'rateLimited': '操作過於頻繁，請稍後再試',
  'privacy': '隱私',
  'officialPreset': '官方模板',
  'customPreset': '自訂',
  'chatLocale': '對話語系',
  'name': '名稱',
  'personality': '性格',
  'backstory': '背景',
  'speakingStyle': '語氣',
  'creating': '建立中…',
  'createAndSwitch': '建立並切換',
  'createFailed': '建立失敗',
  'dailyCheckin': '每日簽到',
  'dailyCheckinReward': '簽到 +{coins} 幣',
  'checkinFailed': '簽到失敗',
  'subscribeFailed': '訂閱失敗',
  'economyRulesTitle': '經濟規則',
  'exportChat': '匯出對話',
  'exportSuccess': '已匯出 {chars} 字',
  'exportFailed': '匯出失敗',
  'devSubscribe': '訂閱（開發驗證）',
  'saveApiHint': '已儲存，請重新啟動 App',
  'saving': '儲存中…',
  'offerwallReward': '獲得 {coins} 呼呼幣',
  'privacyIntro':
      '依藍圖提供資料自主權：可重置關係、檢視並刪除單筆 RAG 記憶、一次清除全部記憶，或刪除帳號資料。',
  'memoryFragmentsTitle': '長期記憶片段',
  'memoryFragmentsEmpty': '尚無已索引的記憶片段。',
  'memoryDeleteBtn': '刪除此片段',
  'memoryDeleteConfirm': '刪除此則長期記憶？對話紀錄不會一併刪除。',
  'memoryDeleteDone': '已刪除該記憶片段。',
  'resetRelationshipTitle': '重置好感度',
  'resetRelationshipMsg': '將此角色的好感度與關係階段恢復為初始狀態。',
  'resetRelationshipBtn': '重置關係進度',
  'clearRagTitle': '清除長期記憶',
  'clearRagMsg': '刪除向量記憶庫中的 RAG 片段，對話紀錄仍保留。',
  'clearRagBtn': '清除 RAG 記憶',
  'clearMessagesTitle': '清除對話紀錄',
  'clearMessagesMsg': '刪除此角色全部聊天訊息。',
  'clearMessagesBtn': '清除對話紀錄',
  'deleteMessageBtn': '刪除此則',
  'deleteMessageConfirm': '確定刪除此則訊息？',
  'deleteAccountTitle': '刪除帳號資料',
  'deleteAccountMsg': '將刪除所有角色、對話與記憶。此操作無法復原。',
  'deleteAccountBtn': '刪除帳號全部資料',
  'actionDone': '{action} 完成',
  'actionFailed': '失敗',
  'defaultGreeting': '嗨，我是 {name}。今天過得怎麼樣？',
  'subscribePrompt': '訂閱方案：輕量 / 基礎 / 尊榮',
  'subscribePromptPrefix': '訂閱方案：',
  'tierEntUnlimitedStamina': '無限體力',
  'tierEntVoice': '語音訊息',
  'tierEntMemory': '記憶 {n} 則',
  'tierEntReply': '回覆上限 {n}',
  'tierEntPremium': 'Premium 專屬',
  'tierNameLite': '輕量',
  'tierNameBasic': '基礎',
  'tierNamePremium': '尊榮',
  'tierNameFree': '免費',
  'tierEntCharacters': '角色上限 {n}',
  'subscribePppHint':
      'PPP（{region}）：{lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}',
  'personalityPlaceholder': '溫柔、傲嬌…',
  'speakingPlaceholder': '口語、可愛…',
  'momentReportPick': '選擇檢舉原因',
  'momentReportReasonSpam': '垃圾訊息',
  'momentReportReasonHarassment': '騷擾',
  'momentReportReasonInappropriate': '不當內容',
  'momentReportReasonOther': '其他',
  'feedTabFriends': '好友',
  'friendsFeedHint': '僅好友可見的動態',
  'friendsFeedEmpty': '尚無好友動態',
  'momentPublishFriends': '僅好友可見',
  'friendsBtn': '好友',
  'friendsDialogTitle': '好友',
  'inviteCodeLabel': '我的邀請碼',
  'copyInviteCode': '複製碼',
  'copyInviteLink': '複製連結',
  'inviteCodeCopied': '已複製邀請碼',
  'inviteLinkCopied': '已複製邀請連結',
  'inviteDeepLinkHint': '已帶入邀請碼，確認後送出好友邀請',
  'friendsIncomingTitle': '待接受邀請',
  'friendsOutgoingTitle': '已送出邀請',
  'friendsListTitle': '好友列表',
  'addFriendByCode': '輸入對方的邀請碼',
  'inviteCodeNotFound': '找不到此邀請碼',
  'friendRequestsEmpty': '目前沒有待處理邀請',
  'friendsClose': '關閉',
  'friendRequestSent': '已送出好友邀請',
  'friendAccepted': '已成為好友',
  'blockUser': '封鎖',
  'blockUserConfirm': '封鎖後將解除好友關係，且無法再互動。確定？',
  'blockedUsersTitle': '已封鎖',
  'unblockUser': '解除封鎖',
  'userBlocked': '已封鎖該使用者',
  'friendBlocked': '無法與此使用者互動（已封鎖）',
  'inviteQrAlt': '邀請 QR 碼',
  'searchFriendsLabel': '搜尋好友',
  'searchFriendsPlaceholder': '暱稱或邀請碼',
  'searchFriendsBtn': '搜尋',
  'searchFriendsEmpty': '找不到符合的使用者',
  'searchFriendsMinLength': '請至少輸入 2 個字元',
  'sendFriendRequestTo': '邀請',
  'displayNameLabel': '我的暱稱',
  'displayNameSaved': '暱稱已更新',
  'invalidDisplayName': '暱稱需為 2–32 個字元',
};
