# Dd Fletcher Study Library

Next.js/Vercel app for student access to unlisted YouTube lessons.

## Features

- Public student library only receives unlocked videos.
- `/admin` is password protected with an HTTP-only session cookie.
- Admin can lock/unlock videos.
- New YouTube imports are added as locked by default.
- Daily Vercel Cron endpoint can import new uploads after YouTube OAuth is configured.
- Vercel Blob stores the live video state when `BLOB_READ_WRITE_TOKEN` is configured.

## Local preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For local testing, the default admin password is `change-me`. Set `ADMIN_PASSWORD` in `.env.local` before using this with real students.

## Required Vercel env vars

```bash
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=long-random-string
CRON_SECRET=another-long-random-string
BLOB_READ_WRITE_TOKEN=from-vercel-blob
```

## YouTube auto-import env vars

These are required for importing owner-visible/unlisted uploads:

```bash
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
YOUTUBE_UPLOADS_PLAYLIST_ID=
```

`YOUTUBE_UPLOADS_PLAYLIST_ID` is optional; if omitted, the app looks up the uploads playlist from the OAuth account.

## Deploy

```bash
npx vercel --prod
```

The site includes `noindex` headers and `robots.txt`, but unlocked unlisted YouTube links are still accessible to anyone who has access to the deployed site.
