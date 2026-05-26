# Adaptive Learning Memory

This layer turns Abstract Algorithms into an adaptive engineering mentor without changing the Hashnode content model. Articles, series, MDX rendering, GraphQL operations, and SEO routes stay intact.

## State Architecture

The memory store lives in `lib/learning-memory.ts` and uses Zustand with lightweight local persistence.

Tracked state:

| Area | Signals |
| --- | --- |
| Concepts | completed count, revisit count, weak score, confidence, source articles |
| Reading velocity | completed articles, total minutes, average minutes per article |
| Simulations | replay count, failure count, last failure, last completion |
| Tradeoff mistakes | repeated mistake text, topic, count |
| Interview readiness | readiness score, communication score, mock interviews, weakness counts |
| Preferences | preferred difficulty, preferred domains |

## Persistence Strategy

Storage key:

- `aa:adaptive-learning-memory:v1`

Persistence is local-first. It is intentionally independent from Hashnode CMS data and can later be synced to Firebase or a user profile API without changing article routes.

Persisted data is behavioral state only:

- no MDX content
- no GraphQL schema changes
- no duplicate CMS hierarchy
- no SEO route changes

## Recommendation Engine

`buildAdaptiveRecommendations(memory, posts)` produces ranked recommendations from:

- weak concepts
- preferred domains
- unread or under-practiced articles
- simulation failures
- interview weaknesses
- reading velocity

Recommendation types:

- `next`: next concept/article
- `review`: weak-area reinforcement
- `practice`: simulation or drill
- `interview`: interview-readiness action
- `continue`: reserved for resume state

## Reusable Hooks

Use `useLearningMemoryStore()` for actions:

- `recordConceptSeen`
- `recordConceptCompleted`
- `recordWeakArea`
- `recordSimulationAttempt`
- `recordTradeoffMistake`
- `recordInterviewPractice`
- `setPreferredDifficulty`
- `resetLearningMemory`

Use `buildMemoryPromptContext(memory)` when sending context to AI Mentor. It summarizes completed concepts, weak areas, reading velocity, preferred domains, difficulty, and interview readiness.

## UX Integration

Homepage:

- personalizes the next recommendation from memory and article signals
- surfaces weak-area reinforcement in dashboard cards

AI Mentor:

- sends persisted memory context to `/api/learning-assistant`
- records prerequisites as weak-area signals
- records related architecture topics as preferred domains/concepts
- records interview-mode sessions as interview practice

Learning Graphs:

- records mastered nodes as completed concepts
- records retry nodes as weak areas
- keeps sequencing local and adaptive without changing CMS structure

Simulations:

- records replay completions
- records triggered failure states as simulation failures and concept weakness

Interview Prep:

- records practiced questions as completed concepts
- records mock interviews and communication improvements
- tracks interview weaknesses for future targeting

## Responsive UX Principles

Desktop:

- show memory through dashboard cards, sidebars, and AI Mentor panels
- keep article reading as the primary surface

Mobile:

- keep memory visible as small continuation and weak-area cues
- avoid large dashboards in the primary path
- keep `Learn`, `Practice`, `AI Mentor`, and `Discover` as the stable navigation model

## Future Sync Path

The current store is local-first. To sync across devices later:

1. Keep the same `LearningMemorySnapshot` shape.
2. Add authenticated API routes for load/save.
3. Merge remote and local records by `updatedAt`, `lastSeenAt`, and count fields.
4. Keep Hashnode GraphQL as the article source of truth.
