import type { NextApiRequest, NextApiResponse } from 'next';

export type TriviadifficUlty = 'Easy' | 'Medium' | 'Hard';

export type TriviaOfDay = {
	question: string;
	options: string[];
	/** Index into options[] for the correct answer */
	answer: number;
	explanation: string;
	topic: string;
	difficulty: TriviadifficUlty;
	funFact: string;
	/** UTC date this trivia was generated for, e.g. "2026-04-24" */
	date: string;
};

type ErrorResponse = { error: string };

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<TriviaOfDay | ErrorResponse>,
) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
	if (!serverUrl) {
		console.error('[trivia-of-day] NEXT_PUBLIC_SERVER_URL is not set');
		return res.status(503).json({ error: 'NEXT_PUBLIC_SERVER_URL env var not configured' });
	}

	try {
		const upstream = await fetch(
			`${serverUrl}/.netlify/functions/ai-trivia-of-day`,
			{
				headers: { 'User-Agent': 'abstractalgorithms-personal-theme/1.0' },
				// 10-second timeout — Groq is fast on first call; cached calls are near-instant
				signal: AbortSignal.timeout(10_000),
			},
		);

		if (!upstream.ok) {
			throw new Error(`Upstream responded ${upstream.status}`);
		}

		const body = (await upstream.json()) as { success: boolean; data: TriviaOfDay };
		if (!body.success || !body.data) {
			throw new Error('Upstream returned empty or unsuccessful response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[trivia-of-day] upstream error:', msg);
		return res.status(502).json({ error: `Failed to fetch trivia: ${msg}` });
	}
}
