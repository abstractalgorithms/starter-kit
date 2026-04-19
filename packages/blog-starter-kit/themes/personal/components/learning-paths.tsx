import Link from 'next/link';

type Path = {
	title: string;
	description: string;
	tagSlug: string;
	color: 'blue' | 'purple' | 'emerald' | 'orange';
	steps: string[];
};

const PATHS: Path[] = [
	{
		title: 'System Design Interview Prep',
		description: 'Build intuition for designing scalable distributed systems from scratch.',
		tagSlug: 'system-design',
		color: 'blue',
		steps: ['Fundamentals & CAP theorem', 'Load balancing & caching', 'Database sharding', 'Microservices patterns', 'Real-world case studies'],
	},
	{
		title: 'Distributed Systems',
		description: 'Deep dive into the theory and practice of building reliable distributed systems.',
		tagSlug: 'distributed-systems',
		color: 'purple',
		steps: ['Consensus algorithms', 'Replication strategies', 'Fault tolerance', 'Stream processing', 'CDC & event sourcing'],
	},
	{
		title: 'Python Engineering',
		description: 'From Python basics to production-ready engineering patterns.',
		tagSlug: 'python',
		color: 'emerald',
		steps: ['Python fundamentals', 'Data structures & algorithms', 'Async & concurrency', 'Testing & tooling', 'Performance optimization'],
	},
	{
		title: 'ML & AI Engineering',
		description: 'Navigate the landscape of machine learning and modern AI systems.',
		tagSlug: 'machine-learning',
		color: 'orange',
		steps: ['ML fundamentals', 'Model training & evaluation', 'LLM engineering', 'MLOps & deployment', 'Sparse MoE & advanced topics'],
	},
];

const COLOR_MAP: Record<Path['color'], {
	card: string; badge: string; step: string; btn: string; dot: string;
}> = {
	blue: {
		card: 'border-blue-200 dark:border-blue-900 from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30',
		badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
		step: 'bg-blue-600',
		btn: 'bg-blue-600 hover:bg-blue-700',
		dot: 'bg-blue-400 dark:bg-blue-600',
	},
	purple: {
		card: 'border-purple-200 dark:border-purple-900 from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
		badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
		step: 'bg-purple-600',
		btn: 'bg-purple-600 hover:bg-purple-700',
		dot: 'bg-purple-400 dark:bg-purple-600',
	},
	emerald: {
		card: 'border-emerald-200 dark:border-emerald-900 from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
		badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
		step: 'bg-emerald-600',
		btn: 'bg-emerald-600 hover:bg-emerald-700',
		dot: 'bg-emerald-400 dark:bg-emerald-600',
	},
	orange: {
		card: 'border-orange-200 dark:border-orange-900 from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
		badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
		step: 'bg-orange-500',
		btn: 'bg-orange-500 hover:bg-orange-600',
		dot: 'bg-orange-400 dark:bg-orange-600',
	},
};

type Props = {
	postCounts: Record<string, number>;
};

export const LearningPaths = ({ postCounts }: Props) => {
	const visible = PATHS.filter((p) => (postCounts[p.tagSlug] ?? 0) > 0);
	if (visible.length === 0) return null;

	return (
		<section>
			<div className="flex items-center gap-3 mb-6">
				<div>
					<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
						Curated Roadmaps
					</p>
					<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
						Learning Paths
					</h2>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				{visible.map((path) => {
					const c = COLOR_MAP[path.color];
					const count = postCounts[path.tagSlug] ?? 0;
					return (
						<div
							key={path.tagSlug}
							className={`rounded-xl border bg-gradient-to-br ${c.card} p-5 flex flex-col gap-3`}
						>
							<div>
								<span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${c.badge}`}>
									{count} articles
								</span>
								<h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 leading-snug mb-1">
									{path.title}
								</h3>
								<p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
									{path.description}
								</p>
							</div>

							<ol className="flex flex-col gap-1.5 flex-1">
								{path.steps.map((step, i) => (
									<li key={i} className="flex items-start gap-2">
										<span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full ${c.step} text-white text-[9px] font-bold flex items-center justify-center`}>
											{i + 1}
										</span>
										<span className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
											{step}
										</span>
									</li>
								))}
							</ol>

							<Link
								href={`/posts?tag=${path.tagSlug}&sort=created-asc`}
								className={`inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-white text-xs font-semibold transition-colors ${c.btn}`}
							>
								Start path
								<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</Link>
						</div>
					);
				})}
			</div>
		</section>
	);
};
