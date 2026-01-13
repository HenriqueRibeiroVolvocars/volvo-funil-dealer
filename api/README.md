# API proxy (api)

This folder contains a small Express proxy that forwards calls to protected URLs configured via environment variables.

Usage

1. Copy `.env.example` to `.env` and fill the real URLs.
2. Install dependencies and run:

```bash
cd api
npm install
npm start
```

The proxy listens on `PORT` (default 7070) and exposes `/api/sheet1`, `/api/sheet2`, `/api/sheet3`, `/api/sheet4`.

When developing with Vite, `vite.config.ts` is configured to proxy `/api` to `http://localhost:7070`.
