import type { NextApiResponse } from 'next';

type SharedCacheOptions = {
	browserMaxAge?: number;
	sMaxAge: number;
	staleWhileRevalidate?: number;
	vercelSMaxAge?: number;
};

export function setVercelApiCacheHeaders(
	res: NextApiResponse,
	{
		browserMaxAge = 0,
		sMaxAge,
		staleWhileRevalidate = 86400,
		vercelSMaxAge = sMaxAge,
	}: SharedCacheOptions,
) {
	const downstreamPolicy = `public, max-age=${browserMaxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
	const sharedPolicy = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
	const vercelPolicy = `public, s-maxage=${vercelSMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;

	res.setHeader('Cache-Control', downstreamPolicy);
	res.setHeader('CDN-Cache-Control', sharedPolicy);
	res.setHeader('Vercel-CDN-Cache-Control', vercelPolicy);
}