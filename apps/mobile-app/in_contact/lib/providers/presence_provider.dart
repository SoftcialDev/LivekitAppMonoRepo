import 'package:flutter/material.dart';
import 'package:in_contact/services/websocket_client.dart';
import '../services/api_client.dart';

enum PresenceStatus {
  offline,
  online,
  away,
  busy,
}

class PresenceProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final WebSocketService _webSocketService = WebSocketService();
  
  PresenceStatus _currentStatus = PresenceStatus.offline;
  bool _isUpdating = false;
  String? _errorMessage;
  DateTime? _lastOnlineTime;
  String? _userEmail;

  PresenceStatus get currentStatus => _currentStatus;
  bool get isUpdating => _isUpdating;
  String? get errorMessage => _errorMessage;
  DateTime? get lastOnlineTime => _lastOnlineTime;
  bool get isOnline => _currentStatus == PresenceStatus.online;

  /// Initialize presence tracking for a user
  Future<void> initialize(String userEmail) async {
    _userEmail = userEmail;
    
    // Listen to WebSocket connection state changes
    _webSocketService.connectionState.listen((connectionState) {
      switch (connectionState) {
        case WebSocketConnectionState.connected:
          setOnline();
          break;
        case WebSocketConnectionState.disconnected:
        case WebSocketConnectionState.error:
          setOffline();
          break;
        case WebSocketConnectionState.connecting:
        case WebSocketConnectionState.reconnecting:
          // Keep current status during connection attempts
          break;
      }
    });
  }

  /// Set user status to online
  Future<bool> setOnline() async {
    return await _updatePresenceStatus(PresenceStatus.online);
  }

  /// Set user status to offline
  Future<bool> setOffline() async {
    return await _updatePresenceStatus(PresenceStatus.offline);
  }

  /// Set user status to away
  Future<bool> setAway() async {
    return await _updatePresenceStatus(PresenceStatus.away);
  }

  /// Set user status to busy
  Future<bool> setBusy() async {
    return await _updatePresenceStatus(PresenceStatus.busy);
  }

  /// Update presence status on backend
  Future<bool> _updatePresenceStatus(PresenceStatus status) async {
    if (_isUpdating) return false;

    try {
      _isUpdating = true;
      _errorMessage = null;
      notifyListeners();

      final statusString = _presenceStatusToString(status);
      await _apiClient.updatePresence(statusString);

      //final previousStatus = _currentStatus;
      _currentStatus = status;

      // Update last online time
      if (status == PresenceStatus.online) {
        _lastOnlineTime = DateTime.now();
      }

      // Log status change
    
      notifyListeners();
      return true;

    } catch (e) {
      _errorMessage = 'Failed to update presence: ${e.toString()}';
      notifyListeners();
      return false;
    } finally {
      _isUpdating = false;
      notifyListeners();
    }
  }

  /// Handle app lifecycle changes (when app goes to background/foreground)
  Future<void> handleAppLifecycleChange(AppLifecycleState state) async {
    switch (state) {
      case AppLifecycleState.resumed:
        // App came to foreground
        if (_userEmail != null) {
          await setOnline();
        }
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
        // App went to background or is closing
        await setOffline();
        break;
      case AppLifecycleState.inactive:
        // App is inactive (e.g., during a phone call)
        await setAway();
        break;
      case AppLifecycleState.hidden:
        // App is hidden
        await setAway();
        break;
    }
  }

  /// Get presence status as human-readable string
  String getStatusDisplayName(PresenceStatus status) {
    switch (status) {
      case PresenceStatus.online:
        return 'Online';
      case PresenceStatus.offline:
        return 'Offline';
      case PresenceStatus.away:
        return 'Away';
      case PresenceStatus.busy:
        return 'Busy';
    }
  }

  /// Get presence status color for UI
  Color getStatusColor(PresenceStatus status) {
    switch (status) {
      case PresenceStatus.online:
        return const Color(0xFF4CAF50); // Green
      case PresenceStatus.offline:
        return const Color(0xFF9E9E9E); // Grey
      case PresenceStatus.away:
        return const Color(0xFFFF9800); // Orange
      case PresenceStatus.busy:
        return const Color(0xFFF44336); // Red
    }
  }

  /// Get presence status icon for UI
  IconData getStatusIcon(PresenceStatus status) {
    switch (status) {
      case PresenceStatus.online:
        return Icons.circle;
      case PresenceStatus.offline:
        return Icons.circle_outlined;
      case PresenceStatus.away:
        return Icons.schedule;
      case PresenceStatus.busy:
        return Icons.do_not_disturb;
    }
  }

  /// Convert PresenceStatus enum to API string
  String _presenceStatusToString(PresenceStatus status) {
    switch (status) {
      case PresenceStatus.online:
        return 'online';
      case PresenceStatus.offline:
        return 'offline';
      case PresenceStatus.away:
        return 'away';
      case PresenceStatus.busy:
        return 'busy';
    }
  }

  /// Clear any error messages
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Get time since last online (for offline users)
  Duration? getTimeSinceLastOnline() {
    if (_lastOnlineTime == null) return null;
    return DateTime.now().difference(_lastOnlineTime!);
  }

  /// Get formatted time since last online
  String getFormattedTimeSinceLastOnline() {
    final duration = getTimeSinceLastOnline();
    if (duration == null) return 'Never';

    if (duration.inMinutes < 1) {
      return 'Just now';
    } else if (duration.inHours < 1) {
      return '${duration.inMinutes}m ago';
    } else if (duration.inDays < 1) {
      return '${duration.inHours}h ago';
    } else {
      return '${duration.inDays}d ago';
    }
  }

  @override
  void dispose() {
    // Ensure we set offline status when disposing
    if (_currentStatus != PresenceStatus.offline) {
      setOffline();
    }
    super.dispose();
  }
}