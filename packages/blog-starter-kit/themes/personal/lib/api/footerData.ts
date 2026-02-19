import request from 'graphql-request';
import {
	PostFragment,
	PostsByPublicationDocument,
	PostsByPublicationQuery,
	PostsByPublicationQueryVariables,
} from '../../generated/graphql';

/**
 * Fetches a small set of posts used exclusively for deriving footer content
 * (Series column + Popular Topics column). Call this in getStaticProps for any
 * page that doesn't already have all posts available.
 */
export async function getFooterPosts(): Promise<PostFragment[]> {
	const data = await request<PostsByPublicationQuery, PostsByPublicationQueryVariables>(
		process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
		PostsByPublicationDocument,
		{
			first: 20,
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		},
	);
	return (data.publication?.posts.edges ?? []).map((e) => e.node);
}
