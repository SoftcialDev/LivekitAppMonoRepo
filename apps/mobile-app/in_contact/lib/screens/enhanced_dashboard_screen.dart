import 'package:flutter/material.dart';
import 'package:in_contact/models/observer_info_row.dart';
import 'package:in_contact/widgets/schedule_row.dart';
import 'package:in_contact/widgets/schedule_row_header.dart';
import 'package:provider/provider.dart';
import 'package:toastification/toastification.dart';
import '../providers/auth_provider.dart';
import '../providers/streaming_provider.dart';
import '../providers/presence_provider.dart';
import '../providers/command_provider.dart';

class EnhancedDashboardScreen extends StatefulWidget {
  const EnhancedDashboardScreen({Key? key}) : super(key: key);

  @override
  State<EnhancedDashboardScreen> createState() =>
      _EnhancedDashboardScreenState();
}

class _EnhancedDashboardScreenState extends State<EnhancedDashboardScreen>
    with WidgetsBindingObserver {
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeServices();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Handle app lifecycle changes for presence
    final presenceProvider = context.read<PresenceProvider>();
    presenceProvider.handleAppLifecycleChange(state);
  }

  Future<void> _initializeServices() async {
    if (_isInitialized) return;

    final authProvider = context.read<AuthProvider>();
    final streamingProvider = context.read<StreamingProvider>();
    final presenceProvider = context.read<PresenceProvider>();
    final commandProvider = context.read<CommandProvider>();

    if (!authProvider.isAuthenticated) return;

    final userEmail = authProvider.user?.email;
    if (userEmail == null) return;

    try {
      // Initialize camera
      await streamingProvider.initializeCameras();

      // Initialize presence tracking
      await presenceProvider.initialize(userEmail);

      // Initialize command handling
      await commandProvider.initialize(streamingProvider, userEmail);

      // Set user as online
      await presenceProvider.setOnline();

      _isInitialized = true;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Initialization failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    final authProvider = context.read<AuthProvider>();
    final streamingProvider = context.read<StreamingProvider>();
    final presenceProvider = context.read<PresenceProvider>();

    // Stop streaming if active
    if (streamingProvider.isStreaming) {
      toastification.show(
        type: ToastificationType.error,
        title: Text('You cannot logout during active streaming'),
        autoCloseDuration: const Duration(seconds: 5),
      );
      //await streamingProvider.stopStreaming();
    } else {
      // Set offline status
      await presenceProvider.setOffline();

      // Logout and cleanup all services
      await authProvider.logoutAndCleanup();
    }
  }

  @override
  Widget build(BuildContext context) {
    double width = MediaQuery.of(context).size.width;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Color(0xFF532287),
        leading: IconButton(
          onPressed: () {
            toastification.show(
              type: ToastificationType.error,
              title: Text('Feature not available'),
              autoCloseDuration: const Duration(seconds: 5),
            );
          },
          icon: Icon(Icons.arrow_back, color: Colors.white),
        ),
        title: const Text('In Contact'),
        centerTitle: true,
        actions: [
          // User menu
          Consumer<AuthProvider>(
            builder: (context, auth, _) {
              return PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'logout') {
                    _handleLogout();
                  }
                },
                itemBuilder:
                    (context) => [
                      PopupMenuItem(
                        value: 'user_info',
                        enabled: false,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              auth.user?.name ?? 'Unknown User',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                                fontSize: 16,
                              ),
                            ),
                            Text(
                              auth.user?.email ?? '',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.black,
                              ),
                            ),
                            if (auth.user?.roles.isNotEmpty == true)
                              Text(
                                'Role: ${auth.user!.roles.join(', ')}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.black,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            Image.asset("assets/images/sign_out.png"),
                            SizedBox(width: 8),
                            Text('Logout', style: TextStyle(fontSize: 16)),
                          ],
                        ),
                      ),
                    ],
                child: const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Icon(Icons.settings),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Consumer<StreamingProvider>(
          builder: (context, streaming, _) {
            if (!streaming.isInitialized) {
              return SizedBox(
                height: MediaQuery.of(context).size.height * 0.8,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text(
                        'Initializing camera...',
                        style: TextStyle(color: Colors.white, fontSize: 20),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (streaming.errorMessage != null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      streaming.errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        streaming.clearError();
                        _initializeServices();
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            return Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 20, left: 20.0),
                      child: Text(
                        "Observer Info",
                        style: TextStyle(color: Colors.white, fontSize: 20),
                      ),
                    ),
                  ],
                ),

                Container(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Spacer(),
                      Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            // Main card content
                            Row(
                              children: [
                                SizedBox(
                                  height: 190,
                                  width: width * 0.80,
                                  child: Padding(
                                    padding: const EdgeInsets.all(10.0),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        // User name
                                        Consumer<AuthProvider>(
                                          builder: (context, auth, _) {
                                            return Text(
                                              auth.user!.name.toString(),
                                              style: TextStyle(
                                                color: Color(0xFF532287),
                                                fontSize: 25,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            );
                                          },
                                        ),
                                        const SizedBox(height: 10),
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            left: 15,
                                          ),
                                          child: Column(
                                            children: [
                                              // Date row
                                              ObserverInfoRow(
                                                icon: Icons.calendar_today,
                                                text: "06/09/2025",
                                              ),
                                              const SizedBox(height: 12),

                                              // Time row
                                              ObserverInfoRow(
                                                icon: Icons.access_time,
                                                text: "8:55 am",
                                              ),
                                              const SizedBox(height: 12),

                                              // Location row
                                              const ObserverInfoRow(
                                                icon: Icons.location_on,
                                                text: 'Saint Mary Hospital',
                                              ),
                                              const SizedBox(height: 12),

                                              // POD row
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  const ObserverInfoRow(
                                                    icon: Icons.monitor,
                                                    text: 'POD 1',
                                                  ),

                                                  //Transmitting status
                                                  Padding(
                                                    padding:
                                                        const EdgeInsets.only(
                                                          right: 10.0,
                                                        ),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.min,
                                                      children: [
                                                        const SizedBox(
                                                          width: 5,
                                                        ),
                                                        Consumer<
                                                          PresenceProvider
                                                        >(
                                                          builder: (
                                                            context,
                                                            presence,
                                                            _,
                                                          ) {
                                                            return Column(
                                                              children: [
                                                                Row(
                                                                  children: [
                                                                    Icon(
                                                                      Icons
                                                                          .circle,
                                                                      color:
                                                                          streaming.isStreaming
                                                                              ? Colors.green
                                                                              : Colors.red,
                                                                      size: 15,
                                                                    ),
                                                                    SizedBox(
                                                                      width: 5,
                                                                    ),
                                                                    Text(
                                                                      streaming
                                                                              .isStreaming
                                                                          ? 'Live'
                                                                          : 'Offline',
                                                                      style: TextStyle(
                                                                        color:
                                                                            streaming.isStreaming
                                                                                ? Colors.green
                                                                                : Colors.red,
                                                                        fontSize:
                                                                            16,
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ],
                                                            );
                                                          },
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            // User Image - positioned to extend outside card
                            Positioned(
                              right: -30,
                              top: -40,
                              child: Container(
                                width: 150,
                                height: 180,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.2),
                                      blurRadius: 30,
                                    ),
                                  ],
                                ),
                                child: // Camera Preview
                                    SizedBox(
                                  height: 200,
                                  width: 200,
                                  child: Container(
                                    margin: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(12),
                                      color: Colors.black,
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child:
                                          streaming.isStreaming
                                              ? streaming.videoPreview
                                              :
                                              /*streaming.videoPreview  ??*/
                                              const Center(
                                                child: Column(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment.center,
                                                  children: [
                                                    Icon(
                                                      Icons
                                                          .videocam_off_outlined,
                                                      color: Colors.white54,
                                                      size: 32,
                                                    ),
                                                    SizedBox(height: 8),
                                                    Text(
                                                      'Offline',
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontSize: 16,
                                                        fontWeight:
                                                            FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                //Schedule Status Section
                Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 20.0),
                      child: Text(
                        'Schedule Status',
                        style: TextStyle(color: Colors.white, fontSize: 20),
                      ),
                    ),
                  ],
                ),

                // Schedule Table
                Container(
                  margin: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      ScheduleRowHeader(),
                      ScheduleRows(
                        event: "Check In",
                        time: "8:00 AM (8:00 AM)",
                        status: "On Time",
                      ),
                      ScheduleRows(
                        event: "Break 1",
                        time: "10:00 AM (10:15 AM)",
                        person: "RA: John Doe",
                        status: "Delayed",
                        isSelected: true,
                      ),
                      ScheduleRows(
                        event: "Break Lunch",
                        time: "12:00 PM",
                        person: "RA: John Doe",
                        status: "On Time",
                      ),
                      ScheduleRows(
                        event: "Break 2",
                        time: "2:00 PM",
                        person: "RA: Angel Jones",
                        status: "Delayed",
                      ),
                      ScheduleRows(
                        event: "Check Out",
                        time: "4:00 PM (4:00 PM)",
                        status: "On Time",
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
