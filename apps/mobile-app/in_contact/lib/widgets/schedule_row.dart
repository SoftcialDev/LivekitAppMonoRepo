import 'package:flutter/material.dart';

class ScheduleRows extends StatelessWidget {
  final String event;
  final String time;
  final String? person;
  final String status;
  final bool isSelected;

  const ScheduleRows({
    super.key,
    required this.event,
    required this.time,
    this.person,
    required this.status,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Container(
        decoration:
            (isSelected)
                ? BoxDecoration(
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.red, width: 1),
                )
                : null,
        child: Padding(
          padding: const EdgeInsets.all(5.0),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  event,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 13,fontWeight: (isSelected) ? FontWeight.bold : FontWeight.normal),
                ),
              ),
              Expanded(
                child: Column(
                  children: [
                    Text(
                      time,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white, fontSize: 13,fontWeight: (isSelected) ? FontWeight.bold : FontWeight.normal),
                    ),
                    if (person != null)
                      Text(
                        person!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white, fontSize: 13,fontWeight: (isSelected) ? FontWeight.bold : FontWeight.normal),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    status,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontSize: 13,fontWeight: (isSelected) ? FontWeight.bold : FontWeight.normal),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
