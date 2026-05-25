import { VizEdgeSemantic, VizNodeHealth, VizNodeKind } from './types';

export const NODE_SEMANTICS: Record<
	VizNodeKind,
	{
		label: string;
		description: string;
		token: string;
		className: string;
		glyph: string;
	}
> = {
	client: {
		label: 'Actor',
		description: 'External user, caller, device, or workload entering the system.',
		token: 'actor',
		className: 'fill-slate-200 stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500',
		glyph: 'U',
	},
	gateway: {
		label: 'Boundary',
		description: 'Trust, routing, authentication, throttling, or protocol boundary.',
		token: 'boundary',
		className: 'fill-cyan-100 stroke-cyan-500 dark:fill-cyan-950/60 dark:stroke-cyan-400',
		glyph: 'G',
	},
	service: {
		label: 'Service',
		description: 'A networked capability with ownership, API surface, and operational limits.',
		token: 'service',
		className: 'fill-blue-100 stroke-blue-500 dark:fill-blue-950/60 dark:stroke-blue-400',
		glyph: 'S',
	},
	coordinator: {
		label: 'Coordinator',
		description: 'Controls ordering, membership, orchestration, or consensus boundaries.',
		token: 'coordination',
		className: 'fill-violet-100 stroke-violet-500 dark:fill-violet-950/60 dark:stroke-violet-400',
		glyph: 'C',
	},
	compute: {
		label: 'Compute',
		description: 'Stateless or stateful execution where commands become decisions.',
		token: 'compute',
		className: 'fill-indigo-100 stroke-indigo-500 dark:fill-indigo-950/60 dark:stroke-indigo-400',
		glyph: 'X',
	},
	worker: {
		label: 'Worker',
		description: 'Async executor, background processor, or batch consumer.',
		token: 'work',
		className: 'fill-sky-100 stroke-sky-500 dark:fill-sky-950/60 dark:stroke-sky-400',
		glyph: 'W',
	},
	queue: {
		label: 'Stream',
		description: 'Temporal buffer, event log, queue, or replayable stream.',
		token: 'time',
		className: 'fill-amber-100 stroke-amber-500 dark:fill-amber-950/60 dark:stroke-amber-400',
		glyph: 'Q',
	},
	storage: {
		label: 'Durability',
		description: 'System of record, index, ledger, or durable state boundary.',
		token: 'state',
		className: 'fill-emerald-100 stroke-emerald-500 dark:fill-emerald-950/60 dark:stroke-emerald-400',
		glyph: 'D',
	},
	replica: {
		label: 'Replica',
		description: 'Copied state with lag, quorum, failover, or read-routing semantics.',
		token: 'replica',
		className: 'fill-teal-100 stroke-teal-500 dark:fill-teal-950/60 dark:stroke-teal-400',
		glyph: 'R',
	},
	cache: {
		label: 'Cache',
		description: 'Fast derived state with freshness, eviction, and invalidation tradeoffs.',
		token: 'freshness',
		className: 'fill-lime-100 stroke-lime-500 dark:fill-lime-950/60 dark:stroke-lime-400',
		glyph: 'M',
	},
	ai: {
		label: 'AI',
		description: 'Probabilistic reasoning, retrieval, ranking, or generative decision point.',
		token: 'model',
		className: 'fill-fuchsia-100 stroke-fuchsia-500 dark:fill-fuchsia-950/60 dark:stroke-fuchsia-400',
		glyph: 'AI',
	},
};

export const EDGE_SEMANTICS: Record<
	VizEdgeSemantic,
	{
		label: string;
		description: string;
		stroke: string;
		dash?: string;
		messageColor: string;
	}
> = {
	request: {
		label: 'Request',
		description: 'User-facing synchronous path. Optimize for clarity and bounded latency.',
		stroke: 'stroke-blue-500 dark:stroke-blue-400',
		messageColor: '#2563eb',
	},
	command: {
		label: 'Command',
		description: 'Intent to mutate or coordinate state. Requires validation and idempotency.',
		stroke: 'stroke-violet-500 dark:stroke-violet-400',
		messageColor: '#7c3aed',
	},
	write: {
		label: 'Write',
		description: 'Durable mutation path. Make consistency and acknowledgement semantics explicit.',
		stroke: 'stroke-emerald-600 dark:stroke-emerald-400',
		messageColor: '#059669',
	},
	read: {
		label: 'Read',
		description: 'Query path with freshness, latency, and fan-out tradeoffs.',
		stroke: 'stroke-sky-500 dark:stroke-sky-400',
		messageColor: '#0284c7',
	},
	replication: {
		label: 'Replication',
		description: 'State propagation across fault domains. Watch lag and quorum visibility.',
		stroke: 'stroke-teal-500 dark:stroke-teal-400',
		dash: '8 6',
		messageColor: '#0d9488',
	},
	event: {
		label: 'Event',
		description: 'Asynchronous fact propagation. Great for decoupling, harder for freshness.',
		stroke: 'stroke-amber-500 dark:stroke-amber-400',
		dash: '4 5',
		messageColor: '#d97706',
	},
	control: {
		label: 'Control',
		description: 'Membership, heartbeat, scheduling, or policy signal.',
		stroke: 'stroke-slate-500 dark:stroke-slate-400',
		dash: '2 5',
		messageColor: '#64748b',
	},
	fallback: {
		label: 'Fallback',
		description: 'Recovery, compensation, or degraded-mode path after a failure.',
		stroke: 'stroke-rose-500 dark:stroke-rose-400',
		dash: '10 5 2 5',
		messageColor: '#e11d48',
	},
};

export const HEALTH_SEMANTICS: Record<
	VizNodeHealth,
	{
		label: string;
		ringClass: string;
		toneClass: string;
	}
> = {
	healthy: {
		label: 'Healthy',
		ringClass: 'stroke-transparent',
		toneClass: 'text-emerald-700 dark:text-emerald-300',
	},
	hot: {
		label: 'Hot path',
		ringClass: 'stroke-amber-400',
		toneClass: 'text-amber-700 dark:text-amber-300',
	},
	degraded: {
		label: 'Degraded',
		ringClass: 'stroke-orange-500',
		toneClass: 'text-orange-700 dark:text-orange-300',
	},
	failed: {
		label: 'Failed',
		ringClass: 'stroke-rose-600',
		toneClass: 'text-rose-700 dark:text-rose-300',
	},
	recovering: {
		label: 'Recovering',
		ringClass: 'stroke-blue-500',
		toneClass: 'text-blue-700 dark:text-blue-300',
	},
};

export const getNodeSemantics = (kind: VizNodeKind) => NODE_SEMANTICS[kind] ?? NODE_SEMANTICS.service;
export const getEdgeSemantics = (semantic?: VizEdgeSemantic) => EDGE_SEMANTICS[semantic ?? 'request'];
export const getHealthSemantics = (health?: VizNodeHealth) => HEALTH_SEMANTICS[health ?? 'healthy'];
