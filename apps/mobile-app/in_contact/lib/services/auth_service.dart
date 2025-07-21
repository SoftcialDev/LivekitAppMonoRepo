import '../models/user_model.dart';
import 'api_client.dart';
import 'msal_auth_service.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();
  final MSALAuthService _msalService = MSALAuthService();

  /// Initialize authentication service
  Future<void> initialize() async {
    await _msalService.initialize();
  }

  /// Perform Azure AD login
  Future<AuthResult> loginWithAzureAD() async {
    try {
      final result = await _msalService.loginInteractive();
      
      // Set the token in the API client for future requests
      _apiClient.setAccessToken(result.accessToken);

      return result;
    } catch (e) {
      throw Exception('Azure AD authentication failed: ${e.toString()}');
    }
  }

  /// Attempt silent login (auto-login with cached tokens)
  Future<AuthResult?> attemptSilentLogin() async {
    try {
      final result = await _msalService.loginSilent();
      
      if (result != null) {
        // Set the token in the API client for future requests
        _apiClient.setAccessToken(result.accessToken);
      }
      
      return result;
    } catch (e) {
      // Silent login failure is expected - user needs to login interactively
      return null;
    }
  }

  /// Check if user is currently signed in
  Future<bool> isSignedIn() async {
    return await _msalService.isSignedIn();
  }

  /// Get current access token for API calls
  Future<String?> getCurrentAccessToken() async {
    return await _msalService.getCurrentAccessToken();
  }

  /// Logout from Azure AD and clear tokens
  Future<void> logout() async {
    try {
      await _msalService.logout();
    } catch (e) {
      // Logout errors can be ignored as we clear local state anyway
    } finally {
      _apiClient.setAccessToken(null);
    }
  }

  // Legacy method for backward compatibility - now redirects to Azure AD
  @Deprecated('Use loginWithAzureAD() instead')
  Future<AuthResult> login(String username, String password) async {
    // For backward compatibility, this now triggers Azure AD login
    // The username/password parameters are ignored as Azure AD handles auth
    return await loginWithAzureAD();
  }

  // Legacy method for backward compatibility
  @Deprecated('Use getCurrentAccessToken() and MSAL user info instead')
  Future<User> getUserInfo(String accessToken) async {
    try {
      _apiClient.setAccessToken(accessToken);
      
      // Try to get user info from your API if needed
      final response = await _apiClient.get('/api/auth/me');
      final userData = response.data as Map<String, dynamic>;
      
      return User.fromJson(userData);
    } catch (e) {
      throw Exception('Failed to get user info: ${e.toString()}');
    }
  }
}