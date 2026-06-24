import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_client.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final notifService = NotificationService();
  await notifService._initLocalNotifications();
  notifService._showLocalNotification(message);
}

class NotificationService {
  static final NotificationService _instance = NotificationService._();
  NotificationService._();

  factory NotificationService() => _instance;

  final _firebaseMessaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();
  final _api = ApiClient();

  String? _fcmToken;
  bool _initialized = false;
  StreamSubscription? _messageSubscription;

  void Function(RemoteMessage)? onMessageOpenedApp;

  Future<void> init() async {
    if (_initialized) return;

    await _initLocalNotifications();

    await _requestPermission();

    _fcmToken = await _firebaseMessaging.getToken();
    if (_fcmToken != null) {
      _registerToken(_fcmToken!);
    }

    _firebaseMessaging.onTokenRefresh.listen((token) {
      _fcmToken = token;
      _registerToken(token);
    });

    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    _messageSubscription = FirebaseMessaging.onMessage.listen(_showLocalNotification);

    _initialized = true;
  }

  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: (_) {},
    );
  }

  Future<void> _requestPermission() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch,
      notification.title,
      notification.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'shadapp_channel',
          'إشعارات ShadApp',
          channelDescription: 'إشعارات التطبيق',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  Future<void> _registerToken(String token) async {
    final deviceType = _getDeviceType();
    try {
      await _api.post('/notifications/register-token', {
        'token': token,
        'device_type': deviceType,
      });
    } catch (_) {}
  }

  String _getDeviceType() {
    return 'android';
  }

  String? get fcmToken => _fcmToken;

  void dispose() {
    _messageSubscription?.cancel();
  }
}
