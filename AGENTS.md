# AGENTS.md

Repository guidance for coding agents working in this monorepo.

## Workspace and commands

- Package manager: `pnpm` (enforced by root `preinstall`)
- Workspace layout: `packages/**` (`pnpm-workspace.yaml`)
- Install dependencies from repo root: `pnpm install`
- Format from repo root: `pnpm format`

Personal theme (main active package):

- Dev (Next + codegen watch): `pnpm --dir packages/blog-starter-kit/themes/personal dev`
- Build: `pnpm --dir packages/blog-starter-kit/themes/personal build`
- Lint: `pnpm --dir packages/blog-starter-kit/themes/personal lint`
- Typecheck: `pnpm --dir packages/blog-starter-kit/themes/personal typecheck`
- GraphQL codegen: `pnpm --dir packages/blog-starter-kit/themes/personal codegen`

Testing status:

- No real automated test suite is currently configured (no Jest/Vitest/Playwright/Cypress setup in repo).
- `packages/utils` has a placeholder `test` script that exits with error.

## Architecture overview

- Themes live at `packages/blog-starter-kit/themes/{personal,enterprise,hashnode}`.
- Shared helpers live in `packages/utils` (renderer/embeds, SEO JSON-LD, OG/social, image/feed helpers).
- Shared lint/TS baselines live in `packages/eslint-config-custom` and `packages/tsconfig`.

Personal theme architecture:

1. Next.js Pages Router + ISR pages (`pages/*`) fetch data via Hashnode GraphQL in `getStaticProps`.
2. GraphQL operations are `.graphql` files under `lib/api/{queries,fragments,mutations}`.
3. `codegen.yml` generates typed operations/documents into `generated/graphql.ts`.
4. Pages pass publication/post/page data into `AppProvider` (`components/contexts/appContext.tsx`) for cross-layout consumers.

Important runtime flows:

- `pages/index.tsx`: fetches/paginates publication posts, derives topic clusters + featured series + hero stats.
- `pages/[slug].tsx`: resolves post vs static page and computes related posts.
- `pages/posts.tsx`: client-side filtering/sorting/pagination via `lib/post-listing.ts`.
- `pages/api/*`: upstream AI proxies + ranking/fallback endpoints + Firebase auth/progress endpoints.
- `next.config.js`: Hashnode analytics rewrites (`/ping/data-event`, `/api/analytics`) and publication redirect rule fetch.

## Code conventions specific to this repo

- Run scripts with `pnpm --dir <package>` when executing from repo root.
- After editing GraphQL queries/fragments, run `codegen` and use generated typed documents from `generated/graphql`.
- Prefer `@starter-kit/utils/*` helpers over duplicating logic in theme code.
- Keep base-path support intact (`NEXT_PUBLIC_BASE_URL`) when adding routes/links/fetch paths.
- For API routes, follow existing handler pattern:
  - method guard + `Allow` header
  - request/env validation
  - bounded-time upstream fetch (`AbortSignal.timeout`)
  - structured JSON errors
  - cache headers via `lib/api/vercelCache.ts` when response is cacheable
- For components that can render outside provider scope, use `useSafeAppContext()` instead of hard dependency on `useAppContext()`.

## Environment and docs to consult

- Root docs: `README.md`, `CONTRIBUTING.md`
- Personal theme env template: `packages/blog-starter-kit/themes/personal/.env.example`
- Firebase subsystem notes: `packages/blog-starter-kit/themes/personal/FIREBASE_SETUP.md`

