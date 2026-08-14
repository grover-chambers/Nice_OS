import 'package:flutter/material.dart';

/// NiceOS Field App design system — from the field-rep concept mockup:
///
///   paper  warm cream surfaces, ink text, amber primary CTA, stamp colours.
///   ink    #17211C   text
///   soft   #4B5646   secondary text
///   paper  #ECE9DF   screen background
///   card   #FBFAF5   card surface
///   amber  #E8A63A   primary action / accent
///   green  #1F6D4C   visited / success stamp
///   red    #B23A2E   skipped / error stamp
///   mono   system mono for labels, numbers, stamps, eyebrows
abstract final class Brand {
  // ---- palette ----
  static const Color ink = Color(0xFF17211C);
  static const Color inkSoft = Color(0xFF4B5646);
  static const Color paper = Color(0xFFECE9DF);
  static const Color card = Color(0xFFFBFAF5);
  static const Color line = Color(0x2417211C); // ink 14%
  static const Color lineStrong = Color(0x4717211C); // ink 28%
  static const Color amber = Color(0xFFE8A63A);
  static const Color amberDeep = Color(0xFFB8791F);
  static const Color stampRed = Color(0xFFB23A2E);
  static const Color stampGreen = Color(0xFF1F6D4C);
  static const Color stampGreenSoft = Color(0xFFDDEBE3);
  static const Color pendingGrey = Color(0xFF8B8677);

  // ---- copy ----
  static const String appName = 'Nice OS';
  static const String company = 'Nice Rice Millers';
  static const String tagline = 'Market Activation Platform';

  static const String fontBody =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  static const String fontMono =
      'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

  static ThemeData theme() {
    final scheme = ColorScheme.fromSeed(seedColor: ink);
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme.copyWith(
        primary: amber,
        onPrimary: ink,
        secondary: ink,
        surface: card,
        onSurface: ink,
      ),
      scaffoldBackgroundColor: paper,
      fontFamily: fontBody,
      textTheme: const TextTheme(
        titleLarge: TextStyle(color: ink, fontWeight: FontWeight.w800, letterSpacing: -0.02),
        titleMedium: TextStyle(color: ink, fontWeight: FontWeight.w800, letterSpacing: -0.01),
        bodyLarge: TextStyle(color: ink),
        bodyMedium: TextStyle(color: ink),
      ),
    );
    return base.copyWith(
      appBarTheme: const AppBarTheme(
        backgroundColor: paper,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: ink,
          fontSize: 20,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.02,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        labelStyle: const TextStyle(
          color: inkSoft,
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.1,
        ),
        floatingLabelStyle: const TextStyle(color: amberDeep, fontFamily: fontMono),
        filled: true,
        fillColor: card,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: lineStrong, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: lineStrong, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: amberDeep, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: stampRed, width: 1.5),
        ),
      ),
    );
  }
}