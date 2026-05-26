import type { NextApiRequest, NextApiResponse } from 'next';
import request from 'graphql-request';
import {
	MorePostsByPublicationDocument,
	MorePostsByPublicationQuery,
	MorePostsByPublicationQueryVariables,
	PostsByPublicationDocument,
	PostsByPublicationQuery,
	PostsByPublicationQueryVariables,
} from '../../generated/graphql';

type AssistantPost = {
	id: string;
	title: string;
	slug: string;
	brief: string;
	readTimeInMinutes: number;
	views: number;
	tags?: Array<{ name: string; slug: string }> | null;
	coverImage?: { url?: string | null } | null;
};

type AssistantRequest = {
	query: string;
	posts?: AssistantPost[];
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	persona?: string;
	memoryContext?: string;
};

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const PUBLICATION_HOST = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;

export type AssistantResponse = {
	overview: string;
	prerequisites: string[];
	recommendedSequence: Array<{ title: string; slug: string; reason: string; difficulty: number }>;
	relatedArchitectureTopics: string[];
	diagrams: Array<{ title: string; slug: string }>;
	implementationArticles: Array<{ title: string; slug: string }>;
	interviewQuestions: string[];
	difficultyEstimate: { score: number; label: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' };
	conceptGraph: Array<{ concept: string; dependsOn: string[] }>;
	adaptiveRecommendations: Array<{ title: string; slug: string; why: string }>;
	promptPlan: {
		retrievalQuery: string;
		orchestrationSteps: string[];
	};
};

const STOP_WORDS = new Set([
	'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
	'how','what','when','where','why','is','are','was','were','be','been','have','has',
	'do','does','can','could','should','would','work','works','internally','about',
	'explain','explained','senior','interviewer','under','minute','minutes','matter','most',
]);

const GENERIC_TOKENS = new Set([
	'failure','modes','trade','offs','scaling','test','correctness','reliability',
	'explain','interview','senior','minutes','question',
]);

const SYNONYMS: Record<string, string[]> = {
	kafka: ['event streaming', 'transactions', 'offsets', 'consumer groups', 'partitions'],
	transactions: ['distributed transactions', 'saga', 'exactly-once', 'idempotency'],
	replication: ['leader follower', 'consistency', 'lag', 'multi-region'],
	quorum: ['read quorum', 'write quorum', 'consistency level'],
	vector: ['embeddings', 'ann', 'similarity search', 'retrieval', 'faiss', 'hnsw'],
	llm: ['transformer', 'prompting', 'rag', 'inference', 'token', 'fine-tuning', 'lora'],
	consensus: ['raft', 'paxos', 'leader election', 'log replication'],
	kubernetes: ['scheduler', 'pods', 'taints', 'affinity', 'cluster'],
	faiss: ['ann', 'approximate nearest neighbor', 'vector index', 'similarity search', 'embeddings', 'ivf', 'hnsw', 'dense retrieval'],
	embeddings: ['vector', 'dense retrieval', 'sentence transformers', 'similarity', 'semantic search', 'faiss', 'ann'],
	ann: ['faiss', 'hnsw', 'ivf', 'approximate nearest neighbor', 'vector search', 'embeddings'],
	hnsw: ['ann', 'faiss', 'graph index', 'approximate nearest neighbor', 'nmslib'],
	rag: ['retrieval augmented generation', 'vector database', 'embeddings', 'retrieval', 'context', 'semantic search'],
	transformer: ['attention', 'llm', 'bert', 'gpt', 'self-attention', 'encoder', 'decoder'],
	'fine-tuning': ['lora', 'qlora', 'adapter', 'peft', 'instruction tuning', 'sft'],
	lora: ['fine-tuning', 'qlora', 'adapter', 'low-rank', 'peft'],
	diffusion: ['stable diffusion', 'unet', 'denoising', 'latent space', 'image generation'],
	attention: ['self-attention', 'multi-head attention', 'transformer', 'cross-attention'],
	redis: ['cache', 'ttl', 'in-memory', 'pub sub', 'sorted sets'],
	postgres: ['sql', 'database', 'index', 'query plan', 'vacuum'],
	grpc: ['protobuf', 'rpc', 'streaming', 'service mesh'],
	sharding: ['horizontal scaling', 'partitioning', 'shard key', 'consistent hashing'],
};

const PREREQ_HINTS: Record<string, string[]> = {
	kafka: ['Event-driven architecture basics', 'Partitioning and replication', 'Idempotency'],
	transactions: ['ACID and isolation levels', 'Message-driven consistency', 'Retry semantics'],
	quorum: ['Replication models', 'Read/write consistency', 'Failure domains'],
	vector: ['Embeddings fundamentals', 'Similarity metrics', 'Index structures'],
	llm: ['Transformer basics', 'Prompt design', 'Retrieval and grounding'],
	consensus: ['Distributed systems failure model', 'Leader election', 'Log ordering'],
	kubernetes: ['Containers and orchestration', 'Resource requests/limits', 'Scheduling constraints'],
	faiss: ['Vector space fundamentals', 'Embeddings and similarity metrics', 'Approximate nearest neighbor concepts', 'Index data structures'],
	embeddings: ['Word2Vec and dense representations', 'Cosine similarity basics', 'Dimensionality reduction', 'Tokenization'],
	ann: ['Exact nearest neighbor search', 'K-d trees and LSH', 'Recall vs. latency trade-offs'],
	hnsw: ['Graph-based indexing', 'Greedy search on hierarchical layers', 'FAISS and ANN fundamentals'],
	rag: ['LLM prompting fundamentals', 'Embeddings and similarity search', 'Vector databases', 'Context window management'],
	transformer: ['Attention mechanism basics', 'Positional encodings', 'Self-supervised pre-training'],
	'fine-tuning': ['Transfer learning fundamentals', 'Parameter-efficient methods', 'Gradient updates and optimizers'],
	lora: ['Matrix rank and decomposition', 'Parameter-efficient fine-tuning', 'Adapter layers'],
	diffusion: ['Gaussian noise processes', 'U-Net architecture', 'Latent space representations'],
	attention: ['Query, key, value projections', 'Scaled dot-product attention', 'Multi-head attention'],
};

const ARCH_TOPICS: Record<string, string[]> = {
	kafka: ['Event sourcing', 'Outbox pattern', 'Stream processing architecture'],
	transactions: ['Saga orchestration', 'CQRS', 'Compensation workflows'],
	quorum: ['CAP theorem', 'Leaderless replication', 'Conflict resolution'],
	vector: ['RAG pipelines', 'Hybrid retrieval', 'Embedding lifecycle'],
	llm: ['Inference gateways', 'Guardrails', 'Context caching'],
	consensus: ['Raft internals', 'Multi-region coordination', 'Split-brain mitigation'],
	kubernetes: ['Bin packing', 'Topology spread constraints', 'Autoscaling strategies'],
	faiss: ['Vector database architecture', 'Hybrid retrieval pipelines', 'Embedding lifecycle management', 'Index sharding for scale'],
	embeddings: ['RAG pipeline design', 'Semantic search architecture', 'Multi-modal embeddings', 'Embedding model selection'],
	ann: ['Flat vs. IVF vs. HNSW index selection', 'Recall-latency trade-off at scale', 'GPU-accelerated similarity search'],
	hnsw: ['Hierarchical graph construction', 'efSearch and M parameter tuning', 'Incremental index updates'],
	rag: ['Chunking strategies', 'Re-ranking pipelines', 'Retrieval evaluation metrics', 'Hybrid dense-sparse retrieval'],
	transformer: ['Pre-training vs. fine-tuning', 'KV cache optimization', 'Speculative decoding'],
	'fine-tuning': ['LoRA and QLoRA architecture', 'Instruction dataset curation', 'Catastrophic forgetting prevention'],
	lora: ['Rank selection for LoRA adapters', 'QLoRA quantization pipeline', 'Merging fine-tuned weights'],
	diffusion: ['Text-to-image sampling strategies', 'ControlNet conditioning', 'Latent diffusion vs. pixel diffusion'],
	attention: ['Flash attention for memory efficiency', 'Grouped-query attention', 'Sliding window attention'],
};

const FALLBACK_PREREQUISITES = [
	'Core terminology and mental model for the topic',
	'Basic implementation familiarity',
	'How to evaluate correctness and performance',
];

const FALLBACK_ARCH_TOPICS = ['Core concepts', 'Implementation trade-offs', 'Performance and reliability'];

const FOLLOW_UP_PREFIXES = [
	/^explain\s+/i,
	/^what\s+failure\s+modes\s+matter\s+most\s+in\s+/i,
	/^which\s+trade[-\s]?offs\s+would\s+you\s+call\s+out\s+when\s+scaling\s+/i,
	/^how\s+would\s+you\s+test\s+correctness\s+and\s+reliability\s+for\s+/i,
];

const normalizeRetrievalQuery = (raw: string) => {
	let value = raw.trim();
	for (let i = 0; i < 4; i += 1) {
		const before = value;
		value = value.replace(/^['"`\s]+|['"`\s]+$/g, '').trim();
		value = value.replace(/\?+$/g, '').trim();
		value = value.replace(/\bto\s+a\s+senior\s+interviewer\s+in\s+under\s+\d+\s+minutes?\b\.?$/i, '').trim();
		for (const pattern of FOLLOW_UP_PREFIXES) {
			if (pattern.test(value)) {
				value = value.replace(pattern, '').trim();
				break;
			}
		}
		if (value === before) break;
	}
	return value || raw.trim();
};

const tokenize = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter((token) => token.length > 1 && !STOP_WORDS.has(token));

const expandKeywords = (tokens: string[]) => {
	const expanded = new Set(tokens);
	for (const token of tokens) {
		(SYNONYMS[token] ?? []).forEach((syn) => expanded.add(syn));
	}
	return [...expanded];
};

const scorePost = (post: AssistantPost, keywords: string[], signalTokens: string[]) => {
	const corpus = `${post.title} ${post.brief} ${(post.tags ?? []).map((tag) => `${tag.name} ${tag.slug}`).join(' ')}`.toLowerCase();
	const title = post.title.toLowerCase();
	const tags = (post.tags ?? []).map((tag) => `${tag.name} ${tag.slug}`.toLowerCase()).join(' ');
	let score = 0;
	for (const keyword of keywords) {
		if (!keyword.trim()) continue;
		if (corpus.includes(keyword)) score += keyword.includes(' ') ? 6 : 3;
	}
	let signalOverlap = 0;
	for (const token of signalTokens) {
		if (!token.trim()) continue;
		if (title.includes(token)) {
			score += 10;
			signalOverlap += 1;
		} else if (tags.includes(token)) {
			score += 8;
			signalOverlap += 1;
		} else if (corpus.includes(token)) {
			score += 4;
			signalOverlap += 1;
		}
	}
	if (signalTokens.length > 0 && signalOverlap === 0) score -= 5;
	score += Math.min(5, (post.views ?? 0) / 5000);
	score += Math.min(3, (post.readTimeInMinutes ?? 0) / 8);
	return score;
};

const pickDominantKey = (tokens: string[]) =>
	tokens.find((token) => PREREQ_HINTS[token] || ARCH_TOPICS[token] || SYNONYMS[token]) ?? tokens[0] ?? 'systems';

const estimateDifficulty = (query: string, sequence: AssistantResponse['recommendedSequence']) => {
	const avg = sequence.length
		? sequence.reduce((sum, item) => sum + item.difficulty, 0) / sequence.length
		: 35;
	const queryComplexity = /(internals|consensus|distributed|transactions|quorum|scheduler|replication|hnsw|ivf|faiss|ann|attention|transformer|lora|qlora|diffusion|quantization|embeddings)/i.test(query) ? 15 : 0;
	const score = Math.max(10, Math.min(95, Math.round(avg + queryComplexity)));
	if (score < 35) return { score, label: 'Beginner' as const };
	if (score < 60) return { score, label: 'Intermediate' as const };
	if (score < 80) return { score, label: 'Advanced' as const };
	return { score, label: 'Expert' as const };
};

async function fetchAIOverview(query: string, relatedTopics: string[]): Promise<string | null> {
	const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
	if (!serverUrl) return null;
	try {
		const res = await fetch(`${serverUrl}/.netlify/functions/wiki-chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ question: query, topK: 5 }),
			signal: AbortSignal.timeout(7000),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { answer?: string };
		return typeof data.answer === 'string' && data.answer.trim() ? data.answer.trim() : null;
	} catch {
		return null;
	}
}

const buildStepReason = (
	post: AssistantPost,
	idx: number,
	queryTokens: string[],
): string => {
	const corpus = `${post.title} ${post.brief}`.toLowerCase();
	const tag = post.tags?.[0]?.name ?? '';

	if (/internals|deep.dive|under the hood|how it works/i.test(corpus))
		return `Explains the internals and mechanics of ${tag || queryTokens[0] || 'the topic'}`;
	if (/interview|system design|cheat sheet|quick ref/i.test(corpus))
		return 'Structured for interview prep and rapid recall';
	if (/practical|hands.on|tutorial|build|implement|production/i.test(corpus))
		return 'Hands-on guide with implementation patterns';
	if (/architect|pattern|design|blueprint/i.test(corpus))
		return 'Covers architectural patterns and design trade-offs';
	if (/compare|vs\.?|versus|difference/i.test(corpus))
		return 'Compares approaches and clarifies when to use each';
	if (/pitfall|mistake|anti.pattern|gotcha|common error/i.test(corpus))
		return 'Identifies common pitfalls and how to avoid them';
	if (/performance|latency|throughput|scale|benchmark/i.test(corpus))
		return 'Addresses performance, scale, and latency trade-offs';
	if (/introduc|overview|primer|beginner|start|101/i.test(corpus))
		return `Accessible entry point${tag ? ` for ${tag}` : ' for the topic'}`;
	if (/advanced|expert|edge case|nuance/i.test(corpus))
		return 'Covers advanced nuances and edge cases';

	if (idx === 0) return `Best starting point for ${queryTokens.slice(0, 2).join(' ') || 'this topic'} — highest relevance match`;
	if (idx === 1) return 'Builds on the foundation from the first article';
	if (idx <= 3) return `Deepens understanding of ${tag || queryTokens[0] || 'the core concept'}`;
	return 'Extends the sequence with additional context and patterns';
};

const buildConceptGraph = (keywords: string[]) => {
	const roots = keywords.slice(0, 4);
	return roots.map((root, index) => ({
		concept: root.replace(/\b\w/g, (c) => c.toUpperCase()),
		dependsOn: roots.slice(0, index),
	}));
};

const normalizeKey = (value: string) =>
	value
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/[?.!,:;"'`()[\]{}]+/g, '')
		.trim();

const dedupeStrings = (items: string[], limit: number) => {
	const map = new Map<string, string>();
	for (const item of items) {
		if (!item?.trim()) continue;
		const key = normalizeKey(item);
		if (!key || map.has(key)) continue;
		map.set(key, item.trim());
		if (map.size >= limit) break;
	}
	return [...map.values()];
};

const dedupeBy = <T>(items: T[], keySelector: (item: T) => string, limit: number) => {
	const map = new Map<string, T>();
	for (const item of items) {
		const raw = keySelector(item);
		const key = normalizeKey(raw);
		if (!key || map.has(key)) continue;
		map.set(key, item);
		if (map.size >= limit) break;
	}
	return [...map.values()];
};

const loadAssistantPostsFromHashnode = async (): Promise<AssistantPost[]> => {
	if (!GQL_ENDPOINT || !PUBLICATION_HOST) return [];

	const first = await request<PostsByPublicationQuery, PostsByPublicationQueryVariables>(
		GQL_ENDPOINT,
		PostsByPublicationDocument,
		{ first: 20, host: PUBLICATION_HOST },
	);

	const allPosts = (first.publication?.posts.edges ?? []).map((edge) => edge.node);
	let cursor = first.publication?.posts.pageInfo.endCursor;
	let hasNextPage = !!first.publication?.posts.pageInfo.hasNextPage;

	while (hasNextPage && cursor && allPosts.length < 260) {
		const next = await request<MorePostsByPublicationQuery, MorePostsByPublicationQueryVariables>(
			GQL_ENDPOINT,
			MorePostsByPublicationDocument,
			{ first: 20, host: PUBLICATION_HOST, after: cursor },
		);
		if (!next.publication) break;
		allPosts.push(...next.publication.posts.edges.map((edge) => edge.node));
		cursor = next.publication.posts.pageInfo.endCursor;
		hasNextPage = !!next.publication.posts.pageInfo.hasNextPage;
	}

	return allPosts.slice(0, 250).map((post) => ({
		id: post.id,
		title: post.title,
		slug: post.slug,
		brief: post.brief,
		readTimeInMinutes: post.readTimeInMinutes,
		views: post.views ?? 0,
		tags: (post.tags ?? []).map((tag) => ({ name: tag.name, slug: tag.slug })),
		coverImage: post.coverImage ?? null,
	}));
};

const hasMarkdownFormatting = (value: string) =>
	/(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(^|\n)\s*[-*]\s+|(^|\n)\s*\d+\.\s+/m.test(value);

const formatOverviewMarkdown = (raw: string, topic: string) => {
	const clean = raw.trim();
	if (!clean) return `**Answer**\n\n${topic}`;
	if (hasMarkdownFormatting(clean)) return clean;

	const normalized = clean.replace(/\s+/g, ' ').trim();
	const sentences = normalized
		.split(/(?<=[.!?])\s+/)
		.map((item) => item.trim())
		.filter(Boolean);

	if (sentences.length <= 2) {
		return `**Answer**\n\n${normalized}\n\n*Use the follow-up questions to go deeper on edge cases and trade-offs.*`;
	}

	const intro = sentences.slice(0, 2).join(' ');
	const bullets = sentences
		.slice(2, 6)
		.map((item) => item.replace(/[.!?]+$/, '').trim())
		.filter(Boolean)
		.map((item) => `- ${item}`);

	return [
		'**Answer**',
		'',
		intro,
		'',
		'**Key points**',
		...bullets,
		'',
		'*Use the follow-up questions to go deeper on edge cases and trade-offs.*',
	].join('\n');
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<AssistantResponse | { error: string }>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { query, posts: clientPosts, history = [], persona, memoryContext = '' } = req.body as AssistantRequest;
	if (!query?.trim()) {
		return res.status(400).json({ error: 'query is required' });
	}

	const posts = Array.isArray(clientPosts) && clientPosts.length > 0 ? clientPosts : await loadAssistantPostsFromHashnode();
	if (posts.length === 0) {
		return res.status(503).json({ error: 'No post corpus available for assistant ranking' });
	}

	const focusQuery = normalizeRetrievalQuery(query);
	const baseTokens = tokenize(focusQuery);
	const memoryTokens = tokenize(memoryContext).filter((token) => !GENERIC_TOKENS.has(token)).slice(0, 8);
	const signalTokens = baseTokens.filter((token) => !GENERIC_TOKENS.has(token));
	const retrievalTokens = signalTokens.length > 0 ? signalTokens : baseTokens;
	const keywords = expandKeywords([...retrievalTokens, ...memoryTokens.slice(0, 3)]);
	const dominantKey = pickDominantKey(retrievalTokens);

	const ranked = posts
		.map((post) => ({ post, score: scorePost(post, keywords, signalTokens) }))
		.filter((item) => item.score >= (signalTokens.length > 0 ? 8 : 4))
		.sort((a, b) => b.score - a.score);

	const top = ranked.slice(0, 8).map((item) => item.post);
	const sequence = dedupeBy(
		top.map((post, idx) => {
		const difficulty = Math.min(95, Math.max(15, post.readTimeInMinutes * 3 + idx * 5));
		return {
			title: post.title,
			slug: post.slug,
			reason: buildStepReason(post, idx, baseTokens),
			difficulty,
		};
		}),
		(item) => item.slug || item.title,
		5,
	);

	const diagrams = top
		.filter((post) => /diagram|architecture|flow|pipeline|topology/i.test(`${post.title} ${post.brief}`))
		.slice(0, 4)
		.map((post) => ({ title: post.title, slug: post.slug }));
	const dedupedDiagrams = dedupeBy(diagrams, (item) => item.slug || item.title, 4);

	const implementationArticles = top
		.filter((post) => /implement|build|practical|hands-on|tutorial|production/i.test(`${post.title} ${post.brief}`))
		.slice(0, 4)
		.map((post) => ({ title: post.title, slug: post.slug }));
	const dedupedImplementationArticles = dedupeBy(implementationArticles, (item) => item.slug || item.title, 4);

	const prerequisites = dedupeStrings([
		...(PREREQ_HINTS[dominantKey] ?? FALLBACK_PREREQUISITES),
		...(persona?.toLowerCase().includes('interview') ? ['System design interview framing'] : []),
		...(memoryContext.toLowerCase().includes('weak areas') ? ['Review weak areas before advancing'] : []),
	], 5);

	const relatedArchitectureTopics = dedupeStrings(ARCH_TOPICS[dominantKey] ?? FALLBACK_ARCH_TOPICS, 5);

	const promptTarget = focusQuery.replace(/[?.!]+$/g, '').trim();

	const interviewQuestions = dedupeStrings([
		`Explain ${promptTarget} to a senior interviewer in under 2 minutes.`,
		`What failure modes matter most in ${promptTarget}?`,
		`Which trade-offs would you call out when scaling ${promptTarget}?`,
		`How would you test correctness and reliability for ${promptTarget}?`,
	], 4);

	const conceptGraph = buildConceptGraph(retrievalTokens);
	const difficultyEstimate = estimateDifficulty(focusQuery, sequence);

	const seenTitles = new Set(
		history
			.filter((item) => item.role === 'assistant')
			.flatMap((item) => tokenize(item.content)),
	);

	const adaptiveRecommendations = dedupeBy(
		top
		.filter((post) => !seenTitles.has(post.title.toLowerCase()))
		.slice(0, 4)
		.map((post, idx) => ({
			title: post.title,
			slug: post.slug,
			why:
				idx === 0
					? memoryContext
						? 'Highest semantic match for your question and adaptive learning memory'
						: 'Highest semantic match for your current question'
					: 'Complements your current learning sequence and fills prerequisite gaps',
		})),
		(item) => item.slug || item.title,
		4,
	);

	const retrievalQuery = `${focusQuery} ${relatedArchitectureTopics.join(' ')} ${prerequisites.join(' ')} ${memoryTokens.join(' ')}`.slice(0, 300);
	const orchestrationSteps = [
		`Identify ${retrievalTokens.slice(0, 3).join(', ') || focusQuery} in the question`,
		memoryContext ? 'Adjust sequencing with persisted learning memory signals' : '',
		top[0] ? `Use "${top[0].title}" as the strongest matching article` : `Search the publication for ${dominantKey}`,
		prerequisites[0] ? `Check prerequisite: ${prerequisites[0]}` : `Infer missing prerequisite context`,
		sequence[0] ? `Rank next reading step: ${sequence[0].title}` : `Build a reading path from available posts`,
		interviewQuestions[0] ? `Generate follow-up: ${interviewQuestions[0]}` : `Prepare follow-up questions from the topic`,
	].filter(Boolean).slice(0, 5);

	const aiOverview = await fetchAIOverview(focusQuery, relatedArchitectureTopics);
	const rawOverview =
		aiOverview ??
		top[0]?.brief ??
		`${focusQuery} involves trade-offs across architecture, consistency, and implementation. Start with core internals, then explore failure handling and production patterns.`;
	const overview = formatOverviewMarkdown(rawOverview, focusQuery);

	const response: AssistantResponse = {
		overview,
		prerequisites,
		recommendedSequence: sequence,
		relatedArchitectureTopics,
		diagrams: dedupedDiagrams,
		implementationArticles: dedupedImplementationArticles,
		interviewQuestions,
		difficultyEstimate,
		conceptGraph,
		adaptiveRecommendations,
		promptPlan: {
			retrievalQuery,
			orchestrationSteps,
		},
	};

	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json(response);
}
