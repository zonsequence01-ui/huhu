import 'package:flutter_test/flutter_test.dart';
import 'package:huhu_mobile/widgets/affection_meter.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('AffectionMeter renders', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AffectionMeter(stageLabel: '熟人', percent: 12, stage: 'acquaintance'),
        ),
      ),
    );
    expect(find.text('熟人'), findsOneWidget);
    expect(find.text('12%'), findsOneWidget);
  });
}
