import type { NextApiRequest, NextApiResponse } from 'next';

export type TopicExplorerResult = {
	summary: string;
	subTopics: string[];
};

type RequestBody = {
	topic: string;
	posts: Array<{ title: string; brief?: string; tags?: Array<{ name: string }> }>;
};

type SuccessResponse = TopicExplorerResult;
type ErrorResponse = { error: string };

const UPSTREAM_URL =
	(process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '') +
	'/.netlify/functions/ai-topic-explorer';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { topic, posts } = req.body as RequestBody;
	if (!topic?.trim() || !Array.isArray(posts) || posts.length === 0) {
		return res.status(400).json({ error: 'topic and posts are required' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'abstractalgorithms-personal-theme/1.0',
			},
			body: JSON.stringify({ topic, posts }),
		});

		if (!upstream.ok) throw new Error(`Upstream responded ${upstream.status}`);

		const body = (await upstream.json()) as { success: boolean; data: TopicExplorerResult };
		if (!body.success || typeof body.data?.summary !== 'string') {
			throw new Error('Invalid upstream response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (err) {
		console.error('[topic-explorer] upstream fetch failed:', err);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate topic summary' });
	}
}
