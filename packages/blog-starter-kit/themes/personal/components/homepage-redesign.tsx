'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { resizeImage } from '@starter-kit/utils/image';
import type { PostFragment, PublicationFragment } from '../generated/graphql';
import type { LearnPost } from './learn-today';
import { loadLearningPath } from './learn-today';
import type { StartHereSeries } from './start-here-section';
import type { TopicCluster } from './topic-clusters';
import { useAuth } from './contexts/authContext';
import { MOTION_EASE, MOTION_TIMING, getHoverLift, getTapScale } from './motion-system';

type Props = {
	publication: PublicationFragment;
	allPosts: LearnPost[];
	initialPosts: PostFragment[];
	featuredSeries: StartHereSeries[];
	topicClusters: TopicCluster[];
};

type Persona = {
	id: string;
	label: string;
	description: string;
	query: string;
	icon: string;
	duration: string;
};

const PERSONAS: Persona[] = [
	{
		id: 'system-design-engineer',
		label: 'System Design Engineer',
		description: 'Master scalable architecture, API design, and trade-offs.',
		query: 'system design engineer roadmap',
		icon: '🏗️',
		duration: '4-week path',
	},
	{
		id: 'backend-engineer',
		label: 'Backend Engineer',
		description: 'Build robust services, storage layers, and async systems.',
		query: 'backend engineering learning path',
		icon: '⚙️',
		duration: '6-week path',
	},
	{
		id: 'ai-llm-engineer',
		label: 'AI/LLM Engineer',
		description: 'Learn model systems, RAG, and production AI architecture.',
		query: 'llm engineering and rag',
		icon: '🤖',
		duration: '5-week path',
	},
	{
		id: 'distributed-systems',
		label: 'Distributed Systems',
		description: 'Deep dive into consensus, replication, and fault tolerance.',
		query: 'distributed systems fundamentals',
		icon: '🌐',
		duration: '5-week path',
	},
	{
		id: 'interview-prep',
		label: 'Interview Prep',
		description: 'Practice a structured sequence for real interview readiness.',
		query: 'system design interview prep',
		icon: '🎯',
		duration: '2-week sprint',
	},
];

const sectionTransition = {
	duration: MOTION_TIMING.slow,
	ease: MOTION_EASE.emphasized,
} as const;
const isVisualizationLabEnabled = process.env.NEXT_PUBLIC_ENABLE_VISUALIZATION_LAB === 'true';

const SectionHeading = ({
	kicker,
	title,
	description,
}: {
	kicker: string;
	title: string;
	description: string;
}) => (
	<div className="mb-5 flex flex-col gap-1">
		<p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-blue-400">
			{kicker}
		</p>
		<h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 md:text-3xl">{title}</h2>
		<p className="max-w-3xl text-sm text-neutral-500 dark:text-neutral-400 md:text-base">{description}</p>
	</div>
);

const SectionShell = ({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<section className={`border-t border-neutral-200 py-10 dark:border-neutral-800 md:py-12 ${className}`}>
		{children}
	</section>
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

export const HomepageRedesign = ({
	publication,
	allPosts,
	initialPosts,
	featuredSeries,
	topicClusters,
}: Props) => {
	const prefersReducedMotion = useReducedMotion();
	const { user } = useAuth();

	const [assistantQuery, setAssistantQuery] = useState('');
	const [selectedPersona, setSelectedPersona] = useState<string>('system-design-engineer');
	const [savedPath, setSavedPath] = useState<ReturnType<typeof loadLearningPath>>(null);
	const [topicPrompt, setTopicPrompt] = useState('');

	useEffect(() => {
		const storedPersona =
			typeof window !== 'undefined' ? localStorage.getItem('aa:selected-persona') : null;
		if (storedPersona && PERSONAS.some((persona) => persona.id === storedPersona)) {
			setSelectedPersona(storedPersona);
		}
		setSavedPath(loadLearningPath());
	}, []);

	const selectedPersonaData =
		PERSONAS.find((persona) => persona.id === selectedPersona) ?? PERSONAS[0];

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

	const trendingPosts = useMemo(
		() => [...allPosts].sort((a, b) => b.views - a.views || b.readTimeInMinutes - a.readTimeInMinutes).slice(0, 6),
		[allPosts],
	);

	const communityPosts = useMemo(
		() =>
			[...initialPosts]
				.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
				.slice(0, 4),
		[initialPosts],
	);

	const visualExplainers = useMemo(
		() =>
			allPosts
				.filter(
					(post) =>
						!!resolveCoverImage(post) || /diagram|architecture|flow|system/i.test(post.title),
				)
				.slice(0, 4),
		[allPosts, fallbackCoverBySlug],
	);

	const knowledgeGraphNodes = useMemo(
		() =>
			topicClusters.map((cluster) => ({
				id: cluster.slug,
				label: cluster.label,
				weight: cluster.postCount,
			})),
		[topicClusters],
	);

	const [activeGraphNode, setActiveGraphNode] = useState<string>(knowledgeGraphNodes[0]?.id ?? '');
	const activeCluster = useMemo(
		() => topicClusters.find((cluster) => cluster.slug === activeGraphNode) ?? null,
		[topicClusters, activeGraphNode],
	);
	const activeTopicSummary = useMemo(() => {
		if (!activeCluster) return 'Select a concept to see AI-guided learning context.';
		const examples = activeCluster.posts
			.slice(0, 2)
			.map((post) => post.title)
			.join(' and ');
		return `Start with core foundations of ${activeCluster.label}, then move into implementation tradeoffs and production patterns.${examples ? ` Suggested anchors: ${examples}.` : ''}`;
	}, [activeCluster]);

	useEffect(() => {
		if (!activeCluster) return;
		setTopicPrompt(`How should I learn ${activeCluster.label} from fundamentals to production implementation?`);
	}, [activeCluster]);

	const roadmapPosts = featuredSeries[0]?.posts?.slice(0, 5) ?? [];

	const moveConfig = prefersReducedMotion
		? { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 } }
		: { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 } };

	return (
		<div className="flex flex-col">
			{/* 1. Hero section */}
			<motion.section
				{...moveConfig}
				viewport={{ once: true, margin: '-80px' }}
				transition={sectionTransition}
				className="pb-10 pt-8 md:pb-12 md:pt-10"
			>
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
					<div>
						<p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-blue-400">
							AI-native engineering learning platform
						</p>
						<h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-5xl">
							Master systems thinking with guided technical depth.
						</h1>
						<p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-500 dark:text-neutral-400">
							{publication.title} combines deep technical articles, interactive roadmaps, and an AI
							assistant to turn exploration into structured engineering progression.
						</p>

						<div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
							<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
								AI Learning Assistant
							</p>
							<div className="flex flex-col gap-3 sm:flex-row">
								<input
									value={assistantQuery}
									onChange={(e) => setAssistantQuery(e.target.value)}
									placeholder={`e.g. ${selectedPersonaData.query}`}
									className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
								/>
								<Link
									href={`/assistant${assistantQuery.trim() ? `?q=${encodeURIComponent(assistantQuery.trim())}` : ''}`}
									className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-180 hover:-translate-y-0.5 hover:bg-blue-700"
								>
									Start AI Learning Plan
								</Link>
							</div>
							<div className="mt-3 flex flex-wrap gap-2">
								{PERSONAS.slice(0, 3).map((persona) => (
									<button
										key={persona.id}
										onClick={() => setAssistantQuery(persona.query)}
										style={!prefersReducedMotion ? { transition: `transform ${MOTION_TIMING.fast}s ease` } : undefined}
										className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-blue-400"
									>
										{persona.query}
									</button>
								))}
							</div>
						</div>

						<div className="mt-4 flex flex-wrap items-center gap-3">
							<Link
								href="/posts"
								className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-blue-400"
							>
								Browse Learning Paths
							</Link>
							{isVisualizationLabEnabled ? (
								<Link
									href="/visualizations"
									className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
								>
									Open Visualization Lab
								</Link>
							) : null}
						</div>
					</div>

					<div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-teal-50 p-5 dark:border-neutral-700 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30">
						<p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
							Technical Depth Visualized
						</p>
						<div className="grid grid-cols-3 gap-3">
							{topicClusters.slice(0, 6).map((cluster) => (
								<Link key={cluster.slug} href={`/tag/${cluster.slug}`} className="block">
									<motion.div
										animate={prefersReducedMotion ? undefined : { y: [0, -4, 0] }}
										transition={{ duration: 3 + (cluster.postCount % 3), repeat: Infinity, repeatType: 'mirror' }}
										className="rounded-xl border border-neutral-200 bg-white/80 p-3 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/70 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
									>
										<p className="line-clamp-1 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
											{cluster.label}
										</p>
										<p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
											{cluster.postCount} lessons
										</p>
									</motion.div>
								</Link>
							))}
						</div>
					</div>
				</div>
			</motion.section>

			{/* 2. Personalized learning entry points */}
			<SectionShell>
				<SectionHeading
					kicker="Personalized learning entry points"
					title="Choose your engineering track"
					description="Pick a role-based trajectory and we’ll tailor recommendations, sequence, and learning pace."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
					{PERSONAS.map((persona) => {
						const active = selectedPersona === persona.id;
						return (
							<motion.button
								key={persona.id}
								onClick={() => {
									setSelectedPersona(persona.id);
									setAssistantQuery(persona.query);
									if (typeof window !== 'undefined') {
										localStorage.setItem('aa:selected-persona', persona.id);
									}
								}}
								whileHover={prefersReducedMotion ? undefined : { y: -4 }}
								whileTap={getTapScale(prefersReducedMotion)}
								className={`rounded-2xl border p-4 text-left transition-colors ${
									active
										? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
										: 'border-neutral-200 bg-white hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500'
								}`}
							>
								<div className="mb-2 text-xl">{persona.icon}</div>
								<p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{persona.label}</p>
								<p className="mt-1 line-clamp-3 text-xs text-neutral-500 dark:text-neutral-400">
									{persona.description}
								</p>
								<p className="mt-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
									{persona.duration}
								</p>
							</motion.button>
						);
					})}
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						Selected track:
						<span className="ml-1 font-semibold text-neutral-800 dark:text-neutral-100">
							{selectedPersonaData.label}
						</span>
					</p>
					<Link
						href={`/assistant?q=${encodeURIComponent(selectedPersonaData.query)}`}
						className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
					>
						Start this track
					</Link>
				</div>
			</SectionShell>

			{/* 3. Continue learning section */}
			<SectionShell>
				<SectionHeading
					kicker="Continue learning"
					title="Resume your progression"
					description="Pick up exactly where you left off with your active learning path and next recommended lesson."
				/>
				<div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
					{savedPath ? (
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div>
								<p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{savedPath.headline}</p>
								<p className="text-xs text-neutral-500 dark:text-neutral-400">
									{savedPath.readSlugs.length} completed • {savedPath.totalPosts} total lessons
								</p>
							</div>
							<Link
								href={savedPath.readSlugs.length ? `/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}` : '/posts'}
								className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
							>
								Resume Learning
							</Link>
						</div>
					) : (
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<p className="text-sm text-neutral-500 dark:text-neutral-400">
								{user
									? 'You are logged in — choose a persona to generate your personalized path.'
									: 'Sign in and start a path to unlock personalized progression and checkpoints.'}
							</p>
							<Link
								href={`/assistant?q=${encodeURIComponent(selectedPersonaData.query)}`}
								className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-blue-400"
							>
								Generate My Path
							</Link>
						</div>
					)}
				</div>
			</SectionShell>

			{/* 4. Trending deep dives */}
			<SectionShell>
				<SectionHeading
					kicker="Trending deep dives"
					title="High-signal technical reads"
					description="A curated feed of the most relevant and widely-read deep technical articles."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{trendingPosts.map((post) => {
						const coverImageUrl = resolveCoverImage(post);
						return (
							<Link
								key={post.id}
								href={`/${post.slug}`}
								className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500"
							>
								{coverImageUrl ? (
									<img
										src={coverImageUrl}
										alt={post.title}
										className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								) : (
									<div className="h-44 w-full bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30" />
								)}
								<div className="p-4">
									<p className="line-clamp-2 text-base font-bold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-50 dark:group-hover:text-blue-400">
										{post.title}
									</p>
									<p className="mt-2 line-clamp-3 text-sm text-neutral-500 dark:text-neutral-400">
										{post.brief}
									</p>
									<p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
										{post.readTimeInMinutes} min read • {post.views} views
									</p>
								</div>
							</Link>
						);
					})}
				</div>
			</SectionShell>

			{/* 5. Interactive roadmap preview */}
			<SectionShell>
				<SectionHeading
					kicker="Interactive roadmap preview"
					title="Preview your milestone sequence"
					description="Understand progression before you commit. Start at the right level and advance module by module."
				/>
				<div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-5">
						{roadmapPosts.map((post, index) => (
							<motion.div
								key={post.id}
								whileHover={getHoverLift(prefersReducedMotion)}
								className="relative rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-950"
							>
								{resolveCoverImage(post) ? (
									<img
										src={resolveCoverImage(post)!}
										alt={post.title}
										className="mb-2 h-24 w-full rounded-lg object-cover"
									/>
								) : (
									<div className="mb-2 h-24 w-full rounded-lg bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30" />
								)}
								<span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
									{index + 1}
								</span>
								<p className="line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{post.title}</p>
								<p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
									{post.readTimeInMinutes} min
								</p>
								{index < roadmapPosts.length - 1 && (
									<div className="absolute right-[-12px] top-1/2 hidden h-[2px] w-5 -translate-y-1/2 bg-blue-300 md:block dark:bg-blue-700" />
								)}
							</motion.div>
						))}
					</div>
					<div className="mt-4">
						<Link
							href={featuredSeries[0] ? `/series/${featuredSeries[0].seriesSlug}` : '/posts'}
							className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
						>
							Open Full Roadmap
						</Link>
					</div>
				</div>
			</SectionShell>

			{/* 6. Featured visual explainers */}
			<SectionShell>
				<SectionHeading
					kicker="Featured visual explainers"
					title="Concepts explained visually"
					description="Architecture maps, causal flows, and systems diagrams for faster conceptual understanding."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{visualExplainers.map((post) => {
						const coverImageUrl = resolveCoverImage(post);
						return (
							<Link
								key={post.id}
								href={`/${post.slug}`}
								className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500"
							>
								{coverImageUrl ? (
									<img
										src={coverImageUrl}
										alt={post.title}
										className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								) : (
									<div className="aspect-[16/9] bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-teal-950/40" />
								)}
								<div className="p-4">
									<p className="line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-50 dark:group-hover:text-blue-400">
										{post.title}
									</p>
								</div>
							</Link>
						);
					})}
				</div>
			</SectionShell>

			{/* 7. Architecture simulation showcase */}
			<SectionShell>
				<SectionHeading
					kicker="Architecture simulation showcase"
					title="Interactive systems intuition"
					description="Explore architecture behavior through simulation-style modules and scenario drills."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{[
						{ title: 'Load Balancer Behavior', desc: 'Observe request distribution and hotspot mitigation.' },
						{ title: 'Replication & Failover', desc: 'Step through primary failure and recovery paths.' },
						{ title: 'Queue Backpressure', desc: 'See throughput collapse and recovery under burst load.' },
					].map((simulation) => (
						<motion.div
							key={simulation.title}
							whileHover={getHoverLift(prefersReducedMotion)}
							className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
						>
							<p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{simulation.title}</p>
							<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{simulation.desc}</p>
							<div className="mt-3 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
								<motion.div
									animate={prefersReducedMotion ? undefined : { width: ['35%', '72%', '52%'] }}
									transition={{ duration: 5, repeat: Infinity, repeatType: 'mirror' }}
									className="h-2 rounded-full bg-blue-500"
								/>
							</div>
						</motion.div>
					))}
				</div>
			</SectionShell>

			{/* 8. Knowledge graph explorer */}
			<SectionShell>
				<SectionHeading
					kicker="Knowledge graph explorer"
					title="Navigate concepts as connected systems"
					description="Trace prerequisites and adjacent concepts to learn in the right sequence."
				/>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900 lg:col-span-2">
						<div className="flex flex-wrap gap-2">
							{knowledgeGraphNodes.map((node) => (
								<button
									key={node.id}
									onClick={() => setActiveGraphNode(node.id)}
									className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
										activeGraphNode === node.id
											? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
											: 'border-neutral-200 text-neutral-600 hover:border-blue-300 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-300 dark:hover:text-blue-400'
									}`}
								>
									{node.label} ({node.weight})
								</button>
							))}
						</div>
					</div>
					<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
						<p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Selected concept</p>
						<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
							{activeCluster?.label ?? 'Select a concept'}
						</p>
						<p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
							{activeTopicSummary}
						</p>
						<div className="mt-3 space-y-2">
							<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
								Suggested to learn next
							</p>
							{(activeCluster?.posts ?? []).slice(0, 3).map((post) => (
								<Link
									key={post.id}
									href={`/${post.slug}`}
									className="block rounded-lg border border-neutral-200 p-2 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
								>
									<p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-1">
										{post.title}
									</p>
									<p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
										{post.readTimeInMinutes} min read
									</p>
								</Link>
							))}
						</div>
						<div className="mt-3">
							<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
								Search prompt
							</p>
							<input
								value={topicPrompt}
								onChange={(e) => setTopicPrompt(e.target.value)}
								className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2.5 py-2 text-xs text-neutral-700 dark:text-neutral-200"
							/>
							<div className="mt-2 flex flex-wrap gap-2">
								<Link
									href={`/assistant?q=${encodeURIComponent(topicPrompt.trim() || `How should I learn ${activeCluster?.label ?? 'this topic'}?`)}`}
									className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
								>
									Ask AI Assistant
								</Link>
								<Link
									href={activeGraphNode ? `/tag/${activeGraphNode}` : '/posts'}
									className="inline-flex rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-blue-400"
								>
									Browse Topic
								</Link>
							</div>
						</div>
					</div>
				</div>
			</SectionShell>

			{/* 9. Progression teaser */}
			<SectionShell>
				<SectionHeading
					kicker="Your learning hub"
					title="Track progression in one dedicated workspace"
					description="Use Progress Tracker for completion history, mastery progression, and personalized study continuity."
				/>
				<div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
					<p className="text-sm text-neutral-600 dark:text-neutral-300">
						{user
							? 'Open your Progress Tracker to continue your path, review completions, and manage your personalized learning journey.'
							: 'Progress Tracker is available after login so your milestones, streaks, and completion history stay synced.'}
					</p>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							href="/progress"
							className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
						>
							Open Progress Tracker
						</Link>
						{savedPath?.readSlugs?.length ? (
							<Link
								href={`/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}`}
								className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-blue-400"
							>
								Continue Last Lesson
							</Link>
						) : null}
					</div>
				</div>
			</SectionShell>

			{/* 10. Community discussions */}
			<SectionShell>
				<SectionHeading
					kicker="Community discussions"
					title="Most discussed articles"
					description="Join high-signal engineering conversations and unresolved technical debates."
				/>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{communityPosts.map((post) => {
						const coverImageUrl = resolveCoverImage(post);
						return (
							<Link
								key={post.id}
								href={`/${post.slug}`}
								className="group rounded-2xl border border-neutral-200 bg-white p-4 transition-all hover:-translate-y-1 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-blue-500"
							>
								<div className="flex items-start gap-3">
									{coverImageUrl ? (
										<img
											src={coverImageUrl}
											alt={post.title}
											className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
										/>
									) : (
										<div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40" />
									)}
									<div>
										<p className="line-clamp-2 text-sm font-bold text-neutral-900 transition-colors group-hover:text-blue-600 dark:text-neutral-50 dark:group-hover:text-blue-400">
											{post.title}
										</p>
										<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
											{post.views ?? 0} views
										</p>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			</SectionShell>

		</div>
	);
};
