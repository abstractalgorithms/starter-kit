import { ReactNode } from 'react';

type Variant = 'info' | 'warning' | 'deep-dive' | 'tip';

type Props = {
	variant?: Variant;
	title?: string;
	children: ReactNode;
};

const VARIANT_STYLES: Record<
	Variant,
	{ wrapper: string; border: string; titleColor: string; iconColor: string; icon: ReactNode }
> = {
	'deep-dive': {
		wrapper: 'bg-blue-50 dark:bg-blue-950/30',
		border: 'border-l-blue-500',
		titleColor: 'text-blue-700 dark:text-blue-300',
		iconColor: 'text-blue-500',
		icon: (
			<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm.75 4.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
			</svg>
		),
	},
	info: {
		wrapper: 'bg-neutral-50 dark:bg-neutral-900',
		border: 'border-l-neutral-400',
		titleColor: 'text-neutral-700 dark:text-neutral-300',
		iconColor: 'text-neutral-500',
		icon: (
			<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
			</svg>
		),
	},
	warning: {
		wrapper: 'bg-amber-50 dark:bg-amber-950/30',
		border: 'border-l-amber-500',
		titleColor: 'text-amber-700 dark:text-amber-300',
		iconColor: 'text-amber-500',
		icon: (
			<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
			</svg>
		),
	},
	tip: {
		wrapper: 'bg-emerald-50 dark:bg-emerald-950/30',
		border: 'border-l-emerald-500',
		titleColor: 'text-emerald-700 dark:text-emerald-300',
		iconColor: 'text-emerald-500',
		icon: (
			<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
			</svg>
		),
	},
};

const VARIANT_LABELS: Record<Variant, string> = {
	'deep-dive': 'Deep Dive',
	info: 'Note',
	warning: 'Warning',
	tip: 'Pro Tip',
};

/**
 * CalloutBlock — visually breaks up article body with a themed aside section.
 *
 * Usage in MDX / custom content:
 *   <CalloutBlock variant="deep-dive" title="How consistent hashing works">
 *     Virtual nodes spread load evenly…
 *   </CalloutBlock>
 *
 * Alternatively, author this directly in the Next.js post page around any
 * hand-crafted section you want to highlight.
 */
export const CalloutBlock = ({ variant = 'deep-dive', title, children }: Props) => {
	const s = VARIANT_STYLES[variant];
	const label = title ?? VARIANT_LABELS[variant];

	return (
		<div
			className={`my-8 rounded-r-xl border border-l-4 ${s.border} border-neutral-200 dark:border-neutral-800 ${s.wrapper} px-5 py-5`}
		>
			<div className="flex items-center gap-2 mb-3">
				<span className={s.iconColor}>{s.icon}</span>
				<span className={`text-xs font-bold uppercase tracking-wide font-mono ${s.titleColor}`}>
					{label}
				</span>
			</div>
			<div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed [&>p]:m-0 [&>p+p]:mt-3">
				{children}
			</div>
		</div>
	);
};
