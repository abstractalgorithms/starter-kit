import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

type Props = {
	post: PostFragment;
};

export const FeaturedArticle = ({ post }: Props) => {
	const postURL = `/${post.slug}`;
	const coverImage = post.coverImage?.url;

	return (
		<section className="w-full py-12">
			<h2 className="text-2xl md:text-3xl font-bold mb-8 text-neutral-900 dark:text-neutral-50">
				Featured Article
			</h2>
			<Link href={postURL}>
				<div className="group cursor-pointer">
					<div className="w-full">
						<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden group-hover:shadow-lg transition-shadow">
							<div className="flex flex-col md:flex-row">
								{coverImage && (
									<div className="w-full md:w-1/2 h-64 md:h-96 relative">
										<img
											src={coverImage}
											alt={post.title}
											className="w-full h-full object-cover block"
										/>
									</div>
								)}
								<div className="w-full md:w-1/2 bg-white dark:bg-neutral-900 p-6 flex">
									<div className="w-full my-auto">
										<h3 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											{post.title}
										</h3>
										<p className="text-neutral-600 dark:text-neutral-300 mb-6 line-clamp-2">
											{post.brief}
										</p>
										<div className="flex items-center gap-4">
											<button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
												Read Article
											</button>
											<span className="text-sm text-neutral-500 dark:text-neutral-400">
												<DateFormatter dateString={post.publishedAt} /> • 6 min read
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Link>
		</section>
	);
};
