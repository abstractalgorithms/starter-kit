import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatViews(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}

function daysSince(iso: string): number {
	return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// ─── Cluster definitions ──────────────────────────────────────────────────────
type ClusterKind = 'created' | 'updated' | 'top';

const CLUSTER_META: Record<
	ClusterKind,
	{ label: string; badge: string; pill: string; pillText: string; border: string; link: string; arrow: string }
> = {
	created: {
		label: 'Recently Added',
		badge: 'New',
		pill: 'bg-blue-100 dark:bg-blue-900/40',
		pillText: 'text-blue-700 dark:text-blue-300',
		border: 'border-l-blue-500',
		link: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
		arrow: 'text-blue-600 dark:text-blue-400',
	},
	updated: {
		label: 'Recently Updated',
		badge: 'Updated',
		pill: 'bg-emerald-100 dark:bg-emerald-900/40',
		pillText: 'text-emerald-700 dark:text-emerald-300',
		border: 'border-l-emerald-500',
		link: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
		arrow: 'text-emerald-600 dark:text-emerald-400',
	},
	top: {
		label: 'Top Posts',
		badge: 'Popular',
		pill: 'bg-orange-100 dark:bg-orange-900/40',
		pillText: 'text-orange-700 dark:text-orange-300',
		border: 'border-l-orange-500',
		link: 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300',
		arrow: 'text-orange-600 dark:text-orange-400',
	},
};

// ─── Single article row inside a cluster ─────────────────────────────────────
const ClusterRow = ({
	post,
	kind,
	rank,
}: {
	post: PostFragment;
	kind: ClusterKind;
	rank?: number;
}) => {
	const c = CLUSTER_META[kind];

	const meta = (() => {
		if (kind === 'created') {
			return <DateFormatter dateString={post.publishedAt} />;
		}
		if (kind === 'updated' && post.updatedAt) {
			const days = daysSince(post.updatedAt);
			return (
				<>
					<span>
						{days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
					</span>
					<span>·</span>
					<span>{post.readTimeInMinutes} min read</span>
				</>
			);
		}
		// top
		return (
			<>
				<span>{formatViews(post.views)} views</span>
				<span>·</span>
				<span>{post.readTimeInMinutes} min read</span>
			</>
		);
	})();

	return (
		<Link
			href={`/${post.slug}`}
			className="group flex gap-3 items-start py-3.5 border-b last:border-b-0 border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors rounded px-2 -mx-2"
		>
			{kind === 'top' && rank != null && (
				<span className={`flex-shrink-0 w-5 h-5 mt-0.5 text-xs font-bold flex items-center justify-center rounded-full ${c.pill} ${c.pillText}`}>
					{rank}
				</span>
			)}
			{post.coverImage ? (
				<img
					src={post.coverImage.url}
					alt={post.title}
					className="w-12 h-12 rounded-md object-cover flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
				/>
			) : null}
			<div className="flex-1 min-w-0">
				<h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1">
					{post.title}
				</h4>
				<div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
					{meta}
				</div>
			</div>
			<svg
				className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.arrow} opacity-0 group-hover:opacity-100 transition-opacity`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</Link>
	);
};

// ─── Single cluster column card ───────────────────────────────────────────────
const ClusterCard = ({ posts, kind }: { posts: PostFragment[]; kind: ClusterKind }) => {
	const c = CLUSTER_META[kind];
	if (posts.length === 0) return null;

	return (
		<div
			className={`rounded-xl border border-l-4 border-neutral-200 dark:border-neutral-800 ${c.border} bg-white dark:bg-neutral-900 overflow-hidden flex flex-col`}
		>
			<div className="px-5 pt-5 pb-3 flex items-center gap-2">
				<span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.pill} ${c.pillText}`}>
					{c.badge}
				</span>
				<span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
					{c.label}
				</span>
			</div>
			<div className="px-5 pb-5 flex-1">
				{posts.map((post, i) => (
					<ClusterRow key={post.id} post={post} kind={kind} rank={kind === 'top' ? i + 1 : undefined} />
				))}
			</div>
		</div>
	);
};

// ─── Main export ──────────────────────────────────────────────────────────────
type Props = {
	recentlyCreated: PostFragment[];
	recentlyUpdated: PostFragment[];
	topPosts: PostFragment[];
};

export const RecentArticles = ({ recentlyCreated, recentlyUpdated, topPosts }: Props) => {
	const hasContent = recentlyCreated.length > 0 || recentlyUpdated.length > 0 || topPosts.length > 0;
	if (!hasContent) return null;

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
				<ClusterCard posts={recentlyCreated} kind="created" />
				{recentlyUpdated.length > 0 && <ClusterCard posts={recentlyUpdated} kind="updated" />}
				<ClusterCard posts={topPosts} kind="top" />
			</div>
		</section>
	);
};

