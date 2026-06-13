# ObsTrack Pro

ObsTrack Pro is a lightweight post-operative recovery board for tracking bay/bed admissions and scheduled observation rounds.

Live app: https://obstrackpro.vercel.app

## Features

- Add patients by bay and bed number
- Choose standard post-op or fixed interval observation schedules
- Track completed, due soon, and overdue observations
- Show the next observation time in each patient card
- Privacy mode for obscuring bed labels during shared-screen use
- Responsive layout for desktop and mobile ward devices
- Dark mode support

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```

## Scripts

```bash
npm run dev        # Start the Vite development server
npm run build      # Build for production
npm run preview    # Preview the production build locally
npm run typecheck  # Run TypeScript checks
```

## Deployment

The production app is hosted on Vercel at:

https://obstrackpro.vercel.app
