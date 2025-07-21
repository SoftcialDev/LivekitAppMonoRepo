import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:livekit_client/livekit_client.dart';
import 'api_client.dart';

class LiveKitService {
  Room? _room;
  LocalVideoTrack? _localVideoTrack;
  LocalAudioTrack? _localAudioTrack;
  bool _isConnected = false;

  bool get isConnected => _isConnected;
  Room? get room => _room;
  LocalVideoTrack? get localVideoTrack => _localVideoTrack;
  
  /// Get video view widget for local preview
  Widget? getLocalVideoView() {
    if (_localVideoTrack == null) {
      return null;
    }
    
    
    // Use proper LiveKit VideoTrackRenderer for actual video preview
    return Stack(
      children: [
        // Actual video preview using LiveKit VideoTrackRenderer
        VideoTrackRenderer(_localVideoTrack!),
        // Recording indicator dot
      ],
    );
  }

  Future<void> connect() async {
    if (_isConnected) {
      return;
    }

    try {
      // Get LiveKit token from backend
      final apiClient = ApiClient();
      final tokenResponse = await apiClient.getLiveKitToken();
      
      final rooms = tokenResponse['rooms'] as List<dynamic>;
      final liveKitUrl = tokenResponse['livekitUrl'] as String;
      
      if (rooms.isEmpty) {
        throw Exception('No LiveKit rooms available');
      }
      
      final roomData = rooms.first as Map<String, dynamic>;
      final token = roomData['token'] as String;
      
      // Create and connect to room
      _room = Room(
        roomOptions: const RoomOptions(
          adaptiveStream: true,
          dynacast: true,
        ),
      );
      
      await _room!.connect(liveKitUrl, token);
      
      _isConnected = true;
      
    } catch (e) {
      throw Exception('LiveKit connection failed: ${e.toString()}');
    }
  }

  Future<void> publishCamera(CameraController cameraController) async {
    await publishCameraById(cameraController.description.name);
  }

  Future<void> publishCameraById(String cameraId) async {
    if (!_isConnected || _room == null) {
      throw Exception('Not connected to LiveKit room');
    }

    try {
      
      // Create video track from camera ID only (no Flutter camera controller)
      _localVideoTrack = await LocalVideoTrack.createCameraTrack(
        CameraCaptureOptions(
          deviceId: cameraId,
          maxFrameRate: 30,
          cameraPosition: CameraPosition.front, // Default to front for mobile
        ),
      );

      // Create audio track
      _localAudioTrack = await LocalAudioTrack.create(
        const AudioCaptureOptions(
          noiseSuppression: true,
          echoCancellation: true,
        ),
      );

      // Publish tracks to room
      await _room!.localParticipant?.publishVideoTrack(_localVideoTrack!);
      
      await _room!.localParticipant?.publishAudioTrack(_localAudioTrack!);
      
      // Small delay to ensure tracks are fully initialized
      await Future.delayed(const Duration(milliseconds: 500));
      
      
    } catch (e) {
      throw Exception('Camera publishing failed: ${e.toString()}');
    }
  }

  Future<void> switchCamera(CameraController newCameraController) async {
    if (!_isConnected || _room == null) return;

    try {
      // Stop current video track
      if (_localVideoTrack != null) {
        await _localVideoTrack!.stop();
        // Stop and dispose the track - the room will handle cleanup
        // Note: unpublish methods vary by LiveKit client version
        _localVideoTrack = null;
      }

      // Create new video track with new camera
      _localVideoTrack = await LocalVideoTrack.createCameraTrack(
        CameraCaptureOptions(
          deviceId: newCameraController.description.name,
          maxFrameRate: 30,
          cameraPosition: newCameraController.description.lensDirection == CameraLensDirection.front 
              ? CameraPosition.front 
              : CameraPosition.back,
        ),
      );

      // Publish new video track
      await _room!.localParticipant?.publishVideoTrack(_localVideoTrack!);
      
      
    } catch (e) {
      throw Exception('Camera switching failed: ${e.toString()}');
    }
  }

  Future<void> toggleMicrophone() async {
    if (_localAudioTrack != null) {
      if (_localAudioTrack!.muted) {
        await _localAudioTrack!.unmute();
      } else {
        await _localAudioTrack!.mute();
      }
    }
  }

  Future<void> disconnect() async {
    if (!_isConnected) return;

    try {
      // Stop and unpublish tracks
      if (_localVideoTrack != null) {
        await _localVideoTrack!.stop();
        _localVideoTrack = null;
      }
      
      if (_localAudioTrack != null) {
        await _localAudioTrack!.stop();
        _localAudioTrack = null;
      }

      // Disconnect from room
      if (_room != null) {
        await _room!.disconnect();
        _room = null;
      }

      _isConnected = false;
      
    } catch (e) {
    }
  }

  void dispose() {
    disconnect();
  }
}
