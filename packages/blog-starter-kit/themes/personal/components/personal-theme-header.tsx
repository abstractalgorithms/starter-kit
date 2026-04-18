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
				<div className="absolute right-0 top-full mt-2 w-80 md:w-96 z-50">
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
											{post.coverImage && (
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

	const navList = (
		<ul className="flex list-none flex-row items-center gap-6 text-sm font-semibold tracking-tight text-neutral-600 dark:text-neutral-300">
			<li>
				<Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					Home
				</Link>
			</li>
			<li>
				<Link href="/posts" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					All Posts
				</Link>
			</li>
			<li>
				<Link href="/series" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					All Series
				</Link>
			</li>
			<li>
				<Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					About
				</Link>
			</li>
		</ul>
	);

	return (
		<header className="w-full bg-white dark:bg-neutral-950">
			<div className="max-w-6xl mx-auto px-5 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
				<h1>
					<Link
						className="flex flex-row items-center gap-3 text-lg font-bold leading-tight tracking-tight text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						href="/"
						aria-label={`${publication.author.name}'s blog home page`}
					>
						{publication.favicon && (
							<img
								className="block h-10 w-10 rounded-full fill-current"
								alt={publication.title}
								src={resizeImage(publication.favicon, {
									w: 40,
									h: 40,
									c: 'face',
								})}
							/>
						)}
						<span>{publication.title}</span>
					</Link>
				</h1>
				<div className="flex items-center gap-4">
					<nav className="hidden md:flex">{navList}</nav>
					<HeaderSearch />
					<ToggleTheme />
				</div>
			</div>
		</header>
	);
};
