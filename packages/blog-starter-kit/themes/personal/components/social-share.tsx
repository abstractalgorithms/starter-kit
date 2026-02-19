'use client';
import { useState } from 'react';

type Props = {
	url: string;
	title: string;
};

const Tooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
	<div className="relative group/tip flex justify-center">
		{children}
		<span className="pointer-events-none absolute left-full ml-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-neutral-900 dark:bg-neutral-100 px-2 py-1 text-xs text-white dark:text-neutral-900 font-medium opacity-0 group-hover/tip:opacity-100 transition-opacity z-50">
			{label}
		</span>
	</div>
);

const IconBtn = ({
	onClick,
	label,
	children,
}: {
	onClick?: () => void;
	label: string;
	children: React.ReactNode;
}) => (
	<Tooltip label={label}>
		<button
			onClick={onClick}
			aria-label={label}
			className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all"
		>
			{children}
		</button>
	</Tooltip>
);

export const SocialShare = ({ url, title }: Props) => {
	const [copied, setCopied] = useState(false);

	const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
	const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
	const hnHref = `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`;

	const copyLink = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<aside className="hidden lg:flex flex-col items-center gap-3 sticky top-24 self-start pt-1">
			{/* Divider label */}
			<span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 rotate-0 mb-1">
				Share
			</span>

			<IconBtn label="Share on X / Twitter">
				<a href={twitterHref} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="flex">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
					</svg>
				</a>
			</IconBtn>

			<IconBtn label="Share on LinkedIn">
				<a href={linkedinHref} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="flex">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
						<circle cx="4" cy="4" r="2" />
					</svg>
				</a>
			</IconBtn>

			<IconBtn label="Post to Hacker News">
				<a href={hnHref} target="_blank" rel="noopener noreferrer" aria-label="Post to Hacker News" className="flex">
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896H6.95z" />
					</svg>
				</a>
			</IconBtn>

			<IconBtn label={copied ? 'Copied!' : 'Copy link'} onClick={copyLink}>
				{copied ? (
					<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				) : (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
				)}
			</IconBtn>
		</aside>
	);
};
