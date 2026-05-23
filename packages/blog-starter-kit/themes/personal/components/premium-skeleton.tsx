'use client';

import { motion, useReducedMotion } from 'framer-motion';

export const PremiumSkeleton = ({ lines = 4 }: { lines?: number }) => {
	const reduceMotion = useReducedMotion();
	return (
		<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
			<div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
			<div className="mt-3 space-y-2">
				{Array.from({ length: lines }).map((_, index) => (
					<motion.div
						key={index}
						className="h-3 rounded bg-neutral-100 dark:bg-neutral-800"
						style={{ width: `${90 - index * 7}%` }}
						animate={reduceMotion ? undefined : { opacity: [0.45, 0.85, 0.45] }}
						transition={{
							duration: 1.35,
							delay: index * 0.05,
							repeat: reduceMotion ? 0 : Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}
			</div>
		</div>
	);
};
