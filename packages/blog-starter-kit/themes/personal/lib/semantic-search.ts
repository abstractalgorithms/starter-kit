type SemanticSearchPost = {
	title: string;
	slug: string;
	brief?: string | null;
	tags?: Array<{ name?: string; slug?: string }> | null;
	readTimeInMinutes?: number | null;
};

export type SemanticSearchResult = {
	title: string;
	href: string;
	snippet?: string;
	source: 'hashnode' | 'llm-wiki';
	score: number;
};

const tokenize = (value: string) =>
	value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((token) => token.length > 2);

const postHaystack = (post: SemanticSearchPost) =>
	[
		post.title,
		post.brief,
		...(post.tags ?? []).flatMap((tag) => [tag.name, tag.slug]),
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

export const searchLocalArticles = (
	query: string,
	posts: SemanticSearchPost[],
	limit = 6,
): SemanticSearchResult[] => {
	const tokens = tokenize(query);
	if (tokens.length === 0) return [];

	return posts
		.map((post) => {
			const haystack = postHaystack(post);
			const title = post.title.toLowerCase();
			const score = tokens.reduce((sum, token) => {
				if (title.includes(token)) return sum + 8;
				if (haystack.includes(token)) return sum + 3;
				return sum;
			}, 0);
			return { post, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(({ post, score }) => ({
			title: post.title,
			href: `/${post.slug}`,
			snippet: post.brief ?? `Canonical article for ${post.title}.`,
			source: 'hashnode',
			score,
		}));
};

const normalizeLlmWikiResults = (payload: unknown, limit: number): SemanticSearchResult[] => {
	const data = payload as {
		results?: Array<Record<string, unknown>>;
		data?: Array<Record<string, unknown>>;
		citations?: Array<Record<string, unknown>>;
	};
	const raw = data.results ?? data.data ?? data.citations ?? [];

	return raw.slice(0, limit).map((item, index) => {
		const title = String(item.title ?? item.name ?? item.slug ?? `llm-wiki result ${index + 1}`);
		const href = String(item.url ?? item.href ?? item.path ?? '#');
		const scoreValue = Number(item.score ?? limit - index);
		return {
			title,
			href,
			snippet: item.snippet ? String(item.snippet) : undefined,
			source: 'llm-wiki',
			score: Number.isFinite(scoreValue) ? scoreValue : limit - index,
		};
	});
};

export const searchLlmWiki = async (
	query: string,
	options: { topic?: string; limit?: number } = {},
): Promise<SemanticSearchResult[]> => {
	const endpoint = process.env.LLM_WIKI_SEARCH_URL;
	if (!endpoint) return [];

	const limit = options.limit ?? 6;
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'User-Agent': 'abstractalgorithms-personal-theme/1.0',
	};
	if (process.env.LLM_WIKI_API_KEY) {
		headers.Authorization = `Bearer ${process.env.LLM_WIKI_API_KEY}`;
	}

	const response = await fetch(endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify({ query, topic: options.topic, limit }),
		signal: AbortSignal.timeout(5000),
	});

	if (!response.ok) throw new Error(`llm-wiki search failed with ${response.status}`);
	return normalizeLlmWikiResults(await response.json(), limit);
};
