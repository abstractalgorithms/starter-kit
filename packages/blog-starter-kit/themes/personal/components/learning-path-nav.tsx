import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { LP_STORAGE_KEY, StoredLearningPath, clearLearningPath } from './learn-today';
import type { LearningPhase, LearnPost } from '../pages/api/learning-path';

type PostLocation = {
	phase: LearningPhase;
	phaseIndex: number;
	postIndex: number;
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
	totalInPhase: number;
};

const PHASE_COLORS: Record<LearningPhase['color'], { pill: string; activePill: string; text: string }> = {
	emerald: { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', activePill: 'bg-emerald-600 text-white', text: 'text-emerald-600 dark:text-emerald-400' },
	blue:    { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',           activePill: 'bg-blue-600 text-white',    text: 'text-blue-600 dark:text-blue-400'    },
	purple:  { pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',   activePill: 'bg-purple-600 text-white',  text: 'text-purple-600 dark:text-purple-400' },
	rose:    { pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',           activePill: 'bg-rose-600 text-white',    text: 'text-rose-600 dark:text-rose-400'    },
};

function findPostInPath(slug: string, path: StoredLearningPath): PostLocation | null {
	for (let pi = 0; pi < path.phases.length; pi++) {
		const phase = path.phases[pi];
		const postIdx = phase.posts.findIndex((p) => p.slug === slug);
		if (postIdx === -1) continue;

		// Build a flat ordered list of all posts across all phases for prev/next
		const flatPosts: LearnPost[] = path.phases.flatMap((ph) => ph.posts);
		const flatIdx = flatPosts.findIndex((p) => p.slug === slug);

		return {
			phase,
			phaseIndex: pi,
			postIndex: postIdx,
			totalInPhase: phase.posts.length,
			prev: flatIdx > 0 ? { slug: flatPosts[flatIdx - 1].slug, title: flatPosts[flatIdx - 1].title } : null,
			next: flatIdx < flatPosts.length - 1 ? { slug: flatPosts[flatIdx + 1].slug, title: flatPosts[flatIdx + 1].title } : null,
		};
	}
	return null;
}

function markRead(slug: string): void {
	try {
		const raw = localStorage.getItem(LP_STORAGE_KEY);
		if (!raw) return;
		const stored: StoredLearningPath = JSON.parse(raw);
		if (!stored.readSlugs.includes(slug)) {
			stored.readSlugs = [...stored.readSlugs, slug];
			localStorage.setItem(LP_STORAGE_KEY, JSON.stringify(stored));
		}
	} catch {}
}

type Props = { slug: string };

export const LearningPathNav = ({ slug }: Props) => {
	const [path, setPath] = useState<StoredLearningPath | null>(null);
	const [location, setLocation] = useState<PostLocation | null>(null);
	const [readCount, setReadCount] = useState(0);
	const [collapsed, setCollapsed] = useState(false);
	const [phaseMenuOpen, setPhaseMenuOpen] = useState(false);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(LP_STORAGE_KEY);
			if (!raw) return;
			const stored: StoredLearningPath = JSON.parse(raw);
			const loc = findPostInPath(slug, stored);
			if (!loc) return;
			// Mark this post as read
			markRead(slug);
			// Re-read after marking
			const updatedRaw = localStorage.getItem(LP_STORAGE_KEY);
			const updated: StoredLearningPath = updatedRaw ? JSON.parse(updatedRaw) : stored;
			setPath(updated);
			setLocation(loc);
			setReadCount(updated.readSlugs.length);
		} catch {}
	}, [slug]);

	const handleExit = useCallback(() => {
		clearLearningPath();
		setPath(null);
		setLocation(null);
	}, []);

	if (!path || !location) return null;

	const totalPosts = path.phases.reduce((s, p) => s + p.posts.length, 0);
	const progressPct = Math.round((readCount / totalPosts) * 100);
	const c = PHASE_COLORS[location.phase.color];

	// Flat index across all phases for "X of N" display
	const flatAll = path.phases.flatMap((ph) => ph.posts);
	const globalIdx = flatAll.findIndex((p) => p.slug === slug);

	return (
		<>
			{/* Overlay to close phase menu */}
			{phaseMenuOpen && (
				<div className="fixed inset-0 z-40" onClick={() => setPhaseMenuOpen(false)} />
			)}

			{/* Fixed bottom bar */}
			<div className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none">
				<div className="pointer-events-auto w-full max-w-5xl mx-4 mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl overflow-hidden">

					{/* Progress bar */}
					<div className="h-0.5 bg-neutral-100 dark:bg-neutral-800">
						<div
							className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500"
							style={{ width: `${progressPct}%` }}
						/>
					</div>

					{collapsed ? (
						/* ── Collapsed mini bar ── */
						<div className="flex items-center justify-between gap-3 px-4 py-2.5">
							<div className="flex items-center gap-2 min-w-0">
								<span className="text-sm">🎯</span>
								<span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 truncate max-w-[180px] sm:max-w-xs">
									{path.headline}
								</span>
								<span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.activePill}`}>
									{location.phase.emoji} Ph.{location.phase.number}
								</span>
							</div>
							<div className="flex items-center gap-2 flex-shrink-0">
								<span className="text-[10px] text-neutral-400">{readCount}/{totalPosts} read</span>
								<button
									onClick={() => setCollapsed(false)}
									className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
								>
									Expand
								</button>
							</div>
						</div>
					) : (
						/* ── Expanded full bar ── */
						<div className="px-4 py-3 flex flex-col gap-2.5">
							{/* Top row: path name + stats + exit */}
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-sm">🎯</span>
										<p className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate max-w-[260px] sm:max-w-md">
											{path.headline}
										</p>
									</div>
									<p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
										{readCount} of {totalPosts} articles read · {progressPct}% complete
									</p>
								</div>
								<div className="flex items-center gap-2 flex-shrink-0">
									<button
										onClick={() => setCollapsed(true)}
										className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
										title="Collapse"
									>
										<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
									</button>
									<button
										onClick={handleExit}
										className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
										title="Exit learning path"
									>
										<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							</div>

							{/* Bottom row: phase chips + nav */}
							<div className="flex items-center justify-between gap-3 flex-wrap">
								{/* Phase chips */}
								<div className="relative flex items-center gap-1.5 flex-wrap">
									{path.phases.map((phase) => {
										const isActive = phase.number === location.phase.number;
										const pc = PHASE_COLORS[phase.color];
										const firstSlug = phase.posts[0]?.slug;
										return (
											<Link
												key={phase.number}
												href={`/${firstSlug}`}
												className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${isActive ? pc.activePill + ' shadow-sm' : pc.pill + ' hover:opacity-80'}`}
												title={`Go to Phase ${phase.number}: ${phase.label}`}
											>
												<span>{phase.emoji}</span>
												<span className="hidden sm:inline">Ph.{phase.number}:</span>
												<span>{phase.label}</span>
											</Link>
										);
									})}
								</div>

								{/* Prev / position / Next */}
								<div className="flex items-center gap-2 flex-shrink-0">
									{location.prev ? (
										<Link
											href={`/${location.prev.slug}`}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
											title={location.prev.title}
										>
											<svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
											</svg>
											<span className="hidden sm:inline truncate max-w-[100px]">{location.prev.title}</span>
											<span className="sm:hidden">Prev</span>
										</Link>
									) : (
										<span className="px-3 py-1.5 text-xs text-neutral-300 dark:text-neutral-600">
											← Start
										</span>
									)}

									<span className={`text-[11px] font-bold px-2 py-1 rounded-lg tabular-nums ${c.activePill}`}>
										{globalIdx + 1} / {totalPosts}
									</span>

									{location.next ? (
										<Link
											href={`/${location.next.slug}`}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
											title={location.next.title}
										>
											<span className="hidden sm:inline truncate max-w-[100px]">{location.next.title}</span>
											<span className="sm:hidden">Next</span>
											<svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
											</svg>
										</Link>
									) : (
										<span className="px-3 py-1.5 text-xs text-neutral-300 dark:text-neutral-600 inline-flex items-center gap-1">
											<svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
											Path complete!
										</span>
									)}
								</div>
							</div>

							{/* Current post context line */}
							<div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
								<span className={`text-[10px] font-bold uppercase tracking-wide ${c.text}`}>
									{location.phase.emoji} Phase {location.phase.number} · {location.phase.label}
								</span>
								<span className="text-neutral-300 dark:text-neutral-600">·</span>
								<span className="text-[10px] text-neutral-400 dark:text-neutral-500">
									Article {location.postIndex + 1} of {location.totalInPhase} in this phase
								</span>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bottom spacer so page content isn't hidden behind the nav */}
			<div className="h-28" />
		</>
	);
};
