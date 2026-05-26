import { PostFullFragment, PostFragment } from '../generated/graphql';
import { formatTagName } from '../utils/format';

type ArticleLike = Pick<PostFragment, 'title' | 'brief' | 'tags'> & {
	content?: { markdown?: string };
};

export type ArticleDomain =
	| 'probabilistic-data-structures'
	| 'data-structures'
	| 'distributed-systems'
	| 'ai-systems'
	| 'system-design'
	| 'backend'
	| 'general';

const KNOWN_CONCEPT_PATTERNS: Array<{ pattern: RegExp; concept: string; domain: ArticleDomain }> = [
	{ pattern: /hyperloglog/i, concept: 'HyperLogLog', domain: 'probabilistic-data-structures' },
	{ pattern: /bloom filter/i, concept: 'Bloom Filter', domain: 'probabilistic-data-structures' },
	{ pattern: /count-min sketch/i, concept: 'Count-Min Sketch', domain: 'probabilistic-data-structures' },
	{ pattern: /softmax/i, concept: 'Softmax', domain: 'ai-systems' },
	{ pattern: /dot product/i, concept: 'Dot Product', domain: 'ai-systems' },
	{ pattern: /quorum/i, concept: 'Quorum', domain: 'distributed-systems' },
	{ pattern: /consensus|raft|paxos/i, concept: 'Consensus', domain: 'distributed-systems' },
	{ pattern: /replication/i, concept: 'Replication', domain: 'distributed-systems' },
	{ pattern: /kafka/i, concept: 'Kafka', domain: 'distributed-systems' },
];

const domainPatterns: Array<{ domain: ArticleDomain; pattern: RegExp }> = [
	{ domain: 'probabilistic-data-structures', pattern: /hyperloglog|bloom filter|count-min sketch|cardinality|probabilistic|leading zero|hash function/i },
	{ domain: 'ai-systems', pattern: /llm|rag|embedding|vector|model|inference|softmax|transformer|machine learning/i },
	{ domain: 'distributed-systems', pattern: /distributed|consensus|quorum|replication|leader election|transaction|saga|kafka|partition/i },
	{ domain: 'system-design', pattern: /system design|architecture|scaling|load balancer|cache|sharding/i },
	{ domain: 'backend', pattern: /api|database|backend|microservice|queue|redis|postgres/i },
	{ domain: 'data-structures', pattern: /data structure|algorithm|tree|graph|heap|hash|sketch/i },
];

const stripTitleSuffix = (title: string) =>
	title
		.replace(/\s+explained\b.*$/i, '')
		.replace(/[:|–-].*$/, '')
		.trim();

export const getArticleSearchText = (post: ArticleLike) =>
	[
		post.title,
		post.brief,
		post.content?.markdown ?? '',
		...(post.tags ?? []).flatMap((tag) => [tag.name, tag.slug]),
	]
		.filter(Boolean)
		.join(' ');

export const inferArticleDomain = (post: ArticleLike): ArticleDomain => {
	const haystack = getArticleSearchText(post);
	return domainPatterns.find((item) => item.pattern.test(haystack))?.domain ?? 'general';
};

export const inferPrimaryArticleConcept = (post: ArticleLike) => {
	const haystack = getArticleSearchText(post);
	const known = KNOWN_CONCEPT_PATTERNS.find((item) => item.pattern.test(haystack));
	if (known) return known.concept;

	const titleConcept = stripTitleSuffix(post.title);
	if (titleConcept.length > 2 && titleConcept.length <= 48) return titleConcept;

	const preciseTag = (post.tags ?? []).find((tag) => {
		const name = formatTagName(tag.name);
		return !/data structures|algorithms|system design|backend|machine learning|distributed systems/i.test(name);
	});
	return preciseTag ? formatTagName(preciseTag.name) : post.title;
};

export const getArticleConceptSeeds = (post: PostFullFragment): string[] => {
	const domain = inferArticleDomain(post);
	const primary = inferPrimaryArticleConcept(post);
	const seedsByDomain: Record<ArticleDomain, string[]> = {
		'probabilistic-data-structures': [
			primary,
			'Hashing',
			'Cardinality Estimation',
			'Leading Zeros',
			'Registers',
			'Harmonic Mean',
			'Bias Correction',
			'Error Bounds',
			'Redis PFADD/PFCOUNT',
			'Analytics at Scale',
			'Probabilistic Data Structures',
		],
		'data-structures': [primary, 'Algorithmic Invariant', 'Memory Layout', 'Complexity', 'Edge Cases', 'Implementation Tradeoffs'],
		'distributed-systems': [primary, 'Replication', 'Consensus', 'Quorum', 'Leader Election', 'Failure Recovery'],
		'ai-systems': [primary, 'Model Behavior', 'Vector Space', 'Inference', 'Evaluation', 'Production Guardrails'],
		'system-design': [primary, 'Requirements', 'Topology', 'Bottlenecks', 'Tradeoffs', 'Failure Modes'],
		backend: [primary, 'API Boundary', 'Storage', 'Caching', 'Queues', 'Operational Failure'],
		general: [primary, 'Mental Model', 'Core Mechanism', 'Tradeoffs', 'Failure Modes', 'Interview Reasoning'],
	};
	return [...new Set(seedsByDomain[domain])];
};
