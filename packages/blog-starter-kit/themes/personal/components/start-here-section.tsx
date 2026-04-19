import Link from 'next/link';
import { PostFragment } from '../generated/graphql';

export type StartHereSeries = {
seriesName: string;
seriesSlug: string;
posts: PostFragment[];
};

type Props = {
series: StartHereSeries[];
};

// Derive a prerequisite label and color from reading time + step position
const getStepBadge = (readTime: number, index: number) => {
if (index === 0) return { label: 'Start Here', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
if (readTime >= 25) return { label: 'Deep Dive', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' };
if (readTime >= 10) return { label: 'Core Concept', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
return { label: 'Quick Read', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
};

const ExpandedSeriesCard = ({ series }: { series: StartHereSeries }) => {
const posts = series.posts.slice(0, 5);
const totalReadTime = posts.reduce((sum, p) => sum + (p.readTimeInMinutes ?? 0), 0);

return (
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
<p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
Read these foundational posts in order to build a strong mental model before diving into advanced topics.
</p>
{/* Total reading time */}
<div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-5">
<svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
{posts.length} articles &middot; ~{totalReadTime} min total
</div>
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

{/* Right: Visual roadmap */}
<ol className="flex-1 flex flex-col gap-0 relative">
{/* Vertical connector line */}
<div className="absolute left-[13px] top-7 bottom-7 w-px bg-gradient-to-b from-emerald-400 via-emerald-300 to-transparent dark:from-emerald-600 dark:via-emerald-700" />

{posts.map((post, index) => {
const badge = getStepBadge(post.readTimeInMinutes ?? 5, index);
const isLast = index === posts.length - 1;
return (
<li key={post.id} className={isLast ? '' : 'pb-2'}>
<Link
href={`/${post.slug}`}
className="group relative flex items-start gap-4 p-4 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all"
>
{/* Step circle (sits on the connector line) */}
<span className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
{index + 1}
</span>

{/* Post info */}
<div className="flex-1 min-w-0">
<div className="flex items-center gap-2 mb-0.5 flex-wrap">
<h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
{post.title}
</h3>
</div>
<p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
{post.subtitle || post.brief}
</p>
</div>

{/* Right: badge + read time */}
<div className="flex-shrink-0 flex flex-col items-end gap-1 self-center">
<span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap ${badge.cls}`}>
{badge.label}
</span>
<span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
{post.readTimeInMinutes} min
</span>
</div>
</Link>
</li>
);
})}
</ol>
</div>
</div>
</div>
);
};

const CompactSeriesCard = ({ series }: { series: StartHereSeries }) => {
const posts = series.posts.slice(0, 3);
const totalReadTime = series.posts.reduce((sum, p) => sum + (p.readTimeInMinutes ?? 0), 0);
return (
<div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden">
<div className="p-5">
<div className="flex items-start justify-between gap-3 mb-4">
<div>
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wide mb-2">
<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
<path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
</svg>
Series
</span>
<h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 leading-snug">
{series.seriesName}
</h3>
<p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
{series.posts.length} posts &middot; ~{totalReadTime} min total
</p>
</div>
<Link
href={`/series/${series.seriesSlug}`}
className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
>
View all
<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
</svg>
</Link>
</div>

<ol className="flex flex-col gap-2 relative">
<div className="absolute left-[10px] top-5 bottom-5 w-px bg-gradient-to-b from-emerald-400 to-transparent dark:from-emerald-600 opacity-60" />
{posts.map((post, index) => {
const badge = getStepBadge(post.readTimeInMinutes ?? 5, index);
return (
<li key={post.id}>
<Link
href={`/${post.slug}`}
className="group flex items-center gap-3 p-2.5 rounded-lg bg-white/70 dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
>
<span className="relative z-10 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
{index + 1}
</span>
<span className="flex-1 min-w-0 text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-1">
{post.title}
</span>
<span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.cls}`}>
{badge.label}
</span>
</Link>
</li>
);
})}
</ol>
</div>
</div>
);
};

export const StartHereSection = ({ series }: Props) => {
const validSeries = series.filter((s) => s.posts.length > 0);
if (validSeries.length === 0) return null;

const [primary, ...rest] = validSeries;

return (
<section className="w-full py-12">
<div className="flex flex-col gap-4">
<ExpandedSeriesCard series={primary} />
{rest.length > 0 && (
<div className={`grid gap-4 ${rest.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
{rest.map((s) => (
<CompactSeriesCard key={s.seriesSlug} series={s} />
))}
</div>
)}
</div>
</section>
);
};
