# Lịch Âm Việt Nam

## What it is

Pre-computed Vietnamese lunar-calendar milestones for 2025–2055. Dates use UTC+7 / the 105°E meridian and the algorithm by Hồ Ngọc Đức.

## Subscribe in Google Calendar

On desktop, choose **Other calendars** → **From URL**, then enter `https://amlich.ethanify.me/amlich.ics`. The subscription is read-only; Google Calendar's first refresh may take about 24 hours.

## What's included

- Giao thừa and Mùng 1–3 Tết.
- Mùng 1 and rằm of every lunar month, including leap months.
- Major lunar festivals and Can-Chi details in every event description.

## For agents

- Stable endpoint: `https://amlich.ethanify.me/amlich.ics`.
- Format: iCalendar / RFC 5545 with all-day `VEVENT`s.
- UID scheme: `<type>-YYYYMMDD@amlich.ethanify.me` (deterministic and namespaced).
- Regenerate the feed with `npm run build`.
- Licence: Apache-2.0.
