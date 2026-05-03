import { AiTechTicker } from './ai-tech-ticker';
import { TriviaOfDayCard } from './trivia-of-day';

export const EngagementSidebar = () => {
	return (
		<aside className="hidden lg:block w-80 flex-shrink-0 overflow-hidden">
			{/* Sticky container for engagement widgets */}
			<div className="sticky top-20 space-y-6 overflow-hidden">
				{/* AI Tech Ticker */}
				<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden p-4 w-full max-w-80">
					<AiTechTicker />
				</div>

				{/* Trivia of the Day */}
				<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 overflow-hidden p-4 w-full max-w-80">
					<TriviaOfDayCard />
				</div>
			</div>
		</aside>
	);
};
