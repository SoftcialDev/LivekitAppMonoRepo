import 'package:dio/dio.dart';
import '../config/app_config.dart';

class ApiClient {
  late final Dio _dio;
  String? _accessToken;

  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    // Add request interceptor to include auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_accessToken != null) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          // Handle common errors
          if (error.response?.statusCode == 401) {
            // Token expired or invalid
            _accessToken = null;
          }
          handler.next(error);
        },
      ),
    );
  }

  void setAccessToken(String? token) {
    _accessToken = token;
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  // Specific API methods for InContact app
  Future<Map<String, dynamic>> getLiveKitToken() async {
    final response = await get('/api/LiveKitToken');
    return response.data as Map<String, dynamic>;
  }

  Future<void> updateStreamingStatus(String status) async {
    await post('/api/StreamingSessionUpdate', data: {
      'status': status,
    });
  }

  Future<List<dynamic>> fetchStreamingSessions() async {
    final response = await get('/api/FetchStreamingSessions');
    final data = response.data as Map<String, dynamic>;
    return data['sessions'] as List<dynamic>;
  }

  Future<String> getWebPubSubToken() async {
    final response = await get('/api/WebPubSubToken');
    final data = response.data as Map<String, dynamic>;

    String endpoint = data["endpoint"];
    String hubName = data["hubName"];
    String token = data["token"];

   String webPubSubToken = "$endpoint/client/hubs/$hubName?access_token=$token";

    return webPubSubToken;
  }

  Future<List<dynamic>> fetchPendingCommands() async {
    final response = await get('/api/FetchPendingCommands');
    
    // Handle the response format that matches Electron app
    final data = response.data as Map<String, dynamic>;
    final pending = data['pending'];
    
    // Normalize single command or array to always return array
    if (pending == null) {
      return [];
    } else if (pending is List) {
      return pending;
    } else {
      return [pending];
    }
  }

  Future<int> acknowledgePendingCommands(List<String> commandIds) async {
    final response = await post('/api/AcknowledgeCommand', data: {
      'ids': commandIds,  // Match Electron app payload format
    });
    final data = response.data as Map<String, dynamic>;
    return data['updatedCount'] as int;  // Match Electron app response format
  }

  Future<void> updatePresence(String status) async {
    await post('/api/PresenceUpdate', data: {
      'status': status,
    });
  }
}