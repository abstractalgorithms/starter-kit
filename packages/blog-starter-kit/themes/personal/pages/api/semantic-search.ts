import type { NextApiRequest, NextApiResponse } from 'next';
import { searchLlmWiki, searchLocalArticles, type SemanticSearchResult } from '../../lib/semantic-search';

type RequestPost = {
	title: string;
	slug: string;
	brief?: string | null;
	tags?: Array<{ name?: string; slug?: string }> | null;
	readTimeInMinutes?: number | null;
};

type SuccessResponse = {
	query: string;
	topic?: string;
	results: SemanticSearchResult[];
	providers: {
		hashnode: boolean;
		llmWiki: boolean;
	};
};

type ErrorResponse = { error: string };

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { query, topic, posts, limit } = req.body as {
		query?: string;
		topic?: string;
		posts?: RequestPost[];
		limit?: number;
	};

	if (!query?.trim()) {
		return res.status(400).json({ error: 'query is required' });
	}

	const boundedLimit = Math.min(Math.max(Number(limit) || 6, 1), 10);
	const localResults = Array.isArray(posts) ? searchLocalArticles(query, posts, boundedLimit) : [];
	let wikiResults: SemanticSearchResult[] = [];

	try {
		wikiResults = await searchLlmWiki(query, { topic, limit: boundedLimit });
	} catch (err) {
		console.error('[semantic-search] llm-wiki search failed:', err);
	}

	const merged = [...localResults, ...wikiResults]
		.sort((a, b) => b.score - a.score)
		.slice(0, boundedLimit);

	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json({
		query,
		topic,
		results: merged,
		providers: {
			hashnode: localResults.length > 0,
			llmWiki: wikiResults.length > 0,
		},
	});
}
