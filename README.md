# Chair Pulse

Free, open-source desktop app that analyzes salon and barbershop booking CSV exports. Get actionable insights to reduce no-shows, fill dead hours, and boost revenue per chair-hour.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **No-Show Analysis** — See your no-show rate, revenue lost, and breakdowns by day, time, service, staff, and deposit status
- **Chair Utilization Heatmap** — Visual 7-day heatmap showing exactly when your chairs are empty vs booked
- **Revenue per Chair-Hour** — Know which hours and services actually make money
- **Service Mix Rankings** — Find which services earn the most per hour, not just per booking
- **Peak/Off-Peak Pricing Model** — See the revenue impact of dynamic pricing
- **Health Score** — A single 0-100 score summarizing your salon's operational health
- **AI Advisory** — Optional LLM integration (your own API key) generates plain-English action plans
- **PDF & CSV Export** — Share reports with your team or accountant

## Privacy

**Your data never leaves your device.** Chair Pulse runs entirely on your computer. There is no server, no telemetry, no analytics, and no data collection. If you enable AI insights, calls go directly from your machine to the AI provider using your own API key. Chair Pulse never sees your data or keys.

## Download

Check the [Releases](../../releases) page for Windows installers (.exe) and portable builds.

## Supported Booking Systems

Chair Pulse auto-detects CSV exports from:
- Fresha
- Booksy
- Square Appointments
- Timely
- Any generic CSV with date, time, service, price, and status columns

## Usage

1. Export your bookings as CSV from your booking system
2. Open Chair Pulse and drag your CSV file into the import area
3. Verify the auto-detected column mapping
4. Click "Run Analysis" to generate your report
5. Browse Dashboard, No-Shows, Utilization, and Services views
6. (Optional) Configure an AI provider in Settings for recommendations
7. Export your report as PDF or CSV

## Development

```bash
# Install dependencies
bun install

# Start dev mode
bun run dev

# Run checks (typecheck + lint + format + test)
bun run check

# Build for production
bun run build

# Package installer
bun run package
```

## Tech Stack

- Electron 40 + React 19 + TypeScript 5.9
- Vite 7 (renderer) + esbuild (main/preload/worker)
- Zustand 5 (state) + Apache ECharts 6 (charts)
- PapaParse 5 (CSV) + jsPDF (PDF export)

## License

MIT — see [LICENSE](./LICENSE)

## Credits

Built by [Douro Digital](https://wearedouro.agency)

Want automated, real-time booking analytics for your salon? [Get in touch](https://wearedouro.agency)
