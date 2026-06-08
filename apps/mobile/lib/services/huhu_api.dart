import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class HuhuApi {
  HuhuApi({String? baseUrl})
      : baseUrl = baseUrl ?? defaultApiBaseUrl(releaseMode: kReleaseMode);

  String baseUrl;
  String? _token;

  Map<String, String> get _authHeaders => {
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Map<String, String> get _jsonHeaders => {
        ..._authHeaders,
        'Content-Type': 'application/json',
      };

  void setToken(String? token) => _token = token;

  Future<Map<String, dynamic>> bootstrap() async {
    final res = await http.post(Uri.parse('$baseUrl/v1/users/bootstrap'));
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listCharacters(String userId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/users/$userId/characters'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['characters'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> confirmAge(int birthYear) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/users/me/age-confirm'),
      headers: _jsonHeaders,
      body: jsonEncode({'birthYear': birthYear}),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMe() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/users/me'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> patchDisplayName(String displayName) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/v1/users/me/display-name'),
      headers: _jsonHeaders,
      body: jsonEncode({'displayName': displayName}),
    );
    _throwIfFailed(res);
  }

  Future<List<Map<String, dynamic>>> searchUsers(String query) async {
    final res = await http.get(
      Uri.parse(
        '$baseUrl/v1/users/search?q=${Uri.encodeQueryComponent(query)}',
      ),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['results'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> patchLocale(String locale) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/v1/users/me/locale'),
      headers: _jsonHeaders,
      body: jsonEncode({'locale': locale}),
    );
    _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> getUiStrings({String? locale}) async {
    final q = locale != null ? '?locale=${Uri.encodeComponent(locale)}' : '';
    final res = await http.get(Uri.parse('$baseUrl/v1/meta/ui-strings$q'));
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> getLocales() async {
    final res = await http.get(Uri.parse('$baseUrl/v1/meta/locales'));
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['locales'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getIapReadiness() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/meta/iap-readiness'),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getIapProducts({String? platform}) async {
    final q = platform != null && platform.isNotEmpty
        ? '?platform=${Uri.encodeComponent(platform)}'
        : '';
    final res = await http.get(
      Uri.parse('$baseUrl/v1/meta/iap-products$q'),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMetaEconomy() async {
    final res = await http.get(Uri.parse('$baseUrl/v1/meta/economy'));
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['economy'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getMetaOfferwall() async {
    final res = await http.get(Uri.parse('$baseUrl/v1/meta/offerwall'));
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['offerwall'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getClientConfig({String? locale}) async {
    final q = locale != null && locale.isNotEmpty
        ? '?locale=${Uri.encodeComponent(locale)}'
        : '';
    final res = await http.get(
      Uri.parse('$baseUrl/v1/meta/client-config$q'),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['config'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getSupportResources({String? locale}) async {
    final q = locale != null && locale.isNotEmpty
        ? '?locale=${Uri.encodeComponent(locale)}'
        : '';
    final res = await http.get(
      Uri.parse('$baseUrl/v1/meta/support-resources$q'),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['resources'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getStoreCatalog({
    String? market,
    String? locale,
  }) async {
    final query = <String, String>{};
    if (market != null && market.isNotEmpty) query['market'] = market;
    if (locale != null && locale.isNotEmpty) query['locale'] = locale;
    final uri = Uri.parse('$baseUrl/v1/meta/store-catalog').replace(
      queryParameters: query.isEmpty ? null : query,
    );
    final res = await http.get(uri);
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> getPresets() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/characters/presets'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['presets'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<String> createFromPreset(
    String presetId, {
    String? locale,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/characters/from-preset'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'presetId': presetId,
        'locale': ?locale,
      }),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['characterId'] as String;
  }

  Future<String> exportConversation(String characterId) async {
    final res = await http.get(
      Uri.parse(
        '$baseUrl/v1/characters/$characterId/export?format=webnovel',
      ),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['markdown'] as String;
  }

  Future<String> createCharacter({
    required String name,
    required String personality,
    required String backstory,
    required String speakingStyle,
    String locale = 'zh-TW',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/characters'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'name': name,
        'personality': personality,
        'backstory': backstory,
        'speakingStyle': speakingStyle,
        'locale': locale,
      }),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['characterId'] as String;
  }

  Future<Map<String, dynamic>> getCharacter(String id) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/characters/$id'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> getMessages(String characterId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/characters/$characterId/messages?limit=50'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['messages'] as List<dynamic>)
        .cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> claimDailyCheckin() async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/rewards/daily-checkin'),
      headers: _authHeaders,
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      throw HuhuApiException(body['error']?.toString() ?? '${res.statusCode}');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> resetRelationship(String characterId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/characters/$characterId/relationship/reset'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<List<Map<String, dynamic>>> listMemories(
    String characterId, {
    int limit = 30,
  }) async {
    final res = await http.get(
      Uri.parse(
        '$baseUrl/v1/characters/$characterId/memories?limit=$limit',
      ),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  Future<void> deleteMemory(String characterId, String memoryId) async {
    final res = await http.delete(
      Uri.parse(
        '$baseUrl/v1/characters/$characterId/memories/$memoryId',
      ),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<void> clearMemories(String characterId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/characters/$characterId/memories'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<void> clearMessages(String characterId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/characters/$characterId/messages'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<void> deleteMessage(String characterId, String messageId) async {
    final res = await http.delete(
      Uri.parse(
        '$baseUrl/v1/characters/$characterId/messages/$messageId',
      ),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> getPricing({String region = 'TW'}) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/pricing?region=$region'),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> deleteAccountData() async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/users/me/data'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> getDefaultCharacter({String? locale}) async {
    final q = locale != null && locale.isNotEmpty
        ? '?locale=${Uri.encodeComponent(locale)}'
        : '';
    final res = await http.get(
      Uri.parse('$baseUrl/v1/meta/default-character$q'),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> claimOfferwall() async {
    final prepRes = await http.post(
      Uri.parse('$baseUrl/v1/rewards/offerwall/prepare'),
      headers: _authHeaders,
    );
    _throwIfFailed(prepRes);
    final prep = jsonDecode(prepRes.body) as Map<String, dynamic>;
    final payload = <String, dynamic>{};
    if (prep['verificationRequired'] == true) {
      payload['transactionId'] = prep['transactionId'];
      payload['timestamp'] = prep['timestamp'];
      payload['signature'] = prep['signature'];
    }
    final res = await http.post(
      Uri.parse('$baseUrl/v1/rewards/offerwall'),
      headers: _jsonHeaders,
      body: jsonEncode(payload),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> verifyIap({
    required String platform,
    required String productId,
    required String receipt,
    String? transactionId,
  }) async {
    final body = <String, dynamic>{
      'platform': platform,
      'productId': productId,
      'receipt': receipt,
    };
    if (transactionId != null && transactionId.isNotEmpty) {
      body['transactionId'] = transactionId;
    }
    final res = await http.post(
      Uri.parse('$baseUrl/v1/iap/verify'),
      headers: _jsonHeaders,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      throw HuhuApiException(
        body['error']?.toString() ?? res.reasonPhrase ?? 'Request failed',
      );
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listDiary(String characterId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/characters/$characterId/diary'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['entries'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> deleteDiary(String characterId, String entryId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/characters/$characterId/diary/$entryId'),
      headers: _authHeaders,
    );
    if (res.statusCode != 204) _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> patchDiary(
    String characterId,
    String entryId, {
    String? title,
    String? body,
    String? mood,
  }) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/v1/characters/$characterId/diary/$entryId'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'title': ?title,
        'body': ?body,
        'mood': ?mood,
      }),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['entry'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDiary(
    String characterId, {
    String? title,
    required String body,
    String? mood,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/characters/$characterId/diary'),
      headers: _jsonHeaders,
      body: jsonEncode({
        if (title != null && title.isNotEmpty) 'title': title,
        'body': body,
        'mood': ?mood,
      }),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['entry'] as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listFeedMoments() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/feed/moments'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['moments'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> reportMoment(
    String momentId, {
    String reason = 'spam',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/feed/moments/$momentId/report'),
      headers: _jsonHeaders,
      body: jsonEncode({'reason': reason}),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listFriendsFeedMoments() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/feed/moments/friends'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['moments'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> sendFriendRequest({
    String? targetUserId,
    String? inviteCode,
  }) async {
    final body = <String, String>{};
    if (targetUserId != null) body['targetUserId'] = targetUserId;
    if (inviteCode != null) body['inviteCode'] = inviteCode;
    final res = await http.post(
      Uri.parse('$baseUrl/v1/friends/request'),
      headers: _jsonHeaders,
      body: jsonEncode(body),
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listFriends() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/friends'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['friends'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> acceptFriendRequest(String friendshipId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/friends/$friendshipId/accept'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getInviteQr() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/users/me/invite-qr'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listBlockedUsers() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/blocks'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['blocked'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> blockUser(String userId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/blocks'),
      headers: _jsonHeaders,
      body: jsonEncode({'userId': userId}),
    );
    _throwIfFailed(res);
  }

  Future<void> unblockUser(String userId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/blocks/${Uri.encodeComponent(userId)}'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> listFriendRequests() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/friends/requests'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> listPublicFeedMoments() async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/feed/moments/public'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['moments'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> listMoments(String characterId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/v1/characters/$characterId/moments'),
      headers: _authHeaders,
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (data['moments'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> deleteMoment(String characterId, String momentId) async {
    final res = await http.delete(
      Uri.parse('$baseUrl/v1/characters/$characterId/moments/$momentId'),
      headers: _authHeaders,
    );
    if (res.statusCode != 204) _throwIfFailed(res);
  }

  Future<Map<String, dynamic>> createMoment(
    String characterId, {
    required String body,
    String? imageBase64,
    String? imageMimeType,
    String visibility = 'private',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/v1/characters/$characterId/moments'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'body': body,
        'visibility': visibility,
        'imageBase64': ?imageBase64,
        'imageMimeType': ?imageMimeType,
      }),
    );
    _throwIfFailed(res);
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['moment'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendChat({
    required String characterId,
    required String content,
    String mode = 'simple',
    String messageType = 'text',
    String? voiceAudioBase64,
    String? voiceMimeType,
    String? imageBase64,
    String? imageMimeType,
  }) async {
    final body = <String, dynamic>{
      'characterId': characterId,
      'content': content,
      'mode': mode,
      'messageType': messageType,
    };
    if (voiceAudioBase64 != null && voiceAudioBase64.isNotEmpty) {
      body['voiceAudioBase64'] = voiceAudioBase64;
      if (voiceMimeType != null) body['voiceMimeType'] = voiceMimeType;
    }
    if (imageBase64 != null && imageBase64.isNotEmpty) {
      body['imageBase64'] = imageBase64;
      if (imageMimeType != null) body['imageMimeType'] = imageMimeType;
    }
    final res = await http.post(
      Uri.parse('$baseUrl/v1/chat'),
      headers: _jsonHeaders,
      body: jsonEncode(body),
    );
    if (res.statusCode >= 400) {
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      throw HuhuApiException(
        body['error']?.toString() ?? res.reasonPhrase ?? 'Request failed',
      );
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  void _throwIfFailed(http.Response res) {
    if (res.statusCode >= 400) {
      try {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        throw HuhuApiException(body['error']?.toString() ?? '${res.statusCode}');
      } catch (_) {
        throw HuhuApiException('HTTP ${res.statusCode}');
      }
    }
  }
}

class HuhuApiException implements Exception {
  HuhuApiException(this.message);
  final String message;
  @override
  String toString() => message;
}
