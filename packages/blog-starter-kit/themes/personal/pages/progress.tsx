import request from 'graphql-request';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useMemo } from 'react';
import { AppProvider } from '../components/contexts/appContext';
import { useAuth } from '../components/contexts/authContext';
import { Container } from '../components/container';
import { Footer } from '../components/footer';
import { Layout } from '../components/layout';
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

type Props = {
	publication: PublicationFragment;
	posts: ProgressPost[];
	footerPosts: PostFragment[];
};

const relativeTime = (timestamp: number) => {
	if (!timestamp) return 'Recently';
	const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
	if (minutes < 60) return minutes < 2 ? 'Just now' : `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
};

const DashboardIcon = ({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'teal' | 'violet' | 'orange' }) => {
	const tones = {
		blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300',
		teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-300',
		violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
		orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300',
	};
	return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${tones[tone]}`}>{children}</span>;
};

const ProgressChart = ({ completedAt, total }: { completedAt: number[]; total: number }) => {
	const points = Array.from({ length: 9 }, (_, index) => {
		const cutoff = Date.now() - (8 - index) * 4 * 86_400_000;
		const completed = completedAt.filter((timestamp) => timestamp > 0 && timestamp <= cutoff).length;
		return { x: 20 + index * 72.5, y: 178 - (total ? completed / total : 0) * 150 };
	});
	const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
	const area = `${path} L ${points[points.length - 1].x} 180 L 20 180 Z`;
	return (
		<svg viewBox="0 0 620 205" className="mt-4 h-[220px] w-full" role="img" aria-label="Completion progress over the last month">
			<defs><linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82f6" stopOpacity=".22" /><stop offset="1" stopColor="#3b82f6" stopOpacity=".02" /></linearGradient></defs>
			{[28, 78, 128, 178].map((y, index) => <g key={y}><line x1="20" y1={y} x2="600" y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" /><text x="0" y={y + 4} className="fill-slate-400 text-[9px]">{100 - index * 33}%</text></g>)}
			<path d={area} fill="url(#progressArea)" />
			<path d={path} fill="none" stroke="#1670f8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
			{points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="white" stroke="#1670f8" strokeWidth="2" />)}
			<text x="20" y="200" className="fill-slate-400 text-[9px]">4 weeks ago</text><text x="555" y="200" className="fill-slate-400 text-[9px]">Today</text>
		</svg>
	);
};

export default function ProgressPage({ publication, posts, footerPosts }: Props) {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const { posts: trackedPosts, learningStreak, error: progressError } = useUserProgress();

	useEffect(() => {
		if (!authLoading && !user) {
			router.push('/');
		}
	}, [user, authLoading, router]);

	const completedPosts = useMemo(
		() => trackedPosts.filter((entry) => entry.status === 'completed'),
		[trackedPosts],
	);
	const completedIds = useMemo(
		() => new Set(completedPosts.map((entry) => entry.postId)),
		[completedPosts],
	);
	const trackedIds = useMemo(() => new Set(trackedPosts.map((entry) => entry.postId)), [trackedPosts]);
	const completedCount = completedIds.size;
	const completionRatio = posts.length > 0 ? completedCount / posts.length : 0;
	const totalReadingMinutes = Math.floor(
		trackedPosts.reduce((total, entry) => total + entry.timeSpent, 0) / 60_000,
	);
	const postsById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
	const readingActivity = useMemo(
		() =>
			trackedPosts
				.map((entry) => ({ entry, post: postsById.get(entry.postId) }))
				.filter((item): item is { entry: typeof trackedPosts[number]; post: ProgressPost } => Boolean(item.post))
				.sort((a, b) => Math.max(b.entry.lastReadAt, b.entry.completedAt, b.entry.bookmarkedAt, b.entry.ratedAt) - Math.max(a.entry.lastReadAt, a.entry.completedAt, a.entry.bookmarkedAt, a.entry.ratedAt)),
		[postsById, trackedPosts],
	);
	const continueReading = readingActivity.filter(({ entry }) => entry.status === 'in-progress');
	const bookmarkedActivity = readingActivity
		.filter(({ entry }) => entry.isBookmarked)
		.sort((a, b) => b.entry.bookmarkedAt - a.entry.bookmarkedAt);
	const ratedActivity = readingActivity
		.filter(({ entry }) => entry.rating !== null)
		.sort((a, b) => b.entry.ratedAt - a.entry.ratedAt);

	const tagBuckets = useMemo(() => {
		const map = new Map<string, { slug: string; label: string; total: number }>();
		for (const post of posts) {
			if (!trackedIds.has(post.id)) continue;
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
	}, [posts, trackedIds]);

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
	const completionPercent = Math.round(completionRatio * 100);
	const progressColor = completionPercent > 0 ? '#1670f8' : '#dbe5f2';
	const achievements = [
		{ icon: '📖', title: 'First Chapter', detail: 'Complete your first article', unlocked: completedCount >= 1, value: Math.min(completedCount, 1), target: 1 },
		{ icon: '🔥', title: 'Consistent Learner', detail: 'Build a 7-day streak', unlocked: learningStreak >= 7, value: Math.min(learningStreak, 7), target: 7 },
		{ icon: '⏱', title: 'Deep Reader', detail: 'Read for 60 minutes', unlocked: totalReadingMinutes >= 60, value: Math.min(totalReadingMinutes, 60), target: 60 },
	];
	const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
	const navSections = [
		{ label: 'PROGRESS', links: [['My Progress', '/progress'], ['Reading Activity', '#activity'], ['Bookmarks', '#bookmarks'], ['Ratings', '#ratings']] },
		{ label: 'CONTINUE LEARNING', links: [['Browse Articles', '/posts'], ['Browse Series', '/series']] },
	];

	if (!user && !authLoading) return null;

	return (
		<AppProvider publication={publication} footerPosts={footerPosts}>
			<Layout>
				<Head>
					<title>Progress Tracker - {publication.title}</title>
					<meta
						name="description"
					content="Track reading activity, completion, streaks, and skill progress from your account."
					/>
				</Head>
				<Container className="mx-auto w-full">
					<PersonalHeader />
					<div className="border-t border-slate-200 bg-[#fbfdff] dark:border-slate-800 dark:bg-slate-950">
					<div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
						<aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-7 dark:border-slate-800 dark:bg-slate-950 lg:block">
							{navSections.map((section) => <div key={section.label} className="mb-7"><p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400">{section.label}</p><div className="space-y-1">{section.links.map(([label, href]) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold ${href === '/progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'}`}><span className="text-base">{href === '/progress' ? '▣' : '◇'}</span>{label}</Link>)}</div></div>)}
							<div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-blue-950/60 dark:to-indigo-950/40"><p className="text-sm font-bold text-slate-900 dark:text-white">Stay consistent, keep learning!</p><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Your progress is saved from the articles you actually read.</p><Link href={continueReading[0] ? `/${continueReading[0].post.slug}` : '/posts'} className="mt-5 flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Continue Learning →</Link></div>
						</aside>
						<main className="min-w-0 flex-1 px-4 py-7 sm:px-6 xl:px-9">
							<div className="mb-6"><h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">My Progress</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your learning journey and see how you’re growing every day.</p>{progressError ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">Unable to load progress. Verify the deployed Firestore rules allow your signed-in UID to access users/{'{uid}'}/progressedPosts.</p> : null}</div>
							<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
								{[
									{ icon: '◫', tone: 'blue' as const, label: 'Overall Progress', value: `${completionPercent}%`, note: `${completedCount} of ${posts.length} articles` },
					{ icon: '✓', tone: 'teal' as const, label: 'Articles Completed', value: `${completedCount}`, note: 'Read to 85% or marked complete' },
									{ icon: '▤', tone: 'violet' as const, label: 'In Progress', value: `${continueReading.length}`, note: `${trackedPosts.length} articles opened` },
									{ icon: '♨', tone: 'orange' as const, label: 'Current Streak', value: `${learningStreak} days`, note: learningStreak ? 'Keep it up!' : 'Read today to begin' },
									{ icon: '🔖', tone: 'blue' as const, label: 'Bookmarks', value: `${bookmarkedActivity.length}`, note: `${unlockedAchievements} achievements unlocked` },
								].map((card) => <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"><div className="flex gap-3"><DashboardIcon tone={card.tone}>{card.icon}</DashboardIcon><div><p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{card.label}</p><p className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white">{card.value}</p><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{card.note}</p></div></div></div>)}
							</div>

							<div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]">
								<section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Progress Over Time</h2><span className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">Last 4 weeks</span></div><ProgressChart completedAt={completedPosts.map((entry) => entry.completedAt)} total={posts.length} /></section>
								<section id="activity" className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Learning Activity</h2><div className="mt-4 space-y-4">{readingActivity.length ? readingActivity.slice(0, 6).map(({ entry, post }) => <Link key={entry.postId} href={`/${post.slug}`} className="flex items-center gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs ${entry.status === 'completed' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>{entry.status === 'completed' ? '✓' : '◫'}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{entry.status === 'completed' ? 'Completed: ' : 'Read: '}{post.title}</span><span className="shrink-0 text-[10px] text-slate-400">{relativeTime(Math.max(entry.lastReadAt, entry.completedAt))}</span></Link>) : <p className="text-xs text-slate-500">Open an article to start your activity feed.</p>}</div></section>
							</div>

							<div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1.05fr_1.4fr]">
								<section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Progress by Domain</h2><div className="mt-5 flex items-center gap-6"><div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(${progressColor} ${completionPercent}%, #e8eef7 0)` }}><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900"><strong className="text-xl text-slate-950 dark:text-white">{completionPercent}%</strong><span className="text-[10px] text-slate-400">Overall</span></div></div><div className="min-w-0 flex-1 space-y-3">{skillProgress.length ? skillProgress.slice(0, 4).map((skill, index) => <div key={skill.slug} className="flex items-center gap-2 text-[11px]"><span className={`h-2 w-2 rounded-full ${['bg-blue-500','bg-teal-500','bg-violet-500','bg-orange-400'][index]}`} /><span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{skill.label}</span><strong className="text-slate-700 dark:text-slate-200">{skill.mastery}%</strong></div>) : <p className="text-xs leading-5 text-slate-500">Domains appear after you open an article.</p>}</div></div></section>
								<section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Topic Progress</h2><div className="mt-5 space-y-5">{skillProgress.length ? skillProgress.slice(0, 4).map((skill) => <div key={skill.slug}><div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-700 dark:text-slate-200">{skill.label}</span><span className="text-slate-400">{skill.mastery}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${skill.mastery}%` }} /></div></div>) : <p className="text-xs leading-5 text-slate-500">Your active topics will appear here.</p>}</div></section>
								<section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Achievements</h2><div className="mt-4 grid grid-cols-3 gap-3">{achievements.map((achievement) => <div key={achievement.title} className={`rounded-lg border p-3 text-center ${achievement.unlocked ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20' : 'border-slate-200 opacity-65 dark:border-slate-700'}`}><span className="text-2xl">{achievement.icon}</span><p className="mt-2 text-[11px] font-bold text-slate-800 dark:text-slate-100">{achievement.title}</p><p className="mt-1 text-[9px] leading-4 text-slate-500">{achievement.detail}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600" style={{ width: `${Math.round((achievement.value / achievement.target) * 100)}%` }} /></div></div>)}</div></section>
							</div>

							<section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-slate-950 dark:text-white">Recently Continued</h2><Link href="/posts" className="text-xs font-semibold text-blue-600">View all →</Link></div>{readingActivity.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{readingActivity.slice(0, 4).map(({ entry, post }, index) => { const expected = Math.max(1, post.readTimeInMinutes * 60_000); const percent = entry.status === 'completed' ? 100 : Math.min(84, Math.max(5, Math.round((entry.timeSpent / expected) * 100))); return <Link key={entry.postId} href={`/${post.slug}`} className="flex min-w-0 gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-300 dark:border-slate-700"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl ${['bg-blue-50 text-blue-500','bg-violet-50 text-violet-500','bg-teal-50 text-teal-500','bg-orange-50 text-orange-500'][index]}`}>◇</span><span className="min-w-0 flex-1"><span className="line-clamp-2 text-xs font-bold text-slate-800 dark:text-slate-100">{post.title}</span><span className="mt-1 block truncate text-[9px] text-blue-600">{post.tags?.[0]?.name ?? 'Article'}</span><span className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full bg-blue-600" style={{ width: `${percent}%` }} /></span><span className="mt-1 block text-[9px] text-slate-400">{percent}%</span></span></Link>; })}</div> : <p className="mt-4 text-xs text-slate-500">Your recently read articles will appear here.</p>}</section>

							<section id="bookmarks" className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Bookmarks</h2><p className="mt-1 text-[11px] text-slate-500">Saved to your account and available across devices.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{bookmarkedActivity.length} saved</span></div>{bookmarkedActivity.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{bookmarkedActivity.slice(0, 8).map(({ entry, post }) => <Link key={entry.postId} href={`/${post.slug}`} className="group rounded-lg border border-slate-200 p-3 hover:border-blue-300 dark:border-slate-700"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-base dark:bg-blue-950/50">🔖</span><span className="min-w-0"><span className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-blue-600 dark:text-slate-100">{post.title}</span><span className="mt-1 block text-[9px] text-slate-400">Saved {relativeTime(entry.bookmarkedAt)}</span></span></div></Link>)}</div> : <p className="mt-4 text-xs text-slate-500">Bookmark an article and it will appear here.</p>}</section>

							<section id="ratings" className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-950 dark:text-white">Your Ratings</h2><p className="mt-1 text-[11px] text-slate-500">Feedback saved to your account.</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{ratedActivity.length} rated</span></div>{ratedActivity.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{ratedActivity.slice(0, 8).map(({ entry, post }) => <Link key={entry.postId} href={`/${post.slug}#article-feedback`} className="group rounded-lg border border-slate-200 p-3 hover:border-violet-300 dark:border-slate-700"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-sm font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">{entry.rating}</span><span className="min-w-0"><span className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-violet-600 dark:text-slate-100">{post.title}</span><span className="mt-1 block text-[9px] text-slate-400">{entry.rating} out of 5 · {relativeTime(entry.ratedAt)}</span></span></div></Link>)}</div> : <p className="mt-4 text-xs text-slate-500">Rate an article and your feedback will appear here.</p>}</section>
						</main>
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
