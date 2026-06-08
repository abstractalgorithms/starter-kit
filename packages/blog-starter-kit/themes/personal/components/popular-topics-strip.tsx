'use client';

import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';
import { TopicCluster, ClusterColor } from './topic-clusters';
import type { LearnPost } from '../components/learn-today';
import type { TopicExplorerResult } from '../pages/api/topic-explorer';
import type { SubtopicAnswerResult } from '../pages/api/subtopic-answer';

// ─── Emoji map for common tech slugs ─────────────────────────────────────────
const SLUG_EMOJI: Record<string, string> = {
	'llm': '🤖', 'large-language-models': '🤖', 'llms': '🤖', 'gpt': '🤖',
	'big-data': '⚡', 'spark': '⚡', 'hadoop': '⚡', 'kafka': '⚡',
	'system-design': '🏗️', 'distributed-systems': '🏗️', 'architecture': '🏗️',
	'machine-learning': '🧠', 'deep-learning': '🧠', 'neural-networks': '🧠',
	'kubernetes': '☸️', 'docker': '🐳', 'devops': '🔧', 'ci-cd': '🔧',
	'databases': '🗃️', 'sql': '🗃️', 'nosql': '🗃️', 'postgresql': '🗃️',
	'python': '🐍', 'java': '☕', 'golang': '🐹', 'rust': '🦀',
	'algorithms': '🔄', 'data-structures': '🔄',
	'data-engineering': '🔧', 'data-pipelines': '🔧',
	'cloud': '☁️', 'aws': '☁️', 'gcp': '☁️', 'azure': '☁️',
	'security': '🔒', 'networking': '🌐',
	'rag': '📚', 'vector-databases': '📐', 'embeddings': '📐',
};
const FALLBACK_EMOJI = '📖';
function topicEmoji(slug: string): string {
	const lower = slug.toLowerCase();
	for (const [key, emoji] of Object.entries(SLUG_EMOJI)) {
		if (lower.includes(key)) return emoji;
	}
	return FALLBACK_EMOJI;
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const DOT_COLORS: Record<ClusterColor, string> = {
	blue:    'bg-blue-500',
	emerald: 'bg-emerald-500',
	purple:  'bg-purple-500',
	orange:  'bg-orange-500',
	teal:    'bg-teal-500',
};

const PILL_ACTIVE: Record<ClusterColor, string> = {
	blue:    'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
	emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
	purple:  'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
	orange:  'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
	teal:    'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
};

const PILL_HOVER: Record<ClusterColor, string> = {
	blue:    'hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300',
	emerald: 'hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300',
	purple:  'hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300',
	orange:  'hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-700 dark:hover:text-orange-300',
	teal:    'hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300',
};

const PANEL_BORDER: Record<ClusterColor, string> = {
	blue:    'border-blue-200 dark:border-blue-800',
	emerald: 'border-emerald-200 dark:border-emerald-800',
	purple:  'border-purple-200 dark:border-purple-800',
	orange:  'border-orange-200 dark:border-orange-800',
	teal:    'border-teal-200 dark:border-teal-800',
};

const SUBTOPIC_BTN: Record<ClusterColor, string> = {
	blue:    'border-blue-200 dark:border-blue-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-neutral-700 dark:text-neutral-300 hover:text-blue-700 dark:hover:text-blue-300',
	emerald: 'border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-neutral-700 dark:text-neutral-300 hover:text-emerald-700 dark:hover:text-emerald-300',
	purple:  'border-purple-200 dark:border-purple-800 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-neutral-700 dark:text-neutral-300 hover:text-purple-700 dark:hover:text-purple-300',
	orange:  'border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-neutral-700 dark:text-neutral-300 hover:text-orange-700 dark:hover:text-orange-300',
	teal:    'border-teal-200 dark:border-teal-800 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 text-neutral-700 dark:text-neutral-300 hover:text-teal-700 dark:hover:text-teal-300',
};

const SUBTOPIC_ACTIVE: Record<ClusterColor, string> = {
	blue:    'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
	emerald: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
	purple:  'border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300',
	orange:  'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300',
	teal:    'border-teal-400 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
	return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
}
function scorePost(post: LearnPost, phrase: string): number {
	const words = tokenize(phrase);
	const title = post.title.toLowerCase();
	const brief = (post.brief ?? '').toLowerCase();
	const tags = (post.tags ?? []).map((t) => t.name.toLowerCase()).join(' ');
	return words.reduce((s, w) => {
		const inTitle = (title.match(new RegExp(w, 'g')) || []).length;
		const inBrief = (brief.match(new RegExp(w, 'g')) || []).length;
		const inTags  = (tags.match(new RegExp(w, 'g')) || []).length;
		return s + inTitle * 4 + inTags * 3 + Math.min(inBrief, 2);
	}, 0);
}

// ─── Article card ─────────────────────────────────────────────────────────────
const ArticleCard = ({ post, color }: { post: LearnPost; color: ClusterColor }) => {
	const accent: Record<ClusterColor, string> = {
		blue: 'text-blue-600 dark:text-blue-400', emerald: 'text-emerald-600 dark:text-emerald-400',
		purple: 'text-purple-600 dark:text-purple-400', orange: 'text-orange-500 dark:text-orange-400',
		teal: 'text-teal-600 dark:text-teal-400',
	};
	return (
		<Link
			href={`/${post.slug}`}
			className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all"
		>
			{post.coverImage?.url && (
				<div className="w-full h-28 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={post.coverImage.url}
						alt={post.title}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				</div>
			)}
			<div className="flex flex-col gap-1.5 p-4 flex-1">
				<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:underline line-clamp-2">
					{post.title}
				</p>
				{post.brief && (
					<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
						{post.brief}
					</p>
				)}
				<div className="flex items-center gap-3 mt-auto pt-1">
					<span className={`text-xs font-medium ${accent[color]}`}>
						{post.readTimeInMinutes} min read
					</span>
					{post.tags?.[0] && (
						<span className="text-xs text-neutral-400 dark:text-neutral-500">
							{post.tags[0].name}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
};

// ─── Expand panel ─────────────────────────────────────────────────────────────
type PanelState = 'loading' | 'ready' | 'error';

const ExplorePanel = ({
	cluster,
	allPosts,
	onClose,
}: {
	cluster: TopicCluster;
	allPosts: LearnPost[];
	onClose: () => void;
}) => {
	const [panelState, setPanelState] = useState<PanelState>('loading');
	const [result, setResult] = useState<TopicExplorerResult | null>(null);
	const [activeSubTopic, setActiveSubTopic] = useState<string | null>(null);
	const [customQuery, setCustomQuery] = useState('');
	const [subAnswer, setSubAnswer] = useState<SubtopicAnswerResult | null>(null);
	const [subAnswerLoading, setSubAnswerLoading] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Posts belonging to this topic (by tag slug)
	const topicPosts = allPosts.filter((p) =>
		(p.tags ?? []).some((t) => t.slug === cluster.slug),
	);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch('/api/topic-explorer', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						topic: cluster.label,
						posts: topicPosts.slice(0, 20).map((p) => ({
							title: p.title,
							brief: p.brief,
							tags: p.tags,
						})),
					}),
				});
				if (!res.ok) throw new Error(`API ${res.status}`);
				const data: TopicExplorerResult = await res.json();
				if (!cancelled) { setResult(data); setPanelState('ready'); }
			} catch {
				if (!cancelled) setPanelState('error');
			}
		})();
		return () => { cancelled = true; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cluster.slug]);

	// Scroll panel into view after mount
	useEffect(() => {
		panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}, []);

	const matchedPosts = activeSubTopic
		? (() => {
			// Score all posts in the blog (not just this topic cluster) against the subtopic
			const scored = [...allPosts]
				.map((p) => ({ post: p, score: scorePost(p, activeSubTopic) }))
				.filter(({ score }) => score >= 4) // require at least a title match (4pts) or strong tag+brief overlap
				.sort((a, b) => b.score - a.score);
			// Drop posts whose score is less than 30% of the top score (eliminates noise)
			const topScore = scored[0]?.score ?? 0;
			const minScore = Math.max(4, topScore * 0.3);
			return scored.filter(({ score }) => score >= minScore).slice(0, 6).map(({ post }) => post);
		})()
		: [];

	// Fetch AI answer whenever the active sub-topic changes
	useEffect(() => {
		if (!activeSubTopic) { setSubAnswer(null); return; }
		let cancelled = false;
		setSubAnswerLoading(true);
		setSubAnswer(null);
		(async () => {
			try {
				const res = await fetch('/api/subtopic-answer', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						topic: cluster.label,
						subTopic: activeSubTopic,
						posts: matchedPosts.slice(0, 6).map((p) => ({
							title: p.title,
							brief: p.brief,
							tags: p.tags,
							slug: p.slug,
						})),
					}),
				});
				if (!res.ok) throw new Error(`API ${res.status}`);
				const data: SubtopicAnswerResult = await res.json();
				if (!cancelled) setSubAnswer(data);
			} catch {
				// silently fail — related posts still show
			} finally {
				if (!cancelled) setSubAnswerLoading(false);
			}
		})();
		return () => { cancelled = true; };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSubTopic]);

	const handleCustomQuery = useCallback(() => {
		const q = customQuery.trim();
		if (q) setActiveSubTopic(q);
	}, [customQuery]);

	const c = cluster.color;

	return (
		<div ref={panelRef} className={`mt-3 rounded-xl border ${PANEL_BORDER[c]} bg-white dark:bg-neutral-900 overflow-hidden`}>
			{/* Panel header */}
			<div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
				<div className="flex items-center gap-2">
					<span className="text-base">{topicEmoji(cluster.slug)}</span>
					<span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{cluster.label}</span>
					<span className="text-xs text-neutral-400 dark:text-neutral-500">· {topicPosts.length} posts</span>
				</div>
				<button
					onClick={onClose}
					className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					aria-label="Close"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div className="px-5 py-4 space-y-4">
				{/* Summary */}
				{panelState === 'loading' && (
					<div className="space-y-2 animate-pulse">
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-4/5" />
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/5" />
					</div>
				)}
				{panelState === 'error' && (
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						Couldn&apos;t generate topic summary. Browse posts below.
					</p>
				)}
				{panelState === 'ready' && result && (
					<p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
						{result.summary}
					</p>
				)}

				{/* Sub-topic question */}
				{panelState === 'ready' && result && (
					<div className="space-y-2.5">
						<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
							What do you want to learn?
						</p>
						{result.subTopics.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{result.subTopics.map((st) => (
									<button
										key={st}
										onClick={() => {
											setCustomQuery('');
											setActiveSubTopic(activeSubTopic === st ? null : st);
										}}
										className={`text-sm px-3.5 py-2 rounded-full border font-medium transition-all duration-150 ${
											activeSubTopic === st && !customQuery ? SUBTOPIC_ACTIVE[c] : SUBTOPIC_BTN[c]
										}`}
									>
										{st}
									</button>
								))}
							</div>
						)}
						{/* Custom query input */}
						<div className="flex gap-2">
							<input
								ref={inputRef}
								type="text"
								value={customQuery}
								onChange={(e) => setCustomQuery(e.target.value)}
								onKeyDown={(e) => { if (e.key === 'Enter') handleCustomQuery(); }}
								placeholder="Or describe what you want to learn…"
							className="flex-1 text-sm px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-transparent transition-all"
							/>
							<button
								onClick={handleCustomQuery}
								disabled={!customQuery.trim()}
								className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
							>
								Search
							</button>
						</div>
					</div>
				)}

				{/* AI Answer */}
				{activeSubTopic && (
					<div className="rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 px-4 py-3.5 space-y-1.5">
						<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							AI Answer
						</p>
						{subAnswerLoading && (
							<div className="space-y-1.5 animate-pulse">
								<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
								<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
								<div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6" />
							</div>
						)}
						{!subAnswerLoading && subAnswer && (
							<p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
								{subAnswer.answer}
							</p>
						)}
						{!subAnswerLoading && !subAnswer && (
							<p className="text-xs text-neutral-400 dark:text-neutral-500 italic">
								Could not generate an answer. Browse related posts below.
							</p>
						)}
					</div>
				)}

				{/* Matched articles */}
				{activeSubTopic && matchedPosts.length > 0 && (
					<div className="space-y-2.5">
						<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
							Read more in detail
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{matchedPosts.map((post) => (
								<ArticleCard key={post.id} post={post} color={c} />
							))}
						</div>
					</div>
				)}
				{activeSubTopic && matchedPosts.length === 0 && !subAnswerLoading && (
					<p className="text-sm text-neutral-500 dark:text-neutral-400">
						No exact matches found.{' '}
						<Link href={`/topic/${cluster.slug}`} className="underline hover:text-neutral-700 dark:hover:text-neutral-200">
							Browse all {cluster.label} posts →
						</Link>
					</p>
				)}

				{/* Footer: see all */}
				<div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
					<Link
						href={`/topic/${cluster.slug}`}
						className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
					>
						Browse all {topicPosts.length} {cluster.label} posts
						<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
						</svg>
					</Link>
				</div>
			</div>
		</div>
	);
};

// ─── Main export ──────────────────────────────────────────────────────────────
type Props = {
	clusters: TopicCluster[];
	allPosts: LearnPost[];
};

export const PopularTopicsStrip = ({ clusters, allPosts }: Props) => {
	const visible = clusters.filter((c) => c.postCount > 0);
	const [activeSlug, setActiveSlug] = useState<string | null>(null);

	const toggle = useCallback((slug: string) => {
		setActiveSlug((prev) => (prev === slug ? null : slug));
	}, []);

	if (visible.length === 0) return null;

	const activeCluster = visible.find((c) => c.slug === activeSlug) ?? null;

	return (
		<div className="w-full py-6 pt-0">
			<div className="flex items-center gap-3 mb-4">
				<p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
					Explore by topic
				</p>
				<div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
			</div>

			{/* Topic pills */}
			<div className="flex flex-wrap gap-2">
				{visible.map((cluster) => {
					const isActive = cluster.slug === activeSlug;
					return (
						<button
							key={cluster.slug}
							onClick={() => toggle(cluster.slug)}
							className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all duration-150 shadow-sm hover:shadow-md ${
								isActive ? PILL_ACTIVE[cluster.color] : `border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 ${PILL_HOVER[cluster.color]}`
							}`}
						>
							<span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[cluster.color]}`} />
							<span className="text-base leading-none">{topicEmoji(cluster.slug)}</span>
							<span>{cluster.label}</span>
							<span className="ml-0.5 text-[11px] font-normal text-neutral-400 dark:text-neutral-500">
								{cluster.postCount}
							</span>
						</button>
					);
				})}
				<Link
					href="/posts"
					className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium text-neutral-400 dark:text-neutral-500 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all duration-150"
				>
					All posts
					<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</Link>
			</div>

			{/* AI explore panel — appears below the pills when a topic is active */}
			{activeCluster && (
				<ExplorePanel
					key={activeCluster.slug}
					cluster={activeCluster}
					allPosts={allPosts}
					onClose={() => setActiveSlug(null)}
				/>
			)}
		</div>
	);
};
