import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

// ─── Cluster definition ──────────────────────────────────────────────────────
// Add / remove clusters here. `slug` must match the Hashnode tag slug exactly.
export const TOPIC_CLUSTER_DEFS = [
	{ label: 'System Design', slug: 'system-design', color: 'blue' },
	{ label: 'Algorithms', slug: 'algorithms', color: 'emerald' },
	{ label: 'Machine Learning', slug: 'machine-learning', color: 'purple' },
	{ label: 'AI Engineering', slug: 'artificial-intelligence', color: 'orange' },
	{ label: 'Architecture', slug: 'architecture', color: 'teal' },
] as const;

export type ClusterColor = (typeof TOPIC_CLUSTER_DEFS)[number]['color'];

export type TopicCluster = {
	label: string;
	slug: string;
	color: ClusterColor;
	posts: PostFragment[];
};

// ─── Color palette (only reference full strings so Tailwind picks them up) ───
const COLORS: Record<
	ClusterColor,
	{ label: string; pill: string; pillText: string; border: string; link: string }
> = {
	blue: {
		label: 'text-blue-600 dark:text-blue-400',
		pill: 'bg-blue-100 dark:bg-blue-900/40',
		pillText: 'text-blue-700 dark:text-blue-300',
		border: 'border-l-blue-500',
		link: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
	},
	emerald: {
		label: 'text-emerald-600 dark:text-emerald-400',
		pill: 'bg-emerald-100 dark:bg-emerald-900/40',
		pillText: 'text-emerald-700 dark:text-emerald-300',
		border: 'border-l-emerald-500',
		link: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
	},
	purple: {
		label: 'text-purple-600 dark:text-purple-400',
		pill: 'bg-purple-100 dark:bg-purple-900/40',
		pillText: 'text-purple-700 dark:text-purple-300',
		border: 'border-l-purple-500',
		link: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300',
	},
	orange: {
		label: 'text-orange-600 dark:text-orange-400',
		pill: 'bg-orange-100 dark:bg-orange-900/40',
		pillText: 'text-orange-700 dark:text-orange-300',
		border: 'border-l-orange-500',
		link: 'text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300',
	},
	teal: {
		label: 'text-teal-600 dark:text-teal-400',
		pill: 'bg-teal-100 dark:bg-teal-900/40',
		pillText: 'text-teal-700 dark:text-teal-300',
		border: 'border-l-teal-500',
		link: 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300',
	},
};

// ─── Single post row inside a cluster ────────────────────────────────────────
const ClusterPostRow = ({ post, color }: { post: PostFragment; color: ClusterColor }) => {
	const c = COLORS[color];
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
				className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${c.label} opacity-0 group-hover:opacity-100`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</Link>
	);
};

// ─── Single cluster card ──────────────────────────────────────────────────────
const ClusterCard = ({ cluster }: { cluster: TopicCluster }) => {
	const c = COLORS[cluster.color];
	return (
		<div className={`rounded-xl border border-l-4 border-neutral-200 dark:border-neutral-800 ${c.border} bg-white dark:bg-neutral-900 overflow-hidden`}>
			<div className="px-5 pt-5 pb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.pill} ${c.pillText}`}>
						{cluster.label}
					</span>
					<span className="text-xs text-neutral-400 dark:text-neutral-500">
						{cluster.posts.length} post{cluster.posts.length !== 1 ? 's' : ''}
					</span>
				</div>
				<Link
					href={`/tag/${cluster.slug}`}
					className={`text-xs font-semibold ${c.link} flex items-center gap-1 transition-colors`}
				>
					View all
					<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>
			<div className="px-5 pb-4">
				{cluster.posts.slice(0, 3).map((post) => (
					<ClusterPostRow key={post.id} post={post} color={cluster.color} />
				))}
			</div>
		</div>
	);
};

// ─── Main export ──────────────────────────────────────────────────────────────
type Props = {
	clusters: TopicCluster[];
};

export const TopicClusters = ({ clusters }: Props) => {
	const visible = clusters.filter((c) => c.posts.length > 0);
	if (visible.length === 0) return null;

	return (
		<section className="w-full py-12">
			<div className="flex items-center justify-between mb-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
						Browse by topic
					</p>
					<h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
						Topic Clusters
					</h2>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{visible.map((cluster) => (
					<ClusterCard key={cluster.slug} cluster={cluster} />
				))}
			</div>
		</section>
	);
};
