# Systems Knowledge Graph

The systems knowledge graph turns Abstract Algorithms navigation from category browsing into relationship traversal. It sits on top of Hashnode articles, tags, series, MDX rendering, and GraphQL APIs. It does not require CMS restructuring.

## Architecture

| Layer | File | Responsibility |
| --- | --- | --- |
| Relationship model | `lib/concept-graph.ts` | Nodes, clusters, dependency edges, article-backed concept inference |
| Graph renderer | `components/systems-knowledge-graph.tsx` | Interactive topology rendering, hover previews, click traversal, responsive detail panel |
| Discover route | `pages/discover.tsx` | Full-page concept graph exploration with SEO and ISR |
| Learning Graphs | `pages/guided-topics.tsx` | Dependency graph plus adaptive learning path progression |
| Homepage preview | `components/homepage-redesign.tsx` | Compact relationship navigator on the first screen flow |

## Concept Relationship Model

Nodes represent engineering concepts, not folders.

Core node fields:

- `label`: user-facing concept name
- `cluster`: foundations, data flow, coordination, reliability, AI systems, or operations
- `level`: foundation, applied, advanced, or interview
- `prerequisiteIds`: concepts that should be understood first
- `relatedIds`: adjacent concepts discovered from explicit edges and article tag co-occurrence
- `postSlug` / `slug`: article or tag route preserving Hashnode SEO

Relationship types:

- `prerequisite`: must understand A before B
- `depends-on`: B uses A operationally
- `extends`: B deepens or specializes A
- `tradeoff`: A and B shape an engineering decision
- `adjacent`: concepts commonly appear together

## Interaction Model

Hover:

- Highlights the relationship edge.
- Shows a natural-language relationship preview in the side panel.

Click:

- Selects the concept.
- Syncs the learning context.
- Records a concept revisit in adaptive learning memory.
- Updates prerequisites, relationship counts, and article references.

Expand:

- Reveals dependencies and adjacent concepts around the selected node.
- Keeps the learner inside the relationship topology instead of sending them back to a category list.

AI action:

- Opens AI Mentor with the selected concept and graph context.
- Prompts relationship explanation rather than generic search.

Interview action:

- Generates a tradeoff question around the active concept and its dependencies.

## Route Organization

- `/discover`: full systems-thinking graph navigation
- `/guided-topics`: compatibility route for Learning Graphs and progression
- `/posts?tag=<tag>`: article-backed concept list fallback
- `/<post-slug>`: canonical article SEO route
- `/assistant?q=...`: contextual AI Mentor explanation and interview drills

## Responsive Navigation

Desktop:

- Scrollable topology canvas with relationship edges.
- Sticky-like detail panel on the right.
- Cluster filters across the top.

Mobile:

- Horizontal graph canvas remains available.
- A compact concept list appears beneath the graph for direct navigation.
- Detail actions remain stacked and touch-friendly.

## Preservation Rules

- Do not create a parallel CMS hierarchy.
- Keep articles as the canonical content objects.
- Keep Hashnode post routes as the primary SEO destination.
- Use tags and local relationship metadata as the semantic graph layer.
- Use AI Mentor for explanation, not as the only way to navigate.
