import 'package:msal_auth/msal_auth.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import '../config/app_config.dart';
import '../models/user_model.dart';

class MSALAuthService {
  static final MSALAuthService _instance = MSALAuthService._internal();
  factory MSALAuthService() => _instance;
  MSALAuthService._internal();

  SingleAccountPca? _msalAuth;
  bool _isInitialized = false;

  /// Initialize MSAL with Azure AD configuration
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _msalAuth = await SingleAccountPca.create(
        clientId: AppConfig.azureAdClientId,
        androidConfig: AndroidConfig(
          configFilePath: 'assets/msal_config.json',
          redirectUri: AppConfig.azureAdRedirectUri,
        ),
        appleConfig: AppleConfig(
          authority: AppConfig.azureAdAuthority,
          authorityType: AuthorityType.aad,
          broker: Broker.msAuthenticator,
        ),
      );

      _isInitialized = true;
    } catch (e) {
      throw Exception('MSAL initialization failed: $e');
    }
  }

  /// Perform interactive login with Azure AD
  Future<AuthResult> loginInteractive() async {
    if (!_isInitialized || _msalAuth == null) {
      throw Exception('MSAL not initialized. Call initialize() first.');
    }

    try {
      // First get basic authentication with OpenID scopes
      final basicScopes = ['openid', 'profile', 'email'];
      final basicAuth = await _msalAuth!.acquireToken(scopes: basicScopes);
      
      // Then get API-specific token
      final apiScopes = [AppConfig.azureAdApiScopeUri];
      final apiAuth = await _msalAuth!.acquireToken(scopes: apiScopes);
      
      final user = await _extractUserFromAuthResult(basicAuth);
      return AuthResult(
        accessToken: apiAuth.accessToken,  // Use API token for backend calls
        user: user,
      );
    } catch (e) {
      throw Exception('Azure AD login failed: $e');
    }
  }

  /// Attempt silent login (refresh token)
  Future<AuthResult?> loginSilent() async {
    if (!_isInitialized || _msalAuth == null) {
      return null;
    }

    try {
      final scopes = [
        AppConfig.azureAdApiScopeUri,  // API-specific scope for backend
      ];

      final authResult = await _msalAuth!.acquireTokenSilent(scopes: scopes);

      final user = await _extractUserFromAuthResult(authResult);
      return AuthResult(
        accessToken: authResult.accessToken,
        user: user,
      );
    } catch (e) {
      // Silent login failure is expected if no valid refresh token
      return null;
    }
  }

  /// Logout and clear cached tokens
  Future<void> logout() async {
    if (!_isInitialized || _msalAuth == null) {
      return;
    }

    try {
      await _msalAuth!.signOut();
    } catch (e) {
      // Don't throw on logout errors - app should still sign out locally
    }
  }

  /// Check if user is currently signed in
  Future<bool> isSignedIn() async {
    if (!_isInitialized || _msalAuth == null) {
      return false;
    }

    try {
      // Try to get a token silently - if successful, user is signed in
      final scopes = [AppConfig.azureAdApiScopeUri];
      final authResult = await _msalAuth!.acquireTokenSilent(scopes: scopes);
      return authResult.accessToken.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Extract user information from AuthenticationResult object
  Future<User> _extractUserFromAuthResult(AuthenticationResult authResult) async {
    try {
      // Get user info from account object
      final account = authResult.account;
      final userId = account.id;
      final email = account.username ?? 'unknown@domain.com';
      final name = account.name ?? email.split('@')[0];
      
      // Extract roles from JWT access token if available
      List<String> roles = [];
      
      if (authResult.accessToken.isNotEmpty) {
        try {
          // Decode the JWT token to get claims
          Map<String, dynamic> decodedToken = JwtDecoder.decode(authResult.accessToken);
          
          // Check for roles claim (if configured in Azure AD)
          if (decodedToken.containsKey('roles')) {
            final rolesData = decodedToken['roles'];
            if (rolesData is List) {
              roles = rolesData.cast<String>();
            } else if (rolesData is String) {
              roles = [rolesData];
            }
          }
          
          // Check for groups claim (common in Azure AD)
          if (roles.isEmpty && decodedToken.containsKey('groups')) {
            final groupsData = decodedToken['groups'];
            if (groupsData is List) {
              roles = _mapGroupsToRoles(groupsData.cast<String>());
            }
          }
        } catch (e) {
        }
      }
      
      // Default role if none found
      if (roles.isEmpty) {
        roles = ['Employee']; // Default role for healthcare workers
      }


      return User(
        id: userId,
        email: email,
        name: name,
        roles: roles,
      );
    } catch (e) {
      // Fallback to basic user info if extraction fails
      return User(
        id: 'azure-user-id',
        email: 'user@collettehealth.com',
        name: 'Azure AD User',
        roles: ['Employee'],
      );
    }
  }

  /// Map Azure AD groups to application roles
  List<String> _mapGroupsToRoles(List<String> groupIds) {
    // Configure these mappings based on your Azure AD group setup
    // You'll need to replace these with your actual Azure AD group IDs
    const groupRoleMapping = {
      // Example group ID mappings - replace with your actual group IDs from Azure AD
      '12345678-1234-1234-1234-123456789012': 'Admin',
      '87654321-4321-4321-4321-210987654321': 'Supervisor', 
      '11111111-2222-3333-4444-555566667777': 'Employee',
    };

    List<String> roles = [];
    for (final groupId in groupIds) {
      if (groupRoleMapping.containsKey(groupId)) {
        roles.add(groupRoleMapping[groupId]!);
      }
    }

    return roles.isEmpty ? ['Employee'] : roles;
  }

  /// Get current access token (for API calls)
  Future<String?> getCurrentAccessToken() async {
    if (!_isInitialized || _msalAuth == null) {
      return null;
    }

    try {
      final scopes = [AppConfig.azureAdApiScopeUri];
      final authResult = await _msalAuth!.acquireTokenSilent(scopes: scopes);
      
      return authResult.accessToken;
    } catch (e) {
      return null;
    }
  }

  /// Get user info from Microsoft Graph API (optional enhancement)
  Future<Map<String, dynamic>?> getUserInfoFromGraph() async {
    try {
      final token = await getCurrentAccessToken();
      if (token == null) return null;

      // You can implement Microsoft Graph API calls here
      // to get additional user information like:
      // - Profile photo
      // - Manager information
      // - Department/Office location
      // - Group memberships
      
      return null; // Placeholder
    } catch (e) {
      return null;
    }
  }
}