import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'core/theme.dart';
import 'core/api_client.dart';
import 'core/router.dart';
import 'core/locale_provider.dart';
import 'package:shadapp_client/generated/app_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  await api.init();
  final token = await api.getToken();
  final loggedIn = token != null;
  String initialLocation;
  if (!loggedIn) {
    initialLocation = '/login';
  } else {
    final role = await api.getRole();
    initialLocation = role == 'client' ? '/dashboard' : '/am/dashboard';
  }
  final router = createRouter(api, initialLocation: initialLocation);
  final localeProvider = LocaleProvider();
  await localeProvider.init();
  runApp(ShadApp(router: router, localeProvider: localeProvider));
}

class ShadApp extends StatefulWidget {
  final GoRouter router;
  final LocaleProvider localeProvider;

  const ShadApp({super.key, required this.router, required this.localeProvider});

  @override
  State<ShadApp> createState() => _ShadAppState();
}

class _ShadAppState extends State<ShadApp> {
  @override
  void initState() {
    super.initState();
    widget.localeProvider.addListener(_onLocaleChanged);
  }

  void _onLocaleChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    widget.localeProvider.removeListener(_onLocaleChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ShadApp',
      debugShowCheckedModeBanner: false,
      theme: shadTheme(),
      locale: widget.localeProvider.locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar'),
        Locale('en'),
      ],
      routerConfig: widget.router,
    );
  }
}
