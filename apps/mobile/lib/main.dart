import 'package:flutter/material.dart';

import 'screens/chat_screen.dart';

void main() {
  runApp(const HuhuApp());
}

class HuhuApp extends StatelessWidget {
  const HuhuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '呼呼 Huhu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF8FAB),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const ChatScreen(),
    );
  }
}
