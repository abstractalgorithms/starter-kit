'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { resizeImage } from '@starter-kit/utils/image';
import type { PostFragment, PublicationFragment } from '../generated/graphql';
import type { LearnPost } from './learn-today';
import { loadLearningPath } from './learn-today';
import type { TopicCluster } from './topic-clusters';
import { AuthModal } from './auth-modal';
import { useAuth } from './contexts/authContext';
import { CTAButton, CTALink } from './cta-system';
import { useLearningContext } from './learning-context-provider';
import { MOTION_EASE, MOTION_TIMING, getHoverLift } from './motion-system';
import { isInterviewPrepEnabled } from '../lib/features';
import { buildAdaptiveRecommendations, useLearningMemoryStore } from '../lib/learning-memory';
import { SystemsKnowledgeGraph } from './systems-knowledge-graph';

type Props = {
	publication: PublicationFragment;
	allPosts: LearnPost[];
	popularPosts: LearnPost[];
	initialPosts: PostFragment[];
	topicClusters: TopicCluster[];
};

type LearningPathCard = {
	id: string;
	title: string;
	description: string;
	query: string;
	tagHints: string[];
	icon: string;
};

type PathSourcePost = Pick<LearnPost, 'title' | 'brief' | 'tags' | 'readTimeInMinutes'>;

const AI_PLACEHOLDERS = [
	'How does Kafka exactly-once semantics work?',
	'Explain quorum consistency visually',
	'Teach me vector databases',
	'How does Raft leader election work?',
];
const LEARNING_PATHS: LearningPathCard[] = [
	{
		id: 'backend-engineer',
		title: 'Backend Engineer',
		description: 'Build resilient APIs, storage systems, queues, and distributed reliability patterns.',
		query: 'Backend engineering role-based track from fundamentals to production',
		tagHints: ['backend', 'api', 'database', 'queues'],
		icon: '⚙️',
	},
	{
		id: 'ai-engineer',
		title: 'AI Engineer',
		description: 'Go from model fundamentals to production RAG and LLM system architecture.',
		query: 'AI engineer role-based track for LLM systems and retrieval',
		tagHints: ['ai', 'llm', 'rag', 'embeddings'],
		icon: '🤖',
	},
	{
		id: 'infrastructure-engineer',
		title: 'Infrastructure Engineer',
		description: 'Build reliable distributed platforms across consistency, replication, consensus, and failure recovery.',
		query: 'Infrastructure engineer role-based track for distributed systems reliability and platform internals',
		tagHints: ['distributed', 'consensus', 'replication', 'kafka'],
		icon: '🌐',
	},
	{
		id: 'systems-architect',
		title: 'Systems Architect',
		description: 'Develop architecture judgment across scale, reliability, tradeoffs, and operating constraints.',
		query: 'Systems architect role-based track from system design foundations to production tradeoffs',
		tagHints: ['system-design', 'architecture', 'reliability'],
		icon: '🎯',
	},
	{
		id: 'principal-engineer',
		title: 'Principal Engineer',
		description: 'Develop cross-system judgment, platform strategy, and long-horizon technical decision-making.',
		query: 'Principal engineer role-based track for platform strategy architecture judgment and technical leadership',
		tagHints: ['architecture', 'platform', 'staff'],
		icon: '🏗️',
	},
];
const SIMULATIONS = [
	{
		title: 'Kafka Rebalance Simulation',
		description: 'Observe partition movement, consumer lag, and assignment strategy in real time.',
		interaction: 'Guided + Free mode',
		time: '8 min',
	},
	{
		title: 'Quorum Consistency Simulator',
		description: 'Tune N/R/W values and visualize stale-read risk vs availability.',
		interaction: 'Interactive controls',
		time: '6 min',
	},
	{
		title: 'RAG Pipeline Visualizer',
		description: 'Step through retrieval, reranking, context assembly, and generation.',
		interaction: 'Step-by-step',
		time: '9 min',
	},
	{
		title: 'CAP Theorem Explorer',
		description: 'Stress partitions and compare behavior across consistency profiles.',
		interaction: 'Scenario playback',
		time: '7 min',
	},
];
const LEARNING_STREAK_KEY = 'aa:learning-streak';

const sectionTransition = {
	duration: MOTION_TIMING.slow,
	ease: MOTION_EASE.emphasized,
} as const;

const SectionShell = ({
	id,
	children,
	className = '',
}: {
	id?: string;
	children: React.ReactNode;
	className?: string;
}) => (
	<section id={id} className={`py-12 md:py-16 ${className}`}>
		{children}
	</section>
);

const SectionHeading = ({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) => (
	<div className="mb-5 md:mb-6 flex items-end justify-between gap-4">
		<div>
			<h2 className="text-xl md:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{title}</h2>
			<p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{description}</p>
		</div>
		{action ? <div className="shrink-0">{action}</div> : null}
	</div>
);

const normalizeCoverImageUrl = (coverImage: unknown) => {
	const raw =
		typeof coverImage === 'string'
			? coverImage
			: typeof coverImage === 'object' &&
			  coverImage !== null &&
			  'url' in coverImage &&
			  typeof (coverImage as { url?: unknown }).url === 'string'
			? (coverImage as { url: string }).url
			: '';
	if (!raw) return null;
	const withProtocol = raw.startsWith('//') ? `https:${raw}` : raw;
	return resizeImage(withProtocol, { w: 960, h: 540, c: 'thumb' });
};

const getPathMatches = (posts: PathSourcePost[], hints: string[]) =>
	posts.filter((post) => {
		const haystack = `${post.title} ${post.brief} ${(post.tags ?? [])
			.flatMap((tag) => [tag.name, tag.slug])
			.join(' ')}`.toLowerCase();
		return hints.some((hint) => haystack.includes(hint.toLowerCase()));
	});

const getDifficultyLabel = (posts: PathSourcePost[]) => {
	if (posts.length === 0) return 'Mentor-built';
	const averageReadTime =
		posts.reduce((total, post) => total + (post.readTimeInMinutes || 0), 0) / posts.length;
	if (averageReadTime >= 12) return 'Advanced';
	if (averageReadTime >= 7) return 'Intermediate';
	return 'Foundational';
};

const formatPathTime = (minutes: number) => {
	if (minutes <= 0) return 'Plan on demand';
	if (minutes < 60) return `${minutes} min reading`;
	const hours = Math.round(minutes / 60);
	return `${hours} hr${hours === 1 ? '' : 's'} reading`;
};

const getPathDescription = (path: LearningPathCard, posts: PathSourcePost[]) => {
	if (posts.length === 0) return path.description;
	const topics = [
		...new Set(
			posts
				.flatMap((post) => post.tags ?? [])
				.map((tag) => tag.name)
				.filter(Boolean),
		),
	].slice(0, 2);
	if (topics.length > 0) {
		return `Covers ${topics.join(' and ')} through published deep dives from Learn.`;
	}
	return `Starts with ${posts[0].title} and continues through related deep dives.`;
};

const AALogo = ({ className = 'h-10 w-10' }: { className?: string }) => (
	<div className={`${className} relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-teal-400 text-white shadow-lg shadow-blue-500/20`}>
		<span className="text-lg font-black tracking-tight">A</span>
		<span className="absolute inset-1 rounded-lg border border-white/35" />
	</div>
);

const HeroSystemGraphic = ({ labels }: { labels: string[] }) => (
	<div className="relative mx-auto h-[280px] max-w-[520px] md:h-[330px]">
		<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(rgba(20,184,166,0.08)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
		<div className="absolute left-1/2 top-1/2 h-40 w-56 -translate-x-1/2 -translate-y-1/2 md:h-48 md:w-64">
			{[0, 1, 2].map((layer) => (
				<div
					key={layer}
					className="absolute left-1/2 h-20 w-48 -translate-x-1/2 rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(37,99,235,0.16)] dark:border-neutral-700 dark:bg-neutral-900/85"
					style={{ top: `${layer * 42}px`, transform: `translateX(-50%) skewY(-10deg)` }}
				>
					<div className={`mx-auto mt-5 h-3 w-28 rounded-full ${layer === 0 ? 'bg-violet-400' : layer === 1 ? 'bg-blue-400' : 'bg-teal-400'}`} />
				</div>
			))}
			<div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-12">
				<AALogo className="h-20 w-20 rounded-2xl" />
			</div>
		</div>
		{labels.slice(0, 6).map((label, index) => {
			const positions = [
				'left-5 top-10',
				'right-10 top-6',
				'left-0 bottom-20',
				'right-4 bottom-14',
				'left-1/2 top-2 -translate-x-1/2',
				'right-0 top-1/2 -translate-y-1/2',
			];
			return (
				<div key={label} className={`absolute ${positions[index]} hidden rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-sm dark:border-blue-900/60 dark:bg-neutral-900/90 sm:block`}>
					<div className="h-7 w-7 rounded-lg bg-blue-50 text-center text-sm font-bold leading-7 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
						{label.charAt(0).toUpperCase()}
					</div>
				</div>
			);
		})}
	</div>
);

const LoadBalancerGraphic = () => (
	<div className="relative h-32 w-full min-w-[220px]">
		<div className="absolute left-2 top-12 rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-neutral-900 dark:text-blue-300">Users</div>
		<div className="absolute left-24 top-9 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">Load<br />Balancer</div>
		{['Server 1', 'Server 2', 'Server 3'].map((server, index) => (
			<div key={server} className="absolute right-2 rounded-lg border border-blue-200 bg-white px-3 py-1 text-[10px] font-semibold text-neutral-700 dark:border-blue-800 dark:bg-neutral-900 dark:text-neutral-200" style={{ top: `${12 + index * 38}px` }}>
				{server}
			</div>
		))}
		<svg className="absolute inset-0 h-full w-full text-blue-300 dark:text-blue-700" fill="none" viewBox="0 0 260 130" aria-hidden="true">
			<path d="M58 62h48M145 52h58M145 62h58M145 72h58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	</div>
);

const JourneyTopologyGraphic = ({ activeLabel }: { activeLabel?: string }) => (
	<div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 p-5 text-white shadow-2xl shadow-blue-500/10 dark:border-neutral-800">
		<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(59,130,246,0.18)_1px,transparent_1px),linear-gradient(rgba(20,184,166,0.12)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70" />
		<div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
			<div className="flex items-center justify-between">
				<span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
					Cognition map
				</span>
				<span className="text-xs text-blue-100">{activeLabel ?? 'Adaptive path'}</span>
			</div>
			<div className="relative mx-auto h-64 w-full max-w-[520px]">
				{['Identity', 'Role', 'Graph', 'Simulation', 'Interview'].map((node, index) => {
					const positions = [
						'left-[4%] top-[42%]',
						'left-[25%] top-[12%]',
						'left-[47%] top-[45%]',
						'right-[18%] top-[18%]',
						'right-[2%] top-[55%]',
					];
					return (
						<div key={node} className={`absolute ${positions[index]}`}>
							<div className="relative">
								<div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-center text-xs font-black shadow-xl backdrop-blur">
									{node}
								</div>
								{index < 4 ? (
									<motion.div
										className="absolute left-[72px] top-1/2 h-1 w-24 origin-left rounded-full bg-gradient-to-r from-blue-400 to-emerald-300"
										animate={{ opacity: [0.35, 1, 0.35], scaleX: [0.72, 1, 0.72] }}
										transition={{ duration: 2.2 + index * 0.2, repeat: Infinity }}
									/>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
			<div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
				<p className="text-sm font-bold">Start with who you want to become. Then move through concepts, systems, pressure, and readiness.</p>
			</div>
		</div>
	</div>
);

export const HomepageRedesign = ({
	publication,
	allPosts,
	popularPosts,
	initialPosts,
	topicClusters,
}: Props) => {
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const { user } = useAuth();
	const [savedPath, setSavedPath] = useState<ReturnType<typeof loadLearningPath>>(null);
	const [learningStreak, setLearningStreak] = useState(0);
	const [aiQuery, setAiQuery] = useState('');
	const [searchText, setSearchText] = useState('');
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const [selectedPathId, setSelectedPathId] = useState(LEARNING_PATHS[0].id);
	const [mentorOpen, setMentorOpen] = useState(false);
	const [dashboardAuthOpen, setDashboardAuthOpen] = useState(false);
	const pathsRef = useRef<HTMLDivElement>(null);
	const { setContext } = useLearningContext();
	const learningMemory = useLearningMemoryStore();

	useEffect(() => {
		setSavedPath(loadLearningPath());
		try {
			const storedStreak = Number(localStorage.getItem(LEARNING_STREAK_KEY) ?? '0');
			setLearningStreak(Number.isFinite(storedStreak) && storedStreak > 0 ? storedStreak : 0);
		} catch {
			setLearningStreak(0);
		}
	}, []);

	useEffect(() => {
		const timer = window.setInterval(() => {
			setPlaceholderIndex((prev) => (prev + 1) % AI_PLACEHOLDERS.length);
		}, 2400);
		return () => window.clearInterval(timer);
	}, []);

	const fallbackCoverBySlug = useMemo(() => {
		const map = new Map<string, string>();
		for (const post of initialPosts) {
			const normalized = normalizeCoverImageUrl(post.coverImage);
			if (normalized) map.set(post.slug, normalized);
		}
		return map;
	}, [initialPosts]);

	const resolveCoverImage = (
		post: Pick<LearnPost, 'slug' | 'coverImage'> | Pick<PostFragment, 'slug' | 'coverImage'>,
	) => normalizeCoverImageUrl(post.coverImage) ?? fallbackCoverBySlug.get(post.slug) ?? null;

	const trendingPosts = popularPosts.slice(0, 4);

	const selectedPath = useMemo(
		() => LEARNING_PATHS.find((path) => path.id === selectedPathId) ?? LEARNING_PATHS[0],
		[selectedPathId],
	);

	const learningPathCards = useMemo(
		() =>
			LEARNING_PATHS.map((path) => {
				const matchedPosts = getPathMatches(allPosts, path.tagHints);
				const moduleCount = matchedPosts.length;
				const totalMinutes = matchedPosts.reduce(
					(total, post) => total + (post.readTimeInMinutes || 0),
					0,
				);
				const previewTitles = matchedPosts.slice(0, 2).map((post) => post.title);
				return {
					...path,
					moduleCount,
					totalMinutes,
					difficultyLabel: getDifficultyLabel(matchedPosts),
					timeLabel: formatPathTime(totalMinutes),
					description: getPathDescription(path, matchedPosts),
					previewTitles,
				};
			}),
		[allPosts],
	);

	const activeGraphCluster = topicClusters[0] ?? null;
	const popularSearchSuggestions = useMemo(() => {
		const topPosts = trendingPosts.slice(0, 3).map((post) => ({
			label: post.title,
			value: post.title,
		}));
		const topClusters = topicClusters
			.slice(0, 3)
			.map((cluster) => ({
				label: cluster.label,
				value: `Explain ${cluster.label} visually`,
			}));
		return [...topPosts, ...topClusters].slice(0, 4);
	}, [topicClusters, trendingPosts]);

	const completionPercent = useMemo(() => {
		if (!savedPath?.readSlugs?.length || !savedPath.totalPosts) return 0;
		return Math.round((savedPath.readSlugs.length / savedPath.totalPosts) * 100);
	}, [savedPath]);

	const adaptiveRecommendations = useMemo(
		() => buildAdaptiveRecommendations(learningMemory, allPosts),
		[allPosts, learningMemory],
	);
	const adaptiveNextPost = useMemo(() => {
		const next = adaptiveRecommendations.find((item) => item.type === 'next');
		return next ? allPosts.find((post) => post.slug === next.href.replace(/^\//, '')) ?? null : null;
	}, [adaptiveRecommendations, allPosts]);
	const weakAreaRecommendation = adaptiveRecommendations.find((item) => item.type === 'review' || item.type === 'practice');

	const nextRecommendation = useMemo(() => {
		if (adaptiveNextPost) return adaptiveNextPost;
		const readSlugs = new Set(savedPath?.readSlugs ?? []);
		return trendingPosts.find((post) => !readSlugs.has(post.slug)) ?? trendingPosts[0] ?? null;
	}, [adaptiveNextPost, savedPath, trendingPosts]);

	const secondaryRecommendations = useMemo(() => {
		const readSlugs = new Set(savedPath?.readSlugs ?? []);
		return trendingPosts
			.filter((post) => post.slug !== nextRecommendation?.slug && !readSlugs.has(post.slug))
			.slice(0, 2);
	}, [nextRecommendation?.slug, savedPath, trendingPosts]);

	const dashboardFocusArea =
		nextRecommendation?.tags?.[0]?.name ?? topicClusters[0]?.label ?? savedPath?.headline ?? null;

	useEffect(() => {
		setContext({
			source: 'homepage',
			pathname: '/',
			title: 'Abstract Algorithms',
			domain: 'Engineering',
			topic: savedPath?.interviewLabel ?? topicClusters[0]?.label ?? 'Learning platform',
			subtopic: savedPath?.headline ?? nextRecommendation?.title,
			concept: nextRecommendation?.tags?.[0]?.name,
			roadmapNode: savedPath?.headline ?? nextRecommendation?.title,
			roadmapHref: '/guided-topics',
			simulationTopic: nextRecommendation?.title ?? topicClusters[0]?.label,
		});
	}, [nextRecommendation, savedPath, setContext, topicClusters]);

	const dashboardCards = user
		? [
				{
					label: 'Streak',
					value: learningStreak > 0 ? `${learningStreak} day${learningStreak === 1 ? '' : 's'}` : 'Not started',
					detail: learningStreak > 0 ? 'Tracked from reading activity' : 'Read an article to begin',
				},
				{
					label: 'Mastery',
					value: completionPercent > 0 ? `${completionPercent}%` : 'No progress yet',
					detail: savedPath?.headline ?? 'Start or resume a track',
				},
				{
					label: 'Focus area',
					value: weakAreaRecommendation?.concept ?? dashboardFocusArea ?? 'Choose a topic',
					detail: weakAreaRecommendation ? 'Weak-area reinforcement' : nextRecommendation ? 'Based on your next unread post' : 'Based on your track',
				},
				{
					label: 'Recommendation',
					value: nextRecommendation?.title ?? 'Browse Learn',
					detail: nextRecommendation ? `${nextRecommendation.readTimeInMinutes} min read` : 'No article signal yet',
				},
		  ]
		: [
				{
					label: 'Streak',
					value: 'Sign in to track',
					detail: 'No activity is tracked while signed out',
				},
				{
					label: 'Mastery',
					value: 'Not started',
					detail: 'Progress appears after you save a track',
				},
				{
					label: 'Focus area',
					value: weakAreaRecommendation?.concept ?? 'Personalized later',
					detail: weakAreaRecommendation ? 'Based on local learning memory' : 'Based on saved topics and completed posts',
				},
				{
					label: 'Recommendation',
					value: nextRecommendation?.title ?? 'Browse Learn',
					detail: nextRecommendation ? 'Popular with readers right now' : 'Available after posts load',
				},
		  ];

	const motionConfig = reduceMotion
		? { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 } }
		: { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 } };

	const openAssistantWithQuery = (value: string) => {
		const trimmed = value.trim();
		router.push(`/assistant${trimmed ? `?q=${encodeURIComponent(trimmed)}` : ''}`);
	};

	return (
		<div className="pb-24 md:pb-0">
			<SectionShell className="pt-7 md:pt-10">
				<motion.div
					{...motionConfig}
					viewport={{ once: true, margin: '-80px' }}
					transition={sectionTransition}
					className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]"
				>
					<div>
						<p className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
							Abstract Algorithms
						</p>
						<h1 className="mt-4 text-4xl font-bold leading-[1.05] text-neutral-950 dark:text-neutral-50 md:text-6xl">
							Start your engineering evolution.
							<br />
							<span className="bg-gradient-to-r from-blue-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">Think in systems.</span>
						</h1>
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300 md:text-lg">
							Choose the engineer you want to become, enter with AI guidance, then move through concepts, topology, simulations, pressure tests, and interview readiness.
						</p>
						<div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
							<CTALink href={savedPath?.readSlugs?.length ? `/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}` : '/topic/distributed-systems'} level={1} size="lg">
								{savedPath ? 'Continue Learning' : 'Begin Topic'}
							</CTALink>
							<button type="button" onClick={() => setMentorOpen(true)} className="text-sm font-bold text-neutral-600 hover:text-blue-700 dark:text-neutral-300 dark:hover:text-blue-300">
								Ask AI Mentor
							</button>
						</div>
						<div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
							{['Concept', 'Visual', 'Challenge'].map((item, index) => (
								<div key={item} className="rounded-2xl border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900">
									<p className="font-black text-neutral-950 dark:text-neutral-50">0{index + 1}</p>
									<p className="mt-1 font-semibold text-neutral-600 dark:text-neutral-300">{item}</p>
								</div>
							))}
						</div>
					</div>
					<JourneyTopologyGraphic activeLabel={nextRecommendation?.tags?.[0]?.name ?? topicClusters[0]?.label} />
				</motion.div>
			</SectionShell>

			<SectionShell id="learning-paths">
				<div ref={pathsRef} />
				<SectionHeading
					title="What you want to become"
					description="Start with identity, then let the platform sequence articles, simulations, and interview practice around that role."
				/>
				<div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.55fr)]">
					<div className="flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4">
					{learningPathCards.map((path) => (
						<motion.button
							key={path.id}
							whileHover={getHoverLift(reduceMotion)}
							onClick={() => setSelectedPathId(path.id)}
							className={`min-w-[240px] snap-start rounded-2xl border p-5 text-left shadow-sm md:min-w-0 ${
								selectedPathId === path.id
									? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-600'
									: 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
							}`}
						>
							<p className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg dark:bg-blue-950/40">{path.icon}</p>
							<p className="mt-3 text-sm font-bold text-neutral-900 dark:text-neutral-50">{path.title}</p>
							<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{path.description}</p>
						</motion.button>
					))}
					</div>
					<div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
						<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">Selected identity</p>
						<p className="mt-2 text-2xl font-black text-neutral-950 dark:text-neutral-50">{selectedPath.title}</p>
						<p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{selectedPath.description}</p>
						<CTALink href={`/assistant?q=${encodeURIComponent(selectedPath.query)}`} level={1} size="md" className="mt-5 w-full">
							Begin Path
						</CTALink>
						<Link href="/topic/distributed-systems" className="mt-3 block text-center text-xs font-bold text-neutral-500 hover:text-blue-700 dark:text-neutral-400 dark:hover:text-blue-300">
							Explore Concepts
						</Link>
					</div>
				</div>
			</SectionShell>

			<SectionShell>
				<SectionHeading
					title="AI-guided entry"
					description="Ask from where you are. The mentor turns the answer into a next concept, a visual, or a practice challenge."
				/>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						openAssistantWithQuery(searchText);
					}}
					className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-neutral-800 dark:bg-neutral-900 md:grid md:grid-cols-[minmax(0,1fr)_180px] md:gap-3 md:p-6"
				>
					<input
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						placeholder={AI_PLACEHOLDERS[placeholderIndex]}
						className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-800 outline-none transition focus:border-blue-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
					<CTAButton type="submit" level={1} size="lg" className="mt-3 w-full md:mt-0">
						Ask AI Mentor
					</CTAButton>
				</form>
			</SectionShell>

			<SectionShell>
				<SectionHeading
					title="Continue learning"
					description="Resume from the exact cognition state, or start inside a topic journey that can span many canonical articles."
				/>
				<div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 md:grid md:grid-cols-[minmax(0,1fr)_260px] md:items-center md:gap-5">
					<div>
						<p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
							{savedPath?.interviewLabel ?? (savedPath ? 'Active journey' : 'Recommended next')}
						</p>
						<p className="mt-1 text-2xl font-black text-neutral-950 dark:text-neutral-50">
							{savedPath?.headline ?? nextRecommendation?.title ?? 'Explore the latest systems deep dive'}
						</p>
						<div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
							<motion.div animate={{ width: `${completionPercent}%` }} transition={{ duration: reduceMotion ? 0 : 0.35 }} className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500" />
						</div>
						<CTALink href={savedPath?.readSlugs?.length ? `/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}` : nextRecommendation?.tags?.[0]?.slug ? `/topic/${nextRecommendation.tags[0].slug}` : '/topic/distributed-systems'} level={1} size="md" className="mt-5">
							Continue Learning
						</CTALink>
					</div>
					<LoadBalancerGraphic />
				</div>
			</SectionShell>

			<SectionShell>
				<SectionHeading
					title="Interactive systems exploration"
					description="Concepts are easier to retain when you can see topology evolve and failure boundaries move."
				/>
				<SystemsKnowledgeGraph posts={initialPosts} initialConcept={activeGraphCluster?.label} compact />
				<div className="mt-4 flex justify-center">
					<CTALink href="/discover" level={1} size="md">Explore Concepts</CTALink>
				</div>
			</SectionShell>

			<SectionShell>
				<SectionHeading
					title="Practice and pressure-testing"
					description="Move from knowing the idea to operating it under constraints."
				/>
				<div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
					<div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-950 dark:bg-rose-950/15">
						<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">Pressure mode</p>
						<p className="mt-2 text-2xl font-black text-neutral-950 dark:text-neutral-50">Break the system before production does.</p>
						<p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Replay stale reads, rebalance storms, queue overload, partition recovery, and consistency failures.</p>
						<CTALink href="/visualizations" level={1} size="md" className="mt-5">Start Simulation</CTALink>
					</div>
					<div className="space-y-3">
						{SIMULATIONS.slice(0, 3).map((item, index) => (
							<div key={item.title} className={`rounded-2xl border p-4 ${index === 1 ? 'ml-0 border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20 md:ml-8' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'}`}>
								<p className="text-sm font-black text-neutral-950 dark:text-neutral-50">{item.title}</p>
								<p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{item.description}</p>
							</div>
						))}
					</div>
				</div>
			</SectionShell>

			<SectionShell>
				<SectionHeading
					title="Interview readiness"
					description="Turn the concepts you just learned into crisp tradeoff reasoning."
				/>
				<div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 md:grid md:grid-cols-[minmax(0,1fr)_220px] md:items-center md:gap-5">
					<div>
						<p className="text-2xl font-black text-neutral-950 dark:text-neutral-50">Practice explaining decisions under follow-up pressure.</p>
						<p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">The mentor targets weak areas, communication gaps, and tradeoff mistakes from your learning memory.</p>
					</div>
					<CTALink href={isInterviewPrepEnabled ? '/interview-prep' : '/assistant?q=interview%20coaching'} level={1} size="md" className="mt-5 md:mt-0">
						Practice Reasoning
					</CTALink>
				</div>
			</SectionShell>

			<SectionShell>
				<div className="rounded-3xl border border-neutral-200 bg-neutral-950 p-6 text-white dark:border-neutral-800">
					<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-blue-200">Continue your journey</p>
					<p className="mt-2 max-w-3xl text-3xl font-black tracking-tight">One path. Articles, graphs, simulations, mentor guidance, and interviews all keep the same learning state.</p>
					<CTALink href="/topic/distributed-systems" level={1} size="lg" className="mt-6">Continue Your Journey</CTALink>
				</div>
			</SectionShell>

			{/* AI Mentor modal */}
			{mentorOpen ? (
				<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-xl">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Ask AI</p>
							<button onClick={() => setMentorOpen(false)} className="text-sm text-neutral-500 dark:text-neutral-400">Close</button>
						</div>
						<input
							value={aiQuery}
							onChange={(e) => setAiQuery(e.target.value)}
							placeholder="Ask any engineering learning question…"
							className="mt-3 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 text-sm text-neutral-800 dark:text-neutral-100"
						/>
						<div className="mt-3 flex flex-wrap gap-2">
							{AI_PLACEHOLDERS.slice(0, 3).map((prompt) => (
								<button key={prompt} onClick={() => setAiQuery(prompt)} className="rounded-full border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400">
									{prompt}
								</button>
							))}
						</div>
						<Link
							href={`/assistant${aiQuery.trim() ? `?q=${encodeURIComponent(aiQuery.trim())}` : ''}`}
							className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
						>
							Open AI Mentor
						</Link>
					</div>
				</div>
			) : null}
			<AuthModal isOpen={dashboardAuthOpen} onClose={() => setDashboardAuthOpen(false)} />

			{/* Mobile bottom navigation */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur px-2 py-2">
				<div className="grid grid-cols-5 gap-1 text-center text-[11px]">
					<Link href="/" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Home</Link>
					<Link href="/posts" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Learn</Link>
					<Link href={isInterviewPrepEnabled ? '/interview-prep' : '/visualizations'} className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Practice</Link>
					<Link href="/assistant" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">AI Mentor</Link>
					<Link href="/discover" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Discover</Link>
				</div>
			</nav>
		</div>
	);
};
