export type VizLayer = 'overview' | 'deepDive' | 'tradeoffs';

export type VizNodeKind =
	| 'client'
	| 'service'
	| 'storage'
	| 'queue'
	| 'compute'
	| 'gateway'
	| 'coordinator'
	| 'replica'
	| 'cache'
	| 'worker'
	| 'ai';

export type VizNodeHealth = 'healthy' | 'hot' | 'degraded' | 'failed' | 'recovering';
export type VizEdgeSemantic = 'request' | 'command' | 'replication' | 'event' | 'read' | 'write' | 'control' | 'fallback';
export type VizAnimationMode = 'normal' | 'slow' | 'stepping' | 'failure';

export type VizNode = {
	id: string;
	label: string;
	kind: VizNodeKind;
	x: number;
	y: number;
	description?: string;
	health?: VizNodeHealth;
	semantics?: {
		responsibility?: string;
		interviewPrompt?: string;
		failureHint?: string;
	};
};

export type VizEdge = {
	id: string;
	from: string;
	to: string;
	label?: string;
	direction?: 'uni' | 'bi';
	semantic?: VizEdgeSemantic;
};

export type VizMessage = {
	id: string;
	edgeId: string;
	label: string;
	color?: string;
	progress: number;
	semantic?: VizEdgeSemantic;
};

export type VizStep = {
	id: string;
	title: string;
	description: string;
	durationMs: number;
	highlightNodeIds?: string[];
	highlightEdgeIds?: string[];
	messages?: VizMessage[];
	layers: Record<VizLayer, string>;
};

export type VizFailureMode = {
	id: string;
	title: string;
	nodeId?: string;
	edgeId?: string;
	description: string;
	blastRadius: string;
	recovery: string;
	severity: 'low' | 'medium' | 'high';
};

export type VizScenario = {
	id: string;
	title: string;
	category:
		| 'kafka'
		| 'distributed-transactions'
		| 'replication'
		| 'quorum'
		| 'vector-database'
		| 'llm-pipeline'
		| 'retrieval'
		| 'cap'
		| 'consensus'
		| 'kubernetes'
		| 'event-sourcing';
	summary: string;
	nodes: VizNode[];
	edges: VizEdge[];
	steps: VizStep[];
	failureModes?: VizFailureMode[];
};
