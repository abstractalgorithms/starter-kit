import Link from 'next/link';
import {
	buildAdaptiveRecommendations,
	buildContextualMentorPrompt,
	buildProactiveMentorNudges,
	mentorHref,
	useLearningMemoryStore,
} from '../lib/learning-memory';
import { CTAButton, CTALink } from './cta-system';

type MentorPost = {
	title: string;
	slug: string;
	brief?: string;
	readTimeInMinutes?: number;
	tags?: Array<{ name: string; slug: string }> | null;
};

type Props = {
	contextTitle: string;
	concept?: string;
	section?: string;
	posts?: MentorPost[];
	compact?: boolean;
	className?: string;
};

export const EmbeddedAIMentor = ({
	contextTitle,
	concept,
	section,
	posts = [],
	compact = false,
	className = '',
}: Props) => {
	const memory = useLearningMemoryStore();
	const recommendations = buildAdaptiveRecommendations(memory, posts);
	const nudges = buildProactiveMentorNudges(memory, recommendations);
	const target = concept || section || contextTitle;
	const askPrompt = buildContextualMentorPrompt({
		intent: 'explain',
		title: contextTitle,
		concept,
		section,
		memory,
	});
	const tradeoffPrompt = buildContextualMentorPrompt({
		intent: 'tradeoff',
		title: contextTitle,
		concept,
		section,
		memory,
	});
	const continuePrompt = buildContextualMentorPrompt({
		intent: 'continue',
		title: contextTitle,
		concept,
		section,
		memory,
	});

	const openInlineMentor = () => {
		window.dispatchEvent(
			new CustomEvent('open-chatbot', {
				detail: {
					question: askPrompt,
				},
			}),
		);
	};

	return (
		<section
			className={`rounded-2xl border border-violet-200 bg-violet-50/70 p-4 font-sans shadow-sm dark:border-violet-900 dark:bg-violet-950/20 ${className}`}
			aria-label="Embedded AI Mentor"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
						AI Mentor
					</p>
					<h2 className={`${compact ? 'text-base' : 'text-lg'} mt-1 font-extrabold tracking-normal text-neutral-950 dark:text-neutral-50`}>
						{target}
					</h2>
					<p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
						Uses your learning memory, current context, weak areas, and prior sessions.
					</p>
				</div>
				<CTAButton type="button" level={1} size="sm" onClick={openInlineMentor}>
					Ask in Context
				</CTAButton>
			</div>

			<div className="mt-3 grid gap-2">
				{nudges.slice(0, compact ? 2 : 3).map((nudge) => (
					<Link
						key={nudge.id}
						href={nudge.href}
						className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 transition-colors hover:border-violet-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/70 dark:hover:border-violet-700"
					>
						<p className="text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-50">{nudge.message}</p>
						<p className="mt-1 text-xs font-bold text-violet-700 dark:text-violet-300">{nudge.cta}</p>
					</Link>
				))}
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				<CTALink href={mentorHref(continuePrompt)} level={2} size="sm">
					Continue Learning
				</CTALink>
				<CTALink href={mentorHref(tradeoffPrompt)} level={3} size="sm">
					Practice Tradeoffs
				</CTALink>
				<CTALink href={`/assistant?q=${encodeURIComponent(`Recommend simulations and interview drills for ${target}`)}`} level={3} size="sm">
					Next Drill
				</CTALink>
			</div>
		</section>
	);
};
