import type { NextApiRequest, NextApiResponse } from 'next';

export type GeneratedPost = {
	title: string;
	summary: string;
	tags: string[];
	readTimeMinutes: number;
	markdown: string;
};

type ErrorResponse = { error: string };

// Use the shared server URL env var — consistent with all other API routes.
// The dedicated ai-generate-post function uses max_tokens=3000 and a proper
// blog-writing system prompt, unlike the generic chat endpoint.
const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GeneratedPost | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	if (!serverUrl) {
		console.error('[generate-post] NEXT_PUBLIC_SERVER_URL is not set');
		return res.status(503).json({ error: 'Server URL not configured' });
	}

	const { topic } = req.body as { topic?: string };

	if (!topic?.trim()) {
		return res.status(400).json({ error: 'topic is required' });
	}

	try {
		const upstream = await fetch(
			`${serverUrl}/.netlify/functions/ai-generate-post`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ topic: topic.trim() }),
				signal: AbortSignal.timeout(35_000),
			},
		);

		if (!upstream.ok) {
			throw new Error(`Upstream responded ${upstream.status}`);
		}

		const envelope = (await upstream.json()) as {
			success: boolean;
			data?: GeneratedPost;
			error?: string;
		};

		if (!envelope.success || !envelope.data) {
			throw new Error(envelope.error ?? 'Empty response from AI');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(envelope.data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[generate-post] error:', msg);
		return res.status(502).json({ error: `Failed to generate post: ${msg}` });
	}
}
