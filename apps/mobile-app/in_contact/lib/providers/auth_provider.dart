import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:in_contact/services/websocket_client.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  final WebSocketService _webSocketService = WebSocketService();
  
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  String? _accessToken;
  String? _errorMessage;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get accessToken => _accessToken;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    try {
      // Initialize MSAL first
      await _authService.initialize();
      
      // Attempt silent login (using cached Azure AD tokens)
      final result = await _authService.attemptSilentLogin();
      if (result != null) {
        _accessToken = result.accessToken;
        _user = result.user;
        _isAuthenticated = true;
        
        // Store token for backup (though MSAL handles its own caching)
        await _storage.write(key: 'access_token', value: _accessToken);
      }
    } catch (e) {
      await _storage.delete(key: 'access_token');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Login with Azure AD (Microsoft Entra)
  Future<bool> loginWithAzureAD() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _authService.loginWithAzureAD();
      _accessToken = result.accessToken;
      _user = result.user;
      _isAuthenticated = true;

      await _storage.write(key: 'access_token', value: _accessToken);
      
      return true;
    } catch (e) {
      _errorMessage = 'Azure AD login failed: ${e.toString()}';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Legacy login method - now redirects to Azure AD
  @Deprecated('Use loginWithAzureAD() instead')
  Future<bool> login(String username, String password) async {
    // Ignore username/password and use Azure AD
    return await loginWithAzureAD();
  }

  Future<void> logout() async {
    try {
      // Disconnect WebSocket first
      await _webSocketService.disconnect();
      
      // Call Azure AD logout
      await _authService.logout();
      
    } catch (e) {
      // Continue with local logout even if services fail
    }
    
    // Clear local authentication state
    _user = null;
    _accessToken = null;
    _isAuthenticated = false;
    _errorMessage = null;
    
    // Clear stored tokens
    await _storage.delete(key: 'access_token');
    
    notifyListeners();
  }

  /// Call this method to cleanup all services during logout
  /// Other providers should listen to auth state changes and cleanup accordingly
  Future<void> logoutAndCleanup() async {
    await logout();
    
    // Note: Other providers (StreamingProvider, PresenceProvider, CommandProvider) 
    // should listen to AuthProvider.isAuthenticated changes in their constructors
    // and automatically disconnect/cleanup when user logs out
  }

  bool hasRole(String role) {
    return _user?.roles.contains(role) ?? false;
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}