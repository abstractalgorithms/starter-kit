# Abstract Algorithms Information Architecture

This IA keeps the Hashnode Starter Kit content model intact. Articles, MDX rendering, GraphQL operations, ISR pages, and Hashnode series remain the source of published content. The platform layer changes how learning structures are named, grouped, and navigated.

## Top-Level Navigation

Primary navigation has four destinations:

| Area | Purpose | Primary route | Includes |
| --- | --- | --- | --- |
| Learn | Structured engineering understanding | `/posts` | Topic Journeys, Articles, Series, Learning Graphs, Role-based Tracks |
| Practice | Validation and operational reasoning | `/interview-prep` or `/visualizations` | Simulations, Interview Prep, Architecture Drills, Whiteboarding |
| AI Mentor | Adaptive engineering mentor | `/assistant` | Recommendations, weak-area guidance, progression, explanations, coaching |
| Discover | Systems-thinking exploration | `/discover` | Concept graph, trending deep dives, emerging systems, architecture collections |

The removed term is `Guided Topics`. Do not reintroduce it in navigation, page headings, metadata, CTAs, or onboarding copy.

## Learning Structures

### Articles

Articles are the atomic content unit. Preserve article slugs, SEO metadata, canonical rendering, MDX support, and Hashnode GraphQL fetching.

### Topic Journeys

Topic Journeys are the primary learner-facing unit. A topic can contain many canonical articles plus graph traversal, simulation, AI mentoring, interview prompts, and semantic retrieval. Topics do not create a new CMS hierarchy; they are generated from existing Hashnode posts, tags, series metadata, and optional `llm-wiki` search.

Route:

- `/topic/[slug]`

### Series

Series are editorial reading collections. They are linear and author-curated, such as `How Kafka Works Internally`. They should not be described as adaptive.

Routes:

- `/series`
- `/series/[slug]`

### Learning Graphs

Learning Graphs are dependency-aware concept progressions. They model prerequisite relationships such as `Replication -> Consensus -> Quorum -> Leader Election`.

Current compatibility route:

- `/guided-topics`

The route remains for compatibility and base-path safety, but all visible UX should say `Learning Graphs`.

### Role-Based Tracks

Tracks are career-role specialization journeys, such as `Backend Engineer`, `AI Engineer`, and `Staff Architect`. Tracks can be generated or guided by AI Mentor, but they should not replace article or series content.

## Route Organization

Keep existing Hashnode routes stable:

| User-facing concept | Route | Notes |
| --- | --- | --- |
| Articles | `/posts`, `/[slug]` | Article-first architecture and SEO stay unchanged |
| Topic Journeys | `/topic/[slug]` | Multi-article learning unit over canonical articles |
| Series | `/series`, `/series/[slug]` | Uses Hashnode series APIs |
| Learning Graphs | `/guided-topics` | Compatibility URL; relabeled in UI |
| Role-based Tracks | `/assistant?q=role-based...` | AI Mentor generates or resumes progression |
| Simulations | `/visualizations` | Practice destination when enabled |
| Interview Prep | `/interview-prep` | Practice destination when enabled |
| AI Mentor | `/assistant` | Adaptive guidance, not search |
| Discover | `/discover`, `/series`, `/posts?sort=popular-desc`, `/posts?sort=updated-desc` | Exploration layer over existing content |

Do not create a parallel CMS hierarchy for graphs or tracks. Use post tags, series, local progression metadata, and assistant context over existing GraphQL content.

## Sidebar Architecture

Article sidebars should prioritize the reader's current learning context:

1. Current article table of contents.
2. Series context when the article belongs to a Hashnode series.
3. Learning Graph context when reached from `/guided-topics`.
4. Practice actions for the active concept: simulation, interview drill, architecture drill.
5. AI Mentor action for explanation, weak-area review, or next recommendation.

Sidebar labels:

- Use `Series` for editorial collections.
- Use `Learning Graph` for dependency-aware progression.
- Use `Track` for role-based specialization.
- Use `Practice` for validation workflows.
- Use `AI Mentor` for adaptive guidance.

## Mobile Navigation

Mobile navigation uses the same four IA pillars, with `Home` allowed as a fifth utility item on the homepage bottom nav:

- Home
- Learn
- Practice
- AI Mentor
- Discover

The full-screen mobile menu groups child links under the four pillars. Avoid exposing implementation terms such as dashboard, library, roadmap, or guided topics as primary labels.

## CTA Hierarchy

Primary CTAs move the learner forward:

- `Start Learning`
- `Continue`
- `Resume Track`
- `Open Learning Graph`

Secondary CTAs validate understanding:

- `Continue Practice`
- `Open Simulation`
- `Start Interview Drill`
- `Retry Weak Concepts`

Tertiary CTAs explore or branch:

- `Browse Articles`
- `View Series`
- `Discover Deep Dives`
- `Ask AI Mentor`

AI Mentor CTAs should describe mentorship outcomes, not search:

- `Recommend What I Should Learn Next`
- `Explain This Concept`
- `Identify Weak Areas`
- `Coach My Interview Answer`

## Migration Strategy

1. Replace visible `Guided Topics` copy with `Learning Graphs`.
2. Collapse primary navigation into `Learn`, `Practice`, `AI Mentor`, and `Discover`.
3. Keep `/guided-topics` live as the compatibility route for saved links and SEO continuity.
4. Preserve `/posts`, `/[slug]`, `/series`, and `/series/[slug]` for article and series SEO.
5. Preserve existing GraphQL operations and generated types unless article or series data requirements change.
6. Treat stored learning-path progress as user progression state, not CMS structure.
7. Audit new features against the semantic rules before adding navigation labels.

## Governance Rules

- Do not use `Roadmaps` as a broad top-level bucket. Use `Learning Graphs` for concept dependencies or `Tracks` for role specialization.
- Do not call Series adaptive.
- Do not call AI Mentor search.
- Do not create new top-level learning nouns unless they map to a distinct user mental model.
- Every new learning surface must answer: is this an Article, Series, Learning Graph, Track, Practice workflow, AI Mentor capability, or Discover collection?
