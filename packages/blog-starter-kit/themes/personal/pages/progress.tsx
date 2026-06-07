import request from 'graphql-request';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { resizeImage } from '@starter-kit/utils/image';
import { AppProvider } from '../components/contexts/appContext';
import { useAuth } from '../components/contexts/authContext';
import { Container } from '../components/container';
import { Footer } from '../components/footer';
import { Layout } from '../components/layout';
import { loadLearningPath } from '../components/learn-today';
import { PersonalHeader } from '../components/personal-theme-header';
import {
	MorePostsByPublicationDocument,
	MorePostsByPublicationQuery,
	MorePostsByPublicationQueryVariables,
	PostFragment,
	PostsByPublicationDocument,
	PostsByPublicationQuery,
	PostsByPublicationQueryVariables,
	PublicationByHostDocument,
	PublicationByHostQuery,
	PublicationByHostQueryVariables,
	PublicationFragment,
} from '../generated/graphql';
import { useUserProgress } from '../hooks/useProgress';
import { getFooterPosts } from '../lib/api/footerData';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;
const BOOKMARK_COLLECTIONS_KEY = 'aa:bookmark-collections';
const LEARNING_STREAK_KEY = 'aa:learning-streak';
const LEARNING_STREAK_DATE_KEY = 'aa:learning-streak-date';

type ProgressPost = {
	id: string;
	title: string;
	slug: string;
	brief: string;
	readTimeInMinutes: number;
	views: number;
	tags?: Array<{ name: string; slug: string }> | null;
	coverImage?: { url?: string | null } | null;
};

type BookmarkCollections = {
	fundamentals: string[];
	interviewPrep: string[];
	architecture: string[];
};

type Props = {
	publication: PublicationFragment;
	posts: ProgressPost[];
	footerPosts: PostFragment[];
};

const PERSONAS = [
	{ id: 'system-design', label: 'System Design', query: 'system design architecture tradeoffs distributed systems' },
	{ id: 'backend', label: 'Backend', query: 'backend systems reliability storage queues' },
	{ id: 'ai-llm', label: 'AI/LLM', query: 'llm rag embeddings retrieval pipelines' },
	{ id: 'interview', label: 'Interview Prep', query: 'system design interview preparation' },
];

const normalizeCoverImageUrl = (raw?: string | null) => {
	if (!raw) return null;
	const withProtocol = raw.startsWith('//') ? `https:${raw}` : raw;
	return resizeImage(withProtocol, { w: 960, h: 540, c: 'thumb' });
};

export default function ProgressPage({ publication, posts, footerPosts }: Props) {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const { posts: trackedPosts } = useUserProgress();
	const [savedPath, setSavedPath] = useState<ReturnType<typeof loadLearningPath>>(null);
	const [learningStreak, setLearningStreak] = useState(1);
	const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
	const [bookmarkCollections, setBookmarkCollections] = useState<BookmarkCollections>({
		fundamentals: [],
		interviewPrep: [],
		architecture: [],
	});

	useEffect(() => {
		if (!authLoading && !user) {
			router.push('/');
		}
	}, [user, authLoading, router]);

	useEffect(() => {
		const storedPersona =
			typeof window !== 'undefined' ? localStorage.getItem('aa:selected-persona') : null;
		if (storedPersona && PERSONAS.some((persona) => persona.id === storedPersona)) {
			setSelectedPersona(storedPersona);
		}
		setSavedPath(loadLearningPath());

		const storedBookmarks = localStorage.getItem(BOOKMARK_COLLECTIONS_KEY);
		if (storedBookmarks) {
			try {
				setBookmarkCollections(JSON.parse(storedBookmarks) as BookmarkCollections);
			} catch {
				setBookmarkCollections({ fundamentals: [], interviewPrep: [], architecture: [] });
			}
		}

		const today = new Date().toISOString().slice(0, 10);
		const lastSeen = localStorage.getItem(LEARNING_STREAK_DATE_KEY);
		const streakRaw = Number(localStorage.getItem(LEARNING_STREAK_KEY) ?? '1');
		const safeStreak = Number.isFinite(streakRaw) && streakRaw > 0 ? streakRaw : 1;
		if (!lastSeen) {
			localStorage.setItem(LEARNING_STREAK_DATE_KEY, today);
			localStorage.setItem(LEARNING_STREAK_KEY, '1');
			setLearningStreak(1);
		} else if (lastSeen !== today) {
			const prevDate = new Date(lastSeen);
			const dayDiff = Math.floor((new Date(today).getTime() - prevDate.getTime()) / 86400000);
			const nextStreak = dayDiff === 1 ? safeStreak + 1 : 1;
			localStorage.setItem(LEARNING_STREAK_DATE_KEY, today);
			localStorage.setItem(LEARNING_STREAK_KEY, String(nextStreak));
			setLearningStreak(nextStreak);
		} else {
			setLearningStreak(safeStreak);
		}
	}, []);

	const completedPosts = useMemo(
		() => trackedPosts.filter((entry) => entry.status === 'completed'),
		[trackedPosts],
	);
	const completedIds = useMemo(
		() => new Set(completedPosts.map((entry) => entry.postId)),
		[completedPosts],
	);
	const completedCount = completedIds.size;
	const completionRatio = posts.length > 0 ? completedCount / posts.length : 0;
	const selectedPersonaData = PERSONAS.find((item) => item.id === selectedPersona) ?? PERSONAS[0];

	const tagBuckets = useMemo(() => {
		const map = new Map<string, { slug: string; label: string; total: number }>();
		for (const post of posts) {
			for (const tag of post.tags ?? []) {
				const prev = map.get(tag.slug);
				map.set(tag.slug, {
					slug: tag.slug,
					label: tag.name,
					total: (prev?.total ?? 0) + 1,
				});
			}
		}
		return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
	}, [posts]);

	const skillProgress = useMemo(
		() =>
			tagBuckets.map((bucket) => {
				const scopedPosts = posts.filter((post) =>
					(post.tags ?? []).some((tag) => tag.slug === bucket.slug),
				);
				const completedScoped = scopedPosts.filter((post) => completedIds.has(post.id)).length;
				const mastery =
					scopedPosts.length > 0
						? Math.round((completedScoped / scopedPosts.length) * 100)
						: 0;
				return { ...bucket, mastery };
			}),
		[posts, tagBuckets, completedIds],
	);

	const personalizedRecommendations = useMemo(() => {
		const personaTerms = selectedPersonaData.query
			.toLowerCase()
			.split(/\s+/)
			.filter((term) => term.length > 2);
		return [...posts]
			.map((post) => {
				let score = completedIds.has(post.id) ? 0 : 5;
				const haystack = `${post.title} ${post.brief} ${(post.tags ?? []).map((tag) => tag.name).join(' ')}`
					.toLowerCase();
				if (personaTerms.some((term) => haystack.includes(term))) score += 5;
				score += Math.min(3, post.readTimeInMinutes / 8);
				score += Math.min(3, post.views / 25000);
				return { post, score };
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 6)
			.map((entry) => entry.post);
	}, [posts, completedIds, selectedPersonaData.query]);

	const studyPlan = useMemo(
		() =>
			personalizedRecommendations.slice(0, 4).map((post, index) => ({
				day: `Day ${index + 1}`,
				target: index % 2 === 0 ? 'Read + notes' : 'Read + architecture sketch',
				post,
			})),
		[personalizedRecommendations],
	);

	const addToCollection = (collection: keyof BookmarkCollections, postSlug: string) => {
		setBookmarkCollections((prev) => {
			const next = {
				...prev,
				[collection]: prev[collection].includes(postSlug)
					? prev[collection]
					: [...prev[collection], postSlug],
			};
			localStorage.setItem(BOOKMARK_COLLECTIONS_KEY, JSON.stringify(next));
			return next;
		});
	};

	if (!user && !authLoading) return null;

	return (
		<AppProvider publication={publication} footerPosts={footerPosts}>
			<Layout>
				<Head>
					<title>Progress Tracker - {publication.title}</title>
					<meta
						name="description"
						content="Track mastery, continue learning, save collections, and follow your personalized engineering study plan."
					/>
				</Head>
				<Container className="mx-auto w-full">
					<PersonalHeader />
					<div className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-8">
						<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 dark:text-blue-400">
									Progress tracker
								</p>
								<h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
									Progression Command Center
								</h1>
								<p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
									Track mastery, streaks, and recommendations in one dedicated learning workspace.
								</p>
							</div>
							<Link
								href="/posts"
								className="inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-blue-400"
							>
								Browse Articles
							</Link>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
								<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Concept completion</p>
								<p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
									{Math.round(completionRatio * 100)}%
								</p>
								<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
									{completedCount} of {posts.length} completed
								</p>
							</div>
							<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
								<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Learning streak</p>
								<p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">🔥 {learningStreak} days</p>
								<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Stay consistent to build momentum.</p>
							</div>
							<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
								<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Bookmark collections</p>
								<div className="mt-2 space-y-1.5">
									<div className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs dark:bg-neutral-800/60">
										<span className="text-neutral-600 dark:text-neutral-300">Fundamentals</span>
										<span className="font-semibold text-neutral-900 dark:text-neutral-100">{bookmarkCollections.fundamentals.length}</span>
									</div>
									<div className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs dark:bg-neutral-800/60">
										<span className="text-neutral-600 dark:text-neutral-300">Interview Prep</span>
										<span className="font-semibold text-neutral-900 dark:text-neutral-100">{bookmarkCollections.interviewPrep.length}</span>
									</div>
									<div className="flex items-center justify-between rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs dark:bg-neutral-800/60">
										<span className="text-neutral-600 dark:text-neutral-300">Architecture</span>
										<span className="font-semibold text-neutral-900 dark:text-neutral-100">{bookmarkCollections.architecture.length}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
							<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Continue learning</p>
							<p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
								Resume exactly where you left off in your active track.
							</p>
							<div className="mt-3 flex flex-wrap gap-3">
								<Link
									href={savedPath?.readSlugs?.length ? `/${savedPath.readSlugs[savedPath.readSlugs.length - 1]}` : '/learn'}
									className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
								>
									Resume Path
								</Link>
								<Link
									href="/learn"
									className="inline-flex rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:text-blue-400"
								>
									Find New Path
								</Link>
							</div>
						</div>

						<div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
							<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Role-based personalization</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{PERSONAS.map((persona) => (
									<button
										key={persona.id}
										onClick={() => {
											setSelectedPersona(persona.id);
											localStorage.setItem('aa:selected-persona', persona.id);
										}}
										className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
											selectedPersona === persona.id
												? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
												: 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
										}`}
									>
										{persona.label}
									</button>
								))}
							</div>
						</div>

						<div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
							<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
								<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">AI-generated study plan</p>
								<div className="mt-3 space-y-2">
									{studyPlan.map((step) => {
										const imageUrl = normalizeCoverImageUrl(step.post.coverImage?.url);
										return (
											<Link key={step.post.id} href={`/${step.post.slug}`} className="block rounded-lg border border-neutral-200 p-3 transition-colors hover:border-blue-300 dark:border-neutral-700 dark:hover:border-blue-500">
												{imageUrl ? (
													<img src={imageUrl} alt={step.post.title} className="mb-2 h-20 w-full rounded-md object-cover" />
												) : (
													<div className="mb-2 h-20 w-full rounded-md bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30" />
												)}
												<p className="text-[11px] font-mono uppercase tracking-wide text-blue-600 dark:text-blue-400">{step.day}</p>
												<p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-1">{step.post.title}</p>
												<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{step.target}</p>
											</Link>
										);
									})}
								</div>
							</div>
							<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
								<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Personalized recommendations</p>
								<div className="mt-3 space-y-2">
									{personalizedRecommendations.slice(0, 5).map((post) => {
										const imageUrl = normalizeCoverImageUrl(post.coverImage?.url);
										return (
											<div key={post.id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
												{imageUrl ? (
													<img src={imageUrl} alt={post.title} className="mb-2 h-20 w-full rounded-md object-cover" />
												) : (
													<div className="mb-2 h-20 w-full rounded-md bg-gradient-to-br from-blue-100 via-indigo-100 to-teal-100 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-teal-950/30" />
												)}
												<Link href={`/${post.slug}`} className="text-sm font-semibold text-neutral-900 hover:text-blue-600 dark:text-neutral-50 dark:hover:text-blue-400 line-clamp-1">
													{post.title}
												</Link>
												<div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
													{post.readTimeInMinutes} min • {post.views} views
												</div>
												<div className="mt-2 flex gap-2">
													<button onClick={() => addToCollection('fundamentals', post.slug)} className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
														Save fundamentals
													</button>
													<button onClick={() => addToCollection('architecture', post.slug)} className="rounded-full bg-blue-100 px-2 py-1 text-[11px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
														Save architecture
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>

						<div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
							<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Skill progression</p>
							<div className="mt-3 space-y-2">
								{skillProgress.map((skill) => (
									<div key={skill.slug}>
										<div className="mb-1 flex items-center justify-between text-xs">
											<span className="font-semibold text-neutral-700 dark:text-neutral-200">{skill.label}</span>
											<span className="text-neutral-500 dark:text-neutral-400">{skill.mastery}%</span>
										</div>
										<div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
											<div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${skill.mastery}%` }} />
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
							<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Recently completed</p>
							<div className="mt-3 space-y-2">
								{completedPosts.length > 0 ? (
									completedPosts
										.sort((a, b) => b.completedAt - a.completedAt)
										.slice(0, 8)
										.map((entry) => (
											<div key={entry.postId} className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
												<p className="font-semibold">{entry.postTitle}</p>
												<p className="mt-1 text-xs opacity-80">
													Completed on {new Date(entry.completedAt).toLocaleDateString()}
												</p>
											</div>
										))
								) : (
									<p className="text-sm text-neutral-500 dark:text-neutral-400">
										No completed posts yet. Start with recommended articles above.
									</p>
								)}
							</div>
						</div>
					</div>
					<Footer />
				</Container>
			</Layout>
		</AppProvider>
	);
}

export const getStaticProps: GetStaticProps<Props> = async () => {
	const publicationData = await request<PublicationByHostQuery, PublicationByHostQueryVariables>(
		GQL_ENDPOINT,
		PublicationByHostDocument,
		{
			host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
		},
	);

	const publication = publicationData.publication;
	if (!publication) return { notFound: true };

	const first = await request<PostsByPublicationQuery, PostsByPublicationQueryVariables>(
		GQL_ENDPOINT,
		PostsByPublicationDocument,
		{ first: 20, host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST },
	);

	const allPosts = (first.publication?.posts.edges ?? []).map((edge) => edge.node);
	let cursor = first.publication?.posts.pageInfo.endCursor;
	let hasNextPage = !!first.publication?.posts.pageInfo.hasNextPage;

	while (hasNextPage && cursor && allPosts.length < 260) {
		const next = await request<MorePostsByPublicationQuery, MorePostsByPublicationQueryVariables>(
			GQL_ENDPOINT,
			MorePostsByPublicationDocument,
			{ first: 20, host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST, after: cursor },
		);
		if (!next.publication) break;
		allPosts.push(...next.publication.posts.edges.map((edge) => edge.node));
		cursor = next.publication.posts.pageInfo.endCursor;
		hasNextPage = !!next.publication.posts.pageInfo.hasNextPage;
	}

	const footerPosts = await getFooterPosts();

	return {
		props: {
			publication,
			posts: allPosts.slice(0, 250).map((post) => ({
				id: post.id,
				title: post.title,
				slug: post.slug,
				brief: post.brief,
				readTimeInMinutes: post.readTimeInMinutes,
				views: post.views ?? 0,
				tags: (post.tags ?? []).map((tag) => ({ name: tag.name, slug: tag.slug })),
				coverImage: post.coverImage ?? null,
			})),
			footerPosts,
		},
		revalidate: 3600,
	};
};
