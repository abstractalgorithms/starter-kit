import type { NextApiRequest, NextApiResponse } from 'next';

export type GeneratedPost = {
	title: string;
	summary: string;
	tags: string[];
	readTimeMinutes: number;
	markdown: string;
};

type ErrorResponse = { error: string };

const CHAT_UPSTREAM = 'https://splendid-sfogliatella-6bc915.netlify.app/api/chat';

function buildPrompt(topic: string): string {
	return `Write a comprehensive technical blog post about: "${topic}"

Return ONLY valid JSON (no markdown fences, no text outside the JSON) in exactly this structure:
{
  "title": "string - a compelling, specific title",
  "summary": "string - 2-3 sentence summary describing what the reader will learn",
  "tags": ["string", "string", "string"],
  "readTimeMinutes": number,
  "markdown": "string - full post content in Markdown"
}

The markdown content must:
- Be 800-1400 words
- Start with a brief intro paragraph (no h1 — the title is separate)
- Use ## for main section headings and ### for sub-sections
- Include practical code examples in fenced code blocks with language tags where relevant
- Have 3-5 main sections covering key concepts, examples, and best practices
- End with a "## Key Takeaways" or "## Summary" section
- Be technically accurate, educational, and engaging

Important: output raw JSON only, starting with { and ending with }.`;
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<GeneratedPost | ErrorResponse>,
) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { topic } = req.body as { topic?: string };

	if (!topic?.trim()) {
		return res.status(400).json({ error: 'topic is required' });
	}

	try {
		const upstream = await fetch(CHAT_UPSTREAM, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question: buildPrompt(topic.trim()),
				history: [],
				postTitle: '',
				postContent: '',
			}),
			signal: AbortSignal.timeout(30_000),
		});

		if (!upstream.ok) {
			throw new Error(`Chat API responded ${upstream.status}`);
		}

		const data = (await upstream.json()) as { answer?: string; error?: string };

		if (data.error || !data.answer) {
			throw new Error(data.error ?? 'Empty response from AI');
		}

		// Strip markdown code fences if the model wrapped the JSON anyway
		const raw = data.answer.trim();
		const jsonStr = raw.startsWith('```')
			? raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
			: raw;

		let parsed: GeneratedPost;
		try {
			parsed = JSON.parse(jsonStr);
		} catch {
			// Try extracting a JSON object substring as a last resort
			const match = jsonStr.match(/\{[\s\S]*\}/);
			if (!match) throw new Error('AI did not return valid JSON');
			parsed = JSON.parse(match[0]);
		}

		if (!parsed.title || !parsed.markdown) {
			throw new Error('AI returned an incomplete post structure');
		}

		// Sanitise / fill defaults
		parsed.tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [];
		parsed.readTimeMinutes = Number(parsed.readTimeMinutes) || Math.ceil(parsed.markdown.split(' ').length / 200);

		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).json(parsed);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[generate-post] error:', msg);
		return res.status(502).json({ error: `Failed to generate post: ${msg}` });
	}
}
