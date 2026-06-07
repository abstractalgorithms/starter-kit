import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { PostFragment } from '../generated/graphql';
import {
	SkillTreeNode,
	SkillTreeProgress,
	buildSkillTreePaths,
	getAdaptiveNode,
	getNodeStatus,
} from '../lib/roadmap-skill-tree';
import { isInterviewPrepEnabled } from '../lib/features';
import { useLearningMemoryStore } from '../lib/learning-memory';
import { CTAButton, CTALink } from './cta-system';
import { EmbeddedAIMentor } from './embedded-ai-mentor';
import { useLearningContext } from './learning-context-provider';
import { InlineSimulation } from './visualization/inline-simulation';

const STORAGE_KEY = 'aa:roadmap-skill-tree:v1';

const COLOR_MAP = {
	blue: {
		surface: 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20',
		active: 'border-blue-400 bg-white shadow-blue-500/10 dark:border-blue-700 dark:bg-neutral-950',
		line: 'from-blue-500 to-cyan-500',
		badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
	},
	purple: {
		surface: 'border-violet-200 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/20',
		active: 'border-violet-400 bg-white shadow-violet-500/10 dark:border-violet-700 dark:bg-neutral-950',
		line: 'from-violet-500 to-blue-500',
		badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200',
	},
	emerald: {
		surface: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20',
		active: 'border-emerald-400 bg-white shadow-emerald-500/10 dark:border-emerald-700 dark:bg-neutral-950',
		line: 'from-emerald-500 to-teal-500',
		badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
	},
	orange: {
		surface: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
		active: 'border-amber-400 bg-white shadow-amber-500/10 dark:border-amber-700 dark:bg-neutral-950',
		line: 'from-amber-500 to-orange-500',
		badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
	},
} as const;

type Props = {
	postCounts: Record<string, number>;
	posts?: PostFragment[];
};

const loadProgress = (): SkillTreeProgress => {
	if (typeof window === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as SkillTreeProgress;
	} catch {
		return {};
	}
};

const statusLabel = {
	mastered: 'Mastered',
	'in-progress': 'In progress',
	available: 'Available',
	locked: 'Locked',
	weak: 'Weak area',
} as const;

const statusClass = {
	mastered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
	'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
	available: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
	locked: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500',
	weak: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
} as const;

export const LearningPaths = ({ postCounts, posts = [] }: Props) => {
	const reduceMotion = useReducedMotion();
	const { setContext } = useLearningContext();
	const recordConceptCompleted = useLearningMemoryStore((state) => state.recordConceptCompleted);
	const recordWeakArea = useLearningMemoryStore((state) => state.recordWeakArea);
	const paths = useMemo(() => buildSkillTreePaths(posts, postCounts), [postCounts, posts]);
	const [activePathSlug, setActivePathSlug] = useState(paths[0]?.tagSlug ?? '');
	const [activeNodeId, setActiveNodeId] = useState('');
	const [progress, setProgress] = useState<SkillTreeProgress>({});

	useEffect(() => {
		setProgress(loadProgress());
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
	}, [progress]);

	const activePath = paths.find((path) => path.tagSlug === activePathSlug) ?? paths[0];
	const adaptiveNode = activePath ? getAdaptiveNode(activePath, progress) : undefined;
	const activeNode =
		activePath?.nodes.find((node) => node.id === activeNodeId) ??
		adaptiveNode ??
		activePath?.nodes[0];
	const activeColors = activePath ? COLOR_MAP[activePath.color] : COLOR_MAP.blue;
	const masteredCount = activePath?.nodes.filter((node) => getNodeStatus(node, progress, activePath.nodes) === 'mastered').length ?? 0;
	const weakCount = activePath?.nodes.filter((node) => getNodeStatus(node, progress, activePath.nodes) === 'weak').length ?? 0;
	const masteryPercent = activePath?.nodes.length ? Math.round((masteredCount / activePath.nodes.length) * 100) : 0;

	useEffect(() => {
		if (!activePath || !activeNode) return;
		setContext({
			source: 'roadmap',
			pathname: '/guided-topics',
			title: activePath.title,
			domain: 'Engineering',
			topic: activePath.title,
			concept: activeNode.title,
			roadmapNode: activeNode.title,
			roadmapHref: `/topic/${activePath.tagSlug}`,
			simulationTopic: activeNode.simulationTopic,
		});
	}, [activeNode, activePath, setContext]);

	if (!activePath || paths.length === 0) return null;

	const updateNode = (node: SkillTreeNode, patch: Partial<SkillTreeProgress[string]>) => {
		setProgress((prev) => {
			const current = prev[node.id] ?? { mastery: 0, attempts: 0, weak: false, updatedAt: Date.now() };
			return {
				...prev,
				[node.id]: {
					...current,
					...patch,
					updatedAt: Date.now(),
				},
			};
		});
		setActiveNodeId(node.id);
		if ((patch.mastery ?? 0) >= 85) {
			recordConceptCompleted({
				label: node.title,
				domain: activePath.title,
				slug: node.postSlug,
				minutes: node.estimatedMinutes,
			});
		}
		if (patch.weak) {
			recordWeakArea({
				label: node.title,
				domain: activePath.title,
				slug: node.postSlug,
			});
		}
	};

	const resumeHref = activeNode?.postSlug ? `/${activeNode.postSlug}` : `/posts?tag=${activePath.tagSlug}&sort=created-asc`;
	const topicHref = `/topic/${activePath.tagSlug}`;
	const simulationHref = `/visualizations?q=${encodeURIComponent(activeNode?.simulationTopic ?? activePath.title)}&node=${encodeURIComponent(activeNode?.title ?? activePath.title)}&from=/guided-topics`;
	const interviewHref = isInterviewPrepEnabled
		? `/interview-prep`
		: `/learn?q=${encodeURIComponent(activeNode?.interviewPrompt ?? activePath.title)}`;

	return (
		<section className="space-y-6">
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
				<div className={`rounded-3xl border ${activeColors.surface} p-5`}>
					<p className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-500 dark:text-neutral-400">
						Learning graph
					</p>
					<div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h2 className="text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-4xl">
								{activePath.title}
							</h2>
							<p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
								{activePath.description}
							</p>
						</div>
						<div className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/70">
							<p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Mastery</p>
							<p className="mt-1 text-2xl font-black text-neutral-950 dark:text-neutral-50">{masteryPercent}%</p>
							<div className="mt-2 h-2 w-36 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
								<div className={`h-full rounded-full bg-gradient-to-r ${activeColors.line}`} style={{ width: `${masteryPercent}%` }} />
							</div>
						</div>
					</div>

					<div className="mt-5 flex gap-2 overflow-x-auto pb-1">
						{paths.map((path) => (
							<button
								key={path.tagSlug}
								onClick={() => {
									setActivePathSlug(path.tagSlug);
									setActiveNodeId('');
								}}
								className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-bold transition ${
									path.tagSlug === activePath.tagSlug
										? 'border-neutral-900 bg-neutral-950 text-white dark:border-neutral-100 dark:bg-white dark:text-neutral-950'
										: 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200'
								}`}
							>
								{path.title}
							</button>
						))}
					</div>
				</div>

				<div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
					<p className="text-[10px] font-mono uppercase tracking-[0.24em] text-violet-600 dark:text-violet-300">
						Adaptive recommendation
					</p>
					<p className="mt-2 text-lg font-extrabold text-neutral-950 dark:text-neutral-50">
						{adaptiveNode?.title ?? 'Pick a node'}
					</p>
					<p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
						{weakCount > 0
							? `${weakCount} weak concept${weakCount === 1 ? '' : 's'} should be retried before branching deeper.`
							: adaptiveNode?.description ?? 'Select a node to see the next recommended move.'}
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<CTALink href={topicHref} level={1} size="sm">Open Collection</CTALink>
						<CTAButton type="button" level={2} size="sm" onClick={() => activeNode && updateNode(activeNode, { attempts: (progress[activeNode.id]?.attempts ?? 0) + 1, mastery: Math.max(progress[activeNode.id]?.mastery ?? 0, 45) })}>
							Continue Practice
						</CTAButton>
					</div>
				</div>
			</div>

			<div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
				<div className="rounded-3xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
					<div className="relative overflow-x-auto pb-3">
						<div className="grid min-w-[760px] grid-cols-3 gap-4">
							{activePath.nodes.map((node, index) => {
								const status = getNodeStatus(node, progress, activePath.nodes);
								const selected = node.id === activeNode?.id;
								const disabled = status === 'locked';
								return (
									<motion.button
										key={node.id}
										onClick={() => !disabled && setActiveNodeId(node.id)}
										whileHover={disabled ? undefined : reduceMotion ? undefined : { y: -2 }}
										className={`relative min-h-44 rounded-3xl border p-4 text-left shadow-lg transition ${
											selected ? activeColors.active : 'border-neutral-200 bg-neutral-50/70 shadow-transparent dark:border-neutral-800 dark:bg-neutral-950/60'
										} ${disabled ? 'opacity-55' : ''}`}
									>
										{index < activePath.nodes.length - 1 ? (
											<span className={`absolute -right-5 top-1/2 hidden h-1 w-6 rounded-full bg-gradient-to-r ${activeColors.line} md:block`} aria-hidden="true" />
										) : null}
										<div className="flex items-start justify-between gap-3">
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusClass[status]}`}>
												{statusLabel[status]}
											</span>
											<span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-500 shadow-sm dark:bg-neutral-900 dark:text-neutral-400">
												{node.difficulty}
											</span>
										</div>
										<h3 className="mt-4 text-base font-extrabold text-neutral-950 dark:text-neutral-50">{node.title}</h3>
										<p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{node.description}</p>
										<div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
											<span>{node.branch}</span>
											<span>{node.estimatedMinutes} min</span>
										</div>
									</motion.button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
					{activeNode ? (
						<>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${activeColors.badge}`}>
										{activeNode.branch}
									</p>
									<h3 className="mt-3 text-xl font-extrabold text-neutral-950 dark:text-neutral-50">{activeNode.title}</h3>
								</div>
								<span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusClass[getNodeStatus(activeNode, progress, activePath.nodes)]}`}>
									{statusLabel[getNodeStatus(activeNode, progress, activePath.nodes)]}
								</span>
							</div>
							<p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{activeNode.description}</p>
							<div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
								<div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
									<p className="text-neutral-500 dark:text-neutral-400">Mastery</p>
									<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{progress[activeNode.id]?.mastery ?? 0}%</p>
								</div>
								<div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
									<p className="text-neutral-500 dark:text-neutral-400">Attempts</p>
									<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{progress[activeNode.id]?.attempts ?? 0}</p>
								</div>
								<div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-950">
									<p className="text-neutral-500 dark:text-neutral-400">Prereqs</p>
									<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{activeNode.prerequisiteIds.length}</p>
								</div>
							</div>

							<div className="mt-5 space-y-2">
								<CTALink href={resumeHref} level={1} size="md" className="w-full">Resume Learning</CTALink>
								<CTALink href={topicHref} level={2} size="md" className="w-full">Open Collection</CTALink>
								<CTAButton type="button" level={2} size="md" className="w-full" onClick={() => updateNode(activeNode, { attempts: (progress[activeNode.id]?.attempts ?? 0) + 1, mastery: Math.min(84, Math.max(progress[activeNode.id]?.mastery ?? 0, 55)), weak: false })}>
									Continue Practice
								</CTAButton>
								<CTALink href={simulationHref} level={3} size="md" className="w-full">Launch Simulation</CTALink>
								<CTAButton type="button" level={3} size="md" className="w-full" onClick={() => updateNode(activeNode, { weak: true, attempts: (progress[activeNode.id]?.attempts ?? 0) + 1, mastery: Math.min(progress[activeNode.id]?.mastery ?? 0, 40) })}>
									Retry Weak Concepts
								</CTAButton>
								<CTALink href={interviewHref} level={3} size="md" className="w-full">
									Start Interview Drill
								</CTALink>
								<CTAButton type="button" level={3} size="md" className="w-full" onClick={() => updateNode(activeNode, { mastery: 90, weak: false })}>
									Mark Mastered
								</CTAButton>
							</div>
							<EmbeddedAIMentor
								contextTitle={activePath.title}
								concept={activeNode.title}
								posts={posts}
								compact
								className="mt-5"
							/>
							<InlineSimulation
								topic={activeNode.simulationTopic}
								node={activeNode.title}
								source="learning-graph"
								compact
								className="mt-5"
							/>
						</>
					) : null}
				</div>
			</div>
		</section>
	);
};
