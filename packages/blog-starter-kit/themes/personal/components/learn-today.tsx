'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { LearningPath, LearningPhase, LearnPost, PostComplexity } from '../pages/api/learning-path';

// Re-export types for consumers
export type { LearnPost };

// localStorage key and persisted type
export const LP_STORAGE_KEY = 'lp:active';
export type StoredLearningPath = LearningPath & { readSlugs: string[]; activatedAt: number };

export function saveLearningPath(path: LearningPath): void {
	try {
		const stored: StoredLearningPath = { ...path, readSlugs: [], activatedAt: Date.now() };
		localStorage.setItem(LP_STORAGE_KEY, JSON.stringify(stored));
	} catch {}
}

export function clearLearningPath(): void {
	try { localStorage.removeItem(LP_STORAGE_KEY); } catch {}
}

export function loadLearningPath(): StoredLearningPath | null {
	try {
		const raw = localStorage.getItem(LP_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as StoredLearningPath) : null;
	} catch { return null; }
}

// ─── Example prompts that cycle in the placeholder ───────────────────────────
const EXAMPLES = [
	'system design interview prep',
	'distributed systems fundamentals',
	'LLM engineering and RAG',
	'Python async programming',
	'database sharding and replication',
	'Kafka and event streaming',
	'machine learning from scratch',
	'microservices architecture',
];

// ─── Complexity badge colors (independent of phase color) ──────────────────────
const COMPLEXITY_BADGE: Record<PostComplexity, string> = {
	Beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
	Intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
	Advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
	Expert: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
};

// ─── Phase color map ──────────────────────────────────────────────────────────
const COLOR: Record<LearningPhase['color'], {
	header: string; badge: string; border: string; dot: string; pill: string;
	tab: string; tabActive: string; tabBorder: string;
}> = {
	emerald: {
		header: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
		badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
		border: 'border-emerald-200 dark:border-emerald-800',
		dot: 'bg-emerald-500',
		pill: 'bg-emerald-600 hover:bg-emerald-700',
		tab: 'text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400',
		tabActive: 'text-emerald-700 dark:text-emerald-300 font-bold',
		tabBorder: 'border-emerald-500',
	},
	blue: {
		header: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
		badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
		border: 'border-blue-200 dark:border-blue-800',
		dot: 'bg-blue-500',
		pill: 'bg-blue-600 hover:bg-blue-700',
		tab: 'text-neutral-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400',
		tabActive: 'text-blue-700 dark:text-blue-300 font-bold',
		tabBorder: 'border-blue-500',
	},
	purple: {
		header: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
		badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
		border: 'border-purple-200 dark:border-purple-800',
		dot: 'bg-purple-500',
		pill: 'bg-purple-600 hover:bg-purple-700',
		tab: 'text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400',
		tabActive: 'text-purple-700 dark:text-purple-300 font-bold',
		tabBorder: 'border-purple-500',
	},
	rose: {
		header: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
		badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
		border: 'border-rose-200 dark:border-rose-800',
		dot: 'bg-rose-500',
		pill: 'bg-rose-600 hover:bg-rose-700',
		tab: 'text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400',
		tabActive: 'text-rose-700 dark:text-rose-300 font-bold',
		tabBorder: 'border-rose-500',
	},
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PhasePostRow = ({
	post,
	color,
	stepNumber,
}: {
	post: LearnPost;
	color: LearningPhase['color'];
	stepNumber: number;
}) => {
	const c = COLOR[color];
	return (
		<Link
			href={`/${post.slug}`}
			className={`group flex items-center gap-3 p-3 rounded-xl border ${c.border} bg-white dark:bg-neutral-900 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
		>
			{/* Step number indicator */}
			<div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${c.border} bg-white dark:bg-neutral-900 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800 transition-colors`}>
				<span className={`text-[11px] font-bold ${c.tabActive}`}>{stepNumber}</span>
			</div>

			{post.coverImage?.url ? (
				<img
					src={post.coverImage.url}
					alt=""
					className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
				/>
			) : (
				<div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
					<svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
			)}

			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
					{post.title}
				</p>
				<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
					{post.brief}
				</p>
			</div>

			<div className="flex-shrink-0 flex flex-col items-end gap-1">
				<span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${c.badge}`}>
					{post.readTimeInMinutes} min
				</span>
				{post.complexity ? (
					<span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${COMPLEXITY_BADGE[post.complexity]}`}>
						{post.complexity}
					</span>
				) : post.series ? (
					<span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate max-w-[90px]">
						{post.series.name}
					</span>
				) : null}
			</div>
		</Link>
	);
};

// ─── Horizontal phase viewer ──────────────────────────────────────────────────

const PhaseViewer = ({ phases }: { phases: LearningPhase[] }) => {
	const [activeIdx, setActiveIdx] = useState(0);
	const phase = phases[activeIdx];
	const c = COLOR[phase.color];

	const goTo = (idx: number) => setActiveIdx(Math.max(0, Math.min(phases.length - 1, idx)));

	return (
		<div className={`rounded-2xl border overflow-hidden ${c.border}`}>
			{/* ── Phase tab strip ── */}
			<div className="flex items-stretch overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 scrollbar-none">
				{phases.map((ph, i) => {
					const tc = COLOR[ph.color];
					const isActive = i === activeIdx;
					return (
						<button
							key={ph.number}
							onClick={() => goTo(i)}
							className={`relative flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-3.5 text-sm transition-colors whitespace-nowrap border-b-2 ${
								isActive
									? `${tc.tabActive} ${tc.tabBorder} bg-neutral-50 dark:bg-neutral-800/60`
									: `${tc.tab} border-transparent`
							}`}
						>
							<span className={`w-5 h-5 rounded-full ${tc.dot} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
								{ph.number}
							</span>
							<span className="hidden xs:inline">{ph.emoji}</span>
							<span className="font-semibold">{ph.label}</span>
							<span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? tc.badge : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
								{ph.posts.length}
							</span>
						</button>
					);
				})}
			</div>

			{/* ── Active phase header ── */}
			<div className={`px-5 py-4 border-b ${c.header}`}>
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-xs text-neutral-500 dark:text-neutral-400">{phase.description}</p>
					</div>
					<div className="flex-shrink-0 text-right">
						<p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
							{phase.posts.length} articles · ~{phase.totalMinutes} min
						</p>
					</div>
				</div>
			</div>

			{/* ── Post list ── */}
			<div className="p-4 flex flex-col gap-2.5 bg-white/50 dark:bg-neutral-900/50">
				{phase.posts.map((post, i) => (
					<PhasePostRow key={post.id} post={post} color={phase.color} stepNumber={i + 1} />
				))}
			</div>

			{/* ── Bottom nav: prev phase / start CTA / next phase ── */}
			<div className={`px-5 py-3 border-t ${c.border} bg-white dark:bg-neutral-900 flex items-center justify-between gap-3`}>
				<button
					onClick={() => goTo(activeIdx - 1)}
					disabled={activeIdx === 0}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 dark:text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-neutral-50 dark:hover:enabled:bg-neutral-800 transition-colors"
				>
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Prev Phase
				</button>

				<Link
					href={`/${phase.posts[0].slug}`}
					className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${c.pill}`}
				>
					Start Phase {phase.number}
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>

				<button
					onClick={() => goTo(activeIdx + 1)}
					disabled={activeIdx === phases.length - 1}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 dark:text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-neutral-50 dark:hover:enabled:bg-neutral-800 transition-colors"
				>
					Next Phase
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>
	);
};

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
	allPosts: LearnPost[];
};

export const LearnToday = ({ allPosts }: Props) => {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<LearningPath | null>(null);
	const [error, setError] = useState('');
	const [placeholderIdx, setPlaceholderIdx] = useState(0);
	const [placeholderVisible, setPlaceholderVisible] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const resultRef = useRef<HTMLDivElement>(null);

	// Cycle placeholder examples
	useEffect(() => {
		const interval = setInterval(() => {
			setPlaceholderVisible(false);
			setTimeout(() => {
				setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length);
				setPlaceholderVisible(true);
			}, 300);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	const handleSubmit = useCallback(async (q: string) => {
		const trimmed = q.trim();
		if (!trimmed || loading) return;

		setLoading(true);
		setError('');
		setResult(null);

		try {
			const res = await fetch('/api/learning-path', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: trimmed, posts: allPosts }),
			});
			const data = await res.json() as LearningPath;
			if (data.phases?.length > 0) saveLearningPath(data);
			setResult(data);
			setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
		} catch {
			setError('Something went wrong. Please try again.');
		} finally {
			setLoading(false);
		}
	}, [allPosts, loading]);

	const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') handleSubmit(query);
	};

	const handleChip = (example: string) => {
		setQuery(example);
		handleSubmit(example);
		inputRef.current?.focus();
	};

	const hrs = result ? Math.round(result.totalMinutes / 60 * 10) / 10 : 0;

	return (
		<section className="w-full py-12">
			{/* Header */}
			<div className="mb-8">
				<p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">
					AI-Powered Discovery
				</p>
				<h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
					What do you want to learn today?
				</h2>
				<p className="text-neutral-500 dark:text-neutral-400 text-sm">
					Describe a topic and get a structured, personalized reading path built from this blog&apos;s content.
				</p>
			</div>

			{/* Input row */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
						{loading ? (
							<svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
						) : (
							<svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						)}
					</div>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKey}
						placeholder={placeholderVisible ? `e.g. "${EXAMPLES[placeholderIdx]}"` : ''}
						className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 text-base transition-colors"
					/>
				</div>
				<button
					onClick={() => handleSubmit(query)}
					disabled={loading || !query.trim()}
					className="flex-shrink-0 flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors text-sm"
				>
					{loading ? (
						<>
							<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
							</svg>
							Building path...
						</>
					) : (
						<>
							Build My Path
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						</>
					)}
				</button>
			</div>

			{/* Example chips */}
			<div className="mt-4 flex flex-wrap gap-2">
				<span className="text-xs text-neutral-400 dark:text-neutral-500 self-center">Try:</span>
				{EXAMPLES.slice(0, 5).map((ex) => (
					<button
						key={ex}
						onClick={() => handleChip(ex)}
						className="px-3 py-1.5 text-xs font-medium rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-neutral-900"
					>
						{ex}
					</button>
				))}
			</div>

			{/* Error */}
			{error && (
				<p className="mt-4 text-sm text-red-500">{error}</p>
			)}

			{/* Results */}
			{result && (
				<div ref={resultRef} className="mt-10 flex flex-col gap-6">
					{/* Path header */}
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="text-2xl">✨</span>
								<h3 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-50">
									{result.headline}
								</h3>
							</div>
							<p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
								{result.summary}
							</p>
							{result.aiPowered && (
								<div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
									<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 2L9.09 9.26 2 10.27l5 4.87L5.82 22 12 18.77 18.18 22 17 15.14l5-4.87-7.09-1.01L12 2z" />
									</svg>
									AI-ranked by complexity
								</div>
							)}
						</div>
						<div className="flex-shrink-0 flex flex-col sm:items-end gap-1">
							<div className="flex items-center gap-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
								<span>{result.totalPosts} articles</span>
								<span className="text-neutral-300 dark:text-neutral-600">·</span>
								<span>{hrs >= 1 ? `~${hrs} hrs` : `~${result.totalMinutes} min`}</span>
								<span className="text-neutral-300 dark:text-neutral-600">·</span>
								<span>{result.phases.length} phases</span>
							</div>
							{result.phases[0]?.posts[0] && (
								<Link
									href={`/${result.phases[0].posts[0].slug}`}
									className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors mt-1"
								>
									Start Learning
									<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
									</svg>
								</Link>
							)}
							<button
								onClick={() => { setResult(null); setQuery(''); }}
								className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
							>
								← Search again
							</button>
						</div>
					</div>

					{result.phases.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 px-6 py-14 text-center">
							<p className="text-4xl mb-3">🔍</p>
							<h4 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
								No matching content found
							</h4>
							<p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
								Try a different topic — e.g. &ldquo;system design&rdquo;, &ldquo;distributed systems&rdquo;, or &ldquo;Python&rdquo;.
							</p>
						</div>
					) : (
						<PhaseViewer phases={result.phases} />
					)}
				</div>
			)}
		</section>
	);
};
