import { PostFragment } from '../generated/graphql';
import { formatTagName } from '../utils/format';

export type ConceptCluster =
	| 'foundations'
	| 'coordination'
	| 'data-flow'
	| 'reliability'
	| 'ai-systems'
	| 'operations';

export type ConceptLevel = 'foundation' | 'applied' | 'advanced' | 'interview';

export type ConceptRelationshipType =
	| 'prerequisite'
	| 'depends-on'
	| 'extends'
	| 'tradeoff'
	| 'adjacent';

export type ConceptGraphNode = {
	id: string;
	label: string;
	slug?: string;
	postSlug?: string;
	summary: string;
	cluster: ConceptCluster;
	level: ConceptLevel;
	articleCount: number;
	prerequisiteIds: string[];
	relatedIds: string[];
	x: number;
	y: number;
};

export type ConceptRelationship = {
	id: string;
	from: string;
	to: string;
	type: ConceptRelationshipType;
	label: string;
	strength: number;
};

export type ConceptGraph = {
	nodes: ConceptGraphNode[];
	relationships: ConceptRelationship[];
	clusters: Array<{ id: ConceptCluster; label: string; description: string }>;
};

export type ConceptGraphOptions = {
	mode?: 'global' | 'article';
	focusConcepts?: string[];
	focusSlug?: string;
	focusPostSlug?: string;
};

const CLUSTERS: ConceptGraph['clusters'] = [
	{ id: 'foundations', label: 'Foundations', description: 'Core primitives that shape the rest of the system.' },
	{ id: 'data-flow', label: 'Data Flow', description: 'How writes, reads, and streams move through the architecture.' },
	{ id: 'coordination', label: 'Coordination', description: 'How distributed actors agree on state and ownership.' },
	{ id: 'reliability', label: 'Reliability', description: 'Failure modes, guarantees, and operational recovery.' },
	{ id: 'ai-systems', label: 'AI Systems', description: 'Inference, retrieval, training, and model-serving systems.' },
	{ id: 'operations', label: 'Operations', description: 'Scaling, observability, and production tradeoffs.' },
];

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '') || 'concept';

const CANONICAL_NODES: Array<Omit<ConceptGraphNode, 'articleCount' | 'prerequisiteIds' | 'relatedIds' | 'postSlug'>> = [
	{ id: 'replication', label: 'Replication', slug: 'replication', summary: 'Copies state across nodes to improve durability, locality, and availability.', cluster: 'data-flow', level: 'foundation', x: 170, y: 110 },
	{ id: 'consensus', label: 'Consensus', slug: 'consensus', summary: 'Coordinates agreement when nodes can fail, lag, or disagree.', cluster: 'coordination', level: 'applied', x: 360, y: 110 },
	{ id: 'quorum', label: 'Quorum', slug: 'quorum', summary: 'Uses read and write thresholds to balance consistency, latency, and availability.', cluster: 'coordination', level: 'applied', x: 550, y: 110 },
	{ id: 'leader-election', label: 'Leader Election', slug: 'leader-election', summary: 'Selects an authority for ordering, failover, and ownership.', cluster: 'coordination', level: 'advanced', x: 740, y: 110 },
	{ id: 'distributed-transactions', label: 'Distributed Transactions', slug: 'distributed-transactions', summary: 'Preserves atomic outcomes across services, shards, or partitions.', cluster: 'reliability', level: 'advanced', x: 920, y: 110 },
	{ id: 'partition-tolerance', label: 'Partition Tolerance', slug: 'partition-tolerance', summary: 'Designs behavior when network links split the system into partial views.', cluster: 'reliability', level: 'foundation', x: 280, y: 275 },
	{ id: 'consistency-models', label: 'Consistency Models', slug: 'consistency-models', summary: 'Defines what a read is allowed to observe after writes and failures.', cluster: 'foundations', level: 'foundation', x: 480, y: 275 },
	{ id: 'event-streaming', label: 'Event Streaming', slug: 'event-streaming', summary: 'Models durable ordered event flow for asynchronous systems.', cluster: 'data-flow', level: 'applied', x: 680, y: 275 },
	{ id: 'backpressure', label: 'Backpressure', slug: 'backpressure', summary: 'Controls overload by slowing producers, queues, or consumers deliberately.', cluster: 'operations', level: 'applied', x: 875, y: 275 },
	{ id: 'retrieval-augmented-generation', label: 'RAG', slug: 'rag', summary: 'Combines retrieval, ranking, context assembly, and generation.', cluster: 'ai-systems', level: 'applied', x: 250, y: 430 },
	{ id: 'vector-indexes', label: 'Vector Indexes', slug: 'vector-indexes', summary: 'Approximate similarity search structures for high-dimensional embeddings.', cluster: 'ai-systems', level: 'foundation', x: 450, y: 430 },
	{ id: 'llm-inference', label: 'LLM Inference', slug: 'llm-inference', summary: 'Serves token generation under latency, batching, memory, and cost constraints.', cluster: 'ai-systems', level: 'advanced', x: 650, y: 430 },
	{ id: 'observability', label: 'Observability', slug: 'observability', summary: 'Connects metrics, logs, traces, and symptoms back to system behavior.', cluster: 'operations', level: 'applied', x: 850, y: 430 },
];

const CANONICAL_RELATIONSHIPS: ConceptRelationship[] = [
	{ id: 'replication-consensus', from: 'replication', to: 'consensus', type: 'depends-on', label: 'replication needs agreement under conflict', strength: 92 },
	{ id: 'consensus-quorum', from: 'consensus', to: 'quorum', type: 'prerequisite', label: 'quorum is a consensus building block', strength: 95 },
	{ id: 'quorum-leader-election', from: 'quorum', to: 'leader-election', type: 'extends', label: 'leadership uses quorum confidence', strength: 88 },
	{ id: 'leader-election-transactions', from: 'leader-election', to: 'distributed-transactions', type: 'extends', label: 'ordering enables transactional coordination', strength: 84 },
	{ id: 'partition-consensus', from: 'partition-tolerance', to: 'consensus', type: 'prerequisite', label: 'partitions force agreement tradeoffs', strength: 90 },
	{ id: 'consistency-quorum', from: 'consistency-models', to: 'quorum', type: 'tradeoff', label: 'read/write thresholds shape consistency', strength: 86 },
	{ id: 'event-replication', from: 'event-streaming', to: 'replication', type: 'adjacent', label: 'streams replicate facts over time', strength: 72 },
	{ id: 'event-backpressure', from: 'event-streaming', to: 'backpressure', type: 'depends-on', label: 'streaming systems need overload control', strength: 80 },
	{ id: 'backpressure-observability', from: 'backpressure', to: 'observability', type: 'adjacent', label: 'signals reveal pressure before failure', strength: 70 },
	{ id: 'vector-rag', from: 'vector-indexes', to: 'retrieval-augmented-generation', type: 'prerequisite', label: 'retrieval depends on searchable embeddings', strength: 89 },
	{ id: 'rag-inference', from: 'retrieval-augmented-generation', to: 'llm-inference', type: 'depends-on', label: 'context affects inference quality and cost', strength: 82 },
	{ id: 'inference-observability', from: 'llm-inference', to: 'observability', type: 'tradeoff', label: 'latency, quality, and cost must be measured', strength: 78 },
];

const keywordMatch = (post: PostFragment, node: Pick<ConceptGraphNode, 'id' | 'label' | 'slug'>) => {
	const haystack = `${post.title} ${post.brief ?? ''} ${(post.tags ?? []).flatMap((tag) => [tag.name, tag.slug]).join(' ')}`.toLowerCase();
	const tokens = [node.id, node.label, node.slug ?? '']
		.flatMap((item) => item.split(/[-\s]+/))
		.filter((item) => item.length > 2);
	return tokens.some((token) => haystack.includes(token.toLowerCase()));
};

const countArticles = (posts: PostFragment[], node: Pick<ConceptGraphNode, 'id' | 'label' | 'slug'>) =>
	posts.filter((post) => keywordMatch(post, node)).length;

const findPostSlug = (posts: PostFragment[], node: Pick<ConceptGraphNode, 'id' | 'label' | 'slug'>) =>
	posts.find((post) => keywordMatch(post, node))?.slug;

const inferCluster = (label: string): ConceptCluster => {
	const lower = label.toLowerCase();
	if (/llm|ai|model|vector|embedding|rag|retrieval|inference/.test(lower)) return 'ai-systems';
	if (/stream|event|queue|kafka|data|cdc|replication/.test(lower)) return 'data-flow';
	if (/consensus|quorum|leader|election|lock|coordination/.test(lower)) return 'coordination';
	if (/failure|fault|reliability|transaction|partition|consistency/.test(lower)) return 'reliability';
	if (/deploy|scale|observability|monitor|performance|latency|cache/.test(lower)) return 'operations';
	return 'foundations';
};

const inferLevel = (index: number, label: string): ConceptLevel => {
	const lower = label.toLowerCase();
	if (/interview|tradeoff|staff/.test(lower)) return 'interview';
	if (/transaction|consensus|inference|architecture/.test(lower)) return 'advanced';
	if (index < 4) return 'foundation';
	return 'applied';
};

const addRelationship = (
	relationships: Map<string, ConceptRelationship>,
	relationship: ConceptRelationship,
) => {
	if (!relationships.has(relationship.id)) {
		relationships.set(relationship.id, relationship);
	}
};

const clusterForConcept = (concept: string): ConceptCluster => inferCluster(concept);

const summaryForConcept = (concept: string) => {
	const lower = concept.toLowerCase();
	if (/hyperloglog/.test(lower)) return 'Probabilistic sketch for approximate unique counts with tiny, fixed memory.';
	if (/hash/.test(lower)) return 'Uniform hashing turns item identity into estimator-friendly bit patterns.';
	if (/cardinality/.test(lower)) return 'The quantity being estimated: how many distinct items appeared.';
	if (/leading zero/.test(lower)) return 'Rare bit-run observations become evidence of larger unseen sets.';
	if (/register/.test(lower)) return 'Compact buckets that store maximum observed leading-zero runs.';
	if (/harmonic/.test(lower)) return 'Aggregation method that dampens outliers across register values.';
	if (/bias|error/.test(lower)) return 'Accuracy boundary that decides whether the estimate is acceptable.';
	if (/redis/.test(lower)) return 'Production implementation surface for PFADD, PFCOUNT, and PFMERGE.';
	return `Article-specific concept in the ${concept} learning path.`;
};

const buildArticleFocusGraph = (posts: PostFragment[], options: ConceptGraphOptions): ConceptGraph => {
	const focusConcepts = [...new Set((options.focusConcepts ?? []).filter(Boolean))].slice(0, 12);
	const concepts = focusConcepts.length > 0 ? focusConcepts : ['Core Concept', 'Mental Model', 'Tradeoffs', 'Failure Modes'];
	const nodes = concepts.map((concept, index) => {
		const id = slugify(concept);
		const matchingPost = posts.find((post) => keywordMatch(post, { id, label: concept, slug: id }));
		return {
			id,
			label: concept,
			slug: index === 0 ? options.focusSlug : matchingPost?.tags?.[0]?.slug,
			postSlug: index === 0 ? options.focusPostSlug : matchingPost?.slug,
			summary: summaryForConcept(concept),
			cluster: clusterForConcept(concept),
			level: index <= 2 ? 'foundation' : index <= 6 ? 'applied' : 'advanced',
			articleCount: matchingPost ? 1 : index === 0 ? 1 : 0,
			prerequisiteIds: index === 0 ? [] : [slugify(concepts[index - 1])],
			relatedIds: [],
			x: 120 + (index % 4) * 230,
			y: 110 + Math.floor(index / 4) * 165,
		} satisfies ConceptGraphNode;
	});
	const relationships = nodes.slice(1).map((node, index) => ({
		id: `${nodes[index].id}-${node.id}`,
		from: nodes[index].id,
		to: node.id,
		type: index <= 2 ? 'prerequisite' : index <= 6 ? 'depends-on' : 'tradeoff',
		label: index <= 2 ? 'builds the mental model' : index <= 6 ? 'feeds the estimation pipeline' : 'shapes production use',
		strength: 80 - index,
	} satisfies ConceptRelationship));
	const crossLinks: ConceptRelationship[] = nodes.length > 5
		? [
				{
					id: `${nodes[1].id}-${nodes[5].id}-tradeoff`,
					from: nodes[1].id,
					to: nodes[5].id,
					type: 'tradeoff',
					label: 'accuracy depends on estimator assumptions',
					strength: 72,
				},
		  ]
		: [];
	const allRelationships = [...relationships, ...crossLinks];
	return {
		nodes: nodes.map((node) => ({
			...node,
			relatedIds: allRelationships
				.filter((relationship) => relationship.from === node.id || relationship.to === node.id)
				.map((relationship) => (relationship.from === node.id ? relationship.to : relationship.from)),
		})),
		relationships: allRelationships,
		clusters: CLUSTERS,
	};
};

export const buildConceptGraph = (posts: PostFragment[] = [], options: ConceptGraphOptions = {}): ConceptGraph => {
	if (options.mode === 'article') {
		return buildArticleFocusGraph(posts, options);
	}

	const nodes = new Map<string, ConceptGraphNode>();
	const relationships = new Map<string, ConceptRelationship>();

	CANONICAL_NODES.forEach((node) => {
		const articleCount = countArticles(posts, node);
		nodes.set(node.id, {
			...node,
			articleCount,
			postSlug: findPostSlug(posts, node),
			prerequisiteIds: [],
			relatedIds: [],
		});
	});

	CANONICAL_RELATIONSHIPS.forEach((relationship) => addRelationship(relationships, relationship));

	const tagCounts = new Map<string, { slug: string; label: string; count: number; postSlug?: string }>();
	posts.forEach((post) => {
		(post.tags ?? []).forEach((tag) => {
			const id = slugify(tag.slug || tag.name);
			const existing = tagCounts.get(id);
			tagCounts.set(id, {
				slug: tag.slug,
				label: formatTagName(tag.name),
				count: (existing?.count ?? 0) + 1,
				postSlug: existing?.postSlug ?? post.slug,
			});
		});
	});

	[...tagCounts.values()]
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
		.slice(0, 14)
		.forEach((tag, index) => {
			const id = slugify(tag.slug || tag.label);
			if (nodes.has(id)) return;
			const cluster = inferCluster(tag.label);
			const row = Math.floor(index / 5);
			const col = index % 5;
			nodes.set(id, {
				id,
				label: tag.label,
				slug: tag.slug,
				postSlug: tag.postSlug,
				summary: `Article-backed concept cluster with ${tag.count} related deep dive${tag.count === 1 ? '' : 's'}.`,
				cluster,
				level: inferLevel(index, tag.label),
				articleCount: tag.count,
				prerequisiteIds: [],
				relatedIds: [],
				x: 160 + col * 190,
				y: 580 + row * 130,
			});
		});

	posts.forEach((post) => {
		const ids = (post.tags ?? [])
			.map((tag) => slugify(tag.slug || tag.name))
			.filter((id) => nodes.has(id));
		ids.slice(0, 4).forEach((from, index) => {
			ids.slice(index + 1, 5).forEach((to) => {
				addRelationship(relationships, {
					id: [from, to].sort().join('-adjacent-'),
					from,
					to,
					type: 'adjacent',
					label: 'co-appears in article context',
					strength: 54,
				});
			});
		});
	});

	const nodeList = [...nodes.values()];
	const relationshipList = [...relationships.values()].filter(
		(relationship) => nodes.has(relationship.from) && nodes.has(relationship.to),
	);

	return {
		nodes: nodeList.map((node) => {
			const inbound = relationshipList
				.filter((relationship) => relationship.to === node.id && ['prerequisite', 'depends-on'].includes(relationship.type))
				.map((relationship) => relationship.from);
			const related = relationshipList
				.filter((relationship) => relationship.from === node.id || relationship.to === node.id)
				.map((relationship) => (relationship.from === node.id ? relationship.to : relationship.from));
			return {
				...node,
				prerequisiteIds: [...new Set(inbound)],
				relatedIds: [...new Set(related)],
			};
		}),
		relationships: relationshipList,
		clusters: CLUSTERS,
	};
};

export const getConceptHref = (node: ConceptGraphNode) => {
	if (node.postSlug) return `/${node.postSlug}`;
	if (node.slug) return `/posts?tag=${encodeURIComponent(node.slug)}`;
	return `/assistant?q=${encodeURIComponent(`Explain ${node.label}`)}`;
};

export const getRelationshipSummary = (
	relationship: ConceptRelationship,
	nodes: ConceptGraphNode[],
) => {
	const from = nodes.find((node) => node.id === relationship.from)?.label ?? relationship.from;
	const to = nodes.find((node) => node.id === relationship.to)?.label ?? relationship.to;
	return `${from} -> ${to}: ${relationship.label}`;
};
