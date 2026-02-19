import Link from 'next/link';
import { PostFragment } from '../generated/graphql';

const ACCENT_COLORS = [
	'border-l-blue-500',
	'border-l-emerald-500',
	'border-l-purple-500',
	'border-l-orange-500',
	'border-l-teal-500',
	'border-l-rose-500',
];

type Props = {
	posts?: PostFragment[];
};

export const CategoriesSection = ({ posts = [] }: Props) => {
	// Extract unique tags from posts and count them
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

	// Convert map to array and sort by count (descending)
	const categories = Array.from(tagMap.values())
		.sort((a, b) => b.count - a.count)
		.slice(0, 6); // Show top 6 categories

	// Fallback to default categories if no posts
	const defaultCategories = [
		{ name: 'architecture', slug: 'architecture', count: 4 },
		{ name: 'algorithms', slug: 'algorithms', count: 2 },
		{ name: 'graph', slug: 'graph', count: 2 },
		{ name: 'event-driven', slug: 'event-driven', count: 1 },
		{ name: 'machine-learning', slug: 'machine-learning', count: 1 },
		{ name: 'artificial-intelligence', slug: 'artificial-intelligence', count: 1 },
	];

	const displayCategories = categories.length > 0 ? categories : defaultCategories;

	return (
		<section className="w-full py-12">
			<div className="flex items-center justify-between mb-8">
				<h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
					Explore Categories
				</h2>
				<Link
					href="/discover"
					className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
				>
					Browse All
				</Link>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				{displayCategories.map((category) => (
					<Link key={category.slug} href={`/tag/${category.slug}`}>
						<div className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer">
							<div className="font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors capitalize">
								{category.name}
							</div>
							<div className="text-sm text-neutral-500 dark:text-neutral-400">
								{category.count} posts
							</div>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
};
