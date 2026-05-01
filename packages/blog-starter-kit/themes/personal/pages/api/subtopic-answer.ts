import type { NextApiRequest, NextApiResponse } from 'next';

export type SubtopicAnswerResult = {
	answer: string;
};

type RequestBody = {
	topic: string;
	subTopic: string;
	posts?: Array<{ title: string; brief?: string; tags?: Array<{ name: string }>; slug: string }>;
};

type SuccessResponse = SubtopicAnswerResult;
type ErrorResponse = { error: string };

const UPSTREAM_URL =
	(process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '') +
	'/.netlify/functions/ai-subtopic-answer';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { topic, subTopic, posts } = req.body as RequestBody;
	if (!topic?.trim() || !subTopic?.trim()) {
		return res.status(400).json({ error: 'topic and subTopic are required' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'abstractalgorithms-personal-theme/1.0',
			},
			body: JSON.stringify({ topic, subTopic, posts: posts ?? [] }),
		});

		if (!upstream.ok) throw new Error(`Upstream responded ${upstream.status}`);

		const body = (await upstream.json()) as { success: boolean; data: SubtopicAnswerResult };
		if (!body.success || typeof body.data?.answer !== 'string') {
			throw new Error('Invalid upstream response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(body.data);
	} catch (err) {
		console.error('[subtopic-answer] upstream fetch failed:', err);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate answer' });
	}
}
