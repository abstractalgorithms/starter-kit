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
	id: string;
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
	totalArticleCount: number;
	stages: TopicLearningStage[];
	semanticQuery: string;
};

export type TopicCollectionSummary = {
	slug: string;
	label: string;
	description: string;
	articleCount: number;
	concepts: string[];
	featuredArticle?: TopicLearningArticle;
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
		description: `Learn ${label} as a connected topic across chapters, concepts, simulations, and interview reasoning.`,
		keywords,
		concepts: [label, 'Mental Model', 'Tradeoffs', 'Failure Modes', 'Interview Reasoning'],
	};
};

const scorePostForTopic = (post: PostFragment, profile: ReturnType<typeof getTopicProfile>, slug: string) => {
	const text = getPostText(post);
	const domain = inferArticleDomain(post);
	let score = profile.domain !== 'general' && domain === profile.domain ? 12 : 0;

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
	return normalizeTopicSlug(post.tags?.[0]?.slug ?? inferPrimaryArticleConcept(post));
};

export const buildTopicLearningJourney = (slugInput: string, posts: PostFragment[]): TopicLearningJourney => {
	const slug = normalizeTopicSlug(slugInput);
	const profile = getTopicProfile(slug, posts);
	const scoredArticles = posts
		.map((post) => ({
			post,
			score: scorePostForTopic(post, profile, slug),
		}))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score);

	const articles = scoredArticles
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

	const tagGroups = new Map<string, { slug: string; name: string; articleSlugs: string[] }>();
	for (const article of articles) {
		for (const tag of article.tags) {
			const tagSlug = normalizeTopicSlug(tag.slug || tag.name);
			if (!tagSlug || tagSlug === slug || tagSlug === profile.domain) continue;
			const current = tagGroups.get(tagSlug) ?? {
				slug: tagSlug,
				name: formatTagName(tag.name),
				articleSlugs: [],
			};
			if (!current.articleSlugs.includes(article.slug)) current.articleSlugs.push(article.slug);
			tagGroups.set(tagSlug, current);
		}
	}

	const rankedTagGroups = [...tagGroups.values()]
		.sort((a, b) => b.articleSlugs.length - a.articleSlugs.length || a.name.localeCompare(b.name));

	const conceptSeeds = rankedTagGroups.length
		? rankedTagGroups.map((group) => group.name)
		: articles.flatMap((article) => {
				const post = posts.find((item) => item.slug === article.slug);
				return post ? getArticleConceptSeeds(post).slice(0, 2) : [article.primaryConcept];
			});
	const concepts = [...new Set([...conceptSeeds, ...profile.concepts])].slice(0, 10);

	const stages: TopicLearningStage[] = rankedTagGroups.slice(0, 8).map((group) => ({
		id: group.slug,
		label: group.name,
		intent: `${group.articleSlugs.length} article${group.articleSlugs.length === 1 ? '' : 's'} in this topic also tagged ${group.name}.`,
		primaryCta: 'Filter Articles',
		articleSlugs: group.articleSlugs,
	}));

	if (stages.length === 0 && articles.length > 0) {
		stages.push({
			id: 'all',
			label: profile.label,
			intent: `All ${articles.length} article${articles.length === 1 ? '' : 's'} matched to ${profile.label}.`,
			primaryCta: 'View Articles',
			articleSlugs: articles.map((article) => article.slug),
		});
	}

	return {
		slug,
		label: profile.label,
		description: profile.description,
		domain: profile.domain,
		concepts,
		articles,
		totalArticleCount: scoredArticles.length,
		stages,
		semanticQuery: `${profile.label} ${concepts.slice(0, 5).join(' ')}`,
	};
};

export const buildTopicCollectionSummaries = (posts: PostFragment[], limit = 8): TopicCollectionSummary[] => {
	const primaryTagSlugs = posts.reduce<Map<string, number>>((counts, post) => {
		const tag = post.tags?.[0];
		if (!tag) return counts;
		const slug = normalizeTopicSlug(tag.slug || tag.name);
		if (!slug) return counts;
		counts.set(slug, (counts.get(slug) ?? 0) + 1);
		return counts;
	}, new Map<string, number>());

	const secondaryProfileSlugs = posts
		.reduce<Map<string, number>>((counts, post) => {
			const domain = inferArticleDomain(post);
			if (domain === 'general') return counts;
			if (primaryTagSlugs.has(domain)) return counts;
			counts.set(domain, (counts.get(domain) ?? 0) + 1);
			return counts;
		}, new Map<string, number>());

	const candidateSlugs = [
		...[...primaryTagSlugs.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([slug]) => slug),
		...[...secondaryProfileSlugs.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([slug]) => slug),
	];

	const seen = new Set<string>();
	return candidateSlugs
		.filter((slug) => {
			if (seen.has(slug)) return false;
			seen.add(slug);
			return true;
		})
		.map((slug) => buildTopicLearningJourney(slug, posts))
		.map((journey) => ({
			slug: journey.slug,
			label: journey.label,
			description: journey.description,
			articleCount: journey.totalArticleCount,
			concepts: journey.concepts.slice(0, 4),
			featuredArticle: journey.articles[0],
		}))
		.filter((summary) => summary.articleCount > 0)
		.slice(0, limit);
};
