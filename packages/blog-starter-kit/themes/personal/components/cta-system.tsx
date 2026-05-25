import Link from 'next/link';
import { useState } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

export type CtaLevel = 1 | 2 | 3 | 4;
export type CtaSize = 'sm' | 'md' | 'lg' | 'icon';

const cx = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(' ');

const base =
	'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 dark:focus-visible:ring-offset-neutral-950';

const sizeClass: Record<CtaSize, string> = {
	sm: 'px-3 py-1.5 text-xs',
	md: 'px-4 py-2 text-sm',
	lg: 'px-5 py-3 text-sm',
	icon: 'h-10 w-10 p-0 text-sm',
};

const levelClass: Record<CtaLevel, string> = {
	1: 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:from-violet-700 hover:to-blue-700 hover:shadow-violet-500/30 active:scale-[0.99]',
	2: 'border border-neutral-200 bg-white text-neutral-800 shadow-sm hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50/50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:border-violet-700 dark:hover:text-violet-300 dark:hover:bg-violet-950/20',
	3: 'text-violet-700 hover:bg-violet-50 hover:text-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/30 dark:hover:text-violet-200',
	4: 'text-neutral-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-violet-700 dark:text-neutral-400 dark:hover:text-violet-300',
};

export const CTAButton = ({
	level,
	size = 'md',
	className,
	children,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	level: CtaLevel;
	size?: CtaSize;
}) => (
	<button className={cx(base, sizeClass[size], levelClass[level], className)} {...props}>
		{children}
	</button>
);

export const CTALink = ({
	level,
	size = 'md',
	className,
	children,
	...props
}: ComponentProps<typeof Link> & {
	level: CtaLevel;
	size?: CtaSize;
	className?: string;
}) => (
	<Link className={cx(base, sizeClass[size], levelClass[level], className)} {...props}>
		{children}
	</Link>
);

export const CTAAnchor = ({
	level,
	size = 'md',
	className,
	children,
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
	level: CtaLevel;
	size?: CtaSize;
}) => (
	<a className={cx(base, sizeClass[size], levelClass[level], className)} {...props}>
		{children}
	</a>
);

export const CTAMenu = ({
	label = 'More actions',
	children,
	className,
}: {
	label?: string;
	children: ReactNode;
	className?: string;
}) => {
	const [open, setOpen] = useState(false);

	return (
		<div className={cx('relative inline-flex', className)}>
			<CTAButton
				type="button"
				level={2}
				size="md"
				aria-haspopup="menu"
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
			>
				{label}
			</CTAButton>
			{open ? (
				<div
					role="menu"
					className="absolute right-0 top-full z-40 mt-2 min-w-48 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
				>
					{children}
				</div>
			) : null}
		</div>
	);
};
