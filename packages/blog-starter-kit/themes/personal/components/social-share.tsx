'use client';
import { useState } from 'react';

const AI_SHARE_API = '/api/ai-generate-share';

type Platform = 'linkedin' | 'twitter';

type Props = {
	url: string;
	title: string;
	excerpt?: string;
	tags?: string[];
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
	disabled,
	children,
}: {
	onClick?: () => void;
	label: string;
	disabled?: boolean;
	children: React.ReactNode;
}) => (
	<Tooltip label={label}>
		<button
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{children}
		</button>
	</Tooltip>
);

// ── AI Share Modal ────────────────────────────────────────────────────────────

type ModalState =
	| { status: 'idle' }
	| { status: 'loading'; platform: Platform }
	| { status: 'ready'; platform: Platform; content: string }
	| { status: 'error'; platform: Platform; message: string };

const SparkleIcon = () => (
	<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
		<path d="M12 2l2.09 6.41L20.5 9l-5 4.59L17 21l-5-3.91L7 21l1.5-7.41L3.5 9l6.41-.59L12 2z" />
	</svg>
);

const Spinner = () => (
	<svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
	</svg>
);

async function fetchAIShareContent(
	platform: Platform,
	title: string,
	excerpt: string,
	url: string,
	tags: string[],
): Promise<string> {
	const res = await fetch(AI_SHARE_API, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title, excerpt, url, tags, platforms: [platform] }),
	});
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const data = await res.json();
	if (!data.success) throw new Error('API returned failure');
	const text: string = data.content?.[platform] ?? '';
	// Strip surrounding quotes the API sometimes wraps around the content
	return text.replace(/^["']|["']$/g, '').trim();
}

function openPlatform(platform: Platform, content: string, url: string) {
	if (platform === 'twitter') {
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`,
			'_blank',
			'noopener,noreferrer',
		);
	} else {
		// LinkedIn doesn't accept pre-filled text via URL; copy content first, then open
		navigator.clipboard.writeText(content).catch(() => {});
		window.open(
			`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
			'_blank',
			'noopener,noreferrer',
		);
	}
}

const AIShareModal = ({
	modal,
	content,
	onContentChange,
	onClose,
	onPost,
	onCopy,
	copied,
	postUrl,
}: {
	modal: ModalState;
	content: string;
	onContentChange: (v: string) => void;
	onClose: () => void;
	onPost: () => void;
	onCopy: () => void;
	copied: boolean;
	postUrl: string;
}) => {
	if (modal.status === 'idle') return null;

	const platform = modal.platform;
	const isLinkedIn = platform === 'linkedin';

	return (
		<div
			className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
					<div className="flex items-center gap-2">
						<SparkleIcon />
						<span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
							AI-Generated {isLinkedIn ? 'LinkedIn' : 'X / Twitter'} Post
						</span>
					</div>
					<button
						onClick={onClose}
						aria-label="Close"
						className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="px-5 py-4">
					{modal.status === 'loading' && (
						<div className="flex flex-col items-center gap-3 py-8 text-neutral-400">
							<Spinner />
							<span className="text-sm">Generating share content…</span>
						</div>
					)}

					{modal.status === 'error' && (
						<div className="py-6 text-center">
							<p className="text-sm text-red-500 dark:text-red-400">{modal.message}</p>
							<p className="text-xs text-neutral-400 mt-1">Please try again or share manually.</p>
						</div>
					)}

					{modal.status === 'ready' && (
						<>
							<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">
								Preview & edit
							</p>
							<textarea
								value={content}
								onChange={(e) => onContentChange(e.target.value)}
								rows={6}
								className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							{isLinkedIn && (
								<p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1.5">
									✦ Content will be copied to your clipboard — paste it in LinkedIn after opening.
								</p>
							)}
						</>
					)}
				</div>

				{/* Footer */}
				{(modal.status === 'ready' || modal.status === 'error') && (
					<div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
						{modal.status === 'ready' && (
							<button
								onClick={onCopy}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 transition-colors"
							>
								{copied ? (
									<>
										<svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
										</svg>
										Copied!
									</>
								) : (
									<>
										<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
										Copy
									</>
								)}
							</button>
						)}
						<button
							onClick={onPost}
							className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
						>
							{isLinkedIn ? (
								<>
									<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
										<circle cx="4" cy="4" r="2" />
									</svg>
									{modal.status === 'ready' ? 'Copy & Open LinkedIn' : 'Open LinkedIn'}
								</>
							) : (
								<>
									<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
									{modal.status === 'ready' ? 'Post to X' : 'Open X'}
								</>
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

// ── Shared hook ───────────────────────────────────────────────────────────────

function useAIShare(url: string, title: string, excerpt: string, tags: string[]) {
	const [modal, setModal] = useState<ModalState>({ status: 'idle' });
	const [editableContent, setEditableContent] = useState('');
	const [copied, setCopied] = useState(false);

	const openAIShare = async (platform: Platform) => {
		setModal({ status: 'loading', platform });
		setEditableContent('');
		try {
			const text = await fetchAIShareContent(platform, title, excerpt, url, tags);
			setEditableContent(text);
			setModal({ status: 'ready', platform, content: text });
		} catch (err) {
			setModal({
				status: 'error',
				platform,
				message: err instanceof Error ? err.message : 'Failed to generate content.',
			});
		}
	};

	const handlePost = () => {
		if (modal.status === 'idle') return;
		const platform = modal.platform;
		if (platform === 'linkedin') {
			navigator.clipboard.writeText(editableContent).catch(() => {});
		}
		openPlatform(platform, editableContent, url);
		setModal({ status: 'idle' });
	};

	const handleCopy = async () => {
		await navigator.clipboard.writeText(editableContent);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const closeModal = () => setModal({ status: 'idle' });

	return { modal, editableContent, setEditableContent, copied, openAIShare, handlePost, handleCopy, closeModal };
}

// ── SocialShare (desktop sticky sidebar) ─────────────────────────────────────

export const SocialShare = ({ url, title, excerpt = '', tags = [] }: Props) => {
	const [linkCopied, setLinkCopied] = useState(false);
	const { modal, editableContent, setEditableContent, copied, openAIShare, handlePost, handleCopy, closeModal } =
		useAIShare(url, title, excerpt, tags);

	const copyLink = async () => {
		await navigator.clipboard.writeText(url);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000);
	};

	const isLoading = modal.status === 'loading';

	return (
		<>
			<AIShareModal
				modal={modal}
				content={editableContent}
				onContentChange={setEditableContent}
				onClose={closeModal}
				onPost={handlePost}
				onCopy={handleCopy}
				copied={copied}
				postUrl={url}
			/>

			<aside className="hidden lg:flex flex-col items-center gap-3 sticky top-24 self-start pt-1">
				<span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-1">
					Share
				</span>

				{/* X / Twitter – AI share */}
				<Tooltip label="AI Share on X / Twitter">
					<button
						onClick={() => openAIShare('twitter')}
						disabled={isLoading}
						aria-label="AI Share on X / Twitter"
						className="w-9 h-9 relative flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading && modal.platform === 'twitter' ? (
							<Spinner />
						) : (
							<>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
								<span className="absolute -top-1 -right-1 text-yellow-400">
									<SparkleIcon />
								</span>
							</>
						)}
					</button>
				</Tooltip>

				{/* LinkedIn – AI share */}
				<Tooltip label="AI Share on LinkedIn">
					<button
						onClick={() => openAIShare('linkedin')}
						disabled={isLoading}
						aria-label="AI Share on LinkedIn"
						className="w-9 h-9 relative flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isLoading && modal.platform === 'linkedin' ? (
							<Spinner />
						) : (
							<>
								<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
									<circle cx="4" cy="4" r="2" />
								</svg>
								<span className="absolute -top-1 -right-1 text-yellow-400">
									<SparkleIcon />
								</span>
							</>
						)}
					</button>
				</Tooltip>

				{/* Copy link */}
				<IconBtn label={linkCopied ? 'Copied!' : 'Copy link'} onClick={copyLink}>
					{linkCopied ? (
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
		</>
	);
};

// ── MobileShareBar ────────────────────────────────────────────────────────────

export const MobileShareBar = ({ url, title, excerpt = '', tags = [] }: Props) => {
	const [linkCopied, setLinkCopied] = useState(false);
	const [saved, setSaved] = useState(false);
	const [showMore, setShowMore] = useState(false);
	const { modal, editableContent, setEditableContent, copied, openAIShare, handlePost, handleCopy, closeModal } =
		useAIShare(url, title, excerpt, tags);

	const copyLink = async () => {
		await navigator.clipboard.writeText(url);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000);
	};

	const isLoading = modal.status === 'loading';

	const savePost = () => {
		try {
			const key = 'aa:saved-post-urls';
			const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
			const next = Array.from(new Set([url, ...existing])).slice(0, 200);
			localStorage.setItem(key, JSON.stringify(next));
			setSaved(true);
		} catch {
			setSaved(true);
		}
	};

	const nativeShare = async () => {
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				await navigator.share({ title, text: excerpt || title, url });
				return;
			} catch {}
		}
		await copyLink();
	};

	const goToHelpful = () => {
		document.getElementById('article-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	const askAi = () => {
		window.location.href = `/learn?q=${encodeURIComponent(title)}`;
	};

	return (
		<>
			<AIShareModal
				modal={modal}
				content={editableContent}
				onContentChange={setEditableContent}
				onClose={closeModal}
				onPost={handlePost}
				onCopy={handleCopy}
				copied={copied}
				postUrl={url}
			/>

			{/* Mobile action strip — compact single row */}
			<div className="relative lg:hidden mt-8 mb-2 py-3 border-t border-neutral-100 dark:border-neutral-800">
				<div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
					<button
						onClick={savePost}
						className="h-8 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300"
					>
						{saved ? 'Saved' : 'Save'}
					</button>
					<button
						onClick={nativeShare}
						className="h-8 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300"
					>
						{linkCopied ? 'Copied' : 'Share'}
					</button>
					<button
						onClick={goToHelpful}
						className="h-8 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300"
					>
						Helpful
					</button>
					<button
						onClick={askAi}
						className="h-8 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300"
					>
						Ask AI
					</button>
					<button
						onClick={() => setShowMore((prev) => !prev)}
						className="h-8 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300"
					>
						More
					</button>
				</div>

				{showMore ? (
					<div className="absolute right-0 top-full mt-2 z-20 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 shadow-xl flex items-center gap-1.5">
						<button
							onClick={() => openAIShare('twitter')}
							disabled={isLoading}
							aria-label="AI Share on X / Twitter"
							className="relative w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
						>
							{isLoading && modal.platform === 'twitter' ? <Spinner /> : <span className="text-[11px] font-semibold">X</span>}
						</button>
						<button
							onClick={() => openAIShare('linkedin')}
							disabled={isLoading}
							aria-label="AI Share on LinkedIn"
							className="relative w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
						>
							{isLoading && modal.platform === 'linkedin' ? <Spinner /> : <span className="text-[11px] font-semibold">in</span>}
						</button>
					</div>
				) : null}
			</div>
		</>
	);
};
