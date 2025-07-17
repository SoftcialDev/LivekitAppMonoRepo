import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:toastification/toastification.dart';
import 'providers/auth_provider.dart';
import 'providers/streaming_provider.dart';
import 'providers/presence_provider.dart';
import 'providers/command_provider.dart';
import 'screens/azure_ad_login_screen.dart';
import 'screens/enhanced_dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint('Warning: Could not load .env file: $e');
  }
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => StreamingProvider()),
        ChangeNotifierProvider(create: (_) => PresenceProvider()),
        ChangeNotifierProvider(create: (_) => CommandProvider()),
      ],
      child: const InContactApp(),
    ),
  );
}

class InContactApp extends StatelessWidget {
  const InContactApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ToastificationWrapper(
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'In Contact',
        theme: ThemeData(
          textTheme: GoogleFonts.montserratTextTheme(),
          scaffoldBackgroundColor: const Color(0xFF532287),
          primaryColor: const Color(0xFF532287), // Purple from Electron app
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF764E9F),
            brightness: Brightness.light,
          ),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF532287),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF532287),
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
          ),
        ),
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isLoading) {
              return const Scaffold(
                body: Center(
                  child: CircularProgressIndicator(),
                ),
              );
            }
            
            return auth.isAuthenticated 
                ? const EnhancedDashboardScreen() 
                : const AzureADLoginScreen();
          },
        ),
      ),
    );
  }
}