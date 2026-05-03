import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../components/contexts/authContext';
import { useUserProgress, SeriesProgress } from '../hooks/useProgress';
import Link from 'next/link';
import { Layout } from '../components/layout';
import { Container } from '../components/container';
import { GetServerSideProps } from 'next';

export default function ProgressPage() {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const { posts, loading: progressLoading } = useUserProgress();

	useEffect(() => {
		if (!authLoading && !user) {
			router.push('/');
		}
	}, [user, authLoading, router]);

	if (authLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-neutral-500">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const completedPostsCount = posts.filter((p) => p.status === 'completed').length;
	const completionPercentage = posts.length > 0 ? Math.round((completedPostsCount / posts.length) * 100) : 0;

	return (
		<Layout>
			<Head>
				<title>Learning Progress</title>
				<meta name="description" content="Track your learning progress and completed posts" />
			</Head>
			<Container className="mx-auto w-full">
				<div className="max-w-7xl mx-auto w-full px-5 py-6 md:py-8">
					{/* Simple Header */}
					<div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
						<div>
							<h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">
								📊 Your Learning Progress
							</h1>
							<p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 mt-1">
								Track your learning journey and completed posts
							</p>
						</div>
						<Link
							href="/"
							className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium text-sm md:text-base px-3 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
							title="Back to Home"
						>
							← Home
						</Link>
					</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
					{/* Total Posts */}
					<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-6">
						<div className="flex items-center gap-3 mb-2">
							<span className="text-3xl">📚</span>
							<h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
								Total Posts
							</h3>
						</div>
						<p className="text-3xl font-bold text-neutral-900 dark:text-white">
							{posts.length}
						</p>
					</div>

					{/* Completed Posts */}
					<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-green-50 dark:bg-green-900/10 p-6">
						<div className="flex items-center gap-3 mb-2">
							<span className="text-3xl">✅</span>
							<h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
								Completed
							</h3>
						</div>
						<p className="text-3xl font-bold text-green-600 dark:text-green-400">
							{completedPostsCount}
						</p>
					</div>

					{/* Progress Percentage */}
					<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-blue-50 dark:bg-blue-900/10 p-6">
						<div className="flex items-center gap-3 mb-2">
							<span className="text-3xl">📈</span>
							<h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
								Completion
							</h3>
						</div>
						<p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
							{completionPercentage}%
						</p>
					</div>
				</div>

				{/* Progress Bar */}
				{posts.length > 0 && (
					<div className="mb-12">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
								Overall Progress
							</h3>
							<span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
								{completedPostsCount} of {posts.length}
							</span>
						</div>
						<div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-3 overflow-hidden">
							<div
								className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-300"
								style={{ width: `${completionPercentage}%` }}
							/>
						</div>
					</div>
				)}

				{/* Completed Posts List */}
				{completedPostsCount > 0 && (
					<div className="mb-12">
						<h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
							✨ Completed Posts ({completedPostsCount})
						</h2>
						<div className="space-y-2">
							{posts
								.filter((p) => p.status === 'completed')
								.sort((a, b) => b.completedAt - a.completedAt)
								.map((post) => (
									<div
										key={post.postId}
										className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30"
									>
										<svg
											className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
										<div className="flex-1">
											<p className="font-medium text-neutral-900 dark:text-white">
												{post.postTitle}
											</p>
											<p className="text-xs text-neutral-500 dark:text-neutral-400">
												Completed on{' '}
												{new Date(post.completedAt).toLocaleDateString('en-US', {
													weekday: 'short',
													year: 'numeric',
													month: 'short',
													day: 'numeric',
												})}
											</p>
										</div>
									</div>
								))}
						</div>
					</div>
				)}

				{completedPostsCount === 0 && (
					<div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-12 text-center">
						<p className="text-neutral-600 dark:text-neutral-400 mb-4 text-lg">
							🚀 You haven&apos;t completed any posts yet. Start your learning journey now!
						</p>
						<Link
							href="/"
							className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
						>
							Browse Posts →
						</Link>
					</div>
				)}
			</div>
		</Container>
	</Layout>
	);
}

export const getServerSideProps: GetServerSideProps = async () => {
	return {
		props: {},
	};
};
