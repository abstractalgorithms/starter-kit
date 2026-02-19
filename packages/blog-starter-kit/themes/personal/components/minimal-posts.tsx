import { PostFragment } from '../generated/graphql';
import { MinimalPostPreview } from './minimal-post-preview';

type Props = {
	posts: PostFragment[];
	context: 'home' | 'series' | 'tag';
};

export const MinimalPosts = ({ posts }: Props) => {
	return (
		<section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{posts.map((post) => (
				<MinimalPostPreview
					key={post.id}
					title={post.title}
					brief={post.brief}
					date={post.publishedAt}
					author={{
						name: post.author.name,
					}}
					slug={post.slug}
					commentCount={post.comments?.totalDocuments}
					coverImage={post.coverImage?.url}
					readTimeInMinutes={post.readTimeInMinutes}
				/>
			))}
		</section>
	);
};
