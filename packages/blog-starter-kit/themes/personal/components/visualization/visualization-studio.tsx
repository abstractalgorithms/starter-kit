'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { getHoverLift, getRevealVariants, getTapScale } from '../motion-system';
import { VIS_SCENARIOS } from './scenarios';
import { useSimulation } from './use-simulation';
import { VizEdge, VizNode, VizScenario } from './types';

const NODE_STYLES: Record<VizNode['kind'], string> = {
	client: 'fill-slate-200 stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500',
	service: 'fill-blue-100 stroke-blue-400 dark:fill-blue-900/50 dark:stroke-blue-500',
	compute: 'fill-violet-100 stroke-violet-400 dark:fill-violet-900/50 dark:stroke-violet-500',
	storage: 'fill-emerald-100 stroke-emerald-400 dark:fill-emerald-900/50 dark:stroke-emerald-500',
	queue: 'fill-amber-100 stroke-amber-400 dark:fill-amber-900/50 dark:stroke-amber-500',
};

const getNode = (scenario: VizScenario, id: string) => scenario.nodes.find((node) => node.id === id);

const EdgeLine = ({
	edge,
	scenario,
	highlighted,
}: {
	edge: VizEdge;
	scenario: VizScenario;
	highlighted: boolean;
}) => {
	const from = getNode(scenario, edge.from);
	const to = getNode(scenario, edge.to);
	if (!from || !to) return null;

	return (
		<g>
			<line
				x1={from.x}
				y1={from.y}
				x2={to.x}
				y2={to.y}
				className={highlighted ? 'stroke-blue-500 dark:stroke-blue-400' : 'stroke-neutral-300 dark:stroke-neutral-600'}
				strokeWidth={highlighted ? 3 : 2}
				strokeLinecap="round"
			/>
			<text
				x={(from.x + to.x) / 2}
				y={(from.y + to.y) / 2 - 8}
				className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-semibold"
				textAnchor="middle"
			>
				{edge.label}
			</text>
		</g>
	);
};

const MessageFlow = ({
	scenario,
	edgeId,
	label,
	color,
	playing,
	speed,
	reduceMotion,
}: {
	scenario: VizScenario;
	edgeId: string;
	label: string;
	color?: string;
	playing: boolean;
	speed: number;
	reduceMotion: boolean | null;
}) => {
	const edge = scenario.edges.find((item) => item.id === edgeId);
	if (!edge) return null;
	const from = getNode(scenario, edge.from);
	const to = getNode(scenario, edge.to);
	if (!from || !to) return null;

	const dotColor = color ?? '#0ea5e9';

	return (
		<g>
			<motion.circle
				cx={from.x}
				cy={from.y}
				r={5}
				fill={dotColor}
				animate={
					playing && !reduceMotion
						? { cx: [from.x, to.x], cy: [from.y, to.y] }
						: { cx: from.x, cy: from.y }
				}
				transition={{
					duration: Math.max(1.1, 2.2 / speed),
					repeat: playing && !reduceMotion ? Infinity : 0,
					ease: 'linear',
					repeatType: 'loop',
				}}
			/>
			<text x={from.x + 10} y={from.y - 10} className="fill-neutral-500 dark:fill-neutral-400 text-[10px]">
				{label}
			</text>
		</g>
	);
};

export const VisualizationStudio = () => {
	const [scenarioId, setScenarioId] = useState(VIS_SCENARIOS[0]?.id ?? '');
	const reduceMotion = useReducedMotion();
	const reveal = getRevealVariants(reduceMotion);
	const scenario = useMemo(
		() => VIS_SCENARIOS.find((item) => item.id === scenarioId) ?? VIS_SCENARIOS[0],
		[scenarioId],
	);

	const {
		stepIndex,
		setStepIndex,
		playing,
		setPlaying,
		speed,
		setSpeed,
		layer,
		setLayer,
		hoveredNodeId,
		setHoveredNodeId,
		activeStep,
		progressPercent,
		totalSteps,
	} = useSimulation(scenario);

	const highlightedNodeIds = new Set(activeStep.highlightNodeIds ?? []);
	const highlightedEdgeIds = new Set(activeStep.highlightEdgeIds ?? []);

	return (
		<div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
				<aside className="space-y-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Scenarios
						</p>
						<div className="mt-2 space-y-2 max-h-[480px] overflow-y-auto pr-1">
							{VIS_SCENARIOS.map((item) => (
								<motion.button
									key={item.id}
									onClick={() => setScenarioId(item.id)}
									whileHover={getHoverLift(reduceMotion)}
									whileTap={getTapScale(reduceMotion)}
									className={`w-full rounded-xl border p-3 text-left transition-colors ${
										item.id === scenario.id
											? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
											: 'border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-500'
									}`}
								>
									<p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title}</p>
									<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{item.summary}</p>
								</motion.button>
							))}
						</div>
					</div>
				</aside>

				<div className="space-y-3">
					<div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
						<div className="flex flex-wrap items-center gap-2">
							<motion.button
								onClick={() => setPlaying((prev) => !prev)}
								whileTap={getTapScale(reduceMotion)}
								className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
								aria-label={playing ? 'Pause simulation' : 'Play simulation'}
							>
								{playing ? 'Pause' : 'Play'}
							</motion.button>
							<motion.button
								onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
								whileTap={getTapScale(reduceMotion)}
								className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
							>
								Prev
							</motion.button>
							<motion.button
								onClick={() => setStepIndex(Math.min(totalSteps - 1, stepIndex + 1))}
								whileTap={getTapScale(reduceMotion)}
								className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
							>
								Next
							</motion.button>
							<label className="ml-auto inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
								Speed
								<select
									value={speed}
									onChange={(e) => setSpeed(Number(e.target.value))}
									className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-1 text-xs text-neutral-700 dark:text-neutral-200"
								>
									<option value={0.75}>0.75x</option>
									<option value={1}>1x</option>
									<option value={1.5}>1.5x</option>
									<option value={2}>2x</option>
								</select>
							</label>
						</div>

						<div className="mt-3">
							<p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
								Step {stepIndex + 1} / {totalSteps}
							</p>
							<div className="mt-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
								<motion.div
									className="h-2 rounded-full bg-blue-500"
									animate={{ width: `${progressPercent}%` }}
									transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0, 0, 1] }}
								/>
							</div>
						</div>
					</div>

					<motion.div
						key={scenario.id}
						variants={reveal}
						initial="hidden"
						animate="show"
						className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-2 overflow-x-auto"
					>
						<svg viewBox="0 0 760 340" className="min-w-[640px] w-full h-auto" role="img" aria-label={`${scenario.title} simulation canvas`}>
							{scenario.edges.map((edge) => (
								<EdgeLine
									key={edge.id}
									edge={edge}
									scenario={scenario}
									highlighted={highlightedEdgeIds.has(edge.id)}
								/>
							))}

							{(activeStep.messages ?? []).map((message) => (
								<MessageFlow
									key={message.id}
									scenario={scenario}
									edgeId={message.edgeId}
									label={message.label}
									color={message.color}
									playing={playing}
									speed={speed}
									reduceMotion={reduceMotion}
								/>
							))}

							{scenario.nodes.map((node) => {
								const highlighted = highlightedNodeIds.has(node.id);
								const hovered = hoveredNodeId === node.id;
								return (
									<g key={node.id}>
										<motion.rect
											x={node.x - 58}
											y={node.y - 26}
											width={116}
											height={52}
											rx={14}
											className={`${NODE_STYLES[node.kind]} ${highlighted ? 'stroke-[3]' : 'stroke-2'}`}
											animate={
												highlighted && !reduceMotion
													? { scale: [1, 1.03, 1], opacity: [0.95, 1, 0.95] }
													: { scale: 1, opacity: 1 }
											}
											transition={{ duration: 1.6, repeat: highlighted && !reduceMotion ? Infinity : 0 }}
											onMouseEnter={() => setHoveredNodeId(node.id)}
											onMouseLeave={() => setHoveredNodeId(null)}
										/>
										<text
											x={node.x}
											y={node.y + 4}
											textAnchor="middle"
											className="fill-neutral-700 dark:fill-neutral-200 text-[11px] font-semibold"
										>
											{node.label}
										</text>
										{hovered && node.description && (
											<g>
												<rect
													x={node.x - 70}
													y={node.y - 70}
													width={140}
													height={26}
													rx={8}
													className="fill-neutral-900 dark:fill-neutral-700"
												/>
												<text x={node.x} y={node.y - 53} textAnchor="middle" className="fill-white text-[10px]">
													{node.description}
												</text>
											</g>
										)}
									</g>
								);
							})}
						</svg>
					</motion.div>
				</div>

				<aside className="space-y-4">
					<motion.div key={`${scenario.id}-${stepIndex}`} variants={reveal} initial="hidden" animate="show" className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Simulation playback
						</p>
						<p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{activeStep.title}</p>
						<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{activeStep.description}</p>
					</motion.div>

					<div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Layered explanations
						</p>
						<div className="mt-2 flex gap-2">
							{(['overview', 'deepDive', 'tradeoffs'] as const).map((item) => (
								<motion.button
									key={item}
									onClick={() => setLayer(item)}
									whileTap={getTapScale(reduceMotion)}
									className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
										layer === item
											? 'bg-blue-600 text-white'
											: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
									}`}
								>
									{item}
								</motion.button>
							))}
						</div>
						<p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
							{activeStep.layers[layer]}
						</p>
					</div>

					<div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Accessibility + performance
						</p>
						<ul className="mt-2 space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
							<li>Keyboard-usable controls for play, step, and speed.</li>
							<li>Reduced-motion path supported automatically.</li>
							<li>SVG rendering for clarity, with data-driven steps.</li>
							<li>Reusable scenario schema for all technical topics.</li>
						</ul>
					</div>
				</aside>
			</div>
		</div>
	);
};
