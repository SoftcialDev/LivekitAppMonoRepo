import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:in_contact/services/websocket_client.dart';
import '../models/command_model.dart';
import '../services/api_client.dart';
import '../providers/streaming_provider.dart';

class CommandProvider with ChangeNotifier {
  final WebSocketService _webSocketService = WebSocketService();
  final ApiClient _apiClient = ApiClient();
  
  StreamingProvider? _streamingProvider;
  StreamSubscription? _commandSubscription;
  StreamSubscription? _connectionSubscription;
  
  List<PendingCommand> _pendingCommands = [];
  List<PendingCommand> _commandHistory = [];
  bool _isProcessing = false;
  String? _errorMessage;
  bool _isInitialized = false;

  List<PendingCommand> get pendingCommands => List.unmodifiable(_pendingCommands);
  List<PendingCommand> get commandHistory => List.unmodifiable(_commandHistory);
  bool get isProcessing => _isProcessing;
  String? get errorMessage => _errorMessage;
  bool get isInitialized => _isInitialized;

  /// Initialize command provider with streaming provider reference
  Future<void> initialize(StreamingProvider streamingProvider, String userEmail) async {
    if (_isInitialized) {
      return;
    }

    _streamingProvider = streamingProvider;
    
    try {
      // Connect to WebSocket service
      await _webSocketService.connect(userEmail);
      
      // Listen to incoming commands
      _commandSubscription = _webSocketService.commands.listen(
        _handleIncomingCommand,
        onError: (error) {
          _errorMessage = 'Command stream error: $error';
          notifyListeners();
        },
      );

      // Listen to connection state changes
      _connectionSubscription = _webSocketService.connectionState.listen(
        _handleConnectionStateChange,
      );

      // Fetch any pending commands that were missed while offline
      await _fetchPendingCommands();
      
      _isInitialized = true;
      _errorMessage = null;
      notifyListeners();
      
      
    } catch (e) {
      _errorMessage = 'Failed to initialize commands: ${e.toString()}';
      notifyListeners();
    }
  }

  /// Handle incoming real-time commands
  Future<void> _handleIncomingCommand(PendingCommand command) async {
    
    // Add to pending list
    _pendingCommands.add(command);
    notifyListeners();
    
    // Process the command immediately
    await _executeCommand(command);
  }

  /// Execute a command (START or STOP streaming)
  Future<void> _executeCommand(PendingCommand command) async {
    if (_streamingProvider == null) {
      return;
    }

    _isProcessing = true;
    notifyListeners();

    try {

      bool success = false;

      switch (command.command.toUpperCase()) {
        case 'START':
          success = await _streamingProvider!.startStreaming();
          break;
        case 'STOP':
          success = await _streamingProvider!.stopStreaming();
          break;
        default:
          _errorMessage = 'Unknown command: ${command.command}';
          notifyListeners();
          return;
      }

      if (success) {
        // Remove from pending and add to history
        _pendingCommands.removeWhere((cmd) => cmd.id == command.id);
        _commandHistory.insert(0, command);
        
        // Limit history size
        if (_commandHistory.length > 50) {
          _commandHistory = _commandHistory.take(50).toList();
        }

        // Acknowledge the command with backend
        await _acknowledgeCommand(command.id);
        
      } else {
        _errorMessage = 'Failed to execute command: ${command.command}';
      }

    } catch (e) {
      _errorMessage = 'Command execution error: ${e.toString()}';
    } finally {
      _isProcessing = false;
      notifyListeners();
    }
  }

  /// Fetch pending commands from backend API
  Future<void> _fetchPendingCommands() async {
    try {
      
      final commands = await _apiClient.fetchPendingCommands();
      
      final pendingList = commands
          .map((json) => PendingCommand.fromJson(json as Map<String, dynamic>))
          .toList();

      
      // Log each command for debugging
      // for (final command in pendingList) {
      // }

      // Process each pending command
      for (final command in pendingList) {
        if (!_pendingCommands.any((cmd) => cmd.id == command.id)) {
          await _executeCommand(command);
        }
      }

    } catch (e) {
      _errorMessage = 'Failed to fetch pending commands: ${e.toString()}';
      notifyListeners();
    }
  }

  /// Acknowledge command completion with backend
  Future<void> _acknowledgeCommand(String commandId) async {
    try {
      await _apiClient.acknowledgePendingCommands([commandId]);
    } catch (e) {
      // Don't treat acknowledgment failures as critical errors
    }
  }

  /// Handle WebSocket connection state changes
  void _handleConnectionStateChange(WebSocketConnectionState state) {
    switch (state) {
      case WebSocketConnectionState.connected:
        // When reconnected, fetch any missed commands
        _fetchPendingCommands();
        break;
      case WebSocketConnectionState.disconnected:
      case WebSocketConnectionState.error:
        _errorMessage = 'Lost connection to command service';
        notifyListeners();
        break;
      case WebSocketConnectionState.connecting:
      case WebSocketConnectionState.reconnecting:
        // Clear error during connection attempts
        if (_errorMessage?.contains('connection') == true) {
          _errorMessage = null;
          notifyListeners();
        }
        break;
    }
  }

  /// Manually retry fetching pending commands
  Future<void> retryFetchCommands() async {
    _errorMessage = null;
    notifyListeners();
    await _fetchPendingCommands();
  }

  /// Clear a specific command from pending list (if manually handled)
  void clearPendingCommand(String commandId) {
    _pendingCommands.removeWhere((cmd) => cmd.id == commandId);
    notifyListeners();
  }

  /// Clear command history
  void clearHistory() {
    _commandHistory.clear();
    notifyListeners();
  }

  /// Get command by ID from history
  PendingCommand? getCommandFromHistory(String commandId) {
    try {
      return _commandHistory.firstWhere((cmd) => cmd.id == commandId);
    } catch (e) {
      return null;
    }
  }

  /// Get recent commands (last N commands)
  List<PendingCommand> getRecentCommands(int count) {
    return _commandHistory.take(count).toList();
  }

  /// Check if a command is currently pending
  bool isCommandPending(String commandId) {
    return _pendingCommands.any((cmd) => cmd.id == commandId);
  }

  /// Get count of pending commands
  int get pendingCommandCount => _pendingCommands.length;

  /// Clear error messages
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Get connection status from WebSocket service
  WebSocketConnectionState get connectionState => _webSocketService.currentState;

  /// Check if connected to command service
  bool get isConnected => _webSocketService.isConnected;

  @override
  void dispose() {
    _commandSubscription?.cancel();
    _connectionSubscription?.cancel();
    _webSocketService.disconnect();
    super.dispose();
  }
}