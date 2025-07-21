import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get azureAdClientId => dotenv.env['AZURE_AD_CLIENT_ID'] ?? '';
  static String get azureAdTenantId => dotenv.env['AZURE_AD_TENANT_ID'] ?? '';
  static String get azureAdRedirectUri => dotenv.env['AZURE_AD_REDIRECT_URI'] ?? '';
  static String get azureAdApiScopeUri => dotenv.env['AZURE_AD_API_SCOPE_URI'] ?? '';
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? '';
  static String get liveKitUrl => dotenv.env['LIVEKIT_URL'] ?? '';

  static String get azureAdAuthority => 'https://login.microsoftonline.com/$azureAdTenantId/v2.0';
}
