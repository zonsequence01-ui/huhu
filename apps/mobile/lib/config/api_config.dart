import 'package:flutter/foundation.dart';

/// Production API base URL (matches @huhu/shared STORE_PUBLIC_SITE_URL).
const String kProductionApiBaseUrl = 'https://huhu-app.pages.dev';

/// Android emulator loopback to host machine API.
const String kDebugEmulatorApiBaseUrl = 'http://10.0.2.2:3000';

/// iOS simulator / desktop debug loopback.
const String kDebugLocalApiBaseUrl = 'http://127.0.0.1:3000';

String defaultApiBaseUrl({required bool releaseMode}) {
  const fromEnv = String.fromEnvironment('API_BASE');
  if (fromEnv.isNotEmpty) return fromEnv;
  if (releaseMode) return kProductionApiBaseUrl;
  if (defaultTargetPlatform == TargetPlatform.android) {
    return kDebugEmulatorApiBaseUrl;
  }
  return kDebugLocalApiBaseUrl;
}

/// Dev-only hosts that must not be used in Play/App Store release builds.
bool isLocalDevApiUrl(String baseUrl) {
  final uri = Uri.tryParse(baseUrl.trim());
  if (uri == null || !uri.hasScheme) return false;
  final host = uri.host.toLowerCase();
  return host == '10.0.2.2' ||
      host == '127.0.0.1' ||
      host == 'localhost';
}

/// Whether a saved API override from SharedPreferences may be applied.
bool isApiBaseOverrideAllowed(
  String baseUrl, {
  required bool releaseMode,
}) {
  if (!releaseMode) return true;
  return !isLocalDevApiUrl(baseUrl);
}

/// Apply stored override if allowed; otherwise keep [defaultBase].
String resolveStoredApiBase(
  String? stored, {
  required String defaultBase,
  required bool releaseMode,
}) {
  if (stored == null || stored.isEmpty) return defaultBase;
  if (isApiBaseOverrideAllowed(stored, releaseMode: releaseMode)) {
    return stored;
  }
  return defaultBase;
}
