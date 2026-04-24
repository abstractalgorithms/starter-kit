'use client';
import { useEffect, useState } from 'react';

export const ScrollButtons = () => {
	const [visible, setVisible] = useState(false);
	const [navOffset, setNavOffset] = useState(0);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 300);
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Respect the LearningPathNav CSS variable so buttons sit above it
	useEffect(() => {
		const read = () => {
			const val = getComputedStyle(document.documentElement)
				.getPropertyValue('--lp-nav-height')
				.trim();
			setNavOffset(val ? parseInt(val, 10) : 0);
		};
		read();
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
		return () => observer.disconnect();
	}, []);

	const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
	const scrollBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

	if (!visible) return null;

	const bottomPx = navOffset + 96; // sit above chatbot button (which is at navOffset + 24px, ~48px btn)

	return (
		<div
			className="fixed right-5 z-40 flex flex-col gap-2 transition-all duration-300"
			style={{ bottom: `${bottomPx}px` }}
		>
			<button
				onClick={scrollTop}
				aria-label="Scroll to top"
				title="Back to top"
				className="group w-9 h-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:hover:text-white transition-all duration-200"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
				</svg>
			</button>
			<button
				onClick={scrollBottom}
				aria-label="Scroll to bottom"
				title="Jump to bottom"
				className="group w-9 h-9 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-blue-600 hover:border-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:border-blue-600 dark:hover:text-white transition-all duration-200"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	);
};
