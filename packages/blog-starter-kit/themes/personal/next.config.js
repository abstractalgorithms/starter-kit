const { request, gql } = require('graphql-request');

const ANALYTICS_BASE_URL = 'https://hn-ping2.hashnode.com';
const HASHNODE_ADVANCED_ANALYTICS_URL = 'https://user-analytics.hashnode.com';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;

const getBasePath = () => {
	if (BASE_URL && BASE_URL.indexOf('/') !== -1) {
		return BASE_URL.substring(BASE_URL.indexOf('/'));
	}
	return undefined;
};

const getRedirectionRules = async () => {
	if (!GQL_ENDPOINT || !host) {
		console.warn(
			'[next.config] Skipping remote redirects because NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT or NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST is missing.'
		);
		return [];
	}

	const query = gql`
		query GetRedirectionRules {
			publication(host: "${host}") {
				id
				redirectionRules {
					source
					destination
					type
				}
			}
		}
  	`;

	let data;
	try {
		data = await request(GQL_ENDPOINT, query);
	} catch (error) {
		console.warn(
			`[next.config] Failed to load remote redirects from ${GQL_ENDPOINT}. Continuing build without remote redirects.`
		);
		if (process.env.NODE_ENV !== 'production') {
			console.warn(error instanceof Error ? error.message : error);
		}
		return [];
	}

	if (!data.publication) {
		console.warn(
			'[next.config] Publication not found while loading redirects. Check NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST. Continuing without remote redirects.'
		);
		return [];
	}

	const redirectionRules = data.publication.redirectionRules;

	// convert to next.js redirects format
	const redirects = redirectionRules
		.filter((rule) => {
			// Hashnode gives an option to set a wildcard redirect,
			// but it doesn't work properly with Next.js
			// the solution is to filter out all the rules with wildcard and use static redirects for now
			return rule.source.indexOf('*') === -1;
		})
		.map((rule) => {
			return {
				source: rule.source,
				destination: rule.destination,
				permanent: rule.type === 'PERMANENT',
			};
		});

	return redirects;
};

/**
 * @type {import('next').NextConfig}
 */
const config = {
	transpilePackages: ['@starter-kit/utils'],
	basePath: getBasePath(),
	experimental: {
		scrollRestoration: true,
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.hashnode.com',
			},
		],
	},
	async rewrites() {
		return [
			{
				source: '/ping/data-event',
				destination: `${ANALYTICS_BASE_URL}/api/data-event`,
			},
			{
				source: '/api/analytics',
				destination: `${HASHNODE_ADVANCED_ANALYTICS_URL}/api/analytics`,
			},
		];
	},
	async redirects() {
		return await getRedirectionRules();
	},
};

module.exports = config;
