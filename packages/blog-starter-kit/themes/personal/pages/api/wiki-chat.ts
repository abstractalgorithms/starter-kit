import type { NextApiRequest, NextApiResponse } from 'next';

const UPSTREAM_URL = 'https://splendid-sfogliatella-6bc915.netlify.app/api/wiki-chat';

type WikiCitation = {
	title: string;
	path: string;
	slug?: string;
	score?: number;
	snippet?: string;
};

export type WikiChatResponse =
	| {
			answer: string;
			citations?: WikiCitation[];
			metadata?: Record<string, unknown>;
	  }
	| { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<WikiChatResponse>) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(req.body),
		});

		const data = await upstream.json();
		return res.status(upstream.status).json(data);
	} catch (err) {
		console.error('[wiki-chat proxy]', err);
		return res.status(502).json({ error: 'Failed to reach upstream wiki AI service.' });
	}
}
