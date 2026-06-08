import 'package:flutter/material.dart';

Color _stageFillColor(String? stage, ColorScheme scheme) {
  switch (stage) {
    case 'stranger':
      return const Color(0xFF8A9BB8);
    case 'acquaintance':
      return const Color(0xFF7EB8D4);
    case 'ambiguous':
      return const Color(0xFFE89AC4);
    case 'dating':
      return scheme.primary;
    case 'partner':
    case 'married':
      return const Color(0xFFF5D76E);
    default:
      return scheme.primary;
  }
}

class AffectionMeter extends StatelessWidget {
  const AffectionMeter({
    super.key,
    required this.stageLabel,
    required this.percent,
    this.stage,
  });

  final String stageLabel;
  final int percent;
  final String? stage;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final fill = _stageFillColor(stage, colorScheme);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              stageLabel,
              style: TextStyle(
                color: fill,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text('$percent%', style: TextStyle(color: fill)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent / 100,
            minHeight: 8,
            backgroundColor: colorScheme.surfaceContainerHighest,
            color: fill,
          ),
        ),
      ],
    );
  }
}
