'use client';

import React from 'react';
import { useUserProgress } from '../hooks/useProgress';
import { useAuth } from './contexts/authContext';

type ProgressBadgeProps = {
	postId: string;
	postTitle?: string;
	size?: 'sm' | 'md';
};

export const ProgressBadge = ({ postId, postTitle = '', size = 'md' }: ProgressBadgeProps) => {
	const { user } = useAuth();
	const { isPostCompleted, markPostComplete, loading } = useUserProgress();
	const isCompleted = user ? isPostCompleted(postId) : false;

	const sizeClasses = size === 'sm' ? 'p-1' : 'p-2';
	const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

	return (
		<button
			onClick={() => {
				if (!user) return;
				markPostComplete(postId, postTitle);
			}}
			disabled={loading || !user}
			className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
				isCompleted
					? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
					: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
			} disabled:opacity-60`}
			title={!user ? 'Login to track progress and mark this post complete' : undefined}
		>
			{!user ? (
				<>
					<svg className={`${iconSize} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11V7a3 3 0 10-6 0v4m-2 0h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
					</svg>
					Login to Mark Complete
				</>
			) : isCompleted ? (
				<>
					<svg className={`${iconSize} flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
					Completed
				</>
			) : (
				<>
					<svg className={`${iconSize} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Mark Complete
				</>
			)}
		</button>
	);
};
