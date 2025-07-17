import 'package:flutter/foundation.dart';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:toastification/toastification.dart';
import '../services/livekit_service.dart';
import '../services/api_client.dart';

class StreamingProvider with ChangeNotifier {
  final LiveKitService _liveKitService = LiveKitService();
  final ApiClient _apiClient = ApiClient();

  bool _isStreaming = false;
  bool _isInitialized = false;
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  String? _selectedCameraId;
  String? _errorMessage;

  bool get isStreaming => _isStreaming;
  bool get isInitialized => _isInitialized;
  CameraController? get cameraController => _cameraController;
  List<CameraDescription> get cameras => _cameras;
  String? get errorMessage => _errorMessage;

  Widget? get videoPreview {
  debugPrint(
    '[StreamingProvider] Getting video preview - isStreaming: $_isStreaming',
  );

  if (_isStreaming) {
    debugPrint('[StreamingProvider] Requesting LiveKit preview');
    final livekitPreview = _liveKitService.getLocalVideoView();
    debugPrint(
      '[StreamingProvider] LiveKit preview available: ${livekitPreview != null}',
    );
    return livekitPreview;
  } else if (_cameraController != null && 
             !_isStreaming) {
    debugPrint('[StreamingProvider] Using Flutter camera preview');
    try {
      // ✅ Additional safety checks
      final controller = _cameraController!;
      if (controller.value.isInitialized && 
          !controller.value.hasError &&
          !controller.value.isRecordingVideo) {
        return CameraPreview(controller);
      }
    } catch (e) {
      debugPrint('Error creating camera preview: $e');
      // Clear the disposed controller
      _cameraController = null;
      return null;
    }
  }

  debugPrint('[StreamingProvider] No preview available');
  return null;
}

  /// Check if camera controller is safe to use
  bool get hasCameraPreview {
    return (_cameraController != null &&
        _cameraController!.value.isInitialized &&
        !_isStreaming);
  }

  Future<bool> initializeCameras() async {
    try {
      // Request camera permissions
      final cameraStatus = await Permission.camera.request();
      //final microphoneStatus = await Permission.microphone.request();

      if (cameraStatus != PermissionStatus.granted) {
        _errorMessage = 'Camera permission is required';
        notifyListeners();
        return false;
      }

      _cameras = await availableCameras();

      // for (int i = 0; i < _cameras.length; i++) {
      //   final camera = _cameras[i];
      // }

      if (_cameras.isEmpty) {
        _errorMessage = 'No cameras found on device';
        notifyListeners();
        return false;
      }

      // For mobile app, always prioritize front camera first
      CameraDescription? selectedCamera;

      // Look for front camera first (mobile preference)
      try {
        selectedCamera = _cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
        );
       
      } catch (e) {
        // If no front camera, fallback to back camera
        try {
          selectedCamera = _cameras.firstWhere(
            (camera) => camera.lensDirection == CameraLensDirection.back,
          );
         
        } catch (e2) {
          // If no back camera either, use first available
          selectedCamera = _cameras.first;
          
        }
      }

      await _initializeCamera(selectedCamera);
      _isInitialized = true;
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to initialize cameras: ${e.toString()}';
     notifyListeners();
      return false;
    }
  }

  Future<void> _initializeCamera(CameraDescription camera) async {
   
    if (_cameraController != null) {
      await _cameraController!.dispose();
    }

    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );

    await _cameraController!.initialize();

    _selectedCameraId = camera.name;
  }

  Future<bool> startStreaming() async {
    toastification.show(
      type: ToastificationType.success,
      title: Text('Starting streamming...'),
      autoCloseDuration: const Duration(seconds: 5),
    );

    if (_isStreaming) {
      return true;
    }

    if (!_isInitialized) {
      return false;
    }

    try {
      _errorMessage = null;
      notifyListeners();

      // Stop Flutter camera to avoid conflict with LiveKit
      if (_cameraController != null) {
        await _cameraController!.dispose();
        _cameraController = null;
        // Notify listeners that camera controller is disposed
        notifyListeners();
      }

      // Connect to LiveKit and let it handle camera directly
      await _liveKitService.connect();
      await _liveKitService.publishCameraById(_selectedCameraId!);

      // Set streaming state after video track is created
      _isStreaming = true;
      notifyListeners(); // Notify UI that streaming state changed

      await _apiClient.updateStreamingStatus('started');

      return true;
    } catch (e) {
      _errorMessage = 'Failed to start streaming: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  Future<bool> stopStreaming() async {

    toastification.show(
      type: ToastificationType.success,
      title: Text('Stopping streamming...'),
      autoCloseDuration: const Duration(seconds: 5),
    );

    if (!_isStreaming) return false;

    try {
      await _liveKitService.disconnect();

      _isStreaming = false;
      await _apiClient.updateStreamingStatus('stopped');

      // Restart Flutter camera for preview after streaming stops
      if (_selectedCameraId != null && _cameras.isNotEmpty) {
        try {
          final camera = _cameras.firstWhere(
            (cam) => cam.name == _selectedCameraId,
            orElse: () => _cameras.first,
          );
          await _initializeCamera(camera);
        } catch (e) {
        }
      }

      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to stop streaming: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  Future<void> switchCamera() async {
    if (_cameras.length <= 1) return;

    try {
      final currentIndex = _cameras.indexWhere(
        (camera) => camera.name == _selectedCameraId,
      );

      final nextIndex = (currentIndex + 1) % _cameras.length;
      await _initializeCamera(_cameras[nextIndex]);

      if (_isStreaming) {
        await _liveKitService.switchCamera(_cameraController!);
      }

      notifyListeners();
    } catch (e) {
      _errorMessage = 'Failed to switch camera: ${e.toString()}';
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _liveKitService.dispose();
    super.dispose();
  }
}
