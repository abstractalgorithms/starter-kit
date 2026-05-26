import { PostFragment } from '../generated/graphql';
import { formatTagName } from '../utils/format';

export type SkillTreeNodeStatus = 'mastered' | 'in-progress' | 'available' | 'locked' | 'weak';

export type SkillTreePath = {
	title: string;
	description: string;
	tagSlug: string;
	color: 'blue' | 'purple' | 'emerald' | 'orange';
	specializations: string[];
	nodes: SkillTreeNode[];
};

export type SkillTreeNode = {
	id: string;
	title: string;
	description: string;
	tagSlug: string;
	postSlug?: string;
	prerequisiteIds: string[];
	branch: string;
	difficulty: 'foundation' | 'applied' | 'advanced' | 'interview';
	estimatedMinutes: number;
	simulationTopic: string;
	interviewPrompt: string;
};

export type SkillTreeProgress = Record<string, {
	mastery: number;
	attempts: number;
	weak: boolean;
	updatedAt: number;
}>;

const PATHS: Array<Omit<SkillTreePath, 'nodes'>> = [
	{
		title: 'Systems Architect',
		description: 'Build architecture judgment across scale, reliability, tradeoffs, and operating constraints.',
		tagSlug: 'system-design',
		color: 'blue',
		specializations: ['Architecture judgment', 'Platform evolution', 'Scaling constraints'],
	},
	{
		title: 'Infrastructure Engineer',
		description: 'Build reliable distributed platforms across consensus, replication, streams, and operational correctness.',
		tagSlug: 'distributed-systems',
		color: 'purple',
		specializations: ['Kafka internals', 'Consistency models', 'Reliable data platforms'],
	},
	{
		title: 'Python Engineering',
		description: 'Move from language fluency into production-grade backend engineering patterns.',
		tagSlug: 'python',
		color: 'emerald',
		specializations: ['Backend services', 'Concurrency', 'Performance tuning'],
	},
	{
		title: 'ML & AI Engineering',
		description: 'Navigate machine learning systems, LLM architecture, retrieval, and MLOps.',
		tagSlug: 'machine-learning',
		color: 'orange',
		specializations: ['LLM systems', 'Retrieval pipelines', 'MLOps readiness'],
	},
];

const FALLBACK_STEPS: Record<string, string[]> = {
	'system-design': ['System design fundamentals', 'Load balancing and caching', 'Database sharding', 'Microservices patterns', 'Architecture review'],
	'distributed-systems': ['Consensus algorithms', 'Replication strategies', 'Fault tolerance', 'Stream processing', 'CDC and event sourcing'],
	python: ['Python fundamentals', 'Data structures and algorithms', 'Async and concurrency', 'Testing and tooling', 'Performance optimization'],
	'machine-learning': ['ML fundamentals', 'Model evaluation', 'LLM engineering', 'MLOps deployment', 'Advanced AI systems'],
};

const branchFor = (title: string, path: Omit<SkillTreePath, 'nodes'>) => {
	const lower = title.toLowerCase();
	if (/design|case|architecture|scaling/.test(lower)) return path.specializations[0] ?? 'Core';
	if (/kafka|stream|event|cdc|queue/.test(lower)) return 'Streaming systems';
	if (/replication|consensus|quorum|cap|partition|clock/.test(lower)) return 'Consistency and reliability';
	if (/llm|rag|retrieval|embedding|vector|model/.test(lower)) return 'AI systems';
	if (/python|async|testing|performance/.test(lower)) return 'Production engineering';
	return path.specializations[1] ?? 'Core engineering';
};

const difficultyFor = (index: number, title: string): SkillTreeNode['difficulty'] => {
	const lower = title.toLowerCase();
	if (/interview/.test(lower)) return 'interview';
	if (index <= 1) return 'foundation';
	if (index <= 3) return 'applied';
	return 'advanced';
};

const summarizePost = (post?: PostFragment, fallback?: string) =>
	post?.brief || (post?.tags ?? []).slice(0, 2).map((tag) => formatTagName(tag.name)).join(' + ') || fallback || 'Build this capability through guided articles and practice.';

export const buildSkillTreePaths = (
	posts: PostFragment[],
	postCounts: Record<string, number>,
): SkillTreePath[] =>
	PATHS.filter((path) => (postCounts[path.tagSlug] ?? 0) > 0 || FALLBACK_STEPS[path.tagSlug]?.length).map((path) => {
		const matchingPosts = posts
			.filter((post) => (post.tags ?? []).some((tag) => tag.slug === path.tagSlug || tag.slug.includes(path.tagSlug)))
			.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))
			.slice(0, 6);
		const titles = matchingPosts.length > 0
			? matchingPosts.map((post) => post.title)
			: FALLBACK_STEPS[path.tagSlug] ?? [];
		const nodes = titles.slice(0, 6).map((title, index) => {
			const post = matchingPosts[index];
			const id = `${path.tagSlug}-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
			return {
				id,
				title,
				description: summarizePost(post, `Practice ${title.toLowerCase()} before moving deeper into ${path.title}.`),
				tagSlug: path.tagSlug,
				postSlug: post?.slug,
				prerequisiteIds: index === 0 ? [] : [`${path.tagSlug}-${index - 1}-${titles[index - 1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`],
				branch: branchFor(title, path),
				difficulty: difficultyFor(index, title),
				estimatedMinutes: post?.readTimeInMinutes ?? 12 + index * 8,
				simulationTopic: title,
				interviewPrompt: `Drill me on ${title} as an engineering interview topic. Include follow-up questions and tradeoffs.`,
			} satisfies SkillTreeNode;
		});
		return { ...path, nodes };
	});

export const getNodeStatus = (
	node: SkillTreeNode,
	progress: SkillTreeProgress,
	nodes: SkillTreeNode[],
): SkillTreeNodeStatus => {
	const state = progress[node.id];
	if (state?.weak) return 'weak';
	if ((state?.mastery ?? 0) >= 85) return 'mastered';
	if ((state?.mastery ?? 0) > 0 || (state?.attempts ?? 0) > 0) return 'in-progress';
	const locked = node.prerequisiteIds.some((id) => {
		const prerequisiteExists = nodes.some((item) => item.id === id);
		if (!prerequisiteExists) return false;
		return (progress[id]?.mastery ?? 0) < 55;
	});
	return locked ? 'locked' : 'available';
};

export const getAdaptiveNode = (path: SkillTreePath, progress: SkillTreeProgress) =>
	path.nodes.find((node) => ['weak', 'in-progress', 'available'].includes(getNodeStatus(node, progress, path.nodes))) ??
	path.nodes[0];
