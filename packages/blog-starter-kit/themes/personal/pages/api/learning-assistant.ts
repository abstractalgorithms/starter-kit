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
	posts?: AssistantPost[];
	history?: Array<{ role: 'user' | 'assistant'; content: string }>;
	persona?: string;
	memoryContext?: string;
	learningContext?: Record<string, unknown>;
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

type ErrorResponse = { error: string };

const UPSTREAM_URL =
	(process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '') +
	'/.netlify/functions/ai-learning-assistant';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<AssistantResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const {
		query,
		posts = [],
		history = [],
		persona,
		memoryContext,
		learningContext,
	} = req.body as AssistantRequest;
	if (!query?.trim()) {
		return res.status(400).json({ error: 'query is required' });
	}

	if (!UPSTREAM_URL.startsWith('http')) {
		return res.status(503).json({ error: 'NEXT_PUBLIC_SERVER_URL env var not configured' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'abstractalgorithms-personal-theme/1.0',
			},
			body: JSON.stringify({
				query,
				posts,
				history,
				persona,
				memoryContext,
				learningContext,
			}),
			signal: AbortSignal.timeout(15000),
		});

		if (!upstream.ok) {
			const message = await upstream.text();
			throw new Error(`Upstream responded ${upstream.status}: ${message.slice(0, 200)}`);
		}

		const body = (await upstream.json()) as {
			success?: boolean;
			data?: AssistantResponse;
			error?: string;
		};
		if (!body.success || !body.data?.overview || !Array.isArray(body.data?.recommendedSequence)) {
			throw new Error(body.error || 'Invalid upstream response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (error) {
		console.error('[learning-assistant] upstream fetch failed:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate learning assistant response' });
	}
}
