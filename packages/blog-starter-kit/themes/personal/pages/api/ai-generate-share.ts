import type { NextApiRequest, NextApiResponse } from 'next';

const UPSTREAM_URL = 'https://splendid-sfogliatella-6bc915.netlify.app/api/ai-generate-share';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const body = { ...req.body };
		if (typeof body.url === 'string') {
			body.url = body.url.replace('abstractalgorithms.hashnode.dev', 'abstractalgorithms.dev');
		}

		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		const data = await upstream.json();
		return res.status(upstream.status).json(data);
	} catch (err) {
		console.error('[ai-generate-share proxy]', err);
		return res.status(502).json({ error: 'Failed to reach upstream AI service.' });
	}
}
