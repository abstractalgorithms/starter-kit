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
	answerBullets: string[];
	examples: Array<{ title: string; body: string }>;
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

const normalizeLines = (text: string, limit: number) =>
	text
		.split(/\r?\n|(?<=[.!?])\s+/)
		.map((line) => line.replace(/^\s*(?:[-*+]\s*)?/, '').trim())
		.filter((line) => line.length > 20)
		.slice(0, limit);

const buildFallbackBullets = (data: AssistantResponse): string[] => {
	const fromOverview = normalizeLines(data.overview || '', 3);
	const fromSequence = (data.recommendedSequence || [])
		.slice(0, 2)
		.map((step) => `Next step: ${step.title} - ${step.reason}`)
		.filter((line) => line.length > 20);
	return [...new Set([...fromOverview, ...fromSequence])].slice(0, 5);
};

const buildFallbackExamples = (data: AssistantResponse): Array<{ title: string; body: string }> => {
	const first = data.relatedArchitectureTopics?.[0] || data.recommendedSequence?.[0]?.title || 'Current topic';
	const question = data.interviewQuestions?.[0] || 'What trade-off matters most here?';
	return [
		{
			title: 'Practical example',
			body: `Apply ${first} to one production path and explain what changes under load or failure conditions.`,
		},
		{
			title: 'Interview example',
			body: question,
		},
	];
};

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

		const normalized: AssistantResponse = {
			...body.data,
			answerBullets:
				Array.isArray(body.data.answerBullets) && body.data.answerBullets.length > 0
					? body.data.answerBullets
					: buildFallbackBullets(body.data),
			examples:
				Array.isArray(body.data.examples) && body.data.examples.length > 0
					? body.data.examples
					: buildFallbackExamples(body.data),
		};

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(normalized);
	} catch (error) {
		console.error('[learning-assistant] upstream fetch failed:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate learning assistant response' });
	}
}
