# RewardsPlanners

## Android builds on Windows

The app uses Android SDK CMake **3.31.6** on Windows. Its bundled Ninja supports
paths longer than 260 characters, which occur in Firebase's generated native
sources under this project's directory. CMake 3.22.1 bundles an older Ninja that
fails with `Filename longer than 260 characters`.

Enable Windows long-path support in **PowerShell as Administrator**, then restart
Windows:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
```

Install CMake in Android Studio under **SDK Manager > SDK Tools > Show Package
Details > CMake > 3.31.6**, or with the Android SDK command-line tools:

```powershell
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" 'cmake;3.31.6'
```

Install this package before building; if it is missing, Gradle can fail with
`[CXX1300] CMake '3.31.6' was not found in SDK, PATH, or by cmake.dir property.`
Then run the usual command:

```powershell
npx react-native run-android
```

The CMake version change creates a new native build configuration, so deleting
`node_modules` or running `gradlew clean` is unnecessary.

## Festival app icon API

`GET /content/resolved/app-icon?platform=ios` and `GET /content/resolved/app-icon?platform=android` are public endpoints. They return the scheduled `icon_key` for the requested platform, or `default` when no active campaign matches.

App icon campaigns are managed through the admin `/content/app-icons` routes. Each campaign stores `platform`, `icon_key`, `starts_at`, `ends_at`, `priority`, and `is_active`. Active resolution uses UTC on the server with `starts_at <= UTC_TIMESTAMP(3)` and `ends_at >= UTC_TIMESTAMP(3)`; if multiple campaigns overlap, the highest `priority` wins, followed by the latest `starts_at` and latest `id`.

Campaign timestamps are stored as UTC `DATETIME(3)`. Admin requests must send `starts_at` and `ends_at` as ISO 8601 timestamps with a timezone, for example `2026-10-08T12:30:00Z` or `2026-10-08T18:00:00+05:30`. Timestamps without a timezone are rejected so festival windows do not shift between servers.
