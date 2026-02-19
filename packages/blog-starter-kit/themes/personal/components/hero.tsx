import { useState, useEffect } from 'react';
import { useAppContext } from './contexts/appContext';
import { SearchBar } from './search-bar';

const ROTATING_TOPICS = [
	'LLM Engineering',
	'System Design',
	'Machine Learning',
	'Design Patterns',
	'Technical Interviews',
	'Software Architecture',
];

const TERMINAL_LINES = [
	{ prompt: '$', cmd: 'abstract-algo search --topic "system-design"', delay: 0 },
	{ prompt: '>', cmd: 'Found 12 deep-dives · 4 series · 38 articles', delay: 600, muted: true },
	{ prompt: '$', cmd: 'abstract-algo run --series "LLM from Scratch"', delay: 1300 },
	{ prompt: '>', cmd: 'Loading episode 1 of 6… ████████░░ 80%', delay: 1900, muted: true },
	{ prompt: '$', cmd: 'abstract-algo recommend --level senior', delay: 2700 },
	{ prompt: '>', cmd: 'CAP theorem, RAFT consensus, transformer attention', delay: 3300, muted: true },
];

const TerminalWindow = () => {
	const [visibleCount, setVisibleCount] = useState(0);

	useEffect(() => {
		if (visibleCount >= TERMINAL_LINES.length) return;
		const line = TERMINAL_LINES[visibleCount];
		const timer = setTimeout(() => setVisibleCount((n) => n + 1), line.delay + (visibleCount === 0 ? 500 : 0));
		return () => clearTimeout(timer);
	}, [visibleCount]);

	return (
		<div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-950 overflow-hidden shadow-xl shadow-neutral-950/10 dark:shadow-neutral-950/40">
			{/* Title bar */}
			<div className="flex items-center gap-1.5 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
				<span className="w-3 h-3 rounded-full bg-red-500/80" />
				<span className="w-3 h-3 rounded-full bg-yellow-500/80" />
				<span className="w-3 h-3 rounded-full bg-green-500/80" />
				<span className="ml-3 text-xs text-neutral-500 font-mono">abstract-algo — bash</span>
			</div>
			{/* Body */}
			<div className="px-5 py-5 font-mono text-sm space-y-1.5 min-h-[200px]">
				{TERMINAL_LINES.slice(0, visibleCount).map((line, i) => (
					<div key={i} className="flex gap-2">
						<span className={line.prompt === '$' ? 'text-emerald-400' : 'text-neutral-600'}>
							{line.prompt}
						</span>
						<span className={line.muted ? 'text-neutral-500' : 'text-neutral-100'}>
							{line.cmd}
						</span>
					</div>
				))}
				{visibleCount < TERMINAL_LINES.length && (
					<div className="flex gap-2">
						<span className="text-emerald-400">$</span>
						<span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
					</div>
				)}
			</div>
		</div>
	);
};

export const Hero = () => {
	const { publication } = useAppContext();
	const [topicIndex, setTopicIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false);
			setTimeout(() => {
				setTopicIndex((prev) => (prev + 1) % ROTATING_TOPICS.length);
				setIsVisible(true);
			}, 300);
		}, 4000);
		return () => clearInterval(interval);
	}, []);

	return (
		<section className="w-full py-10 md:py-14">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">

				{/* ── Left: Text ──────────────────────────────────────────── */}
				<div className="flex flex-col gap-5">
					<div>
						<h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50">
							Discover the Art of
						</h1>
						<div className="h-14 flex items-center overflow-visible">
							<span
								className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500 transition-opacity duration-300 ${
									isVisible ? 'opacity-100' : 'opacity-0'
								}`}
							>
								{ROTATING_TOPICS[topicIndex]}
							</span>
						</div>
					</div>

					<p className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed [text-wrap:balance]">
						{publication.descriptionSEO || publication.title}
					</p>

					<SearchBar />

					<div className="flex flex-wrap gap-2 mt-1">
						{['System Design', 'Algorithms', 'LLM', 'Architecture'].map((tag) => (
							<span
								key={tag}
								className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
							>
								{tag}
							</span>
						))}
					</div>
				</div>

				{/* ── Right: Terminal ─────────────────────────────────────── */}
				<div className="hidden md:block">
					<TerminalWindow />
				</div>

			</div>
		</section>
	);
};
