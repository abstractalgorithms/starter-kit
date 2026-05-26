import Link from 'next/link';
import { buildLearningCrumbs } from '../lib/learning-context';
import { useLearningContext } from './learning-context-provider';

export const ContextualBreadcrumbs = ({ compact = false }: { compact?: boolean }) => {
	const { context } = useLearningContext();
	const crumbs = buildLearningCrumbs(context);
	const visibleCrumbs = compact ? crumbs.slice(-3) : crumbs;

	return (
		<nav
			aria-label="Learning context"
			className={`flex min-w-0 max-w-full items-center gap-x-1.5 gap-y-1 ${compact ? 'flex-wrap text-[12px]' : 'text-sm'}`}
		>
			{visibleCrumbs.map((crumb, index) => {
				const isLast = index === visibleCrumbs.length - 1;
				const content = (
					<span
						className={`truncate ${compact ? 'max-w-[9rem]' : 'max-w-[14rem]'} ${
							isLast ? 'font-semibold text-neutral-900 dark:text-neutral-50' : 'font-medium text-neutral-500 dark:text-neutral-400'
						}`}
					>
						{crumb.label}
					</span>
				);
				return (
					<span key={`${crumb.label}-${index}`} className="inline-flex min-w-0 max-w-full items-center gap-1">
						{crumb.href && !isLast ? (
							<Link href={crumb.href} className="min-w-0 max-w-full hover:text-violet-700 dark:hover:text-violet-300">
								{content}
							</Link>
						) : (
							<span className="min-w-0 max-w-full">{content}</span>
						)}
						{!isLast ? <span className="text-neutral-300 dark:text-neutral-700">/</span> : null}
					</span>
				);
			})}
		</nav>
	);
};
