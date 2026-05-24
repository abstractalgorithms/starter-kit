import { useEffect, useMemo, useState } from 'react';
import { isNewsletterSubscribeEnabled } from '../lib/features';
import type { PostFullFragment, PublicationFragment } from '../generated/graphql';

type Props = {
	post: PostFullFragment;
	publication: PublicationFragment;
};

const getFollowUrl = (publication: PublicationFragment) =>
	publication.links?.hashnode || `https://hashnode.com/@${publication.author.username}`;

const getNewsletterUrl = (publication: PublicationFragment) =>
	publication.url ? `${publication.url.replace(/\/$/, '')}/newsletter` : null;

export const ArticleEngagement = ({ post, publication }: Props) => {
	const ratingKey = `aa:article-rating:${post.slug}`;
	const followKey = `aa:followed:${publication.id}`;
	const subscribeKey = `aa:subscribed:${publication.id}`;
	const [rating, setRating] = useState<number | null>(null);
	const [hasFollowed, setHasFollowed] = useState(false);
	const [hasSubscribed, setHasSubscribed] = useState(false);
	const [showExitPrompt, setShowExitPrompt] = useState(false);
	const [dismissedExitPrompt, setDismissedExitPrompt] = useState(false);
	const followUrl = useMemo(() => getFollowUrl(publication), [publication]);
	const newsletterUrl = useMemo(() => getNewsletterUrl(publication), [publication]);

	useEffect(() => {
		try {
			const storedRating = Number(localStorage.getItem(ratingKey));
			if (storedRating > 0) setRating(storedRating);
			setHasFollowed(localStorage.getItem(followKey) === '1');
			setHasSubscribed(localStorage.getItem(subscribeKey) === '1');
			setDismissedExitPrompt(localStorage.getItem(`${ratingKey}:dismissed`) === '1');
		} catch {}
	}, [followKey, ratingKey, subscribeKey]);

	useEffect(() => {
		if (rating || dismissedExitPrompt) return;

		const onMouseLeave = (event: MouseEvent) => {
			if (event.clientY <= 8) setShowExitPrompt(true);
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				try {
					localStorage.setItem(`${ratingKey}:seen-exit`, '1');
				} catch {}
			}
		};

		document.addEventListener('mouseleave', onMouseLeave);
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			document.removeEventListener('mouseleave', onMouseLeave);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [dismissedExitPrompt, rating, ratingKey]);

	const rateArticle = (value: number) => {
		setRating(value);
		setShowExitPrompt(false);
		try {
			localStorage.setItem(ratingKey, String(value));
		} catch {}
	};

	const dismissExitPrompt = () => {
		setShowExitPrompt(false);
		setDismissedExitPrompt(true);
		try {
			localStorage.setItem(`${ratingKey}:dismissed`, '1');
		} catch {}
	};

	const followPublication = () => {
		setHasFollowed(true);
		try {
			localStorage.setItem(followKey, '1');
		} catch {}
		window.open(followUrl, '_blank', 'noopener,noreferrer');
	};

	const subscribe = () => {
		setHasSubscribed(true);
		try {
			localStorage.setItem(subscribeKey, '1');
		} catch {}
		if (newsletterUrl) window.open(newsletterUrl, '_blank', 'noopener,noreferrer');
	};

	const RatingButtons = ({ compact = false }: { compact?: boolean }) => (
		<div className={`flex ${compact ? 'gap-1' : 'gap-1.5'}`} role="group" aria-label="Rate this article">
			{[1, 2, 3, 4, 5].map((value) => (
				<button
					key={value}
					type="button"
					onClick={() => rateArticle(value)}
					aria-label={`Rate ${value} out of 5`}
					className={`inline-flex items-center justify-center rounded-lg border font-bold transition-colors ${
						compact ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'
					} ${
						rating === value
							? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
							: 'border-neutral-200 text-neutral-500 hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-violet-300'
					}`}
				>
					{value}
				</button>
			))}
		</div>
	);

	return (
		<>
			<section id="article-feedback" className="mt-8 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
					<div>
						<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
							Reader feedback
						</p>
						<h2 className="mt-1 text-base font-bold text-neutral-950 dark:text-neutral-50">
							Was this article useful?
						</h2>
						<p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
							Rate it before you leave, then follow or subscribe for the next deep dive.
						</p>
						<div className="mt-3">
							<RatingButtons />
						</div>
						{rating ? (
							<p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300">
								Thanks. Your rating was saved on this device.
							</p>
						) : null}
					</div>
					<div className="flex flex-col gap-2 sm:flex-row md:flex-col">
						<button
							type="button"
							onClick={followPublication}
							className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-violet-300"
						>
							{hasFollowed ? 'Following' : 'Follow'} {publication.author.name}
						</button>
						{isNewsletterSubscribeEnabled && newsletterUrl ? (
							<button
								type="button"
								onClick={subscribe}
								className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
							>
								{hasSubscribed ? 'Subscribed' : 'Subscribe'}
							</button>
						) : null}
					</div>
				</div>
			</section>

			{showExitPrompt && !rating ? (
				<div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm font-bold text-neutral-950 dark:text-neutral-50">Before you go</p>
							<p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
								How useful was this article?
							</p>
						</div>
						<button
							type="button"
							onClick={dismissExitPrompt}
							className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
						>
							Close
						</button>
					</div>
					<div className="mt-3 flex items-center justify-between gap-3">
						<RatingButtons compact />
						{isNewsletterSubscribeEnabled && newsletterUrl ? (
							<button
								type="button"
								onClick={subscribe}
								className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
							>
								Subscribe
							</button>
						) : null}
					</div>
				</div>
			) : null}
		</>
	);
};
