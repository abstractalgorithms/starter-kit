import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

// ─── Single article row ──────────────────────────────────────────────────────
const RecentArticleRow = ({ post }: { post: PostFragment }) => {
	return (
		<Link href={`/${post.slug}`} className="group flex gap-4 items-start py-4 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors rounded px-2 -mx-2">
			{post.coverImage && (
				<img
					src={post.coverImage.url}
					alt={post.title}
					className="w-14 h-14 rounded-md object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
				/>
			)}
			<div className="flex-1 min-w-0">
				<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1">
					{post.title}
				</h4>
				<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
					<DateFormatter dateString={post.publishedAt} />
					<span>·</span>
					<span>{post.readTimeInMinutes} min read</span>
				</div>
			</div>
			<svg
				className="w-4 h-4 flex-shrink-0 mt-0.5 transition-colors text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</Link>
	);
};

// ─── Article card ───────────────────────────────────────────────────────────
const ArticleCard = ({ post }: { post: PostFragment }) => {
	return (
		<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-lg transition-shadow">
			{post.coverImage && (
				<Link href={`/${post.slug}`}>
					<img
						src={post.coverImage.url}
						alt={post.title}
						className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				</Link>
			)}
			<div className="p-4">
				<Link href={`/${post.slug}`} className="group">
					<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
						{post.title}
					</h3>
				</Link>
				<p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
					{post.subtitle || post.brief}
				</p>
				<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
					<DateFormatter dateString={post.publishedAt} />
					<span>·</span>
					<span>{post.readTimeInMinutes} min read</span>
				</div>
			</div>
		</div>
	);
};

// ─── Main export ──────────────────────────────────────────────────────────────
type Props = {
	posts: PostFragment[];
};

export const RecentArticles = ({ posts }: Props) => {
	if (!posts || posts.length === 0) return null;

	return (
		<section className="w-full py-12">
			<div className="flex items-center justify-between mb-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
						Latest posts
					</p>
					<h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
						Recent Articles
					</h2>
				</div>
				<Link
					href="/posts"
					className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
				>
					View all
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{posts.slice(0, 6).map((post) => (
					<ArticleCard key={post.id} post={post} />
				))}
			</div>
		</section>
	);
};
