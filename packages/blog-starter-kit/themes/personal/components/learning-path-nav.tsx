import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { LP_STORAGE_KEY, StoredLearningPath, clearLearningPath } from './learn-today';
import type { LearningPhase, LearnPost } from '../pages/api/learning-path';
import { isInterviewPrepEnabled } from '../lib/features';

type PostLocation = {
	phase: LearningPhase;
	phaseIndex: number;
	postIndex: number;
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
	totalInPhase: number;
};

const PHASE_COLORS: Record<LearningPhase['color'], { activePill: string; bar: string; text: string }> = {
	emerald: { activePill: 'bg-emerald-600 text-white', bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400' },
	blue:    { activePill: 'bg-blue-600 text-white',    bar: 'from-blue-500 to-cyan-500',     text: 'text-blue-600 dark:text-blue-400'    },
	purple:  { activePill: 'bg-purple-600 text-white',  bar: 'from-purple-500 to-violet-500', text: 'text-purple-600 dark:text-purple-400' },
	rose:    { activePill: 'bg-rose-600 text-white',    bar: 'from-rose-500 to-pink-500',     text: 'text-rose-600 dark:text-rose-400'    },
};

function findPostInPath(slug: string, path: StoredLearningPath): PostLocation | null {
	for (let pi = 0; pi < path.phases.length; pi++) {
		const phase = path.phases[pi];
		const postIdx = phase.posts.findIndex((p) => p.slug === slug);
		if (postIdx === -1) continue;

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

	useEffect(() => {
		try {
			const raw = localStorage.getItem(LP_STORAGE_KEY);
			if (!raw) return;
			const stored: StoredLearningPath = JSON.parse(raw);
			const loc = findPostInPath(slug, stored);
			if (!loc) return;
			markRead(slug);
			const updatedRaw = localStorage.getItem(LP_STORAGE_KEY);
			const updated: StoredLearningPath = updatedRaw ? JSON.parse(updatedRaw) : stored;
			setPath(updated);
			setLocation(loc);
			setReadCount(updated.readSlugs.length);
		} catch {}
	}, [slug]);

	// Expose nav height as a CSS variable so other fixed elements (e.g. chatbot
	// button) can offset themselves above the bar without tight coupling.
	useEffect(() => {
		if (path && location) {
			document.documentElement.style.setProperty('--lp-nav-height', '55px');
		} else {
			document.documentElement.style.removeProperty('--lp-nav-height');
		}
		return () => {
			document.documentElement.style.removeProperty('--lp-nav-height');
		};
	}, [path, location]);

	const handleExit = useCallback(() => {
		clearLearningPath();
		setPath(null);
		setLocation(null);
	}, []);

	if (!path || !location) return null;

	const totalPosts = path.phases.reduce((s, p) => s + p.posts.length, 0);
	const progressPct = Math.round((readCount / totalPosts) * 100);
	const c = PHASE_COLORS[location.phase.color];
	const flatAll = path.phases.flatMap((ph) => ph.posts);
	const globalIdx = flatAll.findIndex((p) => p.slug === slug);

	return (
		<>
			{/* Fixed bottom bar — single compact row */}
			<div className="fixed bottom-0 inset-x-0 z-50">
				{/* Thin progress bar flush to top of the nav */}
				<div className="h-[3px] bg-neutral-200 dark:bg-neutral-800">
					<div
						className={`h-full bg-gradient-to-r ${c.bar} transition-all duration-700`}
						style={{ width: `${progressPct}%` }}
					/>
				</div>

				{/* Single row */}
				<div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
					<div className="max-w-5xl mx-auto px-3 sm:px-4 h-12 flex items-center gap-2 sm:gap-3">

						{/* Path context — interview-prep shows icon + label as back link; learn-today shows phase badge */}
						{path.source === 'interview-prep' ? (
							<Link
								href={isInterviewPrepEnabled ? '/interview-prep' : '/posts'}
								className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
								title={isInterviewPrepEnabled ? 'Back to Interview Prep' : 'Back to Learn'}
							>
								{path.interviewIcon && <span>{path.interviewIcon}</span>}
								<span className="hidden xs:inline">{path.interviewLabel ?? 'Interview Prep'}</span>
								<span className="xs:hidden">↩</span>
							</Link>
						) : (
							<span className={`hidden xs:inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.activePill}`}>
								<span>{location.phase.emoji}</span>
								<span>Ph.{location.phase.number}</span>
							</span>
						)}

						{/* Context label — grows to fill space */}
						<div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
							{path.source === 'interview-prep' ? (
								<>
									<span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${c.activePill} hidden sm:inline-flex`}>
										<span>{location.phase.emoji}</span>
										<span>Ph.{location.phase.number}</span>
									</span>
									<span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${c.text} hidden sm:block`}>
										{location.phase.label}
									</span>
									<span className="hidden sm:block text-neutral-300 dark:text-neutral-700 text-xs">·</span>
									<span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
										{globalIdx + 1}/{totalPosts}
									</span>
								</>
							) : (
								<>
									<span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${c.text} hidden sm:block`}>
										{location.phase.label}
									</span>
									<span className="hidden sm:block text-neutral-300 dark:text-neutral-700 text-xs">·</span>
									<span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
										{globalIdx + 1}/{totalPosts}
										<span className="hidden sm:inline"> · {location.postIndex + 1} of {location.totalInPhase} in phase</span>
									</span>
								</>
							)}
						</div>

						{/* ← Prev */}
						{location.prev ? (
							<Link
								href={`/${location.prev.slug}`}
								className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
								title={location.prev.title}
							>
								<svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								<span className="hidden sm:inline truncate max-w-[90px]">{location.prev.title}</span>
								<span className="sm:hidden">Prev</span>
							</Link>
						) : (
							<span className="shrink-0 px-2.5 py-1.5 text-[11px] text-neutral-300 dark:text-neutral-700 select-none">← Start</span>
						)}

						{/* → Next */}
						{location.next ? (
							<Link
								href={`/${location.next.slug}`}
								className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all group"
								title={location.next.title}
							>
								<span className="hidden sm:inline truncate max-w-[90px]">{location.next.title}</span>
								<span className="sm:hidden">Next</span>
								<svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						) : (
							<span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
								<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								<span className="hidden sm:inline">Complete!</span>
							</span>
						)}

						{/* Divider */}
						<span className="shrink-0 w-px h-5 bg-neutral-200 dark:bg-neutral-700" />

						{/* Exit */}
						<button
							onClick={handleExit}
							className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
							title="Exit learning graph"
						>
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Bottom spacer so last content isn't hidden behind nav */}
			<div className="h-16" />
		</>
	);
};
