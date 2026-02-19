import { useState, useEffect } from 'react';
import { useAppContext } from './contexts/appContext';
import { SearchBar } from './search-bar';

const ROTATING_TOPICS = [
	'System Designs',
	'Machine Learning',
	'LLM Engineering',
	'Design Patterns',
	'Technical Interviews',
	'Software Architecture',
];

export const Hero = () => {
	const { publication } = useAppContext();
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
			</div>
		</section>
	);
};
