import Link from 'next/link';
import { PostFragment } from '../generated/graphql';

export type StartHereSeries = {
	seriesName: string;
	seriesSlug: string;
	posts: PostFragment[];
};

type Props = {
	series: StartHereSeries;
};

export const StartHereSection = ({ series }: Props) => {
	if (!series || series.posts.length === 0) return null;

	return (
		<section className="w-full py-12">
			<div className="relative rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">

				{/* Background accent */}
				<div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-100 dark:bg-emerald-900/20 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

				<div className="relative px-6 py-8 md:px-10 md:py-10">
					<div className="flex flex-col md:flex-row md:items-start gap-8">

						{/* Left: CTA copy */}
						<div className="md:w-56 flex-shrink-0">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wide mb-4">
								<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
								</svg>
								Start Here
							</div>
							<h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-3 leading-snug">
								New to {series.seriesName}?
							</h2>
							<p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-5">
								Read these foundational posts in order to build a strong mental model before diving into advanced topics.
							</p>
							<Link
								href={`/series/${series.seriesSlug}`}
								className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
							>
								View full series
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						</div>

						{/* Right: Numbered post list */}
						<ol className="flex-1 flex flex-col gap-3">
							{series.posts.slice(0, 5).map((post, index) => (
								<li key={post.id}>
									<Link
										href={`/${post.slug}`}
										className="group flex items-start gap-4 p-4 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
									>
										{/* Step number */}
										<span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
											{index + 1}
										</span>

										{/* Post info */}
										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
												{post.title}
											</h3>
											<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
												{post.subtitle || post.brief}
											</p>
										</div>

										{/* Read time badge */}
										<span className="flex-shrink-0 text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap self-center">
											{post.readTimeInMinutes} min
										</span>
									</Link>
								</li>
							))}
						</ol>
					</div>
				</div>
			</div>
		</section>
	);
};
