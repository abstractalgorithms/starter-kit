import { constructRSSFeedFromPosts } from '@starter-kit/utils/feed';
import request from 'graphql-request';
import { GetServerSideProps } from 'next';
import { RssFeedDocument, RssFeedQuery, RssFeedQueryVariables } from '../generated/graphql';
import { FEED_CACHE_SECONDS, FEED_STALE_WHILE_REVALIDATE_SECONDS } from '../lib/cache-constants';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const RSS = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const { res, query } = ctx;
	const after = query.after ? (query.after as string) : null;

	const data = await request<RssFeedQuery, RssFeedQueryVariables>(GQL_ENDPOINT, RssFeedDocument, {
		first: 20,
		host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		after,
	});

	const publication = data.publication;
	if (!publication) {
		return {
			notFound: true,
		};
	}
	const allPosts = publication.posts.edges.map((edge) => edge.node);

	const xml = constructRSSFeedFromPosts(
		publication,
		allPosts,
		after,
		publication.posts.pageInfo.hasNextPage && publication.posts.pageInfo.endCursor
			? publication.posts.pageInfo.endCursor
			: null,
	);

	res.setHeader(
		'Cache-Control',
		`s-maxage=${FEED_CACHE_SECONDS}, stale-while-revalidate=${FEED_STALE_WHILE_REVALIDATE_SECONDS}`,
	);
	res.setHeader('content-type', 'text/xml');
	res.write(xml);
	res.end();

	return { props: {} };
};

export default RSS;
