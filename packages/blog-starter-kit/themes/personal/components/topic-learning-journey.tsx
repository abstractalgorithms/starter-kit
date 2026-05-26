import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PostFragment } from '../generated/graphql';
import type { SemanticSearchResult } from '../lib/semantic-search';
import type { TopicLearningJourney } from '../lib/topic-learning';
import { useLearningMemoryStore } from '../lib/learning-memory';
import { CTALink } from './cta-system';
import { EmbeddedAIMentor } from './embedded-ai-mentor';
import { useLearningContext } from './learning-context-provider';
import { SystemsKnowledgeGraph } from './systems-knowledge-graph';
import { InlineSimulation } from './visualization/inline-simulation';

type Props = {
	journey: TopicLearningJourney;
	posts: PostFragment[];
};

const compactPosts = (posts: PostFragment[]) =>
	posts.map((post) => ({
		title: post.title,
		slug: post.slug,
		brief: post.brief ?? post.subtitle,
		readTimeInMinutes: post.readTimeInMinutes,
		tags: (post.tags ?? []).map((tag) => ({ name: tag.name, slug: tag.slug })),
	}));

const stageTint: Record<TopicLearningJourney['stages'][number]['id'], string> = {
	concept: 'border-blue-200 bg-blue-50/70 text-blue-800 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200',
	visual: 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
	tradeoff: 'border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200',
	challenge: 'border-violet-200 bg-violet-50/70 text-violet-800 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-200',
	continue: 'border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
};

const quietStageCopy: Record<TopicLearningJourney['stages'][number]['id'], { label: string; line: string }> = {
	concept: { label: 'Grounding', line: 'Build the mental model.' },
	visual: { label: 'Shape', line: 'See how the pieces depend on each other.' },
	tradeoff: { label: 'Consequence', line: 'Compare what improves and what breaks.' },
	challenge: { label: 'Stress', line: 'Change constraints and watch behavior.' },
	continue: { label: 'Next', line: 'Move to the next useful edge.' },
};

const SemanticTopicSearch = ({ journey, posts }: Props) => {
	const [query, setQuery] = useState(journey.semanticQuery);
	const [results, setResults] = useState<SemanticSearchResult[]>([]);
	const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

	const runSearch = async () => {
		if (!query.trim()) return;
		setStatus('loading');
		const response = await fetch('/api/semantic-search', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query,
				topic: journey.label,
				posts: compactPosts(posts),
				limit: 6,
			}),
		});
		const body = (await response.json()) as { results?: SemanticSearchResult[] };
		setResults(body.results ?? []);
		setStatus('done');
	};

	return (
		<section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
				<div>
					<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
						Related threads
					</p>
					<label className="mt-2 block text-sm font-bold text-neutral-900 dark:text-neutral-50" htmlFor="topic-semantic-search">
						Find the idea you are trying to connect
					</label>
					<input
						id="topic-semantic-search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
					/>
				</div>
				<button
					type="button"
					onClick={runSearch}
					className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-blue-100"
				>
					{status === 'loading' ? 'Searching...' : 'Search'}
				</button>
			</div>

			{results.length > 0 ? (
				<div className="mt-4 grid gap-2">
					{results.map((result) => (
						<Link
							key={`${result.source}-${result.href}-${result.title}`}
							href={result.href}
							className="rounded-xl border border-neutral-200 px-3 py-2 transition hover:border-blue-300 dark:border-neutral-800 dark:hover:border-blue-700"
						>
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{result.title}</p>
								<span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
									{result.source === 'hashnode' ? 'article' : 'reference'}
								</span>
							</div>
							{result.snippet ? (
								<p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
									{result.snippet}
								</p>
							) : null}
						</Link>
					))}
				</div>
			) : status === 'done' ? (
				<p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
					No close matches yet. Try a more specific concept or failure mode.
				</p>
			) : null}
		</section>
	);
};

export const TopicLearningJourneyView = ({ journey, posts }: Props) => {
	const { setContext } = useLearningContext();
	const recordConceptSeen = useLearningMemoryStore((state) => state.recordConceptSeen);
	const primaryArticle = journey.articles[0];
	const mentorPosts = useMemo(
		() =>
			journey.articles.map((article) => ({
				title: article.title,
				slug: article.slug,
				brief: article.brief ?? undefined,
				readTimeInMinutes: article.readTimeInMinutes ?? undefined,
				tags: article.tags,
			})),
		[journey.articles],
	);

	useEffect(() => {
		setContext({
			source: 'roadmap',
			pathname: `/topic/${journey.slug}`,
			title: journey.label,
			domain: journey.domain,
			topic: journey.label,
			roadmapHref: `/topic/${journey.slug}`,
			roadmapNode: journey.concepts[0],
			simulationTopic: journey.label,
		});
		recordConceptSeen({
			label: journey.label,
			domain: journey.domain,
			slug: journey.slug,
		});
	}, [journey, recordConceptSeen, setContext]);

	return (
		<div className="space-y-8">
			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
				<div>
					<p className="text-[10px] font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
						Start here
					</p>
					<h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-neutral-950 dark:text-neutral-50 md:text-6xl">
						{journey.label}
					</h1>
					<p className="mt-4 max-w-3xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
						{journey.description}
					</p>
					<div className="mt-6 flex flex-wrap gap-2">
						{journey.concepts.slice(0, 6).map((concept) => (
							<span
								key={concept}
								className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
							>
								{concept}
							</span>
						))}
					</div>
				</div>
				<div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
					<p className="text-sm font-black text-neutral-950 dark:text-neutral-50">Begin with</p>
					<p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
						{primaryArticle
							? `${primaryArticle.primaryConcept} gives you the cleanest entry point before branching into constraints, failures, and related systems.`
							: `Start with the core concepts, then branch into constraints, failures, and related systems.`}
					</p>
					<div className="mt-4 grid grid-cols-2 gap-2 text-center">
						<div className="rounded-xl bg-white p-3 dark:bg-neutral-950">
							<p className="text-2xl font-black text-neutral-950 dark:text-neutral-50">{journey.articles.length}</p>
							<p className="text-[10px] font-bold uppercase text-neutral-500">Articles</p>
						</div>
						<div className="rounded-xl bg-white p-3 dark:bg-neutral-950">
							<p className="text-2xl font-black text-neutral-950 dark:text-neutral-50">{journey.concepts.length}</p>
							<p className="text-[10px] font-bold uppercase text-neutral-500">Concepts</p>
						</div>
					</div>
					{primaryArticle ? (
						<CTALink href={`/${primaryArticle.slug}`} level={1} size="sm" className="mt-4 w-full justify-center">
							Start With {primaryArticle.primaryConcept}
						</CTALink>
					) : null}
				</div>
			</section>

			<section className="grid gap-3 md:grid-cols-5">
				{journey.stages.map((stage) => (
					<div key={stage.id} className={`rounded-2xl border p-4 ${stageTint[stage.id]}`}>
						<p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{quietStageCopy[stage.id].label}</p>
						<p className="mt-2 min-h-[52px] text-sm font-semibold leading-snug">{quietStageCopy[stage.id].line}</p>
						{stage.articleSlugs[0] ? (
							<Link href={`/${stage.articleSlugs[0]}`} className="mt-3 inline-flex text-xs font-black underline underline-offset-4">
								{stage.primaryCta}
							</Link>
						) : (
							<span className="mt-3 inline-flex text-xs font-black opacity-70">{stage.primaryCta}</span>
						)}
					</div>
				))}
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				<SystemsKnowledgeGraph
					posts={posts}
					initialConcept={journey.concepts[0]}
					focusConcepts={journey.concepts}
					focusSlug={journey.slug}
					mode="article"
					className="min-h-full"
				/>
				<div className="space-y-4">
					<EmbeddedAIMentor
						contextTitle={journey.label}
						concept={journey.concepts[0]}
						posts={mentorPosts}
						compact
						label="Guidance"
						helperText="Continues from what you have already explored."
					/>
					<InlineSimulation topic={journey.label} node={journey.concepts[0]} source="learning-graph" />
				</div>
			</section>

			<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<p className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
						Read in sequence
					</p>
					<div className="mt-4 grid gap-3">
						{journey.articles.map((article, index) => (
							<Link
								key={article.id}
								href={`/${article.slug}`}
								className="grid gap-3 rounded-xl border border-neutral-200 p-3 transition hover:border-blue-300 dark:border-neutral-800 dark:hover:border-blue-700 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-black text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
									{index + 1}
								</span>
								<span>
									<span className="block text-sm font-black text-neutral-950 dark:text-neutral-50">{article.title}</span>
									<span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
										{article.brief ?? `Deepen ${article.primaryConcept} inside the ${journey.label} topic.`}
									</span>
								</span>
								<span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
									{article.readTimeInMinutes ?? 0} min
								</span>
							</Link>
						))}
					</div>
				</div>
				<SemanticTopicSearch journey={journey} posts={posts} />
			</section>
		</div>
	);
};
