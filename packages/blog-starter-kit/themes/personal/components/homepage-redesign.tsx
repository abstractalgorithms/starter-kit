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
import { MOTION_EASE, MOTION_TIMING, getHoverLift } from './motion-system';

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
		query: 'Backend engineering roadmap from fundamentals to production',
		tagHints: ['backend', 'api', 'database', 'queues'],
		icon: '⚙️',
	},
	{
		id: 'ai-engineer',
		title: 'AI Engineer',
		description: 'Go from model fundamentals to production RAG and LLM system architecture.',
		query: 'AI engineer roadmap for LLM systems and retrieval',
		tagHints: ['ai', 'llm', 'rag', 'embeddings'],
		icon: '🤖',
	},
	{
		id: 'distributed-systems',
		title: 'Distributed Systems',
		description: 'Master consistency, replication, consensus, and failure-aware architecture.',
		query: 'Distributed systems learning path from foundations to internals',
		tagHints: ['distributed', 'consensus', 'replication', 'kafka'],
		icon: '🌐',
	},
	{
		id: 'system-design-interview',
		title: 'System Design Interview Prep',
		description: 'Practice architecture communication, tradeoffs, and interview-ready design depth.',
		query: 'System design interview prep roadmap',
		tagHints: ['interview', 'system-design', 'architecture'],
		icon: '🎯',
	},
	{
		id: 'staff-architect',
		title: 'Staff+ Architect',
		description: 'Develop platform strategy, org-level design thinking, and long-horizon tradeoff judgment.',
		query: 'Staff engineer architect roadmap for platform strategy',
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
const isVisualizationLabEnabled = process.env.NEXT_PUBLIC_ENABLE_VISUALIZATION_LAB === 'true';
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
	if (posts.length === 0) return 'Copilot-built';
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
		return `Covers ${topics.join(' and ')} through published deep dives from the library.`;
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
	const [graphActiveSlug, setGraphActiveSlug] = useState(topicClusters[0]?.slug ?? '');
	const [copilotOpen, setCopilotOpen] = useState(false);
	const [dashboardAuthOpen, setDashboardAuthOpen] = useState(false);
	const pathsRef = useRef<HTMLDivElement>(null);

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

	const activeGraphCluster = useMemo(
		() => topicClusters.find((item) => item.slug === graphActiveSlug) ?? topicClusters[0] ?? null,
		[topicClusters, graphActiveSlug],
	);
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

	const nextRecommendation = useMemo(() => {
		const readSlugs = new Set(savedPath?.readSlugs ?? []);
		return trendingPosts.find((post) => !readSlugs.has(post.slug)) ?? trendingPosts[0] ?? null;
	}, [savedPath, trendingPosts]);

	const secondaryRecommendations = useMemo(() => {
		const readSlugs = new Set(savedPath?.readSlugs ?? []);
		return trendingPosts
			.filter((post) => post.slug !== nextRecommendation?.slug && !readSlugs.has(post.slug))
			.slice(0, 2);
	}, [nextRecommendation?.slug, savedPath, trendingPosts]);

	const dashboardFocusArea =
		nextRecommendation?.tags?.[0]?.name ?? topicClusters[0]?.label ?? savedPath?.headline ?? null;

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
					detail: savedPath?.headline ?? 'Start or resume a roadmap',
				},
				{
					label: 'Focus area',
					value: dashboardFocusArea ?? 'Choose a topic',
					detail: nextRecommendation ? 'Based on your next unread post' : 'Based on your roadmap',
				},
				{
					label: 'Recommendation',
					value: nextRecommendation?.title ?? 'Browse the library',
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
					detail: 'Progress appears after you save a roadmap',
				},
				{
					label: 'Focus area',
					value: 'Personalized later',
					detail: 'Based on saved topics and completed posts',
				},
				{
					label: 'Recommendation',
					value: nextRecommendation?.title ?? 'Browse the library',
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
		<div className="pb-20 md:pb-0">
			{/* Hero */}
			<SectionShell className="pt-7 md:pt-10">
				<motion.div
					{...motionConfig}
					viewport={{ once: true, margin: '-80px' }}
					transition={sectionTransition}
					className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1fr)] gap-6 items-center"
				>
					<div>
						<p className="inline-flex rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
							AI-native engineering learning platform
						</p>
						<h1 className="mt-4 text-4xl md:text-6xl font-bold text-neutral-950 dark:text-neutral-50 leading-[1.05]">
							Master complex systems.
							<br />
							Build <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-teal-500 bg-clip-text text-transparent">real-world expertise.</span>
						</h1>
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
							{isVisualizationLabEnabled
								? 'Interactive explanations, visual simulations, and an AI copilot to accelerate your engineering journey.'
								: 'Interactive explanations, guided concept maps, and an AI copilot to accelerate your engineering journey.'}
						</p>
						<div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
							<button
								onClick={() => pathsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
								className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-violet-700 hover:to-blue-700"
							>
								Start Learning
							</button>
							<button
								onClick={() => setCopilotOpen(true)}
								className="rounded-lg border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:text-blue-400"
							>
								✦ Ask AI
							</button>
						</div>
					</div>
					<div className="hidden lg:block">
						<HeroSystemGraphic labels={topicClusters.map((cluster) => cluster.label)} />
					</div>
				</motion.div>
			</SectionShell>

			{/* AI Search */}
			<SectionShell>
				<div className="rounded-2xl border border-neutral-200/80 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-neutral-800 dark:bg-neutral-900/90 md:p-6">
					<div className="mb-4 flex items-center justify-between gap-3">
						<h2 className="text-lg font-bold text-neutral-950 dark:text-neutral-50">What do you want to learn today?</h2>
						<span className="text-xs font-semibold text-violet-600 dark:text-violet-300">AI Copilot ✣</span>
					</div>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							openAssistantWithQuery(searchText);
						}}
						className="flex flex-col gap-3 md:flex-row md:items-center"
					>
						<input
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder={AI_PLACEHOLDERS[placeholderIndex]}
							className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-blue-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
						/>
						<button
							type="submit"
							className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-700 hover:to-blue-700 text-center inline-flex items-center justify-center gap-1.5"
						>
							Ask
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7 7 7-7 7" />
							</svg>
						</button>
					</form>
					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="text-[11px] text-neutral-500 dark:text-neutral-400">Popular from this site:</span>
						{popularSearchSuggestions.map((chip) => (
							<button
								key={chip.label}
								onClick={() => openAssistantWithQuery(chip.value)}
								className="rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-600 dark:text-neutral-300 hover:border-blue-300 dark:hover:border-blue-500"
							>
								{chip.label}
							</button>
						))}
					</div>
					<div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
						Ask a question here and continue in AI Copilot.
					</div>
				</div>
			</SectionShell>

			{/* Learning paths */}
			<SectionShell id="learning-paths">
				<div ref={pathsRef} />
				<SectionHeading
					title="Choose your learning path"
					description="Role-based roadmaps with module sequencing, difficulty progression, and estimated commitment."
					action={
						<Link href="/posts" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
							View all paths →
						</Link>
					}
				/>
				<div className="flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-5">
					{learningPathCards.map((path) => (
						<motion.button
							key={path.id}
							whileHover={getHoverLift(reduceMotion)}
							onClick={() => setSelectedPathId(path.id)}
							className={`min-w-[155px] snap-start rounded-xl border p-4 text-left shadow-sm md:min-w-0 ${
								selectedPathId === path.id
									? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-600'
									: 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
							}`}
						>
							<p className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-lg dark:bg-blue-950/40">{path.icon}</p>
							<p className="mt-3 text-sm font-bold text-neutral-900 dark:text-neutral-50">{path.title}</p>
							<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{path.description}</p>
							<div className="mt-3 flex flex-wrap gap-1.5">
								<span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
									{path.difficultyLabel}
								</span>
								<span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
									{path.timeLabel}
								</span>
							</div>
							<p className="mt-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
								{path.moduleCount > 0 ? `${path.moduleCount} matched ${path.moduleCount === 1 ? 'article' : 'articles'}` : 'No matching articles yet'}
							</p>
							{path.previewTitles.length > 0 ? (
								<p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
									Includes {path.previewTitles.join(' + ')}
								</p>
							) : null}
							<Link
								href={`/assistant?q=${encodeURIComponent(path.query)}`}
								className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
							>
								Explore Path
							</Link>
						</motion.button>
					))}
				</div>
			</SectionShell>

			{/* Continue learning */}
			<SectionShell>
				<SectionHeading
					title="Continue learning"
					description="Resume a roadmap, or start from the most relevant systems deep dive."
				/>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
					<div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 md:grid md:grid-cols-[minmax(0,1fr)_300px] md:items-center md:gap-4">
						<div>
							<p className="text-[11px] text-neutral-500 dark:text-neutral-400">
								{savedPath?.interviewLabel ?? (savedPath ? 'Active roadmap' : 'Recommended deep dive')}
							</p>
							<p className="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-50 line-clamp-1">
								{savedPath?.headline ?? nextRecommendation?.title ?? 'Explore the latest deep dives'}
							</p>
							<p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
								{savedPath ? `${completionPercent}% complete` : 'Start a roadmap to track completion'}
							</p>
							<div className="mt-2 h-2 w-full max-w-sm overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
								<motion.div animate={{ width: `${completionPercent}%` }} transition={{ duration: reduceMotion ? 0 : 0.35 }} className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-500" />
							</div>
							<Link
								href={savedPath?.readSlugs?.length ? `/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}` : nextRecommendation ? `/${nextRecommendation.slug}` : '/posts'}
								className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-700 hover:to-blue-700"
							>
								{savedPath ? 'Continue' : 'Start reading'}
							</Link>
						</div>
						<LoadBalancerGraphic />
					</div>
					<div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
						{secondaryRecommendations.length > 0 ? (
							secondaryRecommendations.map((post) => (
								<Link key={post.id} href={`/${post.slug}`} className="block rounded-xl p-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
									<div className="flex items-start justify-between gap-3 text-xs">
										<div>
											<p className="font-bold text-neutral-800 dark:text-neutral-100 line-clamp-2">{post.title}</p>
											<p className="text-neutral-500 dark:text-neutral-400">
												{post.tags?.[0]?.name ?? 'Deep dive'} • {post.readTimeInMinutes} min
											</p>
										</div>
										<span className="shrink-0 text-neutral-500 dark:text-neutral-400">Next</span>
									</div>
								</Link>
							))
						) : (
							<div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
								More recommendations appear as new posts are available.
							</div>
						)}
					</div>
				</div>
			</SectionShell>

			{isVisualizationLabEnabled ? (
				<SectionShell>
					<SectionHeading
						title="Interactive learning experiences"
						description="Experiment through immersive simulations and guided walkthroughs."
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
						{SIMULATIONS.map((item, index) => (
							<motion.div key={item.title} whileHover={getHoverLift(reduceMotion)} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
								<div className="h-20 rounded-xl bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/30 p-2">
									<motion.div
										animate={reduceMotion ? undefined : { x: ['0%', '62%', '15%'] }}
										transition={{ duration: 4 + index * 0.5, repeat: Infinity, repeatType: 'mirror' }}
										className="h-1.5 w-16 rounded-full bg-blue-500"
									/>
								</div>
								<p className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</p>
								<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{item.description}</p>
								<p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">{item.interaction} • {item.time}</p>
								<Link
									href="/visualizations"
									className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
								>
									Try now
								</Link>
							</motion.div>
						))}
					</div>
				</SectionShell>
			) : null}

			{/* Trending deep dives */}
			<SectionShell>
				<SectionHeading
					title="Trending deep dives"
					description="High-signal technical explainers with difficulty and prerequisite context."
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
					{trendingPosts.map((post) => {
						const coverImageUrl = resolveCoverImage(post);
						const difficulty = post.readTimeInMinutes > 14 ? 'Advanced' : post.readTimeInMinutes > 8 ? 'Intermediate' : 'Foundational';
						return (
							<Link key={post.id} href={`/${post.slug}`} className="group rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
								{coverImageUrl ? (
									<img src={coverImageUrl} alt={post.title} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
								) : (
									<div className="h-40 w-full bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30" />
								)}
								<div className="p-4">
									<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2">{post.title}</p>
									<div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
										<span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-neutral-600 dark:text-neutral-300">{difficulty}</span>
										<span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-neutral-600 dark:text-neutral-300">{post.readTimeInMinutes} min</span>
									</div>
									<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{post.brief}</p>
								</div>
							</Link>
						);
					})}
				</div>
			</SectionShell>

			{/* Knowledge graph preview */}
			<SectionShell>
				<SectionHeading
					title="Explore the engineering knowledge graph"
					description="Inspect connected concepts, dependencies, and adjacent topics."
				/>
				<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
					<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
						<div className="flex flex-wrap gap-2">
							{topicClusters.map((cluster) => (
								<button
									key={cluster.slug}
									onClick={() => setGraphActiveSlug(cluster.slug)}
									className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${
										graphActiveSlug === cluster.slug
											? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
											: 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
									}`}
								>
									{cluster.label}
								</button>
							))}
						</div>
					</div>
					<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
						<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{activeGraphCluster?.label ?? 'Concept'}</p>
						<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Connected topics and dependencies highlighted. Click to open explorer.</p>
						<Link href={activeGraphCluster ? `/tag/${activeGraphCluster.slug}` : '/posts'} className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Open concept explorer</Link>
					</div>
				</div>
			</SectionShell>

			{/* Dashboard preview */}
			<SectionShell>
				<SectionHeading
					title="Personalized dashboard preview"
					description={
						user
							? 'Track streaks, mastery, focus areas, and next recommendations from your activity.'
							: 'Sign in to turn reading activity into a personalized learning dashboard.'
					}
				/>
				<div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{dashboardCards.map((card) => (
							<div key={card.label} className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 p-3">
								<p className="text-[11px] text-neutral-500 dark:text-neutral-400">{card.label}</p>
								<p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2">{card.value}</p>
								<p className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400 line-clamp-2">{card.detail}</p>
							</div>
						))}
					</div>
					{user ? (
						<Link href="/progress" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
							Open Learning Dashboard
						</Link>
					) : (
						<button
							type="button"
							onClick={() => setDashboardAuthOpen(true)}
							className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
						>
							Sign in to set up dashboard
						</button>
					)}
				</div>
			</SectionShell>

			{/* Copilot modal */}
			{copilotOpen ? (
				<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-xl">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Ask AI</p>
							<button onClick={() => setCopilotOpen(false)} className="text-sm text-neutral-500 dark:text-neutral-400">Close</button>
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
							Open AI Copilot
						</Link>
					</div>
				</div>
			) : null}
			<AuthModal isOpen={dashboardAuthOpen} onClose={() => setDashboardAuthOpen(false)} />

			{/* Mobile bottom navigation */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur px-2 py-2">
				<div className={`grid ${isVisualizationLabEnabled ? 'grid-cols-5' : 'grid-cols-4'} gap-1 text-center text-[11px]`}>
					<Link href="/" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Home</Link>
					<Link href="/posts" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Roadmaps</Link>
					<Link href="/assistant" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Explore</Link>
					{isVisualizationLabEnabled ? (
						<Link href="/visualizations" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Simulations</Link>
					) : null}
					<Link href="/progress" className="rounded-lg py-1.5 text-neutral-700 dark:text-neutral-300">Library</Link>
				</div>
			</nav>
		</div>
	);
};
