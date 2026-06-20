import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:8000/api';
  String? _token;

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  Future<String?> getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    return _token;
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  Future<Map<String, String>> _headers() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = await getToken();
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Future<Map<String, dynamic>> get(String path) async {
    final response = await http.get(Uri.parse('$baseUrl$path'), headers: await _headers());
    return _handle(response);
  }

  Future<Map<String, dynamic>> post(String path, [Map<String, dynamic>? body]) async {
    final response = await http.post(Uri.parse('$baseUrl$path'), headers: await _headers(), body: body != null ? jsonEncode(body) : null);
    return _handle(response);
  }

  Future<Map<String, dynamic>> put(String path, Map<String, dynamic> body) async {
    final response = await http.put(Uri.parse('$baseUrl$path'), headers: await _headers(), body: jsonEncode(body));
    return _handle(response);
  }

  Map<String, dynamic> _handle(http.Response response) {
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) throw Exception(data['message'] ?? 'Request failed');
    return data;
  }
}
