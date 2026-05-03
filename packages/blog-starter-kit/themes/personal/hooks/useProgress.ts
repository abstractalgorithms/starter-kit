import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/contexts/authContext';

export type PostProgress = {
	postId: string;
	postTitle?: string;
	completedAt: number;
	timeSpent: number;
	status: 'completed' | 'in-progress';
};

export type SeriesProgress = {
	seriesId: string;
	seriesName: string;
	totalPosts: number;
	completedPosts: number;
	percentage: number;
	lastUpdated: number;
};

export const useUserProgress = () => {
	const { user } = useAuth();
	const [posts, setPosts] = useState<PostProgress[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!user) {
			setPosts([]);
			return;
		}

		const fetchProgress = async () => {
			setLoading(true);
			try {
				const token = await user.getIdToken();
				const response = await fetch(`/api/progress/get-progress?userId=${user.uid}&token=${encodeURIComponent(token)}`);
				if (!response.ok) throw new Error('Failed to fetch progress');

				const data = await response.json();
				setPosts(data.posts || []);
			} catch (error) {
				console.error('Error fetching progress:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchProgress();
	}, [user]);

	const markPostComplete = useCallback(
		async (postId: string, postTitle?: string) => {
			if (!user) throw new Error('User not authenticated');

			try {
				const token = await user.getIdToken();
				const response = await fetch('/api/progress/mark-complete', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: user.uid,
						token,
						postId,
						postTitle: postTitle || '',
					}),
				});

				if (!response.ok) throw new Error('Failed to mark post complete');

				setPosts((prev) => {
					const existing = prev.find((p) => p.postId === postId);
					if (existing) {
						return prev.map((p) =>
							p.postId === postId ? { ...p, status: 'completed', completedAt: Date.now() } : p,
						);
					}
					return [
						...prev,
						{
							postId,
							postTitle: postTitle || '',
							completedAt: Date.now(),
							timeSpent: 0,
							status: 'completed',
						},
					];
				});
			} catch (error) {
				console.error('Error marking post complete:', error);
				throw error;
			}
		},
		[user],
	);

	const getPostStatus = useCallback((postId: string) => {
		return posts.find((p) => p.postId === postId)?.status || null;
	}, [posts]);

	const isPostCompleted = useCallback((postId: string) => {
		return posts.some((p) => p.postId === postId && p.status === 'completed');
	}, [posts]);

	return {
		posts,
		loading,
		markPostComplete,
		getPostStatus,
		isPostCompleted,
	};
};

export const useSeriesProgress = () => {
	const { user } = useAuth();
	const [seriesData, setSeriesData] = useState<SeriesProgress | null>(null);
	const [loading, setLoading] = useState(false);

	const getSeriesProgress = useCallback(
		async (seriesId: string, seriesName: string) => {
			if (!user) return null;

			try {
				setLoading(true);
				const token = await user.getIdToken();
				const response = await fetch(`/api/progress/get-series?userId=${user.uid}&seriesId=${seriesId}&token=${encodeURIComponent(token)}`);
				if (!response.ok) throw new Error('Failed to fetch series progress');
				
				const data = await response.json();
				return data.series || null;
			} catch (error) {
				console.error('Error getting series progress:', error);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[user],
	);

	const updateSeriesProgress = useCallback(
		async (
			seriesId: string,
			seriesName: string,
			totalPosts: number,
			completedPosts: number,
		) => {
			if (!user) throw new Error('User not authenticated');

			try {
				const token = await user.getIdToken();
				const response = await fetch('/api/progress/update-series', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: user.uid,
						token,
						seriesId,
						seriesName,
						totalPosts,
						completedPosts,
					}),
				});

				if (!response.ok) throw new Error('Failed to update series progress');
				
				const result = await response.json();
				setSeriesData(result.series);
				return result.series;
			} catch (error) {
				console.error('Error updating series progress:', error);
				throw error;
			}
		},
		[user],
	);

	return {
		seriesData,
		loading,
		getSeriesProgress,
		updateSeriesProgress,
	};
};

export const usePostTimeTracking = () => {
	const { user } = useAuth();
	const [startTime, setStartTime] = useState<number | null>(null);

	const startTracking = useCallback(() => {
		setStartTime(Date.now());
	}, []);

	const endTracking = useCallback(
		async (postId: string) => {
			if (!user || !startTime) return;

			try {
				const token = await user.getIdToken();
				const timeSpent = Date.now() - startTime;
				await fetch('/api/progress/track-time', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						userId: user.uid,
						token,
						postId,
						timeSpent,
					}),
				});

				setStartTime(null);
			} catch (error) {
				console.error('Error saving time tracking:', error);
			}
		},
		[user, startTime],
	);

	return {
		startTracking,
		endTracking,
	};
};
