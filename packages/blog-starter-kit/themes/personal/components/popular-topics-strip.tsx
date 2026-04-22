import Link from 'next/link';
import { TopicCluster, ClusterColor } from './topic-clusters';

// ─── Emoji map for common tech slugs ─────────────────────────────────────────
const SLUG_EMOJI: Record<string, string> = {
	'llm': '🤖', 'large-language-models': '🤖', 'llms': '🤖', 'gpt': '🤖',
	'big-data': '⚡', 'spark': '⚡', 'hadoop': '⚡', 'kafka': '⚡',
	'system-design': '🏗️', 'distributed-systems': '🏗️', 'architecture': '🏗️',
	'machine-learning': '🧠', 'deep-learning': '🧠', 'neural-networks': '🧠',
	'kubernetes': '☸️', 'docker': '🐳', 'devops': '🔧', 'ci-cd': '🔧',
	'databases': '🗃️', 'sql': '🗃️', 'nosql': '🗃️', 'postgresql': '🗃️',
	'python': '🐍', 'java': '☕', 'golang': '🐹', 'rust': '🦀',
	'algorithms': '🔄', 'data-structures': '🔄',
	'data-engineering': '🔧', 'data-pipelines': '🔧',
	'cloud': '☁️', 'aws': '☁️', 'gcp': '☁️', 'azure': '☁️',
	'security': '🔒', 'networking': '🌐',
	'rag': '📚', 'vector-databases': '📐', 'embeddings': '📐',
};

const FALLBACK_EMOJI = '📖';

function topicEmoji(slug: string): string {
	const lower = slug.toLowerCase();
	for (const [key, emoji] of Object.entries(SLUG_EMOJI)) {
		if (lower.includes(key)) return emoji;
	}
	return FALLBACK_EMOJI;
}

// ─── Color palette (dot + hover ring) ────────────────────────────────────────
const DOT_COLORS: Record<ClusterColor, string> = {
	blue:    'bg-blue-500',
	emerald: 'bg-emerald-500',
	purple:  'bg-purple-500',
	orange:  'bg-orange-500',
	teal:    'bg-teal-500',
};

const PILL_HOVER: Record<ClusterColor, string> = {
	blue:    'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300',
	emerald: 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300',
	purple:  'hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300',
	orange:  'hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-700 dark:hover:text-orange-300',
	teal:    'hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300',
};

// ─── Single topic pill ────────────────────────────────────────────────────────
const TopicPill = ({ cluster }: { cluster: TopicCluster }) => (
	<Link
		href={`/tag/${cluster.slug}`}
		className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm font-medium transition-all duration-150 ${PILL_HOVER[cluster.color]} shadow-sm hover:shadow-md`}
	>
		<span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[cluster.color]}`} />
		<span className="text-base leading-none">{topicEmoji(cluster.slug)}</span>
		<span>{cluster.label}</span>
		<span className="ml-0.5 text-[11px] font-normal text-neutral-400 dark:text-neutral-500 group-hover:text-current transition-colors">
			{cluster.postCount}
		</span>
	</Link>
);

// ─── Main export ──────────────────────────────────────────────────────────────
type Props = {
	clusters: TopicCluster[];
};

export const PopularTopicsStrip = ({ clusters }: Props) => {
	const visible = clusters.filter((c) => c.postCount > 0);
	if (visible.length === 0) return null;

	return (
		<div className="w-full py-6">
			<div className="flex items-center gap-3 mb-4">
				<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
					Explore by topic
				</p>
				<div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
			</div>
			<div className="flex flex-wrap gap-2">
				{visible.map((cluster) => (
					<TopicPill key={cluster.slug} cluster={cluster} />
				))}
				<Link
					href="/posts"
					className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-150"
				>
					All posts
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>
		</div>
	);
};
