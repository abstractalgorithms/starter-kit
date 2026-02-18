import { resizeImage } from '@starter-kit/utils/image';
import request from 'graphql-request';
import Link from 'next/link';
import { KeyboardEventHandler, useEffect, useRef, useState } from 'react';
import {
	SearchPostsOfPublicationDocument,
	SearchPostsOfPublicationQuery,
	SearchPostsOfPublicationQueryVariables,
} from '../generated/graphql';
import { useAppContext } from './contexts/appContext';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const NO_OF_SEARCH_RESULTS = 5;

type Post = SearchPostsOfPublicationQuery['searchPostsOfPublication']['edges'][0]['node'];

export const SearchBar = () => {
	const { publication } = useAppContext();

	const searchInputRef = useRef<HTMLInputElement>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const [query, setQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Post[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [showResults, setShowResults] = useState(false);

	const resetInput = () => {
		if (!searchInputRef.current) return;
		searchInputRef.current.value = '';
		setQuery('');
		setShowResults(false);
	};

	const escapeSearchOnESC: KeyboardEventHandler<HTMLInputElement> = (e) => {
		if (e.key === 'Escape') {
			resetInput();
		}
	};

	const updateSearchQuery = () => {
		setQuery(searchInputRef.current?.value || '');
		setShowResults(true);
	};

	const search = async (query: string) => {
		if (timerRef.current) clearTimeout(timerRef.current);

		if (!query) {
			setSearchResults([]);
			setShowResults(false);
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
					filter: { query, publicationId: publication.id },
				});
				const posts = data.searchPostsOfPublication.edges.map((edge) => edge.node);
				setSearchResults(posts);
			} catch (error) {
				console.error('Search error:', error);
				setSearchResults([]);
			}
			setIsSearching(false);
		}, 500);
	};

	useEffect(() => {
		search(query);
	}, [query]);

	const searchResultsList = searchResults.map((post, index) => {
		const postURL = `/${post.slug}`;
		return (
			<Link
				key={post.id}
				href={postURL}
				className={`flex flex-row items-start gap-4 px-4 py-4 hover:bg-blue-50 dark:hover:bg-neutral-800/50 transition-colors ${
					index < searchResults.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
				}`}
				onClick={() => resetInput()}
			>
				{post.coverImage && (
					<img
						src={resizeImage(post.coverImage.url, {
							w: 80,
							h: 80,
							c: 'thumb',
						})}
						alt={post.title}
						className="w-20 h-20 rounded-md object-cover flex-shrink-0"
					/>
				)}
				<div className="flex flex-col gap-2 flex-1 min-w-0 text-left">
					<strong className="text-sm md:text-base font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 block">
						{post.title}
					</strong>
					<p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
						{post.brief}
					</p>
				</div>
			</Link>
		);
	});

	return (
		<div className="relative w-full max-w-2xl mx-auto">
			<input
				type="text"
				ref={searchInputRef}
				onKeyUp={escapeSearchOnESC}
				onChange={updateSearchQuery}
				placeholder="Search articles..."
				className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			{showResults && query && (
				<>
					{isSearching && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50">
							<div className="px-4 py-6 space-y-4">
								<div className="space-y-3">
									<div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md w-3/4 animate-pulse"></div>
									<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md w-full animate-pulse"></div>
									<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md w-5/6 animate-pulse"></div>
								</div>
								<div className="space-y-3">
									<div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md w-2/3 animate-pulse"></div>
									<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md w-full animate-pulse"></div>
									<div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-md w-4/5 animate-pulse"></div>
								</div>
							</div>
						</div>
					)}
					{searchResults.length > 0 && !isSearching && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
							<div className="sticky top-0 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
								<p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
									Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
								</p>
							</div>
							<ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
								{searchResultsList}
							</ul>
						</div>
					)}
					{!isSearching && searchResults.length === 0 && query && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl p-6 z-50">
							<div className="text-center">
								<p className="text-sm text-neutral-600 dark:text-neutral-400">
									No articles found for <span className="font-semibold text-neutral-900 dark:text-neutral-200">"{query}"</span>
								</p>
								<p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
									Try different keywords
								</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};
