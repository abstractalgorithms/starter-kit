# Simulation Learning Engine

Simulations are the primary systems-thinking pedagogy layer for Abstract Algorithms. They teach engineering concepts directly through topology, failure, tradeoffs, and step-through reasoning. The standalone visualization lab remains useful, but simulations should also appear inline where learning happens.

## Simulation Architecture

| Layer | File | Responsibility |
| --- | --- | --- |
| Scenario model | `components/visualization/types.ts` | Nodes, edges, steps, messages, failure modes, layers |
| Scenario corpus | `components/visualization/scenarios.ts` | Failure, consistency, replication, consensus, LLM, and network/system simulations |
| Simulation engine | `components/visualization/use-visualization-engine.ts` | Playback, step-through, failure mode, slow motion, selected topology node |
| Canvas primitives | `components/visualization/pedagogy-canvas.tsx` | Topology rendering, semantic node glyphs, animated message flow |
| Full lab | `components/visualization/visualization-studio.tsx` | Large exploratory simulation workspace |
| Inline engine | `components/visualization/inline-simulation.tsx` | Reusable simulation block embedded inside learning surfaces |
| Memory sync | `lib/learning-memory.ts` | Records failure replays, completions, tradeoff pressure tests |

## Inline Simulation System

`InlineSimulation` embeds the simulation engine into:

- articles
- learning graph node details
- AI Mentor simulation tab
- interview prep

Inputs:

- `topic`: current concept, article, interview category, or mentor query
- `node`: current section, graph node, or topology node
- `source`: article, learning graph, AI Mentor, interview prep, or inline
- `compact`: dense mode for sidebars and constrained panels

It automatically chooses the best scenario by matching the topic against scenario title, category, summary, and id.

## State Synchronization

Simulation actions write into adaptive memory:

| Action | Memory effect |
| --- | --- |
| Replay flow | records completed simulation attempt |
| Replay failure | records simulation failure and concept weakness |
| Pressure Test | records tradeoff mistake and triggers failure reasoning |
| Select topology node | keeps reasoning local to the active system component |
| Step through | supports cognition-state continuation through the simulation engine |

Storage remains local-first under `aa:adaptive-learning-memory:v1`.

## Topology Interaction Model

Each topology is a learning object:

- Nodes represent responsibility boundaries.
- Edges represent semantic flows: request, command, replication, event, read, write, control, fallback.
- Message tokens show system movement over time.
- Failure states alter node/edge health visually.
- Layer tabs switch between overview, deep dive, and tradeoff explanation.

Expected learner loop:

1. Read concept.
2. Launch inline simulation.
3. Step through normal behavior.
4. Replay failure.
5. Pressure-test constraints.
6. Explain tradeoffs with AI Mentor.
7. Continue to next concept or interview drill.

## Simulation Types

The scenario corpus should cover:

- Failure simulations
- Consistency simulations
- Replication simulations
- Consensus simulations
- LLM inference/training simulations
- Network/system simulations

Existing categories map into this taxonomy:

- `kafka`, `replication`, `quorum`, `consensus`, `cap`
- `llm-pipeline`, `retrieval`, `vector-database`
- `kubernetes`, `event-sourcing`, `distributed-transactions`

## CTA Behaviors

| CTA | Behavior |
| --- | --- |
| Launch Simulation | Preloads current article, section, graph node, or mentor concept |
| Replay Failure | Visualizes architecture breakdown and records failure memory |
| Pressure Test | Mutates constraints by triggering failure mode and recording tradeoff pressure |
| Step | Moves learner through topology evolution one cognition step at a time |
| Open Lab | Opens full `/visualizations` workspace with current topic preloaded |

## Reusable Simulation Primitives

Use these pieces when adding new simulation experiences:

- `VizScenario`
- `VizNode`
- `VizEdge`
- `VizStep`
- `VizFailureMode`
- `useVisualizationEngine`
- `PedagogyCanvas`
- `DiagramAffordanceBar`
- `InlineSimulation`

Do not create one-off diagram widgets when a scenario can model the same behavior. Add scenarios to the shared corpus instead.
