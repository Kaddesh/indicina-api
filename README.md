# ShortLink — URL Shortener

Express + TypeScript backend for the ShortLink URL shortener, with a
React + Vite + TypeScript frontend.

## Repo layout

| Repo | Path | Stack | Port |
| ---- | ---- | ----- | ---- |
| **Backend** (sibling repo) | `../indicina-api` | Express + TypeScript | `3000` |
| **Frontend** (this repo) | `indicina-client` | React + Vite + TS | `5173` |

```
Browser ──► :5173 (Vite dev server)
              │  /api/*  proxied by Vite
              ▼
             :3000 (Express backend, in-memory store)
```

- The frontend calls relative `/api/*` URLs; Vite forwards them to the backend.
- The backend allows the frontend origin via CORS
  (`CORS_ORIGIN`, default `http://localhost:5173`).
- The backend keeps data **in memory** — everything is lost on restart.

## Prerequisites

- **Node.js 20.19+ or 22.12+** and **npm** (bundled with Node). Verified on Node 22.
- Two terminal windows (one per service).
- No database or external services required.

Verify your tooling:

```sh
node --version   # 20.19+ or 22.12+
npm --version
```

---

# Backend (`../indicina-api`)

## Install

```sh
cd ../indicina-api
npm install
```

## Configure

Copy the template and adjust if needed:

```sh
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT` | `3000` | Port the HTTP server listens on. |
| `BASE_URL` | `http://localhost:3000` | Public base URL used to build `shortUrl` values. |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin for CORS (the frontend). |

> If you change `PORT`, update `BASE_URL` to match so generated short URLs are
> correct.
>
> **Why do short URLs show `http://localhost:3000/...` and not a real domain?**
>
> Every short URL is built as `BASE_URL/<shortCode>`. Since this project isn't in
> production yet, `BASE_URL` defaults to `http://localhost:3000`, so you'll see
> e.g. `http://localhost:3000/8y4C7HW` instead of the final form like
> `http://short.est/GeAi9K`.
>
> The `<shortCode>` part (e.g. `8y4C7HW`) is the actual code — identical in both
> forms. The only difference is the host, which is fully configurable: set
> `BASE_URL` to your public domain in `.env` when you deploy and every generated
> short URL will use it, with no code changes.

## Start

```sh
npm run dev
```

You should see:

```
ShortLink backend listening at http://localhost:3000
```

Smoke-test it:

```sh
curl http://localhost:3000/health
# {"success":true,"data":{"status":"ok"}}
```

## API contract

All responses use the `{ success: true, data }` / `{ success: false, error }`
envelope.

| Method | Path | Params / Body | Purpose |
| ------ | ---- | ------------- | ------- |
| GET | `/health` | — | Health check. |
| POST | `/api/encode` | body `{ originalUrl }` | Shorten a URL (idempotent). |
| GET | `/api/decode` | query `shortCode` **or** `url` | Resolve a code/URL to its original. |
| GET | `/api/list` | query `q` (optional, ≥ 3 chars) | List entries, optionally filtered. |
| GET | `/api/statistic/:shortCode` | path | Metadata + visit stats for a code. |
| GET | `/:shortCode` | path | 302-redirect to the original URL **and records a visit**. |

Errors: 400 `VALIDATION_ERROR`, 404 `NOT_FOUND`, 413 `PAYLOAD_TOO_LARGE`,
500 `INTERNAL_ERROR`.

## Backend tests (Jest + Supertest)

No running server required.

```sh
npm test              # 74 tests across 10 suites
npm run test:watch    # watch mode
npm run test:coverage # coverage report in coverage/
```

---

# Frontend (`indicina-client`)

## Quick Start

The frontend talks to the backend at `http://localhost:3000`. Start the backend first, then:

```bash
npm install
npm run dev          # starts on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so the frontend can call the API using relative URLs through the axios client in `src/api.ts`.

## Scripts

| Script              | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start the Vite dev server (port 5173)     |
| `npm run build`     | Type-check + production build to `dist/`  |
| `npm run preview`   | Preview the production build              |
| `npm test`          | Run Vitest in watch mode                  |
| `npm run test:run`  | Run all tests once                        |
| `npm run test:ui`   | Vitest browser UI (requires `@vitest/ui`) |
| `npm run lint`      | Lint with ESLint                          |
| `npm run lint:fix`  | Lint and auto-fix                         |
| `npm run format`    | Format with Prettier                      |

## Stack

- **React 18** + **TypeScript** + **Vite 8** (fast HMR, modern bundler)
- **React Router 6** (SPA routing)
- **TanStack Query 5** (server-state management, caching, invalidation)
- **Tailwind CSS 3** (utility-first styling, with dark mode)
- **Axios** (typed API client with a response interceptor for the error envelope)
- **Vitest + MSW + Testing Library** (unit and integration tests — see *Testing*)

## Configuration

Configuration is read from Vite environment variables (see `src/api.ts`).

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `VITE_API_BASE` | `http://localhost:3000/api` | Base URL for all API requests. |

A `.env` file already exists in this repo and sets `VITE_API_BASE=/api`, which
makes the browser call relative URLs (`/api/...`) that the Vite dev server
proxies to the backend. The file is gitignored, so a fresh clone runs against
the default `http://localhost:3000/api` instead.

> In development, leave `VITE_API_BASE=/api`. The dev proxy in
> `vite.config.ts` forwards `/api/*` to `http://localhost:3000`, so no CORS
> issues and no absolute URLs needed.

## Features

| Page | Path | Purpose |
| --- | --- | --- |
| Home | `/` | Form to shorten a long URL; shows the result with a copy button |
| All URLs | `/urls` | Searchable, sortable list of every shortened URL with copy + stats buttons |
| Redirect preview | `/r/:shortCode` | Decodes a short code, shows where it goes, redirects after 3 s (or shows a "not found" page for unknown codes) |
| 404 | `*` | Friendly not-found page |

### Form (`/`)
- Single text input + submit button
- On success: shows the short URL with a copy button and a link to view stats
- On error: shows the backend's structured error message
- Submitting also invalidates the `['urls']` query so the list view stays in sync

### List (`/urls`)
- Table of every shortened URL, most recent first
- Search box filters by substring on the original URL (case-insensitive)
- Search is gated on ≥ 3 characters per the brief; a hint is shown until then
- Each row has:
  - Short URL (clickable to test the redirect, copy button)
  - Original URL (truncated, full URL on hover)
  - Visit count
  - Created date
  - "Stats" button → opens a modal with full metadata

### Stats modal
- Triggered from any row
- Shows: short URL, original URL, created, visits, last visited, last user agent, last referer
- Closes on ESC, on backdrop click, or on the ✕ button

### Redirect preview (`/r/:shortCode`)
- Resolves the short code via the backend's `/api/decode`
- If valid: shows a 3-second countdown with Cancel / Go now buttons, then redirects through the backend short URL (which records the visit)
- If 404: shows a "Short URL not found" page with links to create a new one or view all URLs
- Closes on user cancellation or by navigating away

### Dark mode
- Toggle in the header
- Persists preference in `localStorage`
- Falls back to system preference on first visit
- Applied at boot to prevent flash of wrong theme

## Testing

Vitest + jsdom + **MSW** (Mock Service Worker) + Testing Library. MSW
intercepts `/api/*` at the network boundary, so the tests run without a backend.

```sh
npm run test:run   # all tests, once
npm test           # watch mode
```

The suite covers **62 tests across 11 files**:

- API integration (encode, decode, list, statistic + error envelopes)
- Components (form, list/search, stats modal, redirect preview, copy button,
  spinner, theme toggle, layout)
- Hooks (`useTheme`)
- App routing (all routes, including `/r/:shortCode`)

### Browser UI

`npm run test:ui` opens the Vitest browser UI, but requires the optional
`@vitest/ui` package:

```sh
npm install --save-dev @vitest/ui
npm run test:ui
```

## Architecture

```
src/
  main.tsx                 # Bootstraps React, applies persisted theme
  App.tsx                  # Router + QueryClient provider
  index.css                # Tailwind base + a small animation
  types.ts                 # Mirrors backend's API types
  api.ts                   # Axios client + 4 typed API functions
  hooks/
    useTheme.ts            # Dark mode hook with localStorage persistence
  components/
    Layout.tsx             # Header (logo + nav + theme toggle) + content + footer
    ThemeToggle.tsx
    CopyButton.tsx         # Reusable copy-to-clipboard with fallback
    Spinner.tsx
    UrlForm.tsx            # Create form
    UrlList.tsx            # List + search + table
    StatsModal.tsx         # Statistics modal
    RedirectPreview.tsx    # Redirect preview / not-found page
  pages/
    HomePage.tsx
    ListPage.tsx
    NotFoundPage.tsx
  test/
    setup.ts               # Vitest setup + MSW lifecycle + global mocks
    server.ts              # MSW server (handlers registered per test)
    utils.tsx              # renderWithProviders helper
  __tests__/
    api.test.ts            # API contract tests via MSW
    App.test.tsx           # Route-level integration tests
    components/            # Component behavior tests
    hooks/                 # useTheme tests
```

The Vite dev server is configured in `vite.config.ts`:

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

For production, deploy `dist/` behind any static host. Configure your reverse proxy to forward `/api/*` to the backend. The frontend uses relative URLs (`/api/...`) so it works behind any host.

## Build Output

`npm run build` type-checks (`tsc -b`) and emits static assets to `dist/`
(index.html + hashed JS/CSS). Sizes vary per build; a recent production build
was roughly **86 KB gzipped JS** for the whole SPA.

## Design Choices

- **TanStack Query over useEffect+fetch:** automatic caching, dedupe, and background invalidation. After a successful encode, we invalidate `['urls']` so the list page is fresh next time it's opened.
- **No global state library:** TanStack Query owns server state; the rest is local component state. No need for Redux/Zustand at this scale.
- **No copy-to-clipboard library:** `navigator.clipboard.writeText` with a `document.execCommand` fallback is ~15 lines. Avoids a dependency.
- **Redirect preview, not server-side redirect:** The brief's `/{url_path}` is the backend's job (and it records visits). The frontend's `/r/:shortCode` is a UX feature: it shows where a short link points, then follows the backend short URL so visits are still counted.
- **Tailwind dark mode via `class`:** gives full control over the toggle, easy to persist.
- **React Router over Next.js:** a static SPA is the right tool for an in-memory demo. No SSR needed, no extra server cost.

---

# End-to-end verification

## Via HTTP (curl)

With the backend running:

```sh
# Shorten a URL
curl -X POST http://localhost:3000/api/encode \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://indicina.co"}'
# {"success":true,"data":{"shortCode":"AbCdEfG","shortUrl":"http://localhost:3000/AbCdEfG","originalUrl":"https://indicina.co","createdAt":"..."}}

# List (optional ?q= search, >= 3 chars)
curl "http://localhost:3000/api/list?q=indicina"

# Decode a short code
curl "http://localhost:3000/api/decode?shortCode=AbCdEfG"

# Statistics
curl "http://localhost:3000/api/statistic/AbCdEfG"

# Follow a short link (records a visit, then 302-redirects)
curl -I "http://localhost:3000/AbCdEfG"
```

## Via the browser

1. On **http://localhost:5173**, paste a long URL and hit **Shorten**.
2. Go to **All URLs** — the new entry appears with `0` visits.
3. Click **Stats** — the modal opens and shows the metadata.
4. Click the short code in the table — the app shows a preview with a 3-second
   countdown, then redirects to the original URL **through the backend short
   link**, which records the visit.
5. Reopen **Stats** — visits is now `1`.

---

# Code quality

```sh
# Backend
cd ../indicina-api && npm run lint && npm run format

# Frontend
cd ../indicina-client && npm run lint && npm run format
```

# Common issues

- **Port 3000 already in use** — change `PORT` in the backend `.env` and update
  `BASE_URL` (and the frontend proxy target) to match.
- **Port 5173 already in use** — stop the other process, or change the `port`
  in `vite.config.ts`.
- **Frontend list empty / errors** — backend not running, or CORS origin wrong.
  Set `CORS_ORIGIN` to the frontend's origin.
- **Short URLs show the wrong host** — update `BASE_URL` in the backend `.env`.
- **Data disappears on restart** — expected; the backend store is in-memory.
- **Redirect preview says "Short URL not found"** — the short code doesn't
  exist in the (in-memory) backend, or the backend was restarted and lost its
  data.
- **`npm run test:ui` fails** — `@vitest/ui` is not installed; run
  `npm install --save-dev @vitest/ui` first.
- **Node version errors on install/build** — upgrade to Node 20.19+ or 22.12+
  and re-run `npm install`.

