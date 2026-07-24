class NavigationService {
  NavigationService._();

  static final NavigationService instance = NavigationService._();

  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  void navigateTo(String route) {
    navigatorKey.currentState?.pushNamed(route);
  }

  void goBack() {
    navigatorKey.currentState?.pop();
  }
}