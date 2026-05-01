'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { LearningPath, LearningPhase, LearnPost, PostComplexity } from '../pages/api/learning-path';
import { PathCompletionQuiz } from './path-completion-quiz';

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

// ─── Client-side intent detection ────────────────────────────────────────────
// Mirrors the scoring logic in /pages/api/learning-path.ts so routing decisions
// are made instantly without a network round-trip.

const STOP_WORDS = new Set([
	'a','an','the','and','or','but','in','on','at','to','for','of','with',
	'by','from','how','what','when','where','why','is','are','was','were',
	'be','been','have','has','do','does','can','could','should','would',
	'i','me','my','we','you','your','it','its','this','that','these','those',
	'learn','about','understand','want','need','know','get','make','use',
]);

const SYNONYMS: Record<string, string[]> = {
	'distributed': ['replication', 'partition', 'consensus', 'raft', 'paxos', 'shard', 'consistency', 'availability'],
	'system design': ['scalability', 'architecture', 'microservice', 'load balancer', 'cdn', 'api gateway', 'database', 'caching', 'queue', 'storage'],
	'system': ['architecture', 'scalability', 'design', 'service', 'component', 'infrastructure'],
	'design': ['architecture', 'pattern', 'scalability', 'service', 'system', 'structure'],
	'interview': ['prep', 'design', 'system', 'problem', 'solution', 'approach', 'scalability', 'architecture'],
	'prep': ['design', 'system', 'architecture', 'interview', 'scalability', 'problem', 'approach'],
	'database': ['sql', 'nosql', 'postgres', 'mysql', 'mongodb', 'cassandra', 'redis', 'storage', 'replication', 'sharding'],
	'algorithm': ['data structure', 'complexity', 'sorting', 'graph', 'tree', 'dynamic programming'],
	'llm': ['large language model', 'gpt', 'transformer', 'fine-tuning', 'rag', 'embedding'],
	'ml': ['machine learning', 'neural network', 'model', 'training', 'inference'],
	'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'llm', 'neural'],
	'python': ['django', 'fastapi', 'async', 'asyncio', 'pandas', 'numpy'],
	'kubernetes': ['k8s', 'container', 'docker', 'pod', 'deployment', 'orchestration'],
	'kafka': ['streaming', 'event', 'message queue', 'pub sub', 'consumer'],
	'caching': ['redis', 'memcached', 'cdn', 'cache invalidation', 'ttl'],
};

function tokenizeQ(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ')
		.split(/\s+/)
		.filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function expandKeywordsQ(keywords: string[]): string[] {
	const expanded = new Set(keywords);
	for (const kw of keywords) {
		const syns = SYNONYMS[kw];
		if (syns) syns.forEach((s) => expanded.add(s));
		for (const [key, vals] of Object.entries(SYNONYMS)) {
			if (key.includes(kw) || kw.includes(key)) {
				vals.forEach((s) => expanded.add(s));
			}
		}
	}
	return [...expanded];
}

function scorePostQ(post: LearnPost, keywords: string[]): number {
	if (keywords.length === 0) return 0;
	const title = post.title.toLowerCase();
	const brief = (post.brief ?? '').toLowerCase();
	const tags = (post.tags ?? []).map((t) => `${t.name} ${t.slug}`).join(' ').toLowerCase();
	const series = (post.series?.name ?? '').toLowerCase();
	let score = 0;
	for (const kw of keywords) {
		score += (title.match(new RegExp(kw, 'g')) || []).length * 4;
		score += (tags.match(new RegExp(kw, 'g')) || []).length * 3;
		score += (series.match(new RegExp(kw, 'g')) || []).length * 2.5;
		score += Math.min((brief.match(new RegExp(kw, 'g')) || []).length, 3);
	}
	if ((post.views ?? 0) > 10000) score *= 1.15;
	else if ((post.views ?? 0) > 3000) score *= 1.07;
	return score;
}

/** Thresholds for intent routing */
const THRESHOLD_PATH = 5;   // ≥5 matching posts → build a learning path
const THRESHOLD_SEARCH = 2; // 2–4 → show inline search results
                             // <2  → navigate to /generated?topic=X

type ResultMode = 'path' | 'search' | 'generate';

function detectIntent(query: string, allPosts: LearnPost[]): { mode: ResultMode; matches: LearnPost[] } {
	const keywords = expandKeywordsQ(tokenizeQ(query));
	const scored = allPosts
		.map((post) => ({ post, score: scorePostQ(post, keywords) }))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score);
	const matches = scored.map(({ post }) => post);
	if (matches.length >= THRESHOLD_PATH) return { mode: 'path', matches };
	if (matches.length >= THRESHOLD_SEARCH) return { mode: 'search', matches: matches.slice(0, 4) };
	return { mode: 'generate', matches: [] };
}

// ─── Search results panel ─────────────────────────────────────────────────────

const SearchResultsPanel = ({
	query,
	posts,
	onReset,
}: {
	query: string;
	posts: LearnPost[];
	onReset: () => void;
}) => (
	<div className="mt-10 flex flex-col gap-5">
		{/* Header */}
		<div className="flex items-start justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-neutral-800">
			<div>
				<div className="flex items-center gap-2 mb-1">
					<span className="text-lg">🔍</span>
					<h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
						{posts.length} article{posts.length !== 1 ? 's' : ''} about &ldquo;{query}&rdquo;
					</h3>
				</div>
				<p className="text-sm text-neutral-500 dark:text-neutral-400">
					Not quite enough for a full learning path — here&apos;s what we have.
				</p>
			</div>
			<button
				onClick={onReset}
				className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors flex-shrink-0 mt-1"
			>
				← Search again
			</button>
		</div>

		{/* Post cards */}
		<div className="flex flex-col gap-3">
			{posts.map((post) => (
				<Link
					key={post.id}
					href={`/${post.slug}`}
					className="group flex items-start gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
				>
					{post.coverImage?.url ? (
						<img src={post.coverImage.url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
					) : (
						<div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
							<svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
					)}
					<div className="flex-1 min-w-0">
						<p className="font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-0.5">
							{post.title}
						</p>
						<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-2">
							{post.brief}
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
								{post.readTimeInMinutes} min
							</span>
							{(post.tags ?? []).slice(0, 2).map((t) => (
								<span key={t.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
									{t.name}
								</span>
							))}
						</div>
					</div>
					<svg className="w-4 h-4 flex-shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-blue-400 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			))}
		</div>

		{/* Generate CTA */}
		<div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">
					Want a deeper dive?
				</p>
				<p className="text-xs text-neutral-500 dark:text-neutral-400">
					AI can generate a full 1 000-word article specifically about &ldquo;{query}&rdquo;.
				</p>
			</div>
			<Link
				href={`/generated?topic=${encodeURIComponent(query)}`}
				className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
			>
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
				Generate full article
			</Link>
		</div>
	</div>
);

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
	allPosts: LearnPost[];
};

export const LearnToday = ({ allPosts }: Props) => {
	const router = useRouter();
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [mode, setMode] = useState<ResultMode | null>(null);
	const [result, setResult] = useState<LearningPath | null>(null);
	const [searchResults, setSearchResults] = useState<LearnPost[]>([]);
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

	const handleReset = useCallback(() => {
		setMode(null);
		setResult(null);
		setSearchResults([]);
		setError('');
		setQuery('');
	}, []);

	const handleSubmit = useCallback(async (q: string) => {
		const trimmed = q.trim();
		if (!trimmed || loading) return;

		// ── Intent detection (instant, no network call) ──────────────────────────
		const { mode: detectedMode, matches } = detectIntent(trimmed, allPosts);

		if (detectedMode === 'generate') {
			// No matching content → navigate to on-the-fly AI post
			router.push(`/generated?topic=${encodeURIComponent(trimmed)}`);
			return;
		}

		if (detectedMode === 'search') {
			// A few matches → show them inline immediately
			setMode('search');
			setSearchResults(matches);
			setResult(null);
			setError('');
			setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
			return;
		}

		// ── Path mode: enough content for a structured path, call AI ─────────────
		setMode('path');
		setLoading(true);
		setError('');
		setResult(null);
		setSearchResults([]);

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
			setMode(null);
		} finally {
			setLoading(false);
		}
	}, [allPosts, loading, router]);

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
					Type any topic — we&apos;ll find articles, build a learning path, or generate a fresh post, depending on what fits best.
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
							{mode === 'path' ? 'Building path...' : 'Thinking...'}
						</>
					) : (
						<>
							Explore
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

			{/* ── Search results (2–4 matching posts) ──────────────────────────────── */}
			{mode === 'search' && searchResults.length > 0 && (
				<div ref={resultRef}>
					<SearchResultsPanel query={query} posts={searchResults} onReset={handleReset} />
				</div>
			)}

			{/* ── Learning path ────────────────────────────────────────────────────── */}
			{mode === 'path' && result && (
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
								onClick={handleReset}
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

					{result.phases.length > 0 && (
						<PathCompletionQuiz learningPath={result} />
					)}
				</div>
			)}
		</section>
	);
};
