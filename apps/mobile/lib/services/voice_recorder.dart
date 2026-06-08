import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

class VoiceRecorder {
  final AudioRecorder _recorder = AudioRecorder();
  String? _path;

  Future<bool> get hasPermission => _recorder.hasPermission();

  Future<void> start() async {
    if (!await hasPermission) {
      throw StateError('mic_permission_denied');
    }
    final dir = await getTemporaryDirectory();
    _path =
        '${dir.path}/huhu_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: _path!,
    );
  }

  Future<({String base64, String mimeType})?> stop() async {
    final path = await _recorder.stop();
    final filePath = path ?? _path;
    _path = null;
    if (filePath == null) return null;
    final file = File(filePath);
    if (!await file.exists()) return null;
    final bytes = await file.readAsBytes();
    if (bytes.length < 64) return null;
    try {
      await file.delete();
    } catch (_) {}
    return (
      base64: base64Encode(bytes),
      mimeType: 'audio/mp4',
    );
  }

  Future<void> dispose() => _recorder.dispose();
}
