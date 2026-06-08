import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:huhu_mobile/config/api_config.dart';

void main() {
  test('release defaults to production API', () {
    expect(
      defaultApiBaseUrl(releaseMode: true),
      kProductionApiBaseUrl,
    );
  });

  test('debug uses platform-appropriate loopback', () {
    final expected = defaultTargetPlatform == TargetPlatform.android
        ? kDebugEmulatorApiBaseUrl
        : kDebugLocalApiBaseUrl;
    expect(defaultApiBaseUrl(releaseMode: false), expected);
  });

  test('detects local dev API hosts', () {
    expect(isLocalDevApiUrl('http://10.0.2.2:3000'), isTrue);
    expect(isLocalDevApiUrl('http://127.0.0.1:3000'), isTrue);
    expect(isLocalDevApiUrl('http://localhost:3000'), isTrue);
    expect(isLocalDevApiUrl(kProductionApiBaseUrl), isFalse);
  });

  test('resolveStoredApiBase ignores dev override in release', () {
    expect(
      resolveStoredApiBase(
        'http://10.0.2.2:3000',
        defaultBase: kProductionApiBaseUrl,
        releaseMode: true,
      ),
      kProductionApiBaseUrl,
    );
  });
}
