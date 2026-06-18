'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
	collection,
	doc,
	getDoc,
	onSnapshot,
	runTransaction,
	setDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from './authContext';

export type PostProgress = {
	postId: string;
	postTitle?: string;
	completedAt: number;
	timeSpent: number;
	lastReadAt: number;
	isBookmarked: boolean;
	bookmarkedAt: number;
	rating: number | null;
	ratedAt: number;
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

type ProgressContextValue = {
	posts: PostProgress[];
	learningStreak: number;
	loading: boolean;
	error: Error | null;
	recordPostOpened: (postId: string, postTitle?: string) => Promise<void>;
	togglePostBookmark: (postId: string, postTitle?: string) => Promise<void>;
	ratePost: (postId: string, rating: number, postTitle?: string) => Promise<void>;
	markPostComplete: (postId: string, postTitle?: string) => Promise<void>;
	trackPostTime: (postId: string, milliseconds: number, postTitle?: string) => Promise<void>;
	getSeriesProgress: (seriesId: string) => Promise<SeriesProgress | null>;
	updateSeriesProgress: (
		seriesId: string,
		seriesName: string,
		totalPosts: number,
		completedPosts: number,
	) => Promise<SeriesProgress>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

const asNumber = (value: unknown) =>
	typeof value === 'number' && Number.isFinite(value) ? value : 0;

const getActivityUpdate = (data: Record<string, unknown> | undefined) => {
	const today = new Date().toISOString().slice(0, 10);
	const yesterdayDate = new Date();
	yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
	const yesterday = yesterdayDate.toISOString().slice(0, 10);
	const lastActivityDate = typeof data?.lastActivityDate === 'string' ? data.lastActivityDate : '';
	const currentStreak = Math.max(0, asNumber(data?.currentStreak));
	return {
		lastActivityDate: today,
		currentStreak:
			lastActivityDate === today ? Math.max(1, currentStreak) : lastActivityDate === yesterday ? currentStreak + 1 : 1,
	};
};

const updateLearningStats = async (userId: string) => {
	try {
		const statsRef = doc(db, 'users', userId, 'profile', 'metadata');
		await runTransaction(db, async (transaction) => {
			const stats = await transaction.get(statsRef);
			transaction.set(statsRef, getActivityUpdate(stats.data()), { merge: true });
		});
	} catch (statsError) {
		// Progress documents are authoritative. A profile/statistics rule must never
		// prevent an article read or completion from being saved.
		console.warn('Unable to update Firebase learning streak:', statsError);
	}
};

export const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
	const { user, loading: authLoading } = useAuth();
	const [posts, setPosts] = useState<PostProgress[]>([]);
	const [learningStreak, setLearningStreak] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (authLoading) return;
		if (!user) {
			setPosts([]);
			setError(null);
			setLoading(false);
			return;
		}

		setPosts([]);
		setLoading(true);
		const progressRef = collection(db, 'users', user.uid, 'progressedPosts');
		return onSnapshot(
			progressRef,
			(snapshot) => {
				setPosts(
					snapshot.docs.map((progressDoc) => {
						const data = progressDoc.data();
						return {
							postId: progressDoc.id,
							postTitle: typeof data.postTitle === 'string' ? data.postTitle : '',
							completedAt: asNumber(data.completedAt),
							timeSpent: asNumber(data.timeSpent),
							lastReadAt: asNumber(data.lastReadAt),
							isBookmarked: data.isBookmarked === true,
							bookmarkedAt: asNumber(data.bookmarkedAt),
							rating: asNumber(data.rating) || null,
							ratedAt: asNumber(data.ratedAt),
							status: data.status === 'completed' ? 'completed' : 'in-progress',
						};
					}),
				);
				setError(null);
				setLoading(false);
			},
			(snapshotError) => {
				console.error('Unable to subscribe to Firebase progress:', snapshotError);
				setError(snapshotError);
				setLoading(false);
			},
		);
	}, [authLoading, user]);

	useEffect(() => {
		if (!user) {
			setLearningStreak(0);
			return;
		}
		setLearningStreak(0);
		return onSnapshot(
			doc(db, 'users', user.uid, 'profile', 'metadata'),
			(snapshot) => {
				setLearningStreak(Math.max(0, asNumber(snapshot.data()?.currentStreak)));
			},
			(snapshotError) => {
				console.error('Unable to subscribe to Firebase learning stats:', snapshotError);
			},
		);
	}, [user]);

	const ratePost = useCallback(
		async (postId: string, rating: number, postTitle = '') => {
			if (!user) throw new Error('User not authenticated');
			if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
				throw new Error('Rating must be an integer from 1 to 5');
			}
			const progressRef = doc(db, 'users', user.uid, 'progressedPosts', postId);
			await runTransaction(db, async (transaction) => {
				const current = await transaction.get(progressRef);
				const data = current.data();
				transaction.set(
					progressRef,
					{
						postId,
						postTitle: postTitle || data?.postTitle || '',
						timeSpent: asNumber(data?.timeSpent),
						lastReadAt: asNumber(data?.lastReadAt),
						status: data?.status === 'completed' ? 'completed' : 'in-progress',
						rating,
						ratedAt: Date.now(),
						...(data?.status === 'completed' ? { completedAt: asNumber(data.completedAt) } : {}),
					},
					{ merge: true },
				);
			});
		},
		[user],
	);

	const togglePostBookmark = useCallback(
		async (postId: string, postTitle = '') => {
			if (!user) throw new Error('User not authenticated');
			const progressRef = doc(db, 'users', user.uid, 'progressedPosts', postId);
			await runTransaction(db, async (transaction) => {
				const current = await transaction.get(progressRef);
				const data = current.data();
				const nextBookmarked = data?.isBookmarked !== true;
				transaction.set(
					progressRef,
					{
						postId,
						postTitle: postTitle || data?.postTitle || '',
						timeSpent: asNumber(data?.timeSpent),
						lastReadAt: asNumber(data?.lastReadAt),
						status: data?.status === 'completed' ? 'completed' : 'in-progress',
						isBookmarked: nextBookmarked,
						bookmarkedAt: nextBookmarked ? Date.now() : 0,
						...(data?.status === 'completed' ? { completedAt: asNumber(data.completedAt) } : {}),
					},
					{ merge: true },
				);
			});
		},
		[user],
	);

	const recordPostOpened = useCallback(
		async (postId: string, postTitle = '') => {
			if (!user) return;
			const progressRef = doc(db, 'users', user.uid, 'progressedPosts', postId);
			await runTransaction(db, async (transaction) => {
				const current = await transaction.get(progressRef);
				const data = current.data();
				transaction.set(
					progressRef,
					{
						postId,
						postTitle: postTitle || data?.postTitle || '',
						timeSpent: asNumber(data?.timeSpent),
						lastReadAt: Date.now(),
						status: data?.status === 'completed' ? 'completed' : 'in-progress',
						...(data?.status === 'completed' ? { completedAt: asNumber(data.completedAt) } : {}),
					},
					{ merge: true },
				);
			});
			await updateLearningStats(user.uid);
		},
		[user],
	);

	const markPostComplete = useCallback(
		async (postId: string, postTitle = '') => {
			if (!user) throw new Error('User not authenticated');
			const progressRef = doc(db, 'users', user.uid, 'progressedPosts', postId);
			await runTransaction(db, async (transaction) => {
				const current = await transaction.get(progressRef);
				const data = current.data();
				transaction.set(
					progressRef,
					{
						postId,
						postTitle: postTitle || data?.postTitle || '',
						completedAt: data?.status === 'completed' ? asNumber(data.completedAt) : Date.now(),
						timeSpent: asNumber(data?.timeSpent),
						lastReadAt: Date.now(),
						status: 'completed',
					},
					{ merge: true },
				);
			});
			await updateLearningStats(user.uid);
		},
		[user],
	);

	const trackPostTime = useCallback(
		async (postId: string, milliseconds: number, postTitle = '') => {
			if (!user || !Number.isFinite(milliseconds) || milliseconds <= 0) return;
			const boundedTime = Math.min(Math.round(milliseconds), 30 * 60 * 1000);
			const progressRef = doc(db, 'users', user.uid, 'progressedPosts', postId);
			await runTransaction(db, async (transaction) => {
				const current = await transaction.get(progressRef);
				const data = current.data();
				transaction.set(
					progressRef,
					{
						postId,
						postTitle: postTitle || data?.postTitle || '',
						timeSpent: asNumber(data?.timeSpent) + boundedTime,
						lastReadAt: Date.now(),
						status: data?.status === 'completed' ? 'completed' : 'in-progress',
						...(data?.status === 'completed' ? { completedAt: asNumber(data.completedAt) } : {}),
					},
					{ merge: true },
				);
			});
			await updateLearningStats(user.uid);
		},
		[user],
	);

	const getSeriesProgress = useCallback(
		async (seriesId: string) => {
			if (!user) return null;
			const snapshot = await getDoc(doc(db, 'users', user.uid, 'seriesProgress', seriesId));
			if (!snapshot.exists()) return null;
			const data = snapshot.data();
			return {
				seriesId: snapshot.id,
				seriesName: typeof data.seriesName === 'string' ? data.seriesName : '',
				totalPosts: asNumber(data.totalPosts),
				completedPosts: asNumber(data.completedPosts),
				percentage: asNumber(data.percentage),
				lastUpdated: asNumber(data.lastUpdated),
			};
		},
		[user],
	);

	const updateSeriesProgress = useCallback(
		async (seriesId: string, seriesName: string, totalPosts: number, completedPosts: number) => {
			if (!user) throw new Error('User not authenticated');
			const normalizedTotal = Math.max(0, Math.round(totalPosts));
			const normalizedCompleted = Math.min(normalizedTotal, Math.max(0, Math.round(completedPosts)));
			const series = {
				seriesId,
				seriesName,
				totalPosts: normalizedTotal,
				completedPosts: normalizedCompleted,
				percentage: normalizedTotal ? Math.round((normalizedCompleted / normalizedTotal) * 100) : 0,
				lastUpdated: Date.now(),
			};
			await setDoc(doc(db, 'users', user.uid, 'seriesProgress', seriesId), series, { merge: true });
			return series;
		},
		[user],
	);

	const value = useMemo(
		() => ({ posts, learningStreak, loading, error, recordPostOpened, togglePostBookmark, ratePost, markPostComplete, trackPostTime, getSeriesProgress, updateSeriesProgress }),
		[posts, learningStreak, loading, error, recordPostOpened, togglePostBookmark, ratePost, markPostComplete, trackPostTime, getSeriesProgress, updateSeriesProgress],
	);

	return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
};

export const useProgressContext = () => {
	const context = useContext(ProgressContext);
	if (!context) throw new Error('Progress hooks must be used within ProgressProvider');
	return context;
};
