import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/command_model.dart';
import 'api_client.dart';

enum WebSocketConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
  error,
}

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  final ApiClient _apiClient = ApiClient();
  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;

  WebSocketConnectionState _connectionState = WebSocketConnectionState.disconnected;
  String? _userEmail;
  String? _webSocketUrl;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  static const Duration _reconnectDelay = Duration(seconds: 5);

  // Stream controllers for events
  final StreamController<WebSocketConnectionState> _connectionStateController =
      StreamController<WebSocketConnectionState>.broadcast();
  final StreamController<PendingCommand> _commandController =
      StreamController<PendingCommand>.broadcast();
  final StreamController<String> _errorController =
      StreamController<String>.broadcast();

  // Public streams
  Stream<WebSocketConnectionState> get connectionState => _connectionStateController.stream;
  Stream<PendingCommand> get commands => _commandController.stream;
  Stream<String> get errors => _errorController.stream;

  WebSocketConnectionState get currentState => _connectionState;
  bool get isConnected => _connectionState == WebSocketConnectionState.connected;

  /// Connect to Azure Web PubSub using user email as group identifier
  Future<bool> connect(String userEmail) async {
    if (_connectionState == WebSocketConnectionState.connected) {
      return true;
    }

    _userEmail = userEmail;
    _updateConnectionState(WebSocketConnectionState.connecting);

    try {
      // Get WebSocket URL from backend API
      _webSocketUrl = await _apiClient.getWebPubSubToken();
            
      // Validate and convert WebSocket URL format
      if (_webSocketUrl == null || _webSocketUrl!.isEmpty) {
        throw Exception('Empty WebSocket URL received from API');
      }
      
      // Convert HTTPS to WSS and HTTP to WS for WebSocket compatibility
      if (_webSocketUrl!.startsWith('https://')) {
        _webSocketUrl = _webSocketUrl!.replaceFirst('https://', 'wss://');
      } else if (_webSocketUrl!.startsWith('http://')) {
        _webSocketUrl = _webSocketUrl!.replaceFirst('http://', 'ws://');
      } else if (!_webSocketUrl!.startsWith('ws://') && !_webSocketUrl!.startsWith('wss://')) {
        throw Exception('Invalid URL scheme. Expected HTTP(S) or WS(S). URL: $_webSocketUrl');
      }
      
      
      final uri = Uri.parse(_webSocketUrl!);
      
      _channel = WebSocketChannel.connect(uri);
      
      // Wait for connection to be established with timeout
      try {
        await _channel!.ready.timeout(const Duration(seconds: 10));
      } catch (timeoutError) {
        throw Exception('WebSocket connection timeout: $timeoutError');
      }
      
      _updateConnectionState(WebSocketConnectionState.connected);
      _reconnectAttempts = 0;
      
      // Start listening to messages
      _startListening();
      
      // Note: Azure Web PubSub handles heartbeat and group joining automatically
      // No manual messages needed - everything is managed by the Azure Web PubSub service
      
      return true;
      
    } catch (e) {
      if (e is Exception) {
      }
      _handleConnectionError(e.toString());
      return false;
    }
  }

  /// Disconnect from WebSocket
  Future<void> disconnect() async {
    
    _reconnectTimer?.cancel();
    _heartbeatTimer?.cancel();
    
    if (_subscription != null) {
      await _subscription!.cancel();
      _subscription = null;
    }
    
    if (_channel != null) {
      await _channel!.sink.close(status.goingAway);
      _channel = null;
    }
    
    _updateConnectionState(WebSocketConnectionState.disconnected);
  }

  /// Start listening to WebSocket messages
  void _startListening() {
    debugPrint('[WebSocket] Starting to listen for messages...');
    _subscription = _channel!.stream.listen(
      (data) {
        debugPrint('[WebSocket] *** MESSAGE RECEIVED *** Data type: ${data.runtimeType}');
        try {
          _handleMessage(data);
        } catch (e) {
          debugPrint('[WebSocket] Error handling message: $e');
          debugPrint('[WebSocket] Raw data that caused error: $data');
          _errorController.add('Message handling error: $e');
        }
      },
      onError: (error) {
        debugPrint('[WebSocket] Stream error: $error');
        _handleConnectionError(error.toString());
      },
      onDone: () {
        debugPrint('[WebSocket] Stream closed');
        _handleConnectionClosed();
      },
    );
  }

  /// Handle incoming WebSocket messages
  void _handleMessage(dynamic data) {
    try {
      debugPrint('[WebSocket] Raw message received: $data');
      // final Map<String, dynamic> message = jsonDecode(data.toString());
      // final messageType = message['type'] as String?;
       var decoded = jsonDecode(data.toString());
  
  // If it's still a string after first decode, decode again
  if (decoded is String) {
    decoded = jsonDecode(decoded);
  }
  
    final Map<String, dynamic> message = decoded as Map<String, dynamic>;
    final messageType = message['command'] as String?;
    
      debugPrint('[WebSocket] Parsed message: $message');
      debugPrint('[WebSocket] Message type: $messageType');
      
      switch (messageType) {
        case 'system':
          _handleSystemMessage(message);
          break;
        case 'message':
          _handleDataMessage(message);
          break;
        case 'ack':
          _handleAcknowledgment(message);
          break;
        case 'pong':
          // Heartbeat response - connection is alive
          break;
        default:
          debugPrint('[WebSocket] Unknown message type: $messageType');
          // Try to handle as direct command (Azure Web PubSub format)
          _handleDirectCommand(message);
      }
    } catch (e) {
      debugPrint('[WebSocket] Failed to parse message: $e');
      _errorController.add('Message parsing error: $e');
    }
  }

  /// Handle direct command messages (Azure Web PubSub format like Electron app)
  void _handleDirectCommand(Map<String, dynamic> message) {
    debugPrint('[WebSocket] Trying to handle as direct command: $message');
    
    // Check if this looks like a direct command (like Electron app receives)
    if (message.containsKey('command') && message.containsKey('employeeEmail')) {
      try {
        debugPrint('[WebSocket] Found direct command: $message');
        final command = PendingCommand.fromJson(message);
        _commandController.add(command);
        debugPrint('[WebSocket] Direct command received and added to stream: ${command.command}');
      } catch (e) {
        debugPrint('[WebSocket] Failed to parse direct command: $e');
        _errorController.add('Direct command parsing error: $e');
      }
    } else {
      debugPrint('[WebSocket] Message does not appear to be a direct command: $message');
    }
  }

  /// Handle system messages (connection events, errors, etc.)
  void _handleSystemMessage(Map<String, dynamic> message) {
    final event = message['event'] as String?;
    
    switch (event) {
      case 'connected':
        debugPrint('[WebSocket] System: Connected');
        break;
      case 'disconnected':
        debugPrint('[WebSocket] System: Disconnected');
        _handleConnectionClosed();
        break;
      default:
        debugPrint('[WebSocket] System event: $event');
    }
  }

  /// Handle data messages (commands, notifications, etc.)
  void _handleDataMessage(Map<String, dynamic> message) {
    debugPrint('[WebSocket] Handling data message: $message');
    final data = message['data'];
    debugPrint('[WebSocket] Data content: $data');
    
    if (data is Map<String, dynamic>) {
      debugPrint('[WebSocket] Data is a map, checking for command...');
      // Check if this is a command message
      if (data.containsKey('command') && data.containsKey('id')) {
        try {
          debugPrint('[WebSocket] Found command data: $data');
          final command = PendingCommand.fromJson(data);
          _commandController.add(command);
          debugPrint('[WebSocket] Command received and added to stream: ${command.command}');
        } catch (e) {
          debugPrint('[WebSocket] Failed to parse command: $e');
          _errorController.add('Command parsing error: $e');
        }
      } else {
        debugPrint('[WebSocket] Data message does not contain command/id keys: $data');
      }
    } else {
      debugPrint('[WebSocket] Data is not a map, type: ${data.runtimeType}, content: $data');
    }
  }

  /// Handle acknowledgment messages
  void _handleAcknowledgment(Map<String, dynamic> message) {
    final ackId = message['ackId'];
    debugPrint('[WebSocket] Acknowledged: $ackId');
  }

  /// Handle connection errors
  void _handleConnectionError(String error) {
    _updateConnectionState(WebSocketConnectionState.error);
    _errorController.add(error);
    
    if (_reconnectAttempts < _maxReconnectAttempts) {
      _scheduleReconnect();
    } else {
      debugPrint('[WebSocket] Max reconnection attempts reached');
      _updateConnectionState(WebSocketConnectionState.disconnected);
    }
  }

  /// Handle connection closed
  void _handleConnectionClosed() {
    if (_connectionState != WebSocketConnectionState.disconnected) {
      _updateConnectionState(WebSocketConnectionState.disconnected);
      
      if (_reconnectAttempts < _maxReconnectAttempts) {
        _scheduleReconnect();
      }
    }
  }

  /// Schedule automatic reconnection
  void _scheduleReconnect() {
    if (_userEmail == null) return;
    
    _reconnectAttempts++;
    _updateConnectionState(WebSocketConnectionState.reconnecting);
        
    _reconnectTimer = Timer(_reconnectDelay, () {
      if (_connectionState == WebSocketConnectionState.reconnecting) {
        connect(_userEmail!);
      }
    });
  }

  /// Update connection state and notify listeners
  void _updateConnectionState(WebSocketConnectionState newState) {
    if (_connectionState != newState) {
      _connectionState = newState;
      _connectionStateController.add(newState);
    }
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _connectionStateController.close();
    _commandController.close();
    _errorController.close();
  }
}