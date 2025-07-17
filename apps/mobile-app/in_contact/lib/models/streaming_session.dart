class StreamingSession {
  final String id;
  final String userId;
  final DateTime startedAt;
  final DateTime? stoppedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  StreamingSession({
    required this.id,
    required this.userId,
    required this.startedAt,
    this.stoppedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StreamingSession.fromJson(Map<String, dynamic> json) {
    return StreamingSession(
      id: json['id'],
      userId: json['userId'],
      startedAt: DateTime.parse(json['startedAt']),
      stoppedAt: json['stoppedAt'] != null 
          ? DateTime.parse(json['stoppedAt']) 
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  bool get isActive => stoppedAt == null;
  
  Duration? get sessionDuration {
    if (stoppedAt == null) return null;
    return stoppedAt!.difference(startedAt);
  }
}