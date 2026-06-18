import { useCallback, useRef, useState } from 'react';
import {
	PostProgress,
	SeriesProgress,
	useProgressContext,
} from '../components/contexts/progressContext';

export type { PostProgress, SeriesProgress };

export const useUserProgress = () => {
	const { posts, learningStreak, loading, error, markPostComplete } = useProgressContext();

	const getPostStatus = useCallback(
		(postId: string) => posts.find((post) => post.postId === postId)?.status ?? null,
		[posts],
	);
	const isPostCompleted = useCallback(
		(postId: string) => posts.some((post) => post.postId === postId && post.status === 'completed'),
		[posts],
	);

	return { posts, learningStreak, loading, error, markPostComplete, getPostStatus, isPostCompleted };
};

export const useSeriesProgress = () => {
	const { getSeriesProgress, updateSeriesProgress } = useProgressContext();
	const [seriesData, setSeriesData] = useState<SeriesProgress | null>(null);
	const [loading, setLoading] = useState(false);

	const loadSeriesProgress = useCallback(
		async (seriesId: string, _seriesName?: string) => {
			setLoading(true);
			try {
				return await getSeriesProgress(seriesId);
			} finally {
				setLoading(false);
			}
		},
		[getSeriesProgress],
	);

	const saveSeriesProgress = useCallback(
		async (seriesId: string, seriesName: string, totalPosts: number, completedPosts: number) => {
			setLoading(true);
			try {
				const result = await updateSeriesProgress(seriesId, seriesName, totalPosts, completedPosts);
				setSeriesData(result);
				return result;
			} finally {
				setLoading(false);
			}
		},
		[updateSeriesProgress],
	);

	return {
		seriesData,
		loading,
		getSeriesProgress: loadSeriesProgress,
		updateSeriesProgress: saveSeriesProgress,
	};
};

export const usePostTimeTracking = () => {
	const { trackPostTime } = useProgressContext();
	const startTimeRef = useRef<number | null>(null);

	const startTracking = useCallback(() => {
		startTimeRef.current = Date.now();
	}, []);

	const endTracking = useCallback(
		async (postId: string, postTitle?: string) => {
			if (!startTimeRef.current) return;
			const timeSpent = Date.now() - startTimeRef.current;
			startTimeRef.current = null;
			await trackPostTime(postId, timeSpent, postTitle);
		},
		[trackPostTime],
	);

	return { startTracking, endTracking };
};
