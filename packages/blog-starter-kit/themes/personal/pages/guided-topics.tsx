import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function GuidedTopicsCompatibilityPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace('/learn');
	}, [router]);

	return (
		<>
			<Head>
				<title>Explore Concept Collections</title>
				<meta
					name="description"
					content="Explore article-backed systems concepts and related engineering themes."
				/>
				<meta name="robots" content="noindex" />
			</Head>
			<main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
				<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
					Explore
				</p>
				<h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950">
					Concept collections moved to Learn.
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-neutral-500">
					The publication now keeps discovery lighter and closer to the articles.
				</p>
				<Link
					href="/learn"
					className="mt-6 rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white"
				>
					Open Learn
				</Link>
			</main>
		</>
	);
}
