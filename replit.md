# Signal

A personal information dashboard for following selected news and video sources without relying on algorithmic feeds.

## Run & Operate

- `artifacts/signal: web` — run the Signal preview workflow
- `pnpm --filter @workspace/signal run typecheck` — typecheck Signal
- `pnpm run typecheck` — typecheck the full workspace

## Stack

- pnpm workspaces, React, TypeScript, Vite, Tailwind CSS
- Wouter for client-side routes; Lucide for icons
- Shared Express API server and OpenAPI-generated React Query client
- Signal's News page loads normalized articles from public RSS feeds

## Where things live

- `artifacts/signal/src/pages/` — Signal page views
- `artifacts/signal/src/components/SignalUI.tsx` — shared layout and interface components
- `artifacts/signal/src/data/mock.ts` — demo channels and videos
- `artifacts/signal/src/index.css` — Signal theme and responsive styling
- `artifacts/api-server/src/feeds/` — configured RSS sources
- `artifacts/api-server/src/services/` — feed fetching, caching, and article lookup
- `artifacts/api-server/src/routes/news.ts` — News API endpoints
- `lib/api-spec/openapi.yaml` — shared API contract

## Architecture decisions

- Fetch RSS on the server; the browser only consumes normalized `/api/news` responses.
- Keep the feed list centrally configured. Perspective defaults to `unknown`; do not infer political classifications or cluster unrelated articles.
- Only show a coverage indicator when explicit coverage data exists.
- News bookmarks and video actions remain client-side; there is no database or authentication.
- Videos and channel listings remain demo content; do not add YouTube OAuth unless requested.

## Product

- A calm editorial briefing, RSS-powered news, demo videos, and a saved-items shelf.
- A news article is one publisher's report, not a complete story or a cross-source comparison.

## User preferences

- News may use the requested public RSS integration. Do not add authentication, a database, AI summaries, or video integrations unless requested.

## Gotchas

- Never present demo video or channel items as real current events.
- Do not display perspective labels for RSS sources unless a source is explicitly configured with one.
- Saved items, watch status, channel follows, and preferences currently exist only in client state.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
