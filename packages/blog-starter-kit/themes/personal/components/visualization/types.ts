export type VizLayer = 'overview' | 'deepDive' | 'tradeoffs';

export type VizNode = {
	id: string;
	label: string;
	kind: 'service' | 'storage' | 'queue' | 'compute' | 'client';
	x: number;
	y: number;
	description?: string;
};

export type VizEdge = {
	id: string;
	from: string;
	to: string;
	label?: string;
	direction?: 'uni' | 'bi';
};

export type VizMessage = {
	id: string;
	edgeId: string;
	label: string;
	color?: string;
	progress: number;
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
};
