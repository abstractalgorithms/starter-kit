import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

type Props = {
	posts: PostFragment[];
};

export const DiscoverFilters = ({ posts }: Props) => {
	const [selectedTag, setSelectedTag] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

	// Extract unique tags from posts
	const allTags = useMemo(() => {
		const tagMap = new Map<string, { name: string; slug: string; count: number }>();

		posts.forEach((post) => {
			if (post.tags && Array.isArray(post.tags)) {
				post.tags.forEach((tag) => {
					if (!tagMap.has(tag.slug)) {
						tagMap.set(tag.slug, {
							name: tag.name,
							slug: tag.slug,
							count: 0,
						});
					}
					const tagData = tagMap.get(tag.slug);
					if (tagData) {
						tagData.count += 1;
					}
				});
			}
		});

		return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
	}, [posts]);

	// Filter posts based on selected tag and search term
	const filteredPosts = useMemo(() => {
		return posts.filter((post) => {
			const matchesTag = !selectedTag || (post.tags && post.tags.some((tag) => tag.slug === selectedTag));
			const matchesSearch =
				post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				post.brief.toLowerCase().includes(searchTerm.toLowerCase());
			return matchesTag && matchesSearch;
		});
	}, [posts, selectedTag, searchTerm]);

	// Group filtered posts by tag for the "Browse by Category" section
	const postsByTag = useMemo(() => {
		const grouped = new Map<string, PostFragment[]>();

		allTags.forEach((tag) => {
			const postsForTag = filteredPosts.filter(
				(post) => post.tags && post.tags.some((t) => t.slug === tag.slug)
			);
			if (postsForTag.length > 0) {
				grouped.set(tag.slug, postsForTag);
			}
		});

		return grouped;
	}, [filteredPosts, allTags]);

	const stats = {
		totalArticles: posts.length,
		totalCategories: allTags.length,
		avgReadTime: Math.round(6), // Default average
	};

	return (
		<div className="w-full">
			{/* Search Bar */}
			<div className="mb-12">
				<input
					type="text"
					placeholder="Search articles, topics..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{/* Tag Filters */}
			<div className="mb-12">
				<h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
					Filter by Category
				</h3>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => setSelectedTag(null)}
						className={`px-4 py-2 rounded-full transition-all ${
							selectedTag === null
								? 'bg-blue-600 text-white'
								: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-200 dark:hover:bg-neutral-700'
						}`}
					>
						All Categories ({filteredPosts.length})
					</button>
					{allTags.map((tag) => (
						<button
							key={tag.slug}
							onClick={() => setSelectedTag(tag.slug)}
							className={`px-4 py-2 rounded-full transition-all capitalize ${
								selectedTag === tag.slug
									? 'bg-blue-600 text-white'
									: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-200 dark:hover:bg-neutral-700'
							}`}
						>
							{tag.name} ({tag.count})
						</button>
					))}
				</div>
			</div>

			{/* Featured Content */}
			{filteredPosts.length > 0 && (
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-8">
						Featured Content
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredPosts.slice(0, 3).map((post) => (
							<Link key={post.id} href={`/${post.slug}`}>
								<div className="group h-full">
									<div className="flex flex-col h-full p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300">
										{post.coverImage?.url && (
											<div className="relative w-full h-48 overflow-hidden rounded-md mb-4 -m-5 mb-4">
												<img
													src={post.coverImage.url}
													alt={post.title}
													className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
												/>
											</div>
										)}
										<div className="flex flex-col flex-grow">
											{post.tags && post.tags.length > 0 && (
												<div className="flex flex-wrap gap-2 mb-3">
													{post.tags.slice(0, 2).map((tag) => (
														<span
															key={tag.id}
															className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 capitalize"
														>
															{tag.name}
														</span>
													))}
												</div>
											)}
											<h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
												{post.title}
											</h3>
											<p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 flex-grow">
												{post.brief}
											</p>
											<div className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
												<DateFormatter dateString={post.publishedAt} /> • 5 min read
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Browse by Category */}
			{postsByTag.size > 0 && (
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-12">
						Browse by Category
					</h2>
					<div className="space-y-12">
						{Array.from(postsByTag.entries()).map(([tagSlug, tagPosts]) => {
							const tag = allTags.find((t) => t.slug === tagSlug);
							return (
								<div key={tagSlug}>
									<div className="flex items-center justify-between mb-6">
										<h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 capitalize">
											{tag?.name}
										</h3>
										<Link
											href={`/tag/${tagSlug}`}
											className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
										>
											View All ({tag?.count})
										</Link>
									</div>
									<div className="space-y-4">
										{tagPosts.slice(0, 4).map((post) => (
											<Link key={post.id} href={`/${post.slug}`}>
												<div className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all">
													<h4 className="font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
														{post.title}
													</h4>
													<div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-3">
														<DateFormatter dateString={post.publishedAt} />
														<span>•</span>
														<span>5 min read</span>
													</div>
												</div>
											</Link>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Knowledge Hub Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-t border-neutral-200 dark:border-neutral-800">
				<div className="text-center">
					<div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{stats.totalArticles}
					</div>
					<div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
						Total Articles
					</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{stats.totalCategories}
					</div>
					<div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
						Categories
					</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{allTags.reduce((sum, tag) => sum + tag.count, 0)}
					</div>
					<div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
						Topics
					</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
						{stats.avgReadTime}m
					</div>
					<div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
						Avg. Read Time
					</div>
				</div>
			</div>

			{/* No Results */}
			{filteredPosts.length === 0 && (
				<div className="text-center py-12">
					<p className="text-lg text-neutral-600 dark:text-neutral-400">
						No articles found matching your filters.
					</p>
				</div>
			)}
		</div>
	);
};
