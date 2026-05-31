import { PostFragment } from '../generated/graphql';

export type PostListView = 'all' | 'created' | 'updated' | 'top';
export type PostListSort =
	| 'created-desc'
	| 'created-asc'
	| 'updated-desc'
	| 'updated-asc'
	| 'popular-desc'
	| 'popular-asc';

export type PostListFilters = {
	searchTerm: string;
	tagSlug: string | null;
	seriesSlug: string | null;
	createdFrom: string;
	createdTo: string;
	updatedFrom: string;
	updatedTo: string;
};

export const POST_VIEW_META: Record<
	PostListView,
	{ label: string; description: string }
> = {
	all: {
		label: 'All chapters',
		description: 'Browse the full archive of systems chapters.',
	},
	created: {
		label: 'Newest chapters',
		description: 'The most recently published chapters first.',
	},
	updated: {
		label: 'Recently updated',
		description: 'Chapters that were recently revised or expanded.',
	},
	top: {
		label: 'Reader favorites',
		description: 'Popular chapters that readers return to most.',
	},
};

export const DEFAULT_SORT_BY_VIEW: Record<PostListView, PostListSort> = {
	all: 'created-desc',
	created: 'created-desc',
	updated: 'updated-desc',
	top: 'popular-desc',
};

export const POST_SORT_OPTIONS: Array<{ value: PostListSort; label: string }> = [
	{ value: 'created-desc', label: 'Created: newest first' },
	{ value: 'created-asc', label: 'Created: oldest first' },
	{ value: 'updated-desc', label: 'Updated: newest first' },
	{ value: 'updated-asc', label: 'Updated: oldest first' },
	{ value: 'popular-desc', label: 'Popularity: highest first' },
	{ value: 'popular-asc', label: 'Popularity: lowest first' },
];

const getDateKey = (date: string | null | undefined) => (date ?? '').slice(0, 10);

export const getEffectiveUpdatedAt = (post: PostFragment) =>
	post.updatedAt || post.publishedAt;

export const isActuallyUpdatedPost = (post: PostFragment) =>
	Boolean(post.updatedAt && post.updatedAt !== post.publishedAt);

export const sortPosts = (posts: PostFragment[], sort: PostListSort) =>
	[...posts].sort((a, b) => {
		switch (sort) {
			case 'created-asc':
				return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
			case 'created-desc':
				return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
			case 'updated-asc':
				return (
					new Date(getEffectiveUpdatedAt(a)).getTime() -
					new Date(getEffectiveUpdatedAt(b)).getTime()
				);
			case 'updated-desc':
				return (
					new Date(getEffectiveUpdatedAt(b)).getTime() -
					new Date(getEffectiveUpdatedAt(a)).getTime()
				);
			case 'popular-asc':
				return (a.views ?? 0) - (b.views ?? 0);
			case 'popular-desc':
				return (b.views ?? 0) - (a.views ?? 0);
			default:
				return 0;
		}
	});

export const getPostsForView = (posts: PostFragment[], view: PostListView) => {
	if (view === 'updated') {
		return sortPosts(posts.filter(isActuallyUpdatedPost), 'updated-desc');
	}

	if (view === 'top') {
		return sortPosts(posts, 'popular-desc');
	}

	if (view === 'created' || view === 'all') {
		return sortPosts(posts, 'created-desc');
	}

	return posts;
};

export const filterPosts = (posts: PostFragment[], filters: PostListFilters) => {
	const searchTerm = filters.searchTerm.trim().toLowerCase();

	return posts.filter((post) => {
		const matchesSearch =
			!searchTerm ||
			post.title.toLowerCase().includes(searchTerm) ||
			post.brief.toLowerCase().includes(searchTerm) ||
			post.subtitle?.toLowerCase().includes(searchTerm);

		const matchesTag =
			!filters.tagSlug ||
			Boolean(post.tags?.some((tag) => tag.slug === filters.tagSlug));

		const matchesSeries =
			!filters.seriesSlug || post.series?.slug === filters.seriesSlug;

		const createdDate = getDateKey(post.publishedAt);
		const updatedDate = getDateKey(getEffectiveUpdatedAt(post));

		const matchesCreatedFrom =
			!filters.createdFrom || createdDate >= filters.createdFrom;
		const matchesCreatedTo = !filters.createdTo || createdDate <= filters.createdTo;
		const matchesUpdatedFrom =
			!filters.updatedFrom || updatedDate >= filters.updatedFrom;
		const matchesUpdatedTo = !filters.updatedTo || updatedDate <= filters.updatedTo;

		return (
			matchesSearch &&
			matchesTag &&
			matchesSeries &&
			matchesCreatedFrom &&
			matchesCreatedTo &&
			matchesUpdatedFrom &&
			matchesUpdatedTo
		);
	});
};

export const parsePostListView = (value: string | string[] | undefined): PostListView => {
	if (typeof value !== 'string') {
		return 'all';
	}

	return value === 'created' || value === 'updated' || value === 'top' ? value : 'all';
};

export const parsePostListSort = (
	value: string | string[] | undefined,
	fallbackView: PostListView,
): PostListSort => {
	if (typeof value !== 'string') {
		return DEFAULT_SORT_BY_VIEW[fallbackView];
	}

	return POST_SORT_OPTIONS.some((option) => option.value === (value as PostListSort))
		? (value as PostListSort)
		: DEFAULT_SORT_BY_VIEW[fallbackView];
};
