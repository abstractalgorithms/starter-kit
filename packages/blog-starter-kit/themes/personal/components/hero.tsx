import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from './contexts/appContext';
import { SearchBar } from './search-bar';

type HeroStats = {
	articlesCount: number;
	categoriesCount: number;
	seriesCount: number;
};

type Props = {
	stats?: HeroStats;
};

const ROTATING_TOPICS = [
	'System Designs',
	'Machine Learning',
	'LLM Engineering',
	'Design Patterns',
	'Technical Interviews',
	'Software Architecture',
];

export const Hero = ({ stats: globalStats }: Props) => {
	const { publication, posts } = useAppContext();
	const [topicIndex, setTopicIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setIsVisible(false);
			setTimeout(() => {
				setTopicIndex((prev) => (prev + 1) % ROTATING_TOPICS.length);
				setIsVisible(true);
			}, 300);
		}, 4000);

		return () => clearInterval(interval);
	}, []);

	const localStats = useMemo(() => {
		// Count total articles from posts available in current context
		const articlesCount = posts.length;

		// Count unique categories (tags)
		const tagsSet = new Set<string>();
		posts.forEach((post) => {
			if (post.tags && Array.isArray(post.tags)) {
				post.tags.forEach((tag) => {
					tagsSet.add(tag.slug);
				});
			}
		});
		const categoriesCount = tagsSet.size;

		// Count unique series from posts
		const seriesSet = new Set<string>();
		posts.forEach((post) => {
			if (post.series?.id) {
				seriesSet.add(post.series.id);
			}
		});
		const seriesCount = seriesSet.size;

		return {
			articlesCount,
			categoriesCount,
			seriesCount,
		};
	}, [posts]);

	const stats = globalStats ?? localStats;

	const statItems = [
		{ label: 'Published Articles', value: stats.articlesCount },
		{ label: 'Categories', value: stats.categoriesCount },
		{ label: 'Series', value: stats.seriesCount },
	];

	return (
		<section className="w-full py-8 md:py-12">
			<div className="text-center">
			<h1 className="text-4xl md:text-7xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-50 mb-0">
				Discover the Art of
			</h1>
			<div className="min-h-16 md:min-h-20 flex items-center justify-center mb-2 overflow-visible">
				<h2 
					className={`text-3xl md:text-5xl font-bold leading-snug text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-500 transition-opacity duration-300 ${
						isVisible ? 'opacity-100' : 'opacity-0'
					}`}
				>
					{ROTATING_TOPICS[topicIndex]}
				</h2>
			</div>
				<p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto mb-6">
					{publication.descriptionSEO || publication.title}
			</p>
			<div className="mb-8">
				<SearchBar />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 max-w-4xl mx-auto">
				{statItems.map((item) => (
					<div
						key={item.label}
						className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 py-4 text-center"
					>
						<div className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
							{item.value}
						</div>
						<div className="text-sm md:text-base text-neutral-600 dark:text-neutral-300 mt-1">
							{item.label}
						</div>
					</div>
				))}
				</div>
			</div>
		</section>
	);
};
