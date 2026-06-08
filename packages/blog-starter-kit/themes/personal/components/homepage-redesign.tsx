'use client';

import { resizeImage } from '@starter-kit/utils/image';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import type { PostFragment, PublicationFragment } from '../generated/graphql';
import type { LearnPost } from './learn-today';
import { loadLearningPath } from './learn-today';
import { useLearningContext } from './learning-context-provider';
import { MOTION_EASE, MOTION_TIMING } from './motion-system';
import type { TopicCluster } from './topic-clusters';

type Props = {
	publication: PublicationFragment;
	allPosts: LearnPost[];
	popularPosts: LearnPost[];
	initialPosts: PostFragment[];
	topicClusters: TopicCluster[];
};

type IconName =
	| 'server'
	| 'architecture'
	| 'cube'
	| 'code'
	| 'brain'
	| 'book'
	| 'users'
	| 'briefcase'
	| 'database'
	| 'diagram'
	| 'mail'
	| 'arrow';

const AI_PLACEHOLDERS = [
	'Search system design, DSA, LLD...',
	'Try "rate limiter design"',
	'Try "graph algorithms"',
	'Try "Kafka consumer groups"',
];

const TOPIC_CARDS = [
	{
		title: 'System Design',
		href: '/topic/system-design',
		icon: 'server',
		items: ['High Level Design', 'Scalability', 'Databases', 'Caching', 'Message Queues'],
	},
	{
		title: 'Software Architecture',
		href: '/topic/architecture',
		icon: 'architecture',
		items: ['Design Patterns', 'Microservices', 'Event Driven', 'Distributed Systems', 'Cloud Architecture'],
	},
	{
		title: 'Low Level Design',
		href: '/topic/low-level-design',
		icon: 'cube',
		items: ['OOP and SOLID', 'UML Diagrams', 'Design Principles', 'Object Design', 'LLD Problems'],
	},
	{
		title: 'Data Structures and Algorithms',
		href: '/topic/data-structures',
		icon: 'code',
		items: ['Arrays and Strings', 'Trees and Graphs', 'Dynamic Programming', 'Greedy', 'Advanced Topics'],
	},
	{
		title: 'AI Engineering',
		href: '/topic/ai-systems',
		icon: 'brain',
		items: ['LLMs and RAG', 'Prompt Engineering', 'Vector Databases', 'AI System Design', 'Agents'],
	},
] as const;

const sectionTransition = {
	duration: MOTION_TIMING.slow,
	ease: MOTION_EASE.emphasized,
} as const;

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
	return resizeImage(withProtocol, { w: 640, h: 420, c: 'thumb' });
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) => {
	const common = {
		className,
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		viewBox: '0 0 24 24',
		'aria-hidden': true,
	};

	if (name === 'server') {
		return (
			<svg {...common}>
				<rect x="4" y="4" width="16" height="5" rx="1.5" />
				<rect x="4" y="15" width="16" height="5" rx="1.5" />
				<path d="M7 9v6M17 9v6M8 6.5h.01M8 17.5h.01" />
			</svg>
		);
	}
	if (name === 'architecture') {
		return (
			<svg {...common}>
				<path d="M12 4v5M6 20v-5h12v5M6 15l6-6 6 6" />
				<rect x="9" y="3" width="6" height="4" rx="1" />
				<rect x="3" y="17" width="6" height="4" rx="1" />
				<rect x="15" y="17" width="6" height="4" rx="1" />
			</svg>
		);
	}
	if (name === 'cube') {
		return (
			<svg {...common}>
				<path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z" />
				<path d="M4.7 7.4 12 11.5l7.3-4.1M12 21v-9.5" />
			</svg>
		);
	}
	if (name === 'code') {
		return (
			<svg {...common}>
				<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
			</svg>
		);
	}
	if (name === 'brain') {
		return (
			<svg {...common}>
				<path d="M9 5a3 3 0 0 0-4 2.8A3.5 3.5 0 0 0 4 14a3 3 0 0 0 3 4h2V5ZM15 5a3 3 0 0 1 4 2.8A3.5 3.5 0 0 1 20 14a3 3 0 0 1-3 4h-2V5Z" />
				<path d="M9 9H7M15 9h2M9 14H6M15 14h3M12 5v14" />
			</svg>
		);
	}
	if (name === 'book') {
		return (
			<svg {...common}>
				<path d="M5 4h5a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H5V4ZM19 4h-5a4 4 0 0 0-4 4" />
			</svg>
		);
	}
	if (name === 'users') {
		return (
			<svg {...common}>
				<path d="M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 20v-2a3 3 0 0 0-2-2.8M4 20v-2a3 3 0 0 1 2-2.8" />
			</svg>
		);
	}
	if (name === 'briefcase') {
		return (
			<svg {...common}>
				<rect x="3" y="7" width="18" height="13" rx="2" />
				<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
			</svg>
		);
	}
	if (name === 'database') {
		return (
			<svg {...common}>
				<ellipse cx="12" cy="5" rx="7" ry="3" />
				<path d="M5 5v14c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
			</svg>
		);
	}
	if (name === 'diagram') {
		return (
			<svg {...common}>
				<rect x="4" y="4" width="6" height="5" rx="1" />
				<rect x="14" y="4" width="6" height="5" rx="1" />
				<rect x="9" y="15" width="6" height="5" rx="1" />
				<path d="M10 6.5h4M7 9v3.5h5V15M17 9v3.5h-5" />
			</svg>
		);
	}
	if (name === 'mail') {
		return (
			<svg {...common}>
				<rect x="3" y="5" width="18" height="14" rx="2" />
				<path d="m3 7 9 6 9-6" />
			</svg>
		);
	}
	return (
		<svg {...common}>
			<path d="M5 12h14M13 6l6 6-6 6" />
		</svg>
	);
};

const AALogo = () => (
	<div className="flex items-center gap-3">
		<span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-500/30">
			A
		</span>
		<div className="leading-none">
			<p className="text-sm font-black uppercase tracking-[0.08em] text-slate-950">Abstract</p>
			<p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Algorithms</p>
		</div>
	</div>
);

const HeroVisual = () => (
	<div className="relative mx-auto h-[360px] max-w-[620px] md:h-[430px]">
		<div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(37,99,235,0.10)_1px,transparent_1px),linear-gradient(rgba(37,99,235,0.08)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
		<div className="absolute left-1/2 top-1/2 h-48 w-64 -translate-x-1/2 -translate-y-1/2">
			{[2, 1, 0].map((layer) => (
				<div
					key={layer}
					className="absolute left-1/2 h-24 w-64 -translate-x-1/2 rounded-[28px] border border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-[0_24px_70px_rgba(37,99,235,0.16)]"
					style={{ top: `${layer * 42}px`, transform: 'translateX(-50%) skewY(-10deg)' }}
				/>
			))}
			<div className="absolute left-1/2 top-2 flex h-32 w-32 -translate-x-1/2 -translate-y-16 items-center justify-center rounded-[34px] border border-cyan-300/45 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-7xl font-black text-white shadow-[0_0_70px_rgba(56,189,248,0.55)]">
				A
			</div>
		</div>
		{[
			{ title: 'Learn', subtitle: 'Deep articles and visual explanations', icon: 'book' as IconName, cls: 'left-0 top-8 md:left-8 md:top-10' },
			{ title: 'Series', subtitle: 'Structured paths through complex topics', icon: 'diagram' as IconName, cls: 'right-0 top-10 md:right-8 md:top-12' },
			{ title: 'Blog', subtitle: 'Engineering articles and deep dives', icon: 'code' as IconName, cls: 'bottom-5 left-1/2 -translate-x-1/2' },
		].map((node) => (
			<Link
				key={node.title}
				href={node.title === 'Series' ? '/series' : node.title === 'Blog' ? '/posts' : '/learn'}
				className={`absolute ${node.cls} w-[155px] rounded-3xl border border-blue-100 bg-white/92 p-4 text-center text-slate-950 shadow-xl shadow-blue-200/50 backdrop-blur transition hover:-translate-y-1 hover:border-blue-300`}
			>
				<span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
					<Icon name={node.icon} />
				</span>
				<p className="mt-2 text-sm font-black uppercase">{node.title}</p>
				<p className="mt-1 text-[11px] leading-4 text-slate-600">{node.subtitle}</p>
			</Link>
		))}
		<svg className="absolute inset-0 h-full w-full text-blue-500/45" fill="none" viewBox="0 0 620 430" aria-hidden="true">
			<path d="M165 120 C230 125 245 190 305 190 M455 122 C390 130 374 190 315 190 M310 270 C310 305 310 315 310 350" stroke="currentColor" strokeWidth="2" strokeDasharray="8 10" />
		</svg>
	</div>
);

const SectionHeader = ({
	title,
	action,
}: {
	title: string;
	action?: React.ReactNode;
}) => (
	<div className="mb-5 flex items-center justify-between gap-4">
		<h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
		{action ? <div className="shrink-0">{action}</div> : null}
	</div>
);

const ArrowLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
	<Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
		{children}
		<Icon name="arrow" className="h-4 w-4" />
	</Link>
);

export const HomepageRedesign = ({
	popularPosts,
	initialPosts,
	topicClusters,
	allPosts,
}: Props) => {
	const router = useRouter();
	const reduceMotion = useReducedMotion();
	const [savedPath, setSavedPath] = useState<ReturnType<typeof loadLearningPath>>(null);
	const [searchText, setSearchText] = useState('');
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const { setContext } = useLearningContext();

	useEffect(() => {
		setSavedPath(loadLearningPath());
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

	const latestPosts = allPosts.length > 0 ? allPosts.slice(0, 5) : popularPosts.slice(0, 5);
	const totalPosts = Math.max(allPosts.length, initialPosts.length);
	const totalViews = allPosts.reduce((sum, post) => sum + (post.views ?? 0), 0);
	const actualTopicCount = new Set(
		allPosts.flatMap((post) => (post.tags ?? []).map((tag) => tag.slug || tag.name).filter(Boolean)),
	).size;
	const actualSeriesCount = new Set(
		allPosts.map((post) => post.series?.slug || post.series?.name).filter(Boolean),
	).size;
	const seriesRoadmaps = useMemo(() => {
		const groups = new Map<
			string,
			{
				name: string;
				slug: string;
				postCount: number;
				totalViews: number;
				latestPublishedAt: string;
			}
		>();

		for (const post of allPosts) {
			if (!post.series?.slug || !post.series.name) continue;
			const existing = groups.get(post.series.slug);
			const publishedAt = post.publishedAt ?? '';
			if (existing) {
				existing.postCount += 1;
				existing.totalViews += post.views ?? 0;
				if (publishedAt > existing.latestPublishedAt) existing.latestPublishedAt = publishedAt;
			} else {
				groups.set(post.series.slug, {
					name: post.series.name,
					slug: post.series.slug,
					postCount: 1,
					totalViews: post.views ?? 0,
					latestPublishedAt: publishedAt,
				});
			}
		}

		return Array.from(groups.values())
			.sort((a, b) => b.totalViews - a.totalViews || b.postCount - a.postCount || b.latestPublishedAt.localeCompare(a.latestPublishedAt))
			.slice(0, 3);
	}, [allPosts]);
	const strongestSeriesSignal = Math.max(
		...seriesRoadmaps.map((series) => (series.totalViews > 0 ? series.totalViews : series.postCount)),
		1,
	);
	const homepageStats = [
		{ value: String(totalPosts), label: totalPosts === 1 ? 'Article' : 'Articles', icon: 'book' as IconName },
		actualTopicCount > 0
			? { value: String(actualTopicCount), label: actualTopicCount === 1 ? 'Topic' : 'Topics', icon: 'cube' as IconName }
			: null,
		actualSeriesCount > 0
			? { value: String(actualSeriesCount), label: actualSeriesCount === 1 ? 'Series' : 'Series', icon: 'architecture' as IconName }
			: null,
		totalViews > 0
			? { value: totalViews.toLocaleString(), label: totalViews === 1 ? 'Views' : 'Views', icon: 'users' as IconName }
			: null,
	].filter((stat): stat is { value: string; label: string; icon: IconName } => Boolean(stat));

	useEffect(() => {
		setContext({
			source: 'homepage',
			pathname: '/',
			title: 'Abstract Algorithms',
			domain: 'Software Engineering',
			topic: topicClusters[0]?.label ?? 'System Design',
			subtopic: savedPath?.headline ?? 'Engineering learning paths',
			concept: 'System design, DSA, LLD, HLD',
			roadmapNode: savedPath?.headline ?? 'Learning roadmap',
			roadmapHref: '/learn',
			simulationTopic: 'Software engineering concepts',
		});
	}, [savedPath, setContext, topicClusters]);

	const motionConfig = reduceMotion
		? { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 } }
		: { initial: { opacity: 0, y: 10 }, whileInView: { opacity: 1, y: 0 } };

	const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = searchText.trim();
		router.push(trimmed ? `/learn?q=${encodeURIComponent(trimmed)}` : '/learn');
	};

	return (
		<div className="min-h-screen bg-white pb-20 text-slate-950 md:pb-0">
			<section className="relative overflow-hidden bg-white text-slate-950">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_28%,rgba(37,99,235,0.10),transparent_34%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.84))]" />
				<div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 pb-8 pt-10 md:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] md:px-8 md:pb-10 md:pt-16">
					<motion.div {...motionConfig} viewport={{ once: true, margin: '-80px' }} transition={sectionTransition} className="flex flex-col justify-center">
						<div className="mb-7 md:hidden">
							<AALogo />
						</div>
						<p className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
							Your all-in-one platform to
						</p>
						<h1 className="mt-3 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
							<span className="text-blue-600">Learn Software</span>
							<br />
							Engineering
						</h1>
						<p className="mt-5 max-w-xl text-base leading-8 text-slate-700 md:text-lg">
							In-depth articles, visual guides and learning paths to master software engineering.
						</p>
						<div className="mt-7 flex flex-wrap gap-3">
							<Link href="/learn" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/25 transition hover:bg-blue-500">
								Start Learning <Icon name="arrow" className="h-4 w-4" />
							</Link>
							<Link href="/series" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-blue-300 hover:text-blue-700">
								<Icon name="diagram" className="h-4 w-4" /> Browse Series
							</Link>
						</div>
						<div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 text-sm sm:grid-cols-4">
							{homepageStats.map(({ value, label, icon }) => (
								<div key={label} className="flex items-start gap-2">
									<Icon name={icon} className="mt-1 h-5 w-5 text-blue-600" />
									<div>
										<p className="text-xl font-black">{value}</p>
										<p className="text-xs text-slate-600">{label}</p>
									</div>
								</div>
							))}
						</div>
					</motion.div>
					<motion.div {...motionConfig} viewport={{ once: true, margin: '-80px' }} transition={{ ...sectionTransition, delay: 0.08 }}>
						<HeroVisual />
					</motion.div>
				</div>
			</section>

			<div className="mx-auto max-w-[1440px] px-5 py-8 md:px-8">
				<section className="px-0">
					<SectionHeader title="Explore by topic" action={<ArrowLink href="/learn">View all topics</ArrowLink>} />
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
						{TOPIC_CARDS.map((topic) => (
							<Link key={topic.title} href={topic.href} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
								<span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
									<Icon name={topic.icon} />
								</span>
								<h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">{topic.title}</h3>
								<ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-neutral-300">
									{topic.items.map((item) => (
										<li key={item} className="flex gap-2">
											<span className="mt-2 h-1 w-1 rounded-full bg-slate-500" />
											<span>{item}</span>
										</li>
									))}
								</ul>
								<span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:text-blue-800 dark:text-blue-300">
									Explore <Icon name="arrow" className="h-4 w-4" />
								</span>
							</Link>
						))}
					</div>
				</section>

				<section className="mt-8">
					<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
						<SectionHeader title="Popular Series Roadmaps" action={<ArrowLink href="/series">View all</ArrowLink>} />
						<div className="space-y-5">
							{seriesRoadmaps.length > 0 ? (
								seriesRoadmaps.map((series) => {
									const signal = series.totalViews > 0 ? series.totalViews : series.postCount;
									const width = Math.max(12, Math.round((signal / strongestSeriesSignal) * 100));

									return (
										<div key={series.slug} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
											<span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
												<Icon name="book" />
											</span>
											<div className="min-w-0">
												<p className="truncate text-sm font-black text-slate-950 dark:text-white">{series.name}</p>
												<div className="mt-2 flex items-center gap-3">
													<div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800">
														<div className="h-full rounded-full bg-blue-600" style={{ width: `${width}%` }} />
													</div>
													<span className="whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-neutral-300">
														{series.postCount} article{series.postCount === 1 ? '' : 's'}
													</span>
												</div>
											</div>
											<Link href={`/series/${series.slug}`} className="rounded-lg border border-blue-100 bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700 dark:border-blue-900">
												Open
											</Link>
										</div>
									);
								})
							) : (
								<div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
									No published series found yet. Add posts to a Hashnode series and they will appear here automatically.
								</div>
							)}
						</div>
					</div>
				</section>

				<section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
					<div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
						<SectionHeader title="Latest from the blog" action={<ArrowLink href="/posts">View all</ArrowLink>} />
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
							{latestPosts.map((post) => {
								const cover = resolveCoverImage(post);
								const tag = post.tags?.[0]?.name ?? 'Engineering';
								return (
									<Link key={post.slug} href={`/${post.slug}`} className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 dark:border-neutral-800 dark:bg-neutral-950">
										<span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">{tag}</span>
										<p className="mt-3 line-clamp-3 min-h-[3.75rem] text-sm font-black leading-5 text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
											{post.title}
										</p>
										<p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">{post.readTimeInMinutes} min read</p>
										{cover ? (
											<Image src={cover} alt="" width={320} height={180} className="mt-3 aspect-[16/10] w-full rounded-lg object-cover" />
										) : (
											<div className="mt-3 flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/40">
												<Icon name={post.title.toLowerCase().includes('database') ? 'database' : 'diagram'} className="h-10 w-10" />
											</div>
										)}
									</Link>
								);
							})}
						</div>
					</div>

					<form onSubmit={submitSearch} className="rounded-lg border border-blue-100 bg-blue-50/70 p-6 text-slate-950 shadow-sm">
						<span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
							<Icon name="mail" className="h-7 w-7" />
						</span>
						<h2 className="mt-6 text-2xl font-black">Stay in the loop</h2>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							Get the best architecture breakdowns, system design insights and interview tips delivered to your inbox.
						</p>
						<div className="mt-6 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1">
							<input
								value={searchText}
								onChange={(event) => setSearchText(event.target.value)}
								placeholder="Enter your email"
								className="min-w-0 rounded-lg border border-blue-100 bg-white px-3 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400"
							/>
							<button type="submit" className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
								Subscribe
							</button>
						</div>
					</form>
				</section>

			</div>

			<nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95">
				<div className="grid grid-cols-3 gap-1 text-center text-[11px]">
					<Link href="/" className="rounded-lg bg-blue-50 py-1.5 font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Home</Link>
					<Link href="/learn" className="rounded-lg py-1.5 text-slate-700 dark:text-neutral-300">Learn</Link>
					<Link href="/posts" className="rounded-lg py-1.5 text-slate-700 dark:text-neutral-300">Blog</Link>
				</div>
			</nav>
		</div>
	);
};
