import type { NextApiRequest, NextApiResponse } from 'next';
import type { LearnPost } from './learning-path';

export type QuizQuestion = {
	q: string;
	options: string[];
	answer: number;
	explanation?: string;
};

type RequestBody = {
	query: string;
	posts: Array<Pick<LearnPost, 'title' | 'tags' | 'complexity'>>;
};

type SuccessResponse = { questions: QuizQuestion[] };
type ErrorResponse = { error: string };

const UPSTREAM_URL =
	(process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '') +
	'/.netlify/functions/ai-quiz-generator';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { query, posts } = req.body as RequestBody;
	if (!query?.trim() || !Array.isArray(posts) || posts.length === 0) {
		return res.status(400).json({ error: 'query and posts are required' });
	}

	try {
		const upstream = await fetch(UPSTREAM_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'abstractalgorithms-personal-theme/1.0',
			},
			body: JSON.stringify({ query, posts }),
		});

		if (!upstream.ok) throw new Error(`Upstream responded ${upstream.status}`);

		const body = (await upstream.json()) as { success: boolean; data: { questions: QuizQuestion[] } };
		if (!body.success || !Array.isArray(body.data?.questions)) {
			throw new Error('Invalid upstream response');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json({ questions: body.data.questions });
	} catch (err) {
		console.error('[quiz] upstream fetch failed:', err);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate quiz' });
	}
}
