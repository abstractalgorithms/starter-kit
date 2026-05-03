import { useEffect, useState, useCallback, useRef } from 'react';
import type { TickerItem } from '../pages/api/ai-tech-ticker';

// Base interval at 1× speed (ms)
const BASE_INTERVAL_MS = 12_000;
const FADE_DURATION_MS = 300;

type Speed = 0 | 1;

type CategoryStyle = { bg: string; text: string; border: string; dot: string };

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
	LLM:            { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-l-violet-500',  dot: 'bg-violet-500' },
	Vision:         { bg: 'bg-sky-100 dark:bg-sky-900/30',       text: 'text-sky-700 dark:text-sky-300',       border: 'border-l-sky-500',     dot: 'bg-sky-500' },
	NLP:            { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
	Robotics:       { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-l-orange-500', dot: 'bg-orange-500' },
	'Generative AI':{ bg: 'bg-pink-100 dark:bg-pink-900/30',     text: 'text-pink-700 dark:text-pink-300',     border: 'border-l-pink-500',   dot: 'bg-pink-500' },
	'ML/Research':  { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     border: 'border-l-blue-500',   dot: 'bg-blue-500' },
	Hardware:       { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-yellow-500', dot: 'bg-yellow-500' },
	Multimodal:     { bg: 'bg-teal-100 dark:bg-teal-900/30',     text: 'text-teal-700 dark:text-teal-300',     border: 'border-l-teal-500',   dot: 'bg-teal-500' },
};

const DEFAULT_STYLE: CategoryStyle = {
	bg: 'bg-neutral-100 dark:bg-neutral-800',
	text: 'text-neutral-600 dark:text-neutral-400',
	border: 'border-l-neutral-400',
	dot: 'bg-neutral-400',
};

// Maps each category to relevant blog tag slugs for the "Explore on this blog" section
const CATEGORY_RELATED: Record<string, { label: string; slug: string }[]> = {
	LLM:             [{ label: 'LLM Engineering', slug: 'llm' }, { label: 'Machine Learning', slug: 'machine-learning' }],
	Vision:          [{ label: 'Computer Vision', slug: 'computer-vision' }, { label: 'ML Research', slug: 'machine-learning' }],
	NLP:             [{ label: 'NLP', slug: 'nlp' }, { label: 'LLM Engineering', slug: 'llm' }],
	Robotics:        [{ label: 'Robotics', slug: 'robotics' }, { label: 'ML Research', slug: 'machine-learning' }],
	'Generative AI': [{ label: 'Generative AI', slug: 'generative-ai' }, { label: 'LLM Engineering', slug: 'llm' }],
	'ML/Research':   [{ label: 'ML Research', slug: 'machine-learning' }, { label: 'System Design', slug: 'system-design' }],
	Hardware:        [{ label: 'Hardware', slug: 'hardware' }, { label: 'System Design', slug: 'system-design' }],
	Multimodal:      [{ label: 'Multimodal AI', slug: 'multimodal' }, { label: 'LLM Engineering', slug: 'llm' }],
};

function formatTimeAgo(timestamp: string): string {
	const diffMs = Date.now() - new Date(timestamp).getTime();
	const mins = Math.floor(diffMs / 60_000);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

function formatPublishedDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	} catch {
		return iso;
	}
}

export const AiTechTicker = () => {
	const [items, setItems] = useState<TickerItem[]>([]);
	const [index, setIndex] = useState(0);
	const [visible, setVisible] = useState(true);
	const [speed, setSpeed] = useState<Speed>(1);
	// progress bar: 0→1 over the current interval
	const [progress, setProgress] = useState(0);
	const indexRef = useRef(0);
	const progressRafRef = useRef<number | null>(null);
	const intervalStartRef = useRef<number>(Date.now());

	useEffect(() => {
		fetch('/api/ai-tech-ticker')
			.then((r) => (r.ok ? r.json() : null))
			.then((data: TickerItem[] | null) => {
				if (Array.isArray(data) && data.length > 0) setItems(data);
			})
			.catch(() => {});
	}, []);

	const advance = useCallback((nextIndex: number) => {
		setVisible(false);
		setTimeout(() => {
			indexRef.current = nextIndex;
			setIndex(nextIndex);
			setProgress(0);
			intervalStartRef.current = Date.now();
			setVisible(true);
		}, FADE_DURATION_MS);
	}, []);

	// Animate the progress bar via requestAnimationFrame
	const startProgressAnimation = useCallback((intervalMs: number) => {
		if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
		intervalStartRef.current = Date.now();

		const tick = () => {
			const elapsed = Date.now() - intervalStartRef.current;
			const pct = Math.min(elapsed / intervalMs, 1);
			setProgress(pct);
			if (pct < 1) progressRafRef.current = requestAnimationFrame(tick);
		};
		progressRafRef.current = requestAnimationFrame(tick);
	}, []);

	// Stop the progress bar animation
	const stopProgressAnimation = useCallback(() => {
		if (progressRafRef.current) {
			cancelAnimationFrame(progressRafRef.current);
			progressRafRef.current = null;
		}
	}, []);

	// Auto-rotate based on current play state
	useEffect(() => {
		if (items.length < 2 || speed === 0) {
			stopProgressAnimation();
			setProgress(0);
			return;
		}

		const intervalMs = BASE_INTERVAL_MS;
		startProgressAnimation(intervalMs);

		const id = setInterval(() => {
			advance((indexRef.current + 1) % items.length);
			// restart progress after fade completes
			setTimeout(() => startProgressAnimation(intervalMs), FADE_DURATION_MS);
		}, intervalMs);

		return () => {
			clearInterval(id);
			stopProgressAnimation();
		};
	}, [items.length, speed, advance, startProgressAnimation, stopProgressAnimation]);

	if (items.length === 0) return null;

	const item = items[index];
	const cat = CATEGORY_STYLES[item.category] ?? DEFAULT_STYLE;
	const isPaused = speed === 0;

	return (
		<section className="w-full py-6 flex flex-col h-full">
			{/* Compact header row */}
			<div className="flex items-center justify-between mb-3 gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
						What&apos;s happening
					</span>
					<span className="text-neutral-300 dark:text-neutral-600 flex-shrink-0">·</span>
					<h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 truncate">
						AI Tech Spotlight
					</h2>
				</div>

				<div className="flex items-center gap-2 flex-shrink-0">
					{/* Play/Pause button */}
					<button
						onClick={() => setSpeed(isPaused ? 1 : 0)}
						aria-label={isPaused ? 'Play' : 'Pause'}
						className={`flex items-center justify-center w-6 h-6 rounded transition-colors flex-shrink-0 ${
							isPaused
								? 'bg-blue-600 text-white'
								: 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
						}`}
					>
						{isPaused ? (
							<svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
						) : (
							<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
						)}
					</button>

					{/* Live indicator */}
					<div className="flex items-center gap-1 select-none flex-shrink-0">
						<span className="relative flex h-1.5 w-1.5">
							<span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${!isPaused ? 'animate-ping' : ''}`} />
							<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
						</span>
						<span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide whitespace-nowrap">
							{isPaused ? 'Paused' : 'Live'}
						</span>
					</div>
				</div>
			</div>

			{/* Compact news card */}
			<div
				className={`flex flex-col rounded-lg border border-l-4 border-neutral-200 dark:border-neutral-800 ${cat.border} bg-white dark:bg-neutral-900 overflow-hidden flex-1`}
				style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_DURATION_MS}ms ease` }}
			>
				{/* Progress bar */}
				<div className="h-0.5 bg-neutral-100 dark:bg-neutral-800">
					<div className="h-full bg-blue-500 dark:bg-blue-400 transition-none" style={{ width: `${progress * 100}%` }} />
				</div>

				<div className="p-4 flex flex-col flex-1">
					{/* Top row: category badge + time + source link */}
					<div className="flex items-center justify-between gap-3 mb-2">
						<div className="flex items-center gap-2">
							<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cat.bg} ${cat.text}`}>
								<span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.dot}`} />
								{item.category}
							</span>
							<span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
								{item.source.name} · {formatPublishedDate(item.publishedAt || item.timestamp)}
							</span>
						</div>
						<span className="text-[11px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap tabular-nums">
							{formatTimeAgo(item.timestamp)}
						</span>
					</div>

					<h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 leading-snug mb-1.5">
						{item.title}
					</h3>

					<p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2 mb-3">
						{item.context}
					</p>

					{/* Footer row: read link + blog tags */}
					<div className="flex items-center gap-3 flex-wrap">
						<a
							href={item.source.url}
							target="_blank"
							rel="noopener noreferrer"
							className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md ${cat.bg} ${cat.text} hover:opacity-80 transition-opacity`}
						>
							Read full article
							<svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
							</svg>
						</a>

						{(CATEGORY_RELATED[item.category] ?? []).length > 0 && (
							<>
								<span className="text-[10px] text-neutral-400 dark:text-neutral-500">Explore:</span>
								{(CATEGORY_RELATED[item.category] ?? []).map((tag) => (
									<a
										key={tag.slug}
										href={`/tag/${tag.slug}`}
										className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text} hover:opacity-80 transition-opacity`}
									>
										{tag.label}
									</a>
								))}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Dot navigation */}
			<div className="flex items-center justify-center gap-1.5 mt-2">
				{items.map((_, i) => (
					<button
						key={i}
						aria-label={`Show news item ${i + 1}`}
						onClick={() => advance(i)}
						className={`h-1 rounded-full transition-all duration-300 ${
							i === index
								? 'w-5 bg-neutral-700 dark:bg-neutral-200'
								: 'w-1 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500'
						}`}
					/>
				))}
			</div>
		</section>
	);
};
