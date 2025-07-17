import 'package:flutter/material.dart';

class ObserverInfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const ObserverInfoRow({Key? key, required this.icon, required this.text})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF532287), size: 16),
        const SizedBox(width: 10),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF532287),
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}