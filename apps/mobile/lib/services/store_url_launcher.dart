import 'package:url_launcher/url_launcher.dart';

Future<bool> openStoreUrl(String? url) async {
  if (url == null || url.isEmpty) return false;
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
