class PendingCommand {
  final String id;
  final String command;
  final String? userId; 
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  PendingCommand({
    required this.id,
    required this.command,
    this.userId,  // Optional
    required this.timestamp,
    this.metadata,
  });

  factory PendingCommand.fromJson(Map<String, dynamic> json) {
    return PendingCommand(
      id: json['id'] ?? json['employeeEmail'] ?? '${json['command']}-${json['timestamp']}',
      command: json['command'],
      userId: json['userId'] ?? json['employeeEmail'],  // Can be null
      timestamp: DateTime.parse(json['timestamp']),
      metadata: json['metadata'],
    );
  }

  bool get isStartCommand => command.toUpperCase() == 'START';
  bool get isStopCommand => command.toUpperCase() == 'STOP';
}