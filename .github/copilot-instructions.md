# Copilot instructions for `hashnode.dev/starter-kit`

## Build, lint, and test commands

This repo is a **pnpm workspace** (`pnpm-workspace.yaml`) with multiple packages under `packages/**`.

- Install deps (repo root): `pnpm install`
- Personal theme dev server (with GraphQL codegen watch):  
  `pnpm --dir packages/blog-starter-kit/themes/personal dev`
- Personal theme build:  
  `pnpm --dir packages/blog-starter-kit/themes/personal build`
- Personal theme lint:  
  `pnpm --dir packages/blog-starter-kit/themes/personal lint`
- Personal theme typecheck:  
  `pnpm --dir packages/blog-starter-kit/themes/personal typecheck`
- Regenerate GraphQL types (personal theme):  
  `pnpm --dir packages/blog-starter-kit/themes/personal codegen`
- Format from repo root:  
  `pnpm format`

### Single-test command status

There is currently **no real automated test suite** configured in this repository/theme (no Jest/Vitest/Playwright/Cypress test files or configs).  
`packages/utils/package.json` contains a placeholder `test` script that exits with error.

## High-level architecture

### Monorepo shape

- `packages/blog-starter-kit/themes/{personal,enterprise,hashnode}`: Next.js themes.
- `packages/utils`: shared rendering/SEO/social/feed utilities consumed by themes.
- `packages/eslint-config-custom` and `packages/tsconfig`: shared lint/TS baselines.

### Personal theme data flow (main active package)

The personal theme uses **Next.js Pages Router + ISR + Hashnode GraphQL**:

1. Page `getStaticProps` functions fetch publication/posts/pages using `graphql-request` + typed documents from `generated/graphql`.
2. Data is passed through `AppProvider` (`components/contexts/appContext.tsx`) for shared access in layout/analytics/footer-style consumers.
3. Pages generally revalidate aggressively (`revalidate: 1`) to keep content fresh.

Important entry points:

- `pages/index.tsx`: fetches first post page, then paginates all posts, derives topic clusters/series/hero stats.
- `pages/[slug].tsx`: resolves either a post (`SinglePostByPublication`) or static page (`PageByPublication`) and computes related posts locally.
- `pages/posts.tsx`: client-side filtering/sorting/pagination over pre-fetched posts using `lib/post-listing.ts`.

### GraphQL and codegen pipeline

- GraphQL operations live in `lib/api/{queries,fragments,mutations}/*.graphql`.
- `codegen.yml` generates:
  - `generated/schema.graphql`
  - `generated/graphql.ts` (typed operations + document nodes)
- Runtime imports should come from `../generated/graphql` (not handwritten TS types).

### API routes and AI integrations

`pages/api/*` is a mix of:

- Thin proxy routes to upstream AI services (`NEXT_PUBLIC_SERVER_URL` + Netlify functions),
- Local ranking/fallback logic (e.g., `learning-path.ts`),
- Firebase-backed auth/progress endpoints.

Common route pattern in this codebase:

1. Method guard (`405` + `Allow` header),
2. Required env/body validation (`400`/`503`),
3. Upstream call with explicit timeout (`AbortSignal.timeout(...)`),
4. Normalize upstream envelope and return typed JSON.

Caching for selected endpoints is centralized in `lib/api/vercelCache.ts` via `setVercelApiCacheHeaders`.

### Rendering stack details

- Markdown rendering uses shared utilities from `@starter-kit/utils/renderer` and then client-side enhancements in `components/markdown-to-html.tsx`:
  - embed handling,
  - quiz hook integration,
  - copy buttons/heading anchors,
  - KaTeX rendering,
  - Mermaid rendering + diagram enhancements.
- Analytics wiring:
  - `components/analytics.tsx` uses `useSafeAppContext()`,
  - `next.config.js` rewrites `/ping/data-event` and `/api/analytics` to Hashnode analytics backends.

### Firebase auth/progress subsystem

- Client auth context: `components/contexts/authContext.tsx`.
- Firebase app/auth/firestore setup: `lib/firebase.ts`.
- Progress hooks: `hooks/useProgress.ts`.
- Server endpoints under `pages/api/auth/*` and `pages/api/progress/*`.
- Expected env vars are documented in `.env.example` and `FIREBASE_SETUP.md`.

## Key conventions specific to this repository

- **Run in package context:** use `pnpm --dir <package-path> <script>` for theme scripts from repo root.
- **Codegen is part of normal workflow:** after editing `.graphql` operations or GraphQL-dependent page logic, run `codegen` and use regenerated types/documents.
- **Prefer shared utilities over reimplementation:** use `@starter-kit/utils/*` for SEO JSON-LD, OG generation, markdown/render helpers, image resizing, embeds.
- **Use App context defensively in cross-page components:** components like analytics use `useSafeAppContext()` when they may render outside `AppProvider`.
- **Respect base-path-aware URLs:** many runtime paths depend on `NEXT_PUBLIC_BASE_URL` (subpath deployment support); avoid hardcoding absolute root paths in new code.
- **When adding API routes, match existing resilience pattern:** explicit method checks, timeout-bounded upstream fetches, structured error payloads, and cache headers when appropriate.
- **Formatting/linting baseline:** Prettier at repo root uses tabs, single quotes, trailing commas, and organize-imports/tailwind/packagejson plugins; theme lint extends `@starter-kit/eslint-config-custom` (`next/core-web-vitals` + `prettier`).
- **Contribution expectations:** per `CONTRIBUTING.md`, prioritize functional features/fixes/integrations over purely cosmetic UI tweaks.
