import type { NextApiRequest, NextApiResponse } from 'next';

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
	posts: AssistantPost[];
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	persona?: string;
};

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
]);

const SYNONYMS: Record<string, string[]> = {
	kafka: ['event streaming', 'transactions', 'offsets', 'consumer groups', 'partitions'],
	transactions: ['distributed transactions', 'saga', 'exactly-once', 'idempotency'],
	replication: ['leader follower', 'consistency', 'lag', 'multi-region'],
	quorum: ['read quorum', 'write quorum', 'consistency level'],
	vector: ['embeddings', 'ann', 'similarity search', 'retrieval'],
	llm: ['transformer', 'prompting', 'rag', 'inference', 'token'],
	consensus: ['raft', 'paxos', 'leader election', 'log replication'],
	kubernetes: ['scheduler', 'pods', 'taints', 'affinity', 'cluster'],
};

const PREREQ_HINTS: Record<string, string[]> = {
	kafka: ['Event-driven architecture basics', 'Partitioning and replication', 'Idempotency'],
	transactions: ['ACID and isolation levels', 'Message-driven consistency', 'Retry semantics'],
	quorum: ['Replication models', 'Read/write consistency', 'Failure domains'],
	vector: ['Embeddings fundamentals', 'Similarity metrics', 'Index structures'],
	llm: ['Transformer basics', 'Prompt design', 'Retrieval and grounding'],
	consensus: ['Distributed systems failure model', 'Leader election', 'Log ordering'],
	kubernetes: ['Containers and orchestration', 'Resource requests/limits', 'Scheduling constraints'],
};

const ARCH_TOPICS: Record<string, string[]> = {
	kafka: ['Event sourcing', 'Outbox pattern', 'Stream processing architecture'],
	transactions: ['Saga orchestration', 'CQRS', 'Compensation workflows'],
	quorum: ['CAP theorem', 'Leaderless replication', 'Conflict resolution'],
	vector: ['RAG pipelines', 'Hybrid retrieval', 'Embedding lifecycle'],
	llm: ['Inference gateways', 'Guardrails', 'Context caching'],
	consensus: ['Raft internals', 'Multi-region coordination', 'Split-brain mitigation'],
	kubernetes: ['Bin packing', 'Topology spread constraints', 'Autoscaling strategies'],
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

const scorePost = (post: AssistantPost, keywords: string[]) => {
	const corpus = `${post.title} ${post.brief} ${(post.tags ?? []).map((tag) => `${tag.name} ${tag.slug}`).join(' ')}`.toLowerCase();
	let score = 0;
	for (const keyword of keywords) {
		if (!keyword.trim()) continue;
		if (corpus.includes(keyword)) score += keyword.includes(' ') ? 6 : 3;
	}
	score += Math.min(5, (post.views ?? 0) / 5000);
	score += Math.min(3, (post.readTimeInMinutes ?? 0) / 8);
	return score;
};

const estimateDifficulty = (query: string, sequence: AssistantResponse['recommendedSequence']) => {
	const avg = sequence.length
		? sequence.reduce((sum, item) => sum + item.difficulty, 0) / sequence.length
		: 35;
	const queryComplexity = /(internals|consensus|distributed|transactions|quorum|scheduler|replication)/i.test(query) ? 15 : 0;
	const score = Math.max(10, Math.min(95, Math.round(avg + queryComplexity)));
	if (score < 35) return { score, label: 'Beginner' as const };
	if (score < 60) return { score, label: 'Intermediate' as const };
	if (score < 80) return { score, label: 'Advanced' as const };
	return { score, label: 'Expert' as const };
};

const buildConceptGraph = (keywords: string[]) => {
	const roots = keywords.slice(0, 4);
	return roots.map((root, index) => ({
		concept: root.replace(/\b\w/g, (c) => c.toUpperCase()),
		dependsOn: roots.slice(0, index),
	}));
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<AssistantResponse | { error: string }>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { query, posts, history = [], persona } = req.body as AssistantRequest;
	if (!query?.trim() || !Array.isArray(posts) || posts.length === 0) {
		return res.status(400).json({ error: 'query and posts are required' });
	}

	const baseTokens = tokenize(query);
	const keywords = expandKeywords(baseTokens);
	const dominantKey = baseTokens[0] ?? 'systems';

	const ranked = posts
		.map((post) => ({ post, score: scorePost(post, keywords) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score);

	const top = ranked.slice(0, 8).map((item) => item.post);
	const sequence = top.slice(0, 5).map((post, idx) => {
		const difficulty = Math.min(95, Math.max(15, post.readTimeInMinutes * 3 + idx * 5));
		return {
			title: post.title,
			slug: post.slug,
			reason: idx === 0 ? 'Start with foundational mental model' : 'Builds directly on previous concept',
			difficulty,
		};
	});

	const diagrams = top
		.filter((post) => /diagram|architecture|flow|pipeline|topology/i.test(`${post.title} ${post.brief}`))
		.slice(0, 4)
		.map((post) => ({ title: post.title, slug: post.slug }));

	const implementationArticles = top
		.filter((post) => /implement|build|practical|hands-on|tutorial|production/i.test(`${post.title} ${post.brief}`))
		.slice(0, 4)
		.map((post) => ({ title: post.title, slug: post.slug }));

	const prerequisites = [
		...(PREREQ_HINTS[dominantKey] ?? ['Distributed systems fundamentals', 'Data consistency basics', 'Failure handling patterns']),
		...(persona?.toLowerCase().includes('interview') ? ['System design interview framing'] : []),
	].slice(0, 5);

	const relatedArchitectureTopics = (ARCH_TOPICS[dominantKey] ?? [
		'Scalability patterns',
		'Resilience engineering',
		'Data consistency models',
	]).slice(0, 5);

	const interviewQuestions = [
		`Explain ${query} to a senior interviewer in under 2 minutes.`,
		`What failure modes matter most in ${query}?`,
		`Which trade-offs would you call out when scaling ${query}?`,
		`How would you test correctness and reliability for ${query}?`,
	].slice(0, 4);

	const conceptGraph = buildConceptGraph(keywords);
	const difficultyEstimate = estimateDifficulty(query, sequence);

	const seenTitles = new Set(
		history
			.filter((item) => item.role === 'assistant')
			.flatMap((item) => tokenize(item.content)),
	);

	const adaptiveRecommendations = top
		.filter((post) => !seenTitles.has(post.title.toLowerCase()))
		.slice(0, 4)
		.map((post, idx) => ({
			title: post.title,
			slug: post.slug,
			why:
				idx === 0
					? 'Highest semantic match for your current question'
					: 'Complements your current learning sequence and fills prerequisite gaps',
		}));

	const retrievalQuery = `${query} ${relatedArchitectureTopics.join(' ')} ${prerequisites.join(' ')}`.slice(0, 300);

	const response: AssistantResponse = {
		overview:
			top[0]?.brief ||
			`${query} combines architecture, consistency, and implementation trade-offs. Start with internals, then move to failure handling and production patterns.`,
		prerequisites,
		recommendedSequence: sequence,
		relatedArchitectureTopics,
		diagrams,
		implementationArticles,
		interviewQuestions,
		difficultyEstimate,
		conceptGraph,
		adaptiveRecommendations,
		promptPlan: {
			retrievalQuery,
			orchestrationSteps: [
				'Intent parse and technical entity extraction',
				'Semantic retrieval across article corpus',
				'Prerequisite and dependency inference',
				'Roadmap and recommendation ranking',
				'Interview and implementation augmentation',
			],
		},
	};

	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json(response);
}
