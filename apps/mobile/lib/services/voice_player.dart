import 'dart:convert';

import 'package:audioplayers/audioplayers.dart';

class VoicePlayer {
  final AudioPlayer _player = AudioPlayer();

  Future<void> playBase64(String audioBase64, {String mimeType = 'audio/mpeg'}) async {
    if (mimeType == 'text/plain' || audioBase64.isEmpty) return;
    final bytes = base64Decode(audioBase64);
    await _player.stop();
    await _player.play(BytesSource(bytes));
  }

  void dispose() {
    _player.dispose();
  }
}
