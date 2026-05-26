import type { PostFragment } from '../generated/graphql';
import { getArticleConceptSeeds, inferArticleDomain, inferPrimaryArticleConcept, type ArticleDomain } from './article-domain';
import { formatTagName } from '../utils/format';

export type TopicLearningArticle = {
	id: string;
	title: string;
	slug: string;
	brief?: string | null;
	readTimeInMinutes?: number | null;
	tags: Array<{ name: string; slug: string }>;
	primaryConcept: string;
	domain: ArticleDomain;
	relevance: number;
};

export type TopicLearningStage = {
	id: 'concept' | 'visual' | 'tradeoff' | 'challenge' | 'continue';
	label: string;
	intent: string;
	primaryCta: string;
	articleSlugs: string[];
};

export type TopicLearningJourney = {
	slug: string;
	label: string;
	description: string;
	domain: ArticleDomain;
	concepts: string[];
	articles: TopicLearningArticle[];
	stages: TopicLearningStage[];
	semanticQuery: string;
};

const TOPIC_PROFILES: Record<
	string,
	{
		label: string;
		domain: ArticleDomain;
		description: string;
		keywords: string[];
		concepts: string[];
	}
> = {
	'probabilistic-data-structures': {
		label: 'Probabilistic Data Structures',
		domain: 'probabilistic-data-structures',
		description:
			'Learn sketches, approximate membership, cardinality estimation, error bounds, and when approximation beats exactness.',
		keywords: ['hyperloglog', 'bloom', 'count-min', 'sketch', 'cardinality', 'probabilistic', 'hash', 'approximation'],
		concepts: ['Hashing', 'Cardinality Estimation', 'Approximation Error', 'Registers', 'Streaming Data'],
	},
	'distributed-systems': {
		label: 'Distributed Systems',
		domain: 'distributed-systems',
		description:
			'Move through replication, consensus, quorum, leader election, transactions, and failure recovery as one connected system.',
		keywords: ['distributed', 'replication', 'consensus', 'quorum', 'leader', 'transaction', 'saga', 'kafka', 'partition'],
		concepts: ['Replication', 'Consensus', 'Quorum', 'Leader Election', 'Distributed Transactions'],
	},
	'ai-systems': {
		label: 'AI Systems',
		domain: 'ai-systems',
		description:
			'Understand model behavior, inference, retrieval, vector spaces, evaluation, and production guardrails together.',
		keywords: ['llm', 'rag', 'embedding', 'vector', 'softmax', 'transformer', 'inference', 'training', 'model'],
		concepts: ['Model Behavior', 'Vector Space', 'Inference', 'Retrieval', 'Evaluation'],
	},
	'system-design': {
		label: 'System Design',
		domain: 'system-design',
		description:
			'Practice requirements, topology, bottlenecks, tradeoffs, failure modes, and operational constraints as a design loop.',
		keywords: ['system design', 'architecture', 'scaling', 'cache', 'sharding', 'load balancer', 'database'],
		concepts: ['Requirements', 'Topology', 'Bottlenecks', 'Tradeoffs', 'Failure Modes'],
	},
	backend: {
		label: 'Backend Engineering',
		domain: 'backend',
		description:
			'Connect API boundaries, storage, queues, caching, consistency, and operational failure into backend judgment.',
		keywords: ['backend', 'api', 'database', 'queue', 'redis', 'postgres', 'microservice', 'storage'],
		concepts: ['API Boundary', 'Storage', 'Caching', 'Queues', 'Operational Failure'],
	},
	'data-structures': {
		label: 'Data Structures',
		domain: 'data-structures',
		description:
			'Learn invariants, complexity, memory layout, edge cases, and implementation tradeoffs across related structures.',
		keywords: ['data structure', 'algorithm', 'tree', 'graph', 'heap', 'hash', 'complexity'],
		concepts: ['Invariants', 'Complexity', 'Memory Layout', 'Edge Cases', 'Implementation Tradeoffs'],
	},
};

export const normalizeTopicSlug = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const titleFromSlug = (slug: string) =>
	slug
		.split('-')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

const getPostText = (post: PostFragment) =>
	[
		post.title,
		post.brief,
		post.subtitle,
		post.series?.name,
		...(post.tags ?? []).flatMap((tag) => [tag.name, tag.slug]),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

const getTopicProfile = (slug: string, posts: PostFragment[]) => {
	if (TOPIC_PROFILES[slug]) return TOPIC_PROFILES[slug];

	const matchingTag = posts
		.flatMap((post) => post.tags ?? [])
		.find((tag) => tag?.slug === slug || normalizeTopicSlug(tag?.name ?? '') === slug);

	const label = matchingTag?.name ? formatTagName(matchingTag.name) : titleFromSlug(slug);
	const keywords = [label, slug.replace(/-/g, ' ')];
	return {
		label,
		domain: 'general' as ArticleDomain,
		description: `Learn ${label} as a connected topic across articles, concepts, simulations, and interview reasoning.`,
		keywords,
		concepts: [label, 'Mental Model', 'Tradeoffs', 'Failure Modes', 'Interview Reasoning'],
	};
};

const scorePostForTopic = (post: PostFragment, profile: ReturnType<typeof getTopicProfile>, slug: string) => {
	const text = getPostText(post);
	const domain = inferArticleDomain(post);
	let score = domain === profile.domain ? 12 : 0;

	for (const keyword of profile.keywords) {
		const normalized = keyword.toLowerCase();
		if (text.includes(normalized)) score += normalized.length > 8 ? 8 : 5;
	}

	for (const tag of post.tags ?? []) {
		if (tag.slug === slug || normalizeTopicSlug(tag.name ?? '') === slug) score += 18;
	}

	if (normalizeTopicSlug(post.title).includes(slug)) score += 10;
	return score;
};

export const inferTopicSlugForPost = (post: PostFragment) => {
	const domain = inferArticleDomain(post);
	if (domain !== 'general') return domain;
	return post.tags?.[0]?.slug ?? normalizeTopicSlug(inferPrimaryArticleConcept(post));
};

const buildStage = (
	id: TopicLearningStage['id'],
	label: string,
	intent: string,
	primaryCta: string,
	articles: TopicLearningArticle[],
	offset: number,
): TopicLearningStage => ({
	id,
	label,
	intent,
	primaryCta,
	articleSlugs: articles.slice(offset, offset + 2).map((article) => article.slug),
});

export const buildTopicLearningJourney = (slugInput: string, posts: PostFragment[]): TopicLearningJourney => {
	const slug = normalizeTopicSlug(slugInput);
	const profile = getTopicProfile(slug, posts);
	const articles = posts
		.map((post) => ({
			post,
			score: scorePostForTopic(post, profile, slug),
		}))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, 12)
		.map(({ post, score }) => ({
			id: post.id,
			title: post.title,
			slug: post.slug,
			brief: post.brief ?? post.subtitle,
			readTimeInMinutes: post.readTimeInMinutes,
			tags: (post.tags ?? []).map((tag) => ({ name: tag.name, slug: tag.slug })),
			primaryConcept: inferPrimaryArticleConcept(post),
			domain: inferArticleDomain(post),
			relevance: score,
		}));

	const conceptSeeds = articles.length
		? articles.flatMap((article) => {
				const post = posts.find((item) => item.slug === article.slug);
				return post ? getArticleConceptSeeds(post).slice(0, 4) : [article.primaryConcept];
			})
		: profile.concepts;
	const concepts = [...new Set([...profile.concepts, ...conceptSeeds])].slice(0, 10);

	const stages: TopicLearningStage[] = [
		buildStage('concept', 'Concept', 'Establish the topic mental model before choosing an article.', 'Start Topic', articles, 0),
		buildStage('visual', 'Visual', 'Explore the topology and relationship map across the topic.', 'Explore Graph', articles, 1),
		buildStage('tradeoff', 'Tradeoff', 'Compare production constraints across related articles.', 'Practice Tradeoffs', articles, 2),
		buildStage('challenge', 'Challenge', 'Pressure-test the topic with simulations and interview prompts.', 'Start Challenge', articles, 3),
		buildStage('continue', 'Continue', 'Resume from the next article, weak area, or semantic search result.', 'Continue Learning', articles, 4),
	];

	return {
		slug,
		label: profile.label,
		description: profile.description,
		domain: profile.domain,
		concepts,
		articles,
		stages,
		semanticQuery: `${profile.label} ${concepts.slice(0, 5).join(' ')}`,
	};
};
