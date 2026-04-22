import type { NextApiRequest, NextApiResponse } from 'next';
import type { QuizQuestion } from './quiz';

type RequestBody = { postTitle: string; postContent: string };
type SuccessResponse = { questions: QuizQuestion[] };
type ErrorResponse = { error: string };

const CHAT_UPSTREAM = 'https://splendid-sfogliatella-6bc915.netlify.app/api/chat';

const SYSTEM_PROMPT = `You are a technical quiz generator. Given the content of a blog post, generate exactly 4 multiple-choice quiz questions that test genuine comprehension of the material. Return ONLY a valid JSON array — no markdown, no code fences, no commentary. Each element must have:
- "q": the question string
- "options": array of 4 answer strings (concise, no option labels like A/B/C)
- "answer": 0-based index of the correct option
- "explanation": 1-2 sentence explanation of why that option is correct

Example shape:
[{"q":"...","options":["...","...","...","..."],"answer":1,"explanation":"..."}]`;

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<SuccessResponse | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { postTitle, postContent } = req.body as RequestBody;
	if (!postTitle?.trim() || !postContent?.trim()) {
		return res.status(400).json({ error: 'postTitle and postContent are required' });
	}

	// Trim content to ~6 000 chars to stay within token budgets
	const trimmedContent = postContent.slice(0, 6000);

	const question = `${SYSTEM_PROMPT}

Post title: ${postTitle}

Post content:
${trimmedContent}`;

	try {
		const upstream = await fetch(CHAT_UPSTREAM, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question,
				history: [],
				postTitle,
				postContent: trimmedContent,
			}),
		});

		if (!upstream.ok) {
			throw new Error(`Upstream responded ${upstream.status}`);
		}

		const data = await upstream.json();
		const rawAnswer: string = data?.answer ?? '';

		// Extract the JSON array from the response (strip any accidental markdown)
		const jsonMatch = rawAnswer.match(/\[[\s\S]*\]/);
		if (!jsonMatch) throw new Error('No JSON array in response');

		const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);
		if (!Array.isArray(questions) || questions.length === 0) {
			throw new Error('Empty or invalid questions array');
		}

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json({ questions });
	} catch (err) {
		console.error('[post-quiz]', err);
		res.setHeader('Cache-Control', 'no-store');
		return res.status(502).json({ error: 'Failed to generate quiz. Please try again.' });
	}
}
