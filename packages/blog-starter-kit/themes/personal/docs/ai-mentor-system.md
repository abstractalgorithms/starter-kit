# AI Mentor System

The AI Mentor is not a search box. It is an embedded adaptive layer that follows the learner across articles, learning graphs, simulations, interview prep, and topology nodes.

## Architecture

Core pieces:

| Layer | File | Responsibility |
| --- | --- | --- |
| Learning memory | `lib/learning-memory.ts` | Persistent learner model, weak areas, velocity, simulations, interview readiness |
| Context state | `lib/learning-context.ts` | Current article, section, graph node, simulation, route position |
| Recommendation engine | `buildAdaptiveRecommendations` | Ranks next concepts, reviews, drills, and interview actions |
| Proactive nudges | `buildProactiveMentorNudges` | Converts memory into mentor-style suggestions |
| Embedded UI | `components/embedded-ai-mentor.tsx` | Reusable mentor panel for in-context surfaces |
| Assistant API | `pages/api/learning-assistant.ts` | Uses memory context to alter retrieval, prerequisites, and sequence |

## Contextual Recommendation Engine

Inputs:

- current route and section
- current article title and tags
- active learning graph node
- active simulation scenario, node, and failure state
- interview category and readiness state
- persisted memory snapshot

Outputs:

- next concept
- weak-area review
- simulation replay
- interview drill
- tradeoff challenge
- exact-session continuation

## Proactive Interaction Model

The mentor should speak in continuity language:

- `You recently studied Kafka replication.`
- `You may now be ready for transactions.`
- `You struggled with quorum tradeoffs previously.`
- `Want to pressure-test consistency failures?`

Implementation:

- `buildProactiveMentorNudges(memory, recommendations)` creates these prompts.
- `EmbeddedAIMentor` displays them as contextual actions.
- `buildContextualMentorPrompt` injects memory, current section, current concept, and intent.

## Embedded AI UI System

The reusable panel appears in:

- articles, after engagement and before next-learning
- learning graph node detail panels
- simulation sidebars beside topology/node state
- interview prep dashboard
- sticky article context rail through contextual actions

The mentor should not require users to leave the learning surface unless they choose a deeper AI Mentor session.

## Contextual CTA System

CTA behaviors:

| CTA | Behavior |
| --- | --- |
| Ask in Context | Opens inline article chatbot with article, section, and memory context |
| Continue Learning | Opens AI Mentor with exact memory and current context |
| Practice Tradeoffs | Opens AI Mentor with tradeoff pressure-test prompt |
| Next Drill | Requests simulations and interview drills for the active concept |
| Launch Simulation | Opens the current concept in visualization context |
| Practice Interview | Opens interview prep with the current concept as coaching context |

## Preservation Rules

- Do not change Hashnode post routes or slugs.
- Do not duplicate CMS structure for mentor state.
- Do not move article rendering out of the existing MDX/Hashnode flow.
- Keep AI Mentor as a behavioral layer over articles, series, graphs, simulations, and interview prep.
