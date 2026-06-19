'use client';

import { resizeImage } from '@starter-kit/utils/image';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import request from 'graphql-request';
import { KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import {
	SearchPostsOfPublicationDocument,
	SearchPostsOfPublicationQuery,
	SearchPostsOfPublicationQueryVariables,
} from '../generated/graphql';
import { useAppContext } from './contexts/appContext';
import { ToggleTheme } from './toggle-theme';
import { UserProfile } from './user-profile';
import { AuthModal } from './auth-modal';
import { isNewsletterSubscribeEnabled } from '../lib/features';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const NO_OF_SEARCH_RESULTS = 5;

type SearchPost = SearchPostsOfPublicationQuery['searchPostsOfPublication']['edges'][0]['node'];

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
				aria-label="Search topics and articles"
				className="flex items-center justify-center hover:bg-background border-0"
			>
				<svg
					className="h-6 w-6 text-slate-700 transition-colors hover:text-blue-700 dark:text-neutral-400 dark:hover:text-neutral-100"
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
							placeholder="Search topics, articles..."
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
								<p className="text-xs text-neutral-500 dark:text-neutral-400">Type to search topics and articles...</p>
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
	const router = useRouter();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const isHome = router.pathname === '/';
	const followUrl =
		publication.links?.linkedin ||
		publication.links?.hashnode ||
		`https://hashnode.com/@${publication.author.username}`;
	const newsletterUrl = publication.url ? `${publication.url.replace(/\/$/, '')}/newsletter` : null;
	const navItems = [
		{ label: 'Learn', href: '/learn' },
		{ label: 'Videos', href: '/videos' },
		{ label: 'Series', href: '/series' },
		{ label: 'Blog', href: '/posts' },
	] as const;

	const isActive = (href: string) =>
		href === '/' ? router.pathname === '/' : router.pathname === href || router.pathname.startsWith(`${href}/`);

	useEffect(() => {
		const onScroll = () => setIsScrolled(window.scrollY > 20);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-40 w-full transition-all duration-300 ${
				isHome
					? isScrolled
						? 'border-b border-slate-200 bg-white/92 shadow-sm backdrop-blur'
						: 'border-b border-slate-100 bg-white'
					: isScrolled
					? 'bg-white/85 dark:bg-neutral-950/85 backdrop-blur border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm'
					: 'bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800'
			}`}
		>
			{/* Desktop header */}
			<div className={`mx-auto hidden max-w-[1440px] md:grid grid-cols-[1fr_auto_1fr] items-center px-7 ${isScrolled ? 'py-2.5' : 'py-3'} gap-4`}>
				<div className="justify-self-start">
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
				</div>
				<nav className="justify-self-center flex items-center gap-1">
					{navItems.map((item) => {
						const active = isActive(item.href);
						return (
							<Link
								key={item.label}
								href={item.href}
								className={`relative px-3 py-3 font-sans text-sm font-semibold transition-colors ${
									active
										? 'text-blue-700'
										: isHome
										? 'text-slate-950 hover:text-blue-700'
										: 'text-neutral-600 hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400'
								}`}
							>
								{item.label}
								{active ? <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" /> : null}
							</Link>
						);
					})}
				</nav>
				<div className="justify-self-end flex items-center gap-3">
					<HeaderSearch />
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
			<div className={`mx-auto max-w-[1440px] px-4 md:hidden ${isScrolled ? 'py-2.5' : 'py-3'} flex items-center justify-between`}>
				<button
					onClick={() => setIsMobileMenuOpen(true)}
					aria-label="Open menu"
					className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
				>
					<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<Link href="/" className="mx-2 flex min-w-0 flex-1 items-center gap-2" aria-label={`${publication.author.name}'s blog home page`}>
					{publication.favicon ? (
						<img
							className="h-8 w-8 shrink-0 rounded-lg object-cover"
							alt=""
							src={resizeImage(publication.favicon, { w: 32, h: 32, c: 'face' })}
						/>
					) : (
						<span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-emerald-400 text-sm font-black text-white">
							A
						</span>
					)}
					<span className="min-w-0 leading-none">
						<span className="block truncate text-[12px] font-black uppercase tracking-[0.08em] text-slate-950 dark:text-white">
							Abstract
						</span>
						<span className="block truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 dark:text-neutral-300">
							Algorithms
						</span>
					</span>
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
							<Link
								key={item.label}
								href={item.href}
								onClick={() => setIsMobileMenuOpen(false)}
								className="block rounded-xl border border-neutral-200 px-4 py-3 text-base font-semibold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50"
							>
								{item.label}
							</Link>
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
