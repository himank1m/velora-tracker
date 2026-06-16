# Velora Tracker

Velora Tracker is a Vite React application for Velora Motors operations. The same React codebase supports the production website and a Capacitor Android app.

## Website Build

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build the production website:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The website build still outputs to `dist/`, so Vercel deployment continues to work the same way.

## Capacitor Android Setup

The Capacitor configuration uses:

- App name: `Velora Tracker`
- App ID: `com.velora.tracker`
- Web output directory: `dist`

If Capacitor packages are not installed yet, run:

```bash
npm install
```

Add Android platform files:

```bash
npm run cap:add:android
```

After the Android project exists, sync future web changes into Android:

```bash
npm run cap:sync
```

Open the Android project in Android Studio:

```bash
npm run android
```

## Android APK

After running `npm run cap:sync`, build a debug APK from the Android project:

```bash
cd android
gradlew assembleDebug
```

The debug APK will be created under:

```text
android/app/build/outputs/apk/debug/
```

## Play Store AAB

For a Play Store bundle, open the Android project:

```bash
npm run android
```

Then in Android Studio:

1. Select `Build`.
2. Select `Generate Signed Bundle / APK`.
3. Choose `Android App Bundle`.
4. Follow the signing steps.

You can also build a release bundle from the Android folder after signing configuration is ready:

```bash
cd android
gradlew bundleRelease
```

The AAB will be created under:

```text
android/app/build/outputs/bundle/release/
```

## Supabase Auth For Mobile

The web app continues using the same Vercel environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

For mobile authentication redirects, add the Android WebView origin to Supabase Auth redirect URLs:

```text
https://localhost/*
```

Also keep your Vercel production URL in the Supabase redirect URL list.

## Branding Assets

Placeholder Velora branding assets are included in:

```text
resources/icon.svg
resources/splash.svg
public/app-icon.svg
```

Use `resources/icon.svg` and `resources/splash.svg` as source files when generating native Android launcher and splash assets.

## Safety Notes

- The website remains a normal Vite React app.
- Capacitor is an additional platform target.
- Supabase database tables and data are not changed by the mobile setup.
- The Android app and website share the same Supabase backend.
