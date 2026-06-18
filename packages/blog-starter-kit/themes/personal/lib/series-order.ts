export type SeriesDifficulty = 'Foundation' | 'Intermediate' | 'Advanced';

type SeriesOrderPost = {
	title: string;
	brief?: string | null;
	readTimeInMinutes?: number | null;
	publishedAt?: string;
	tags?: Array<{ name: string; slug?: string }> | null;
};

const FOUNDATION = /\b(introduction|intro|fundamentals?|basics?|beginner|overview|explained|what is|key terms?|getting started|101)\b/i;
const ADVANCED = /\b(advanced|internals?|deep dive|production|at scale|scalability|optimization|performance|distributed|consistency|consensus|sharding|fault tolerance|high availability|trade-?offs?)\b/i;
const APPLIED = /\b(design|implementation|architecture|pattern|guide|building|how to|case study|interview)\b/i;

export const getSeriesComplexityScore = (post: SeriesOrderPost) => {
	const text = `${post.title} ${post.brief ?? ''} ${(post.tags ?? []).map((tag) => `${tag.name} ${tag.slug ?? ''}`).join(' ')}`;
	let score = Math.min(Math.max(post.readTimeInMinutes ?? 5, 1), 30);
	if (FOUNDATION.test(text)) score -= 30;
	if (APPLIED.test(text)) score += 8;
	if (ADVANCED.test(text)) score += 28;
	return score;
};

export const getSeriesDifficulty = (post: SeriesOrderPost): SeriesDifficulty => {
	const score = getSeriesComplexityScore(post);
	if (score <= 5) return 'Foundation';
	if (score >= 32) return 'Advanced';
	return 'Intermediate';
};

export const orderSeriesPosts = <T extends SeriesOrderPost>(posts: T[]): T[] =>
	[...posts].sort((left, right) => {
		const complexity = getSeriesComplexityScore(left) - getSeriesComplexityScore(right);
		if (complexity !== 0) return complexity;
		const published = (left.publishedAt ?? '').localeCompare(right.publishedAt ?? '');
		if (published !== 0) return published;
		return left.title.localeCompare(right.title);
	});
