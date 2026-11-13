# RewardsPlanners

## Festival app icon API

`GET /content/resolved/app-icon?platform=ios` and `GET /content/resolved/app-icon?platform=android` are public endpoints. They return the scheduled `icon_key` for the requested platform, or `default` when no active campaign matches.

App icon campaigns are managed through the admin `/content/app-icons` routes. Each campaign stores `platform`, `icon_key`, `starts_at`, `ends_at`, `priority`, and `is_active`. Active resolution uses UTC on the server with `starts_at <= UTC_TIMESTAMP(3)` and `ends_at >= UTC_TIMESTAMP(3)`; if multiple campaigns overlap, the highest `priority` wins, followed by the latest `starts_at` and latest `id`.

Campaign timestamps are stored as UTC `DATETIME(3)`. Admin requests must send `starts_at` and `ends_at` as ISO 8601 timestamps with a timezone, for example `2026-10-08T12:30:00Z` or `2026-10-08T18:00:00+05:30`. Timestamps without a timezone are rejected so festival windows do not shift between servers.
