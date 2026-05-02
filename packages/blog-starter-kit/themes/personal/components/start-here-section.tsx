import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PostFragment } from '../generated/graphql';

export type StartHereSeries = {
	seriesName: string;
	seriesSlug: string;
	posts: PostFragment[];
	totalPostCount: number;
};

type Props = {
	series: StartHereSeries[];
};

// ─── Inline AI types (no server import) ──────────────────────────────────────

type AiPost = {
	id: string;
	title: string;
	slug: string;
	brief: string;
	readTimeInMinutes: number;
	complexity?: string;
};

type AiPhase = {
	color: 'emerald' | 'blue' | 'purple' | 'rose';
	posts: AiPost[];
};

type AiPath = { phases: AiPhase[] };

// ─── Complexity badge derived from AI phase color ─────────────────────────────

const PHASE_BADGE: Record<string, { label: string; cls: string }> = {
	emerald: { label: 'Foundation', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
	blue:    { label: 'Core',       cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
	purple:  { label: 'Deep Dive',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
	rose:    { label: 'Advanced',   cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

// Fall back for posts not returned by AI
const fallbackBadge = (readTime: number, index: number) => {
	if (index === 0) return { label: 'Start Here', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
	if (readTime >= 25) return { label: 'Deep Dive', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
	if (readTime >= 10) return { label: 'Core Concept', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
	return { label: 'Quick Read', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
};

// ─── Hook: fetch AI-ordered posts for a series ────────────────────────────────

type RankedPost = PostFragment & { badgeLabel: string; badgeCls: string };

function useAiRankedPosts(seriesName: string, rawPosts: PostFragment[]) {
	const [ranked, setRanked] = useState<RankedPost[] | null>(null);
	const [aiPowered, setAiPowered] = useState(false);
	const fetched = useRef(false);

	useEffect(() => {
		if (fetched.current || rawPosts.length === 0) return;
		fetched.current = true;

		const learnPosts = rawPosts.map((p) => ({
			id: p.id,
			title: p.title,
			slug: p.slug,
			brief: p.brief ?? '',
			readTimeInMinutes: p.readTimeInMinutes ?? 5,
			views: (p as any).views ?? 0,
			publishedAt: p.publishedAt,
			tags: (p.tags ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
			series: p.series ? { name: p.series.name, slug: p.series.slug } : null,
		}));

		const postMap = new Map(rawPosts.map((p) => [p.id, p]));

		fetch('/api/learning-path', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query: seriesName, posts: learnPosts }),
		})
			.then((r) => r.ok ? r.json() : Promise.reject(r.status))
			.then((data: AiPath) => {
				if (!data.phases?.length) throw new Error('empty');

				// Flatten phases → ordered list, tag each post with phase badge
				const orderedIds = new Set<string>();
				const result: RankedPost[] = [];

				data.phases.forEach((phase) => {
					const badge = PHASE_BADGE[phase.color] ?? PHASE_BADGE.emerald;
					phase.posts.forEach((ap) => {
						if (orderedIds.has(ap.id)) return;
						orderedIds.add(ap.id);
						const original = postMap.get(ap.id);
						if (original) {
							result.push({ ...original, badgeLabel: badge.label, badgeCls: badge.cls });
						}
					});
				});

				// Append any posts not returned by AI (in original order)
				rawPosts.forEach((p) => {
					if (!orderedIds.has(p.id)) {
						result.push({ ...p, badgeLabel: 'Quick Read', badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' });
					}
				});

				setRanked(result);
				setAiPowered(true);
			})
			.catch(() => {
				// Fall back to original order with heuristic badges
				setRanked(
					rawPosts.map((p, i) => {
						const b = fallbackBadge(p.readTimeInMinutes ?? 5, i);
						return { ...p, badgeLabel: b.label, badgeCls: b.cls };
					}),
				);
			});
	}, [seriesName, rawPosts]);

	return { ranked, aiPowered };
}

// ─── ExpandedSeriesCard ───────────────────────────────────────────────────────

const ExpandedSeriesCard = ({ series }: { series: StartHereSeries }) => {
	const { ranked, aiPowered } = useAiRankedPosts(series.seriesName, series.posts);
	const displayPosts = (ranked ?? series.posts).slice(0, 5);
	const totalReadTime = displayPosts.reduce((sum, p) => sum + (p.readTimeInMinutes ?? 0), 0);
	const loading = ranked === null;
	const totalPostCount = series.totalPostCount;

	return (
		<div className="relative rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">
			<div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-100 dark:bg-emerald-900/20 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

			<div className="relative px-6 py-8 md:px-10 md:py-10">
				<div className="flex flex-col md:flex-row md:items-start gap-8">
					{/* Left: CTA copy */}
					<div className="md:w-56 flex-shrink-0">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wide mb-4">
							<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
							</svg>
							Start Here
						</div>
						<h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-3 leading-snug">
							New to {series.seriesName}?
						</h2>
						<p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
							Follow this curated path — each post builds on the previous, helping you master {series.seriesName} step by step.
						</p>

						{/* Reading time + AI badge */}
						<div className="flex flex-col gap-1.5 mb-5">
							<div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
								<svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								{totalPostCount} articles total &middot; ~{totalReadTime} min for top 5
							</div>
							{aiPowered && (
								<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
									<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									AI-curated top 5 from {totalPostCount} posts
								</span>
							)}
						</div>

						<Link
							href={`/series/${series.seriesSlug}`}
							className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
						>
							View full series
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</Link>
					</div>

					{/* Right: Roadmap list */}
					<ol className="flex-1 flex flex-col gap-0 relative">
						<div className="absolute left-[13px] top-7 bottom-7 w-px bg-gradient-to-b from-emerald-400 via-emerald-300 to-transparent dark:from-emerald-600 dark:via-emerald-700" />

						{loading
							? /* shimmer */ Array.from({ length: 5 }).map((_, i) => (
								<li key={i} className={i < 4 ? 'pb-2' : ''}>
									<div className="flex items-start gap-4 p-4 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 animate-pulse">
										<div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-200 dark:bg-emerald-800" />
										<div className="flex-1 space-y-2">
											<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
											<div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
										</div>
									</div>
								</li>
							))
							: displayPosts.map((post, index) => {
								const badgeLabel = (post as RankedPost).badgeLabel ?? fallbackBadge(post.readTimeInMinutes ?? 5, index).label;
								const badgeCls   = (post as RankedPost).badgeCls   ?? fallbackBadge(post.readTimeInMinutes ?? 5, index).cls;
								const isLast = index === displayPosts.length - 1;
								return (
									<li key={post.id} className={isLast ? '' : 'pb-2'}>
										<Link
											href={`/${post.slug}`}
											className="group relative flex items-start gap-4 p-4 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
										>
											<span className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
												{index + 1}
											</span>
											<div className="flex-1 min-w-0">
												<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
													{post.title}
												</h3>
												<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
													{post.subtitle || post.brief}
												</p>
											</div>
											<div className="flex-shrink-0 flex flex-col items-end gap-1 self-center">
												<span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap ${badgeCls}`}>
													{badgeLabel}
												</span>
												<span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
													{post.readTimeInMinutes} min
												</span>
											</div>
										</Link>
									</li>
								);
							})
						}
					</ol>
				</div>
			</div>
		</div>
	);
};

// ─── CompactSeriesCard ────────────────────────────────────────────────────────

const CompactSeriesCard = ({ series }: { series: StartHereSeries }) => {
	const [expanded, setExpanded] = useState(false);
	const { ranked, aiPowered } = useAiRankedPosts(series.seriesName, series.posts);
	const displayPosts = (ranked ?? series.posts).slice(0, 5);
	const totalReadTime = series.posts.reduce((sum, p) => sum + (p.readTimeInMinutes ?? 0), 0);
	const loading = ranked === null;
	const totalPostCount = series.totalPostCount;

	return (
		<div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">
			<div className="p-5">
				<div className="flex items-start justify-between gap-3 mb-0">
					<div className="flex-1 min-w-0">
						<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide mb-2">
							<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
							</svg>
							Series
						</span>
						<h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 leading-snug">
							{series.seriesName}
						</h3>
					</div>
					<Link
						href={`/series/${series.seriesSlug}`}
						className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
					>
						View all
						<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</Link>
				</div>

				{/* Toggle row */}
				<button
					onClick={() => setExpanded((e) => !e)}
					className="mt-3 w-full flex items-center justify-between gap-2 py-2 text-left group"
					aria-expanded={expanded}
				>
					<span className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
						<svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{totalPostCount} posts &middot; ~{totalReadTime} min (top 5)
						{aiPowered && (
							<span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-600 dark:text-purple-400 ml-1">
								<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								AI-curated
							</span>
						)}
					</span>
					<span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
						{expanded ? 'Hide posts' : 'Show posts'}
						<svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
						</svg>
					</span>
				</button>

				{expanded && (
					<ol className="flex flex-col gap-2 relative mt-2">
						<div className="absolute left-[10px] top-5 bottom-5 w-px bg-gradient-to-b from-emerald-400 to-transparent dark:from-emerald-600 opacity-60" />
						{loading
							? Array.from({ length: 5 }).map((_, i) => (
								<li key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 animate-pulse">
									<div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800" />
									<div className="flex-1 h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
								</li>
							))
							: displayPosts.map((post, index) => {
								const badgeLabel = (post as RankedPost).badgeLabel ?? fallbackBadge(post.readTimeInMinutes ?? 5, index).label;
								const badgeCls   = (post as RankedPost).badgeCls   ?? fallbackBadge(post.readTimeInMinutes ?? 5, index).cls;
								return (
									<li key={post.id}>
										<Link
											href={`/${post.slug}`}
											className="group flex items-center gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
										>
											<span className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
												{index + 1}
											</span>
											<span className="flex-1 min-w-0 text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
												{post.title}
											</span>
											<span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeCls}`}>
												{badgeLabel}
											</span>
										</Link>
									</li>
								);
							})
						}
					</ol>
				)}
			</div>
		</div>
	);
};

// ─── Section ──────────────────────────────────────────────────────────────────

export const StartHereSection = ({ series }: Props) => {
	const validSeries = series.filter((s) => s.posts.length > 0);
	if (validSeries.length === 0) return null;

	const [primary, ...rest] = validSeries;

	return (
		<section id="learning-paths" className="w-full pt-6 pb-12">
			{/* Section header */}
			<div className="flex flex-col gap-1 mb-6">
				<div className="flex items-center gap-3">
					<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
						Not sure where to begin?
					</p>
					<div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
				</div>
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					Follow these recommended series — each one takes you from zero to confident, step by step.
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<ExpandedSeriesCard series={primary} />
				{rest.length > 0 && (
					<div className={`grid gap-4 ${rest.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
						{rest.map((s) => (
							<CompactSeriesCard key={s.seriesSlug} series={s} />
						))}
					</div>
				)}
			</div>
		</section>
	);
};
