'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import type { PostFragment } from '../generated/graphql';
import { ProgressBadge } from './progress-badge';

// ─── Inline types (mirrors pages/api/learning-path.ts without server imports) ─

type PhaseColor = 'emerald' | 'blue' | 'purple' | 'rose';

type AiPost = {
	id: string;
	title: string;
	slug: string;
	brief: string;
	readTimeInMinutes: number;
	complexity?: string;
};

type AiPhase = {
	number: number;
	label: string;
	emoji: string;
	description: string;
	color: PhaseColor;
	posts: AiPost[];
	totalMinutes: number;
};

type AiLearningPath = {
	headline: string;
	summary: string;
	totalPosts: number;
	totalMinutes: number;
	phases: AiPhase[];
	aiPowered: boolean;
};

// ─── Color tokens ─────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<PhaseColor, { border: string; bg: string; badge: string; dot: string; title: string; step: string }> = {
	emerald: {
		border: 'border-emerald-200 dark:border-emerald-800',
		bg: 'bg-emerald-50 dark:bg-emerald-950/30',
		badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
		dot: 'bg-emerald-500',
		title: 'text-emerald-700 dark:text-emerald-300',
		step: 'bg-emerald-600',
	},
	blue: {
		border: 'border-blue-200 dark:border-blue-800',
		bg: 'bg-blue-50 dark:bg-blue-950/30',
		badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
		dot: 'bg-blue-500',
		title: 'text-blue-700 dark:text-blue-300',
		step: 'bg-blue-600',
	},
	purple: {
		border: 'border-purple-200 dark:border-purple-800',
		bg: 'bg-purple-50 dark:bg-purple-950/30',
		badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
		dot: 'bg-purple-500',
		title: 'text-purple-700 dark:text-purple-300',
		step: 'bg-purple-600',
	},
	rose: {
		border: 'border-rose-200 dark:border-rose-800',
		bg: 'bg-rose-50 dark:bg-rose-950/30',
		badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
		dot: 'bg-rose-500',
		title: 'text-rose-700 dark:text-rose-300',
		step: 'bg-rose-600',
	},
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
	seriesName: string;
	posts: PostFragment[];
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SeriesAiLearningPath = ({ seriesName, posts }: Props) => {
	const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
	const [path, setPath] = useState<AiLearningPath | null>(null);
	const fetched = useRef(false);

	// Keep a slug lookup so we can link phase posts back to real URLs
	const slugMap = new Map(posts.map((p) => [p.id, p.slug]));

	const generate = async () => {
		setState('loading');
		try {
			const learnPosts = posts.map((p) => ({
				id: p.id,
				title: p.title,
				slug: p.slug,
				brief: p.brief ?? '',
				readTimeInMinutes: p.readTimeInMinutes ?? 5,
				views: (p as any).views ?? 0,
				tags: (p.tags ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
				series: p.series ? { name: p.series.name, slug: p.series.slug } : null,
				publishedAt: p.publishedAt,
			}));

			const res = await fetch('/api/learning-path', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: seriesName, posts: learnPosts }),
			});

			if (!res.ok) throw new Error(`API ${res.status}`);
			const data: AiLearningPath = await res.json();

			if (!data.phases || data.phases.length === 0) throw new Error('No phases returned');
			setPath(data);
			setState('ready');
		} catch {
			setState('error');
		}
	};

	// Auto-generate on mount
	useEffect(() => {
		if (fetched.current) return;
		fetched.current = true;
		generate();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="mb-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
			{/* ── Header ── */}
			<div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
				<div className="flex items-center gap-3">
					<span className="text-[10px] font-mono uppercase tracking-widest text-purple-500 dark:text-purple-400">
						AI Guided Topic
					</span>
					<span className="text-sm font-bold text-neutral-900 dark:text-neutral-50 hidden sm:block">
						{path ? path.headline : `Personalized roadmap for ${seriesName}`}
					</span>
				</div>

				<div className="flex items-center gap-2 flex-shrink-0">
					{state === 'loading' && (
						<span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
							<svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
							</svg>
							Generating…
						</span>
					)}
					{state === 'error' && (
						<button
							onClick={generate}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors"
						>
							Retry
						</button>
					)}
					{state === 'ready' && (
						<button
							onClick={generate}
							className="inline-flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
						>
							<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Regenerate
						</button>
					)}
				</div>
			</div>

			{/* ── Body ── */}
			{state === 'loading' && (
				<div className="p-6 space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="rounded-lg border border-neutral-100 dark:border-neutral-800 p-4 space-y-2 animate-pulse">
							<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
							<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
							<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
						</div>
					))}
				</div>
			)}

			{state === 'error' && (
				<div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
					<p className="text-sm text-neutral-500 dark:text-neutral-400">Could not generate the path. Please try again.</p>
				</div>
			)}

			{state === 'ready' && path && (
				<div className="p-6">
					{/* Summary row */}
					<div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b border-neutral-100 dark:border-neutral-800">
						<p className="text-sm text-neutral-600 dark:text-neutral-300 flex-1">{path.summary}</p>
						<div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
							<span>{path.totalPosts} posts</span>
							<span>·</span>
							<span>~{Math.round(path.totalMinutes / 60 * 10) / 10}h total</span>
							{path.aiPowered && (
								<>
									<span>·</span>
									<span className="inline-flex items-center gap-1 text-purple-500 dark:text-purple-400 font-medium">
										<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
										AI-ranked
									</span>
								</>
							)}
						</div>
					</div>

					{/* Phases */}
					<div className="flex flex-col gap-6">
						{path.phases.map((phase) => {
							const c = PHASE_COLORS[phase.color] ?? PHASE_COLORS.blue;
							return (
								<div key={phase.number} className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden`}>
									{/* Phase header */}
									<div className="px-5 py-3 flex items-start gap-3">
										<span className="text-xl leading-none mt-0.5">{phase.emoji}</span>
										<div>
											<div className="flex items-center gap-2 mb-0.5">
												<span className={`text-[10px] font-mono uppercase tracking-widest ${c.title}`}>
													Phase {phase.number}
												</span>
												<span className={`text-xs font-bold ${c.title}`}>{phase.label}</span>
												<span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${c.badge}`}>
													{phase.posts.length} posts · ~{phase.totalMinutes} min
												</span>
											</div>
											<p className="text-xs text-neutral-500 dark:text-neutral-400">{phase.description}</p>
										</div>
									</div>

									{/* Phase posts */}
									<div className="px-5 pb-4 flex flex-col gap-2">
										{phase.posts.map((ap, idx) => {
											const slug = slugMap.get(ap.id) ?? ap.slug;
											return (
												<Link
													key={ap.id}
													href={`/${slug}`}
													className="group flex items-start gap-3 p-3 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-white dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm transition-all"
												>
													<span className={`flex-shrink-0 w-6 h-6 rounded-full ${c.step} text-white text-[10px] font-bold flex items-center justify-center mt-0.5`}>
														{idx + 1}
													</span>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
															{ap.title}
														</p>
														{ap.brief && (
															<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
																{ap.brief}
															</p>
														)}
													</div>
													<div className="flex-shrink-0 flex flex-col items-end gap-1">
														{ap.complexity && (
															<span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${c.badge}`}>
																{ap.complexity}
															</span>
														)}
														<div className="flex items-center gap-2">
															<span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
																{ap.readTimeInMinutes} min
															</span>
															<ProgressBadge postId={slug} postTitle={ap.title} size="sm" />
														</div>
													</div>
												</Link>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
