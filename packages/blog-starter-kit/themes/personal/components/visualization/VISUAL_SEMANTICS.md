# Abstract Algorithms Visual Pedagogy System

This folder defines the proprietary engineering diagram language used by Abstract Algorithms.

## Topology Semantics

Nodes describe engineering responsibility, not just infrastructure shape.

- `client`: external actor or workload entering the system.
- `gateway`: trust, routing, throttling, and protocol boundary.
- `service`: owned network capability with APIs and operating limits.
- `coordinator`: ordering, orchestration, consensus, or membership boundary.
- `compute`: execution point where commands become decisions.
- `worker`: asynchronous processor or background executor.
- `queue`: temporal buffer, stream, log, or replay layer.
- `storage`: durable system of record.
- `replica`: copied state with lag, quorum, or failover semantics.
- `cache`: derived fast state with freshness and invalidation risk.
- `ai`: probabilistic model, retrieval, ranking, or generative step.

## Edge Grammar

Edges show the learning meaning of movement through a system.

- `request`: synchronous user path; optimize for latency and clarity.
- `command`: mutating intent; discuss validation, idempotency, and ordering.
- `write`: durable mutation; discuss acknowledgement and consistency.
- `read`: query path; discuss freshness, latency, and fan-out.
- `replication`: dashed propagation across fault domains.
- `event`: asynchronous fact propagation with replay and lag semantics.
- `control`: heartbeat, membership, scheduling, or policy signal.
- `fallback`: recovery or degraded path after failure.

## Animation Semantics

- Replay flow restarts from the first step and plays the happy path.
- Step through pauses playback and advances one conceptual decision.
- Slow motion mode reduces speed to make causality visible.
- Trigger failure switches to failure mode, highlights blast radius, and reveals recovery guidance.
- Reduced-motion users receive state transitions without continuous motion.

## Failure Visualization

Failures are first-class states with:

- target node or edge
- severity
- blast radius
- recovery path
- visual treatment using rose dashed rings and fallback edges

Failure diagrams should answer: what broke, who notices, what becomes stale, what retries, and how recovery happens.

## Interaction Affordances

Every reusable diagram should support:

- `Replay Flow`
- `Trigger Failure`
- `Explain This Node`
- `Step Through`
- `Slow Motion Mode`

Node explanation should connect the visual role to interview reasoning: responsibility, tradeoffs, and failure hints.

## Implementation

- Semantics tokens live in `semantics.ts`.
- Scenario data uses `types.ts`.
- Playback and failure state live in `use-visualization-engine.ts`.
- Reusable canvas primitives live in `pedagogy-canvas.tsx`.
- Product-level simulation UX composes those pieces in `visualization-studio.tsx`.
