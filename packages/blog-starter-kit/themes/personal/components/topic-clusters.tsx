import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { formatTagName } from '../utils/format';

export type ClusterColor = 'blue' | 'emerald' | 'purple' | 'orange' | 'teal';

export type TopicCluster = {
	label: string;
	slug: string;
	color: ClusterColor;
	posts: PostFragment[];
	postCount: number;
};

const COLOR_CYCLE: ClusterColor[] = ['blue', 'emerald', 'purple', 'orange', 'teal'];

export function buildTopicClusters(
	allPosts: PostFragment[],
	maxClusters = 6,
	postsPerCluster = 4,
): TopicCluster[] {
	const tagMap = new Map<string, { label: string; posts: PostFragment[] }>();

	for (const post of allPosts) {
		for (const tag of post.tags ?? []) {
			if (!tag?.slug) continue;
			const existing = tagMap.get(tag.slug);
			if (existing) {
				existing.posts.push(post);
			} else {
				tagMap.set(tag.slug, { label: formatTagName(tag.name ?? tag.slug), posts: [post] });
			}
		}
	}

	return [...tagMap.entries()]
		.sort((a, b) => b[1].posts.length - a[1].posts.length)
		.slice(0, maxClusters)
		.map(([slug, { label, posts }], i) => ({
			label,
			slug,
			color: COLOR_CYCLE[i % COLOR_CYCLE.length],
			postCount: posts.length,
			posts: posts.slice(0, postsPerCluster),
		}));
}

// ─── Difficulty badge helper ──────────────────────────────────────────────────
const getDifficulty = (mins: number) => {
	if (mins <= 6)  return { label: 'Beginner',     cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
	if (mins <= 20) return { label: 'Intermediate', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
	return              { label: 'Advanced',        cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
};

// ─── Color palette ────────────────────────────────────────────────────────────
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

// ─── Compact 2×2 post card ────────────────────────────────────────────────────
const ClusterPostCard = ({ post, color }: { post: PostFragment; color: ClusterColor }) => {
	const diff = getDifficulty(post.readTimeInMinutes ?? 5);
	const c = COLORS[color];
	return (
		<Link
			href={`/${post.slug}`}
			className="group flex flex-col gap-2 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 hover:-translate-y-0.5 hover:shadow-md bg-neutral-50 dark:bg-neutral-950/50 transition-all duration-200 overflow-hidden"
		>
			{post.coverImage ? (
				<img
					src={post.coverImage.url}
					alt={post.title}
					className="w-full h-20 object-cover rounded-md group-hover:scale-[1.03] transition-transform duration-300"
				/>
			) : (
				<div className={`w-full h-20 rounded-md flex items-center justify-center text-xl ${c.pill}`}>
					📄
				</div>
			)}
			<div className="flex items-center justify-between gap-1">
				<span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${diff.cls}`}>
					{diff.label}
				</span>
				<span className="text-[9px] text-neutral-400 dark:text-neutral-500 shrink-0">{post.readTimeInMinutes}m</span>
			</div>
			<h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
				{post.title}
			</h4>
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
						{cluster.postCount} post{cluster.postCount !== 1 ? 's' : ''}
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
			<div className="px-4 pb-4 grid grid-cols-2 gap-2">
				{cluster.posts.map((post) => (
					<ClusterPostCard key={post.id} post={post} color={cluster.color} />
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

