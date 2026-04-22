import type { NextApiRequest, NextApiResponse } from 'next';

export type TickerCategory = 'LLM' | 'Vision' | 'NLP' | 'Robotics' | 'Generative AI' | 'ML/Research' | 'Hardware' | 'Multimodal';

export type TickerSource = {
name: string;
url: string;
siteUrl: string;
feedUrl: string;
};

export type TickerItem = {
title: string;
description: string;
summary: string;
context: string;
category: TickerCategory;
timestamp: string;
publishedAt: string;
sourceName: string;
sourceUrl: string;
source: TickerSource;
};

type ErrorResponse = { error: string };

// Upstream Netlify function that aggregates live AI RSS feeds.
// Set NEXT_PUBLIC_SERVER_URL in .env.local:
//   NEXT_PUBLIC_SERVER_URL=https://splendid-sfogliatella-6bc915.netlify.app
const UPSTREAM_URL =
(process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '') +
'/.netlify/functions/ai-tech-ticker';

export default async function handler(
req: NextApiRequest,
res: NextApiResponse<TickerItem[] | ErrorResponse>,
) {
if (req.method !== 'GET') {
res.setHeader('Allow', 'GET');
return res.status(405).json({ error: 'Method Not Allowed' });
}

try {
const count = typeof req.query.count === 'string' ? req.query.count : '10';
const upstream = await fetch(`${UPSTREAM_URL}?count=${encodeURIComponent(count)}`, {
headers: { 'User-Agent': 'abstractalgorithms-personal-theme/1.0' },
});

if (!upstream.ok) {
throw new Error(`Upstream responded ${upstream.status}`);
}

const body = (await upstream.json()) as { success: boolean; data: TickerItem[] };
if (!body.success || !Array.isArray(body.data) || body.data.length === 0) {
throw new Error('Upstream returned empty or unsuccessful response');
}

res.setHeader('Cache-Control', 'no-store');
res.setHeader('X-Ticker-Source', 'live');
return res.status(200).json(body.data);
} catch (err) {
console.error('[ai-tech-ticker] upstream fetch failed:', err);
res.setHeader('Cache-Control', 'no-store');
res.setHeader('X-Ticker-Source', 'error');
return res.status(502).json({ error: 'Failed to fetch live ticker data' });
}
}
