'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { resizeImage } from '@starter-kit/utils/image';
import Image from 'next/image';
import Link from 'next/link';
import request from 'graphql-request';
import { KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import {
	SearchPostsOfPublicationDocument,
	SearchPostsOfPublicationQuery,
	SearchPostsOfPublicationQueryVariables,
	PublicationNavbarItem,
} from '../generated/graphql';
import { useAppContext } from './contexts/appContext';
import { ToggleTheme } from './toggle-theme';
import { UserProfile } from './user-profile';
import { AuthModal } from './auth-modal';
import { isNewsletterSubscribeEnabled } from '../lib/features';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const NO_OF_SEARCH_RESULTS = 5;

type SearchPost = SearchPostsOfPublicationQuery['searchPostsOfPublication']['edges'][0]['node'];

function hasUrl(
	navbarItem: PublicationNavbarItem,
): navbarItem is PublicationNavbarItem & { url: string } {
	return !!navbarItem.url && navbarItem.url.length > 0;
}

const HeaderSearch = () => {
	const { publication } = useAppContext();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchPost[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const close = () => {
		setIsOpen(false);
		setQuery('');
		setResults([]);
	};

	useEffect(() => {
		if (isOpen) inputRef.current?.focus();
	}, [isOpen]);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				close();
			}
		};
		if (isOpen) document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [isOpen]);

	const search = useCallback(
		async (q: string) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (!q) {
				setResults([]);
				return;
			}
			timerRef.current = setTimeout(async () => {
				setIsSearching(true);
				try {
					const data = await request<
						SearchPostsOfPublicationQuery,
						SearchPostsOfPublicationQueryVariables
					>(GQL_ENDPOINT, SearchPostsOfPublicationDocument, {
						first: NO_OF_SEARCH_RESULTS,
						filter: { query: q, publicationId: publication.id },
					});
					setResults(data.searchPostsOfPublication.edges.map((e) => e.node));
				} catch {
					setResults([]);
				}
				setIsSearching(false);
			}, 400);
		},
		[publication.id],
	);

	useEffect(() => {
		search(query);
	}, [query, search]);

	const onKeyUp: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key === 'Escape') close();
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				onClick={() => setIsOpen((o) => !o)}
				aria-label="Search articles"
				className="flex items-center justify-center hover:bg-background border-0"
			>
				<svg
					className="w-6 h-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.25rem)] md:w-96 md:max-w-none z-50">
					<div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden">
						<input
							ref={inputRef}
							type="text"
							placeholder="Search articles…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyUp={onKeyUp}
							className="w-full px-4 py-3 text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none"
						/>

						{isSearching && (
							<div className="p-4 space-y-3">
								{[1, 2, 3].map((i) => (
									<div key={i} className="flex gap-3 items-start">
										<div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse flex-shrink-0" />
										<div className="flex-1 space-y-2">
											<div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse w-3/4" />
											<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse w-full" />
										</div>
									</div>
								))}
							</div>
						)}

						{!isSearching && results.length > 0 && (
							<ul className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
								{results.map((post) => (
									<li key={post.id}>
										<Link
											href={`/${post.slug}`}
											onClick={close}
											className="flex gap-3 items-start px-4 py-3 hover:bg-blue-50 dark:hover:bg-neutral-800/50 transition-colors"
										>
											{post.coverImage?.url && (
												<Image
													src={resizeImage(post.coverImage.url, { w: 48, h: 48, c: 'thumb' })}
													alt={post.title}
													width={48}
													height={48}
													className="w-12 h-12 rounded object-cover flex-shrink-0"
												/>
											)}
											<div className="min-w-0">
												<p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
													{post.title}
												</p>
												<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
													{post.brief}
												</p>
											</div>
										</Link>
									</li>
								))}
							</ul>
						)}

						{!isSearching && results.length === 0 && query && (
							<div className="px-4 py-6 text-center">
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									No results for{' '}
									<span className="font-semibold text-neutral-900 dark:text-neutral-200">
										&quot;{query}&quot;
									</span>
								</p>
							</div>
						)}

						{!query && (
							<div className="px-4 py-4 text-center">
								<p className="text-xs text-neutral-500 dark:text-neutral-400">Type to search articles…</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export const PersonalHeader = () => {
	const { publication } = useAppContext();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const followUrl =
		publication.links?.linkedin ||
		publication.links?.hashnode ||
		`https://hashnode.com/@${publication.author.username}`;
	const newsletterUrl = publication.url ? `${publication.url.replace(/\/$/, '')}/newsletter` : null;
	const navItems = [
		{
			label: 'Articles',
			href: '/posts',
			items: [
				{ label: 'Latest Articles', href: '/posts', description: 'Canonical engineering deep dives' },
				{ label: 'Popular Deep Dives', href: '/posts?sort=popular-desc', description: 'What engineers are reading most' },
				{ label: 'Recently Updated', href: '/posts?sort=updated-desc', description: 'Freshly revised systems ideas' },
				{ label: 'Series', href: '/series', description: 'Author-curated reading sequences' },
			],
		},
		{
			label: 'Explore',
			href: '/discover',
			items: [
				{ label: 'Concept Collections', href: '/discover#topic-collections', description: 'Article-backed systems themes' },
				{ label: 'Related Systems', href: '/discover', description: 'Follow adjacent engineering ideas' },
				{ label: 'Architecture Deep Dives', href: '/posts?sort=popular-desc', description: 'Durable systems essays and patterns' },
			],
		},
		{
			label: 'Practice',
			href: '/visualizations',
			items: [
				{ label: 'System Behavior', href: '/visualizations', description: 'Small simulations for difficult tradeoffs' },
				{ label: 'Architecture Prompts', href: '/assistant?q=architecture%20tradeoff%20question', description: 'Reason through design choices' },
				{ label: 'Failure Cases', href: '/assistant?q=production%20failure%20reasoning', description: 'Practice operational judgment' },
			],
		},
		{
			label: 'AI Mentor',
			href: '/assistant',
			items: [
				{ label: 'Next Step', href: '/assistant?q=recommend%20what%20I%20should%20learn%20next', description: 'Continue from your current context' },
				{ label: 'Weak Areas', href: '/assistant?q=identify%20my%20weak%20engineering%20concepts', description: 'Find gaps and prerequisites' },
				{ label: 'Explain a Concept', href: '/assistant', description: 'Get a clearer model at your depth' },
				{ label: 'Compare Tradeoffs', href: '/assistant?q=compare%20architecture%20tradeoffs', description: 'Reason through competing designs' },
			],
		},
	] as const;
	const trackLinks = [
		{ label: 'Distributed Systems', href: '/topic/distributed-systems' },
		{ label: 'AI Systems', href: '/topic/ai-systems' },
		{ label: 'System Design', href: '/topic/system-design' },
		{ label: 'Probabilistic Data Structures', href: '/topic/probabilistic-data-structures' },
	];

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 20);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-40 w-full transition-all duration-300 ${
				isScrolled
					? 'bg-white/85 dark:bg-neutral-950/85 backdrop-blur border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm'
					: 'bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800'
			}`}
		>
			{/* Desktop header */}
			<div className={`mx-auto hidden max-w-[1440px] md:grid grid-cols-[1fr_auto_1fr] items-center px-7 ${isScrolled ? 'py-2.5' : 'py-3'} gap-4`}>
				<h1 className="justify-self-start">
					<Link
						className="flex flex-row items-center gap-3 hover:opacity-90 transition-opacity"
						href="/"
						aria-label={`${publication.author.name}'s blog home page`}
					>
						{publication.favicon ? (
							<img
								className="block h-10 w-10 rounded-full fill-current"
								alt={publication.title}
								src={resizeImage(publication.favicon, {
									w: 40,
									h: 40,
									c: 'face',
								})}
							/>
						) : (
							<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-emerald-400 text-lg font-black text-white shadow-lg shadow-violet-500/20">
								A
							</span>
						)}
						<div className="flex flex-col leading-tight">
							<span className="text-lg font-extrabold tracking-tight text-black dark:text-white">
								{publication.title}
							</span>
						</div>
					</Link>
				</h1>
				<nav className="justify-self-center flex items-center gap-1">
					{navItems.map((item) => (
						<DropdownMenu.Root key={item.label}>
							<DropdownMenu.Trigger asChild>
								<button
									type="button"
									className="rounded-lg px-3 py-1.5 font-sans text-sm font-semibold text-neutral-600 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-700 dark:text-neutral-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 dark:data-[state=open]:bg-blue-950/30 dark:data-[state=open]:text-blue-300"
								>
									{item.label}
								</button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									align="center"
									sideOffset={10}
									collisionPadding={16}
									className="aa-nav-dropdown z-50 w-[21rem] rounded-2xl border border-neutral-200/80 bg-white/95 p-2.5 text-neutral-900 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 dark:text-neutral-50"
								>
									{item.items.map((child) => (
										<DropdownMenu.Item key={child.label} asChild>
											<Link
												href={child.href}
												className="group block rounded-xl px-3.5 py-3 outline-none transition-colors hover:bg-blue-50 focus:bg-blue-50 dark:hover:bg-neutral-900 dark:focus:bg-neutral-900"
											>
												<span className="block text-[0.93rem] font-bold leading-5 tracking-normal text-neutral-950 group-hover:text-blue-700 dark:text-neutral-50 dark:group-hover:text-blue-300">{child.label}</span>
												<span className="mt-1 block text-[0.78rem] font-medium leading-5 tracking-normal text-neutral-500 dark:text-neutral-400">{child.description}</span>
											</Link>
										</DropdownMenu.Item>
									))}
									<DropdownMenu.Arrow className="fill-white dark:fill-neutral-950" />
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					))}
				</nav>
				<div className="justify-self-end flex items-center gap-3">
					<HeaderSearch />
					<a
						href={followUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="hidden rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-violet-300 lg:inline-flex"
					>
						Follow
					</a>
					{isNewsletterSubscribeEnabled && newsletterUrl ? (
						<a
							href={newsletterUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="hidden rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 lg:inline-flex"
						>
							Subscribe
						</a>
					) : null}
					<ToggleTheme />
					<UserProfile onLoginClick={() => setIsAuthModalOpen(true)} />
				</div>
			</div>

			{/* Mobile header */}
			<div className={`md:hidden max-w-7xl mx-auto px-4 ${isScrolled ? 'py-2.5' : 'py-3'} flex items-center justify-between`}>
				<button
					onClick={() => setIsMobileMenuOpen(true)}
					aria-label="Open menu"
					className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<Link href="/" className="inline-flex items-center gap-2">
					{publication.favicon ? (
						<img
							className="h-8 w-8 rounded-full"
							alt={publication.title}
							src={resizeImage(publication.favicon, { w: 32, h: 32, c: 'face' })}
						/>
					) : (
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-emerald-400 text-sm font-black text-white">
							A
						</span>
					)}
				</Link>
				<div className="flex items-center gap-2">
					<HeaderSearch />
					<UserProfile onLoginClick={() => setIsAuthModalOpen(true)} />
				</div>
			</div>

			{/* Mobile full-screen menu */}
			{isMobileMenuOpen ? (
				<div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-neutral-950 p-5 overflow-y-auto">
					<div className="flex items-center justify-between">
						<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Navigation</p>
						<button
							onClick={() => setIsMobileMenuOpen(false)}
							className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-300"
						>
							Close
						</button>
					</div>
					<div className="mt-6 space-y-2">
						{navItems.map((item) => (
							<div key={item.label} className="rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
								<p className="block text-base font-semibold text-neutral-900 dark:text-neutral-50">
									{item.label}
								</p>
								<div className="mt-3 grid gap-2">
									{item.items.map((child) => (
										<Link
											key={child.label}
											href={child.href}
											onClick={() => setIsMobileMenuOpen(false)}
											className="block rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
										>
											{child.label}
										</Link>
									))}
								</div>
							</div>
						))}
						<a
							href={followUrl}
							target="_blank"
							rel="noopener noreferrer"
							onClick={() => setIsMobileMenuOpen(false)}
							className="block rounded-xl border border-neutral-200 px-4 py-3 text-base font-medium text-neutral-800 dark:border-neutral-800 dark:text-neutral-100"
						>
							Follow {publication.author.name}
						</a>
						{isNewsletterSubscribeEnabled && newsletterUrl ? (
							<a
								href={newsletterUrl}
								target="_blank"
								rel="noopener noreferrer"
								onClick={() => setIsMobileMenuOpen(false)}
								className="block rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white"
							>
								Subscribe
							</a>
						) : null}
					</div>
				</div>
			) : null}

			<AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
		</header>
	);
};
