import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { isInterviewPrepEnabled } from '../lib/features';
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

	const clusters = [...tagMap.entries()]
		.sort((a, b) => b[1].posts.length - a[1].posts.length)
		.slice(0, maxClusters)
		.map(([slug, { label, posts }], i) => ({
			label,
			slug,
			color: COLOR_CYCLE[i % COLOR_CYCLE.length],
			postCount: posts.length,
			posts: posts.slice(0, postsPerCluster),
		}));

	// Add Interview Prep as a special cluster if not already present
	const hasInterviewPrep = clusters.some(c => c.slug === 'interview-prep');
	if (isInterviewPrepEnabled && !hasInterviewPrep) {
		const interviewPosts = allPosts.filter(p => 
			(p.tags ?? []).some(t => t?.slug?.toLowerCase().includes('interview'))
		);
		clusters.push({
			label: 'Interview Prep',
			slug: 'interview-prep',
			color: 'purple' as const,
			postCount: interviewPosts.length,
			posts: interviewPosts.slice(0, postsPerCluster),
		});
	}

	return clusters;
}

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
		link: 'text-blue-500 dark:text-blue-400',
	},
	emerald: {
		label: 'text-emerald-600 dark:text-emerald-400',
		pill: 'bg-emerald-100 dark:bg-emerald-900/40',
		pillText: 'text-emerald-700 dark:text-emerald-300',
		border: 'border-l-emerald-500',
		link: 'text-emerald-500 dark:text-emerald-400',
	},
	purple: {
		label: 'text-purple-600 dark:text-purple-400',
		pill: 'bg-purple-100 dark:bg-purple-900/40',
		pillText: 'text-purple-700 dark:text-purple-300',
		border: 'border-l-purple-500',
		link: 'text-purple-500 dark:text-purple-400',
	},
	orange: {
		label: 'text-orange-600 dark:text-orange-400',
		pill: 'bg-orange-100 dark:bg-orange-900/40',
		pillText: 'text-orange-700 dark:text-orange-300',
		border: 'border-l-orange-500',
		link: 'text-orange-500 dark:text-orange-400',
	},
	teal: {
		label: 'text-teal-600 dark:text-teal-400',
		pill: 'bg-teal-100 dark:bg-teal-900/40',
		pillText: 'text-teal-700 dark:text-teal-300',
		border: 'border-l-teal-500',
		link: 'text-teal-500 dark:text-teal-400',
	},
};

// ─── Single cluster card ──────────────────────────────────────────────────────
const ClusterCard = ({ cluster }: { cluster: TopicCluster }) => {
	const c = COLORS[cluster.color];
	return (
		<Link
			href={`/tag/${cluster.slug}`}
			className={`group rounded-xl border border-l-4 border-neutral-200 dark:border-neutral-800 ${c.border} bg-white dark:bg-neutral-900 overflow-hidden flex items-center justify-between px-5 py-4 hover:shadow-md transition-all duration-150`}
		>
			<div className="flex items-center gap-2">
				<span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.pill} ${c.pillText}`}>
					{cluster.label}
				</span>
				<span className="text-xs text-neutral-400 dark:text-neutral-500">
					{cluster.postCount} post{cluster.postCount !== 1 ? 's' : ''}
				</span>
			</div>
			<svg className={`w-3.5 h-3.5 ${c.link} opacity-0 group-hover:opacity-100 transition-opacity`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>
		</Link>
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
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{visible.map((cluster) => (
					<ClusterCard key={cluster.slug} cluster={cluster} />
				))}
			</div>
		</section>
	);
};

