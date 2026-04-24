import type { NextApiRequest, NextApiResponse } from 'next';

export type ScenarioDifficulty = 'Mid' | 'Senior' | 'Staff';

export type ScenarioOfDay = {
	/** 2–3 sentence real-world setup for the scenario */
	scenario: string;
	/** The interview question derived from the scenario */
	question: string;
	/** Exactly 4 answer options */
	options: string[];
	/** 0-based index of the correct option */
	answer: number;
	/** Explanation of why the correct answer is right and others are not */
	explanation: string;
	topic: string;
	difficulty: ScenarioDifficulty;
	/** Lowercase keywords used to match related blog posts locally */
	relatedKeywords: string[];
	/** Single punchy principle to remember */
	takeaway: string;
	/** UTC date this scenario was generated for, e.g. "2026-04-24" */
	date: string;
};

type ErrorResponse = { error: string };

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ScenarioOfDay | ErrorResponse>,
) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
	if (!serverUrl) {
		console.error('[scenario-of-day] NEXT_PUBLIC_SERVER_URL is not set');
		return res.status(503).json({ error: 'NEXT_PUBLIC_SERVER_URL env var not configured' });
	}

	try {
		const upstream = await fetch(
			`${serverUrl}/.netlify/functions/ai-scenario-of-day`,
			{
				headers: { 'User-Agent': 'abstractalgorithms-personal-theme/1.0' },
				// 12-second timeout — cached responses are near-instant; first call may take a few seconds
				signal: AbortSignal.timeout(12_000),
			},
		);

		if (!upstream.ok) {
			throw new Error(`Upstream responded ${upstream.status}`);
		}

		const body = (await upstream.json()) as { success: boolean; data: ScenarioOfDay };
		if (!body.success || !body.data) {
			throw new Error('Upstream returned empty or unsuccessful response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[scenario-of-day] upstream error:', msg);
		return res.status(502).json({ error: `Failed to fetch scenario: ${msg}` });
	}
}
