import { useEffect, useState } from 'react';
import type { TickerItem } from '../pages/api/ai-tech-ticker';

const POLL_INTERVAL_MS = 60_000;

const CATEGORY_STYLES: Record<string, string> = {
	LLM: 'bg-violet-500/20 text-violet-300',
	Vision: 'bg-sky-500/20 text-sky-300',
	NLP: 'bg-emerald-500/20 text-emerald-300',
	Robotics: 'bg-orange-500/20 text-orange-300',
	'Generative AI': 'bg-pink-500/20 text-pink-300',
	'ML/Research': 'bg-blue-500/20 text-blue-300',
	Hardware: 'bg-yellow-500/20 text-yellow-300',
	Multimodal: 'bg-teal-500/20 text-teal-300',
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

export const AiTechTicker = () => {
	const [item, setItem] = useState<TickerItem | null>(null);
	const [visible, setVisible] = useState(true);

	const fetchItem = async () => {
		try {
			const res = await fetch('/api/ai-tech-ticker');
			if (!res.ok) return;
			const next: TickerItem = await res.json();
			// Fade out → swap content → fade in for a smooth transition
			setVisible(false);
			setTimeout(() => {
				setItem(next);
				setVisible(true);
			}, 300);
		} catch {
			// Fail silently — ticker is non-critical UI
		}
	};

	useEffect(() => {
		fetchItem();
		const id = setInterval(fetchItem, POLL_INTERVAL_MS);
		return () => clearInterval(id);
	}, []);

	if (!item) return null;

	const catStyle =
		CATEGORY_STYLES[item.category] ?? 'bg-neutral-700/50 text-neutral-300';

	const tickerText = `${item.title}  —  ${item.description}`;

	return (
		<div className="w-full bg-neutral-950 border-b border-neutral-800 overflow-hidden h-8 flex items-center">
			<div className="max-w-6xl mx-auto px-5 w-full flex items-center gap-3 h-full">
				{/* Live indicator */}
				<div className="flex items-center gap-1.5 flex-shrink-0 select-none">
					<span className="relative flex h-2 w-2">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
					</span>
					<span className="text-[10px] font-bold text-neutral-200 tracking-[0.15em] uppercase">
						AI
					</span>
				</div>

				{/* Separator */}
				<div className="h-4 w-px bg-neutral-700 flex-shrink-0" />

				{/* Category badge */}
				<span
					className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none whitespace-nowrap ${catStyle}`}
					style={{
						opacity: visible ? 1 : 0,
						transition: 'opacity 0.3s ease',
					}}
				>
					{item.category}
				</span>

				{/* Scrolling text — duplicated to create a seamless loop */}
				<div className="flex-1 overflow-hidden relative h-full flex items-center">
					<div
						className="flex items-center whitespace-nowrap"
						style={{
							animation: 'ai-ticker-scroll 35s linear infinite',
							opacity: visible ? 1 : 0,
							transition: 'opacity 0.3s ease',
						}}
					>
						<span className="text-xs text-neutral-300 px-8">{tickerText}</span>
						<span className="text-xs text-neutral-300 px-8" aria-hidden="true">
							{tickerText}
						</span>
					</div>
				</div>

				{/* Timestamp */}
				<span
					className="flex-shrink-0 text-[10px] text-neutral-500 tabular-nums select-none"
					style={{
						opacity: visible ? 1 : 0,
						transition: 'opacity 0.3s ease',
					}}
				>
					{formatTimeAgo(item.timestamp)}
				</span>
			</div>

			<style>{`
        @keyframes ai-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
		</div>
	);
};
