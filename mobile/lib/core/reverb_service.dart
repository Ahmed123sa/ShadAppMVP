import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'api_client.dart';

class ReverbService {
  static final ReverbService _instance = ReverbService._();
  factory ReverbService() => _instance;
  ReverbService._();

  String host = 'localhost';
  String port = '8080';
  String key = 'shadapp-key';

  WebSocketChannel? _channel;
  Timer? _pingTimer;
  int? _currentWorkspaceId;
  void Function(Map<String, dynamic>)? onMessageReceived;
  void Function()? onContractStatusChanged;

  void configure({String? host, String? port, String? key}) {
    if (host != null) this.host = host;
    if (port != null) this.port = port;
    if (key != null) this.key = key;
  }

  void _autoConfigureFromApi() {
    final baseUrl = ApiClient().baseUrl;
    final uri = Uri.tryParse(baseUrl);
    if (uri != null && uri.host.isNotEmpty && uri.host != 'localhost') {
      host = uri.host;
    }
  }

  Future<void> connect(int workspaceId) async {
    _currentWorkspaceId = workspaceId;
    await _disconnect();
    _autoConfigureFromApi();

    final url = 'ws://$host:$port/app/$key?protocol=7&client=flutter&version=7.6.2';

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      await _channel!.ready;

      _subscribe('workspace.$workspaceId');

      _pingTimer = Timer.periodic(const Duration(seconds: 25), (_) {
        _send({'event': 'pusher:ping', 'data': {}});
      });

      _channel!.stream.listen(
        (data) {
          final msg = jsonDecode(data as String) as Map<String, dynamic>;
          final event = msg['event'] as String?;
          if (event == 'pusher:connection_established') {
            _subscribe('workspace.$workspaceId');
          } else if (event == 'message.sent') {
            final payload = jsonDecode(msg['data'] as String) as Map<String, dynamic>;
            onMessageReceived?.call(payload);
          } else if (event == 'contract.status_changed') {
            onContractStatusChanged?.call();
          }
        },
        onError: (_) => _reconnect(),
        onDone: () => _reconnect(),
      );
    } catch (_) {
      _reconnect();
    }
  }

  void _subscribe(String channel) {
    _send({'event': 'pusher:subscribe', 'data': {'channel': channel}});
  }

  void _send(Map<String, dynamic> data) {
    _channel?.sink.add(jsonEncode(data));
  }

  Future<void> _reconnect() async {
    await Future.delayed(const Duration(seconds: 3));
    if (_currentWorkspaceId != null) {
      connect(_currentWorkspaceId!);
    }
  }

  Future<void> _disconnect() async {
    _pingTimer?.cancel();
    _pingTimer = null;
    await _channel?.sink.close();
    _channel = null;
  }

  void disconnect() {
    _currentWorkspaceId = null;
    _disconnect();
  }
}
