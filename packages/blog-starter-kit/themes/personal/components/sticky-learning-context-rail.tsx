import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isInterviewPrepEnabled } from '../lib/features';
import { learningContextLabel } from '../lib/learning-context';
import { buildContextualMentorPrompt, mentorHref, useLearningMemoryStore } from '../lib/learning-memory';
import { ContextualBreadcrumbs } from './contextual-breadcrumbs';
import { CTAButton, CTALink, CTAMenu } from './cta-system';
import { useLearningContext } from './learning-context-provider';

export const StickyLearningContextRail = () => {
	const router = useRouter();
	const { context, positions, getContextHref, buildPrompt } = useLearningContext();
	const learningMemory = useLearningMemoryStore();
	const [isCollapsed, setIsCollapsed] = useState(false);

	useEffect(() => {
		try {
			setIsCollapsed(localStorage.getItem('aa:learning-context-rail-collapsed') === '1');
		} catch {}
	}, []);

	const setCollapsed = (value: boolean) => {
		setIsCollapsed(value);
		try {
			localStorage.setItem('aa:learning-context-rail-collapsed', value ? '1' : '0');
		} catch {}
	};

	const askAi = () => {
		window.dispatchEvent(
			new CustomEvent('open-chatbot', {
				detail: {
					question: buildPrompt('Explain what I should focus on next from my current learning context.'),
				},
			}),
		);
	};

	const resumeHref = getContextHref('continue');
	const simulationHref = getContextHref('simulation');
	const roadmapHref = getContextHref('roadmap');
	const tradeoffHref = mentorHref(
		buildContextualMentorPrompt({
			intent: 'tradeoff',
			title: context.title,
			concept: context.concept,
			section: context.sectionTitle,
			memory: learningMemory,
		}),
	);
	const hasPosition = !!positions[context.pathname]?.updatedAt;
	const isIndividualPage = router.pathname === '/[slug]';

	// Render only on individual slug pages.
	if (!isIndividualPage) {
		return null;
	}

	return (
		<>
			<aside
				className={`fixed right-4 top-24 z-30 hidden max-h-[calc(100vh-8rem)] rounded-2xl border border-neutral-200 bg-white font-sans shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition-all dark:border-neutral-800 dark:bg-neutral-900 lg:block xl:hidden ${
					isCollapsed ? 'w-14 p-2.5' : 'w-72 p-4'
				}`}
				aria-label="Learning context"
			>
				<div className="flex items-start justify-between gap-3">
					{!isCollapsed ? (
						<div className="min-w-0">
							<p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Learning Context</p>
							<p className="mt-1 line-clamp-2 text-sm font-semibold leading-relaxed text-neutral-900 dark:text-neutral-50">
								{learningContextLabel(context)}
							</p>
						</div>
					) : null}
					<button
						type="button"
						onClick={() => setCollapsed(!isCollapsed)}
						aria-label={isCollapsed ? 'Expand learning context rail' : 'Collapse learning context rail'}
						className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-500 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-300"
					>
						{isCollapsed ? 'LC' : '×'}
					</button>
				</div>

				{!isCollapsed ? (
					<>
						<div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
							<ContextualBreadcrumbs compact />
							{context.sectionTitle ? (
								<p className="mt-2 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
									Current section:{' '}
									<span className="font-medium text-neutral-800 dark:text-neutral-100">{context.sectionTitle}</span>
								</p>
							) : null}
						</div>
						<div className="mt-3 grid gap-2">
							<CTAButton
								type="button"
								onClick={askAi}
								level={2}
								size="md"
							>
								Ask AI
							</CTAButton>
							<CTALink href={resumeHref} level={3} size="md" className="justify-start">
								{hasPosition ? 'Continue Learning' : 'Open Current Context'}
							</CTALink>
							<CTAMenu label="More context actions">
								<CTALink href={roadmapHref} level={3} size="sm" className="w-full justify-start">Open Learning Graph</CTALink>
								<CTALink href={simulationHref} level={3} size="sm" className="w-full justify-start">Launch Simulation</CTALink>
								<CTALink href={tradeoffHref} level={3} size="sm" className="w-full justify-start">Practice Tradeoffs</CTALink>
								{isInterviewPrepEnabled ? (
									<CTALink href="/interview-prep" level={3} size="sm" className="w-full justify-start">Practice Interview</CTALink>
								) : null}
							</CTAMenu>
						</div>
					</>
				) : null}
			</aside>
		</>
	);
};
