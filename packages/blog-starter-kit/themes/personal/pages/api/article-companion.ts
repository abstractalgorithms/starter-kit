import type { NextApiRequest, NextApiResponse } from 'next';

type ArticleCompanionRequest = {
	title: string;
	subtitle?: string;
	brief?: string;
	markdown: string;
	tocItems?: Array<{ slug: string; title: string; level: number }>;
	tags?: Array<{ name: string }>;
	readTimeInMinutes?: number;
};

type ArticleCompanionResponse = {
	overview: string;
	summaryBullets: string[];
	flowNodes: string[];
	conceptDependencies: Array<{ concept: string; dependsOn: string | null }>;
	tradeoffOptions: Array<{ title: string; body: string }>;
	failureScenarios: Array<{ title: string; impact: string; mitigation: string; severity: number }>;
	interviewPrompts: {
		relevanceScore: number;
		relevanceLabel: string;
		practiceQuestion: string;
		tradeoffPrompt: string;
		whiteboardPrompt: string;
		mockDiscussionPrompt: string;
		checkpoints: string[];
	};
	deepDiveSections: Array<{ slug: string; title: string; summaryMarkdown: string; bulletMarkdown: string }>;
};

type ErrorResponse = { error: string };

const serverBaseUrl =
	(process.env.SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
const UPSTREAM_URL = `${serverBaseUrl}/.netlify/functions/ai-article-companion`;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ArticleCompanionResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const incoming = (req.body ?? {}) as Partial<ArticleCompanionRequest> & {
		tocItems?: Array<{ title?: unknown; slug?: unknown; level?: unknown }>;
		tags?: Array<{ name?: unknown }>;
		readTimeInMinutes?: unknown;
	};
	const title = typeof incoming.title === 'string' ? incoming.title : '';
	const markdown = typeof incoming.markdown === 'string' ? incoming.markdown : '';
	if (!title?.trim() || !markdown?.trim()) {
		return res.status(400).json({ error: 'title and markdown are required' });
	}

	const payload: ArticleCompanionRequest = {
		title: title.trim(),
		markdown: markdown.trim(),
		subtitle: typeof incoming.subtitle === 'string' ? incoming.subtitle : undefined,
		brief: typeof incoming.brief === 'string' ? incoming.brief : undefined,
		tocItems: Array.isArray(incoming.tocItems)
			? incoming.tocItems
					.filter((item) => item && typeof item.title === 'string')
					.slice(0, 12)
					.map((item) => ({
						title: String(item.title),
						slug: typeof item.slug === 'string' ? item.slug : '',
						level: Number.isFinite(item.level) ? Number(item.level) : 1,
					}))
			: undefined,
		tags: Array.isArray(incoming.tags)
			? incoming.tags
					.filter((tag) => tag && typeof tag.name === 'string')
					.slice(0, 12)
					.map((tag) => ({ name: String(tag.name) }))
			: undefined,
		readTimeInMinutes: Number.isFinite(incoming.readTimeInMinutes)
			? Number(incoming.readTimeInMinutes)
			: undefined,
	};

	if (!UPSTREAM_URL.startsWith('http')) {
		return res.status(503).json({ error: 'SERVER_URL or NEXT_PUBLIC_SERVER_URL env var not configured' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'abstractalgorithms-personal-theme/1.0',
			},
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(45000),
		});

		if (!upstream.ok) {
			const message = await upstream.text();
			throw new Error(`Upstream responded ${upstream.status}: ${message.slice(0, 500)}`);
		}

		const body = (await upstream.json()) as {
			success?: boolean;
			data?: ArticleCompanionResponse;
			error?: string;
		};
		if (!body.success || !body.data?.overview || !Array.isArray(body.data?.summaryBullets)) {
			throw new Error(body.error || 'Invalid upstream response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (error) {
		console.error('[article-companion] upstream fetch failed:', error);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate article companion response' });
	}
}