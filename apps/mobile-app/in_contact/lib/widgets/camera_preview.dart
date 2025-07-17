import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import '../providers/streaming_provider.dart';

class CameraPreviewWidget extends StatelessWidget {
  const CameraPreviewWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<StreamingProvider>(
      builder: (context, streamingProvider, child) {
        // Handle streaming state
        if (streamingProvider.isStreaming) {
          debugPrint('[CameraPreviewWidget] App is streaming, getting LiveKit preview');
          final livekitPreview = streamingProvider.videoPreview;
          debugPrint('[CameraPreviewWidget] LiveKit preview widget: ${livekitPreview != null}');
          
          if (livekitPreview != null) {
            debugPrint('[CameraPreviewWidget] Showing LiveKit preview');
            return ClipRect(
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: livekitPreview,
              ),
            );
          } else {
            debugPrint('[CameraPreviewWidget] LiveKit preview not available yet');
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.green),
                  SizedBox(height: 16),
                  Text(
                    'Starting stream preview...',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            );
          }
        }
        
        // Handle non-streaming state (Flutter camera preview)
        if (!streamingProvider.isStreaming && streamingProvider.hasCameraPreview) {
          final flutterPreview = streamingProvider.videoPreview;
          if (flutterPreview != null) {
            return ClipRect(
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: flutterPreview,
              ),
            );
          }
        }
        
        // Loading state
        if (streamingProvider.isInitialized && !streamingProvider.isStreaming) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text(
                  'Initializing camera...',
                  style: TextStyle(color: Colors.white),
                ),
              ],
            ),
          );
        }
        
        // Error state
        if (streamingProvider.errorMessage != null) {
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
                  streamingProvider.errorMessage!,
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }
        
        // Default state
        return const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.camera_alt_outlined,
                size: 64,
                color: Colors.grey,
              ),
              SizedBox(height: 16),
              Text(
                'Camera not available',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        );
      },
    );
  }
}

// Legacy widget for backward compatibility
class CameraPreviewWidgetLegacy extends StatelessWidget {
  final CameraController controller;

  const CameraPreviewWidgetLegacy({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    // Check if controller is disposed or not initialized
    if (!controller.value.isInitialized) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Initializing camera...',
              style: TextStyle(color: Colors.white),
            ),
          ],
        ),
      );
    }

    // Handle camera errors
    if (controller.value.hasError) {
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
              'Camera Error: ${controller.value.errorDescription ?? 'Unknown error'}',
              style: const TextStyle(color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    try {
      return ClipRect(
        child: AspectRatio(
          aspectRatio: controller.value.aspectRatio,
          child: CameraPreview(controller),
        ),
      );
    } catch (e) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.camera_alt_outlined,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              'Camera Preview Error: ${e.toString()}',
              style: const TextStyle(color: Colors.white),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
  }
}