'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CTAButton } from '../cta-system';
import { useLearningMemoryStore } from '../../lib/learning-memory';
import { DiagramAffordanceBar, PedagogyCanvas } from './pedagogy-canvas';
import { getHealthSemantics, getNodeSemantics } from './semantics';
import { VIS_SCENARIOS } from './scenarios';
import { VizScenario } from './types';
import { useVisualizationEngine } from './use-visualization-engine';

const scoreScenarioMatch = (scenario: VizScenario, query: string) => {
	const normalized = query.toLowerCase();
	const haystack = [scenario.id, scenario.title, scenario.category, scenario.summary].join(' ').toLowerCase();
	return normalized
		.split(/[\s:,-]+/)
		.filter((token) => token.length > 2)
		.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
};

const getScenarioForTopic = (topic?: string) => {
	if (!topic) return VIS_SCENARIOS[0];
	const ranked = [...VIS_SCENARIOS]
		.map((scenario) => ({ scenario, score: scoreScenarioMatch(scenario, topic) }))
		.sort((a, b) => b.score - a.score);
	return ranked[0]?.score > 0 ? ranked[0].scenario : VIS_SCENARIOS[0];
};

export const InlineSimulation = ({
	topic,
	node,
	source: _source = 'inline',
	compact = false,
	className = '',
}: {
	topic?: string;
	node?: string;
	source?: 'article' | 'learning-graph' | 'ai-mentor' | 'interview-prep' | 'inline';
	compact?: boolean;
	className?: string;
}) => {
	const scenario = useMemo(() => getScenarioForTopic(`${topic ?? ''} ${node ?? ''}`.trim()), [node, topic]);
	const recordSimulationAttempt = useLearningMemoryStore((state) => state.recordSimulationAttempt);
	const recordTradeoffMistake = useLearningMemoryStore((state) => state.recordTradeoffMistake);
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
		selectedNodeId,
		setSelectedNodeId,
		selectedNode,
		activeStep,
		progressPercent,
		totalSteps,
		activeFailure,
		animationMode,
		effectiveSpeed,
		replayFlow,
		stepThrough,
		slowMotion,
		triggerFailure,
		clearFailure,
	} = useVisualizationEngine(scenario);

	const highlightedNodeIds = new Set(activeStep.highlightNodeIds ?? []);
	const highlightedEdgeIds = new Set(activeStep.highlightEdgeIds ?? []);
	const hoveredNode = scenario.nodes.find((item) => item.id === hoveredNodeId) ?? null;
	const activeNode = selectedNode ?? hoveredNode;
	const activeNodeSemantics = activeNode ? getNodeSemantics(activeNode.kind) : null;

	const replayAndRemember = () => {
		recordSimulationAttempt({ topic: topic ?? scenario.title, scenarioId: scenario.id, completed: true });
		replayFlow();
	};

	const triggerFailureAndRemember = () => {
		recordSimulationAttempt({ topic: topic ?? scenario.title, scenarioId: scenario.id, failed: true });
		triggerFailure();
	};

	const pressureTest = () => {
		recordTradeoffMistake({
			topic: topic ?? scenario.title,
			mistake: `Pressure tested ${activeStep.title}`,
		});
		triggerFailureAndRemember();
	};

	return (
		<section
			className={`rounded-3xl border border-blue-200 bg-white p-4 shadow-sm dark:border-blue-900 dark:bg-neutral-950 ${className}`}
			aria-label="Inline engineering simulation"
		>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
						System behavior
					</p>
					<h2 className={`${compact ? 'text-lg' : 'text-2xl'} mt-1 font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50`}>
						{scenario.title}
					</h2>
					<p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
						{scenario.summary}
					</p>
				</div>
				<Link
					href={`/visualizations?q=${encodeURIComponent(topic ?? scenario.title)}${node ? `&node=${encodeURIComponent(node)}` : ''}`}
					className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
				>
					Open
				</Link>
			</div>

			<div className={`mt-4 grid gap-4 ${compact ? '' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
				<div className="space-y-3">
					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
						<div className="flex flex-wrap items-center gap-2">
							<DiagramAffordanceBar
								playing={playing}
								hasFailure={(scenario.failureModes?.length ?? 0) > 0}
								slow={animationMode === 'slow'}
								onReplay={replayAndRemember}
								onTriggerFailure={triggerFailureAndRemember}
								onStep={stepThrough}
								onSlowMotion={slowMotion}
							/>
							<CTAButton type="button" level={2} size="sm" onClick={pressureTest}>
								Pressure Test
							</CTAButton>
							<CTAButton
								type="button"
								level={3}
								size="sm"
								className="ml-auto"
								onClick={() => setPlaying((prev) => !prev)}
							>
								{playing ? 'Pause' : 'Play'}
							</CTAButton>
							<label className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
								Speed
								<select
									value={speed}
									onChange={(event) => setSpeed(Number(event.target.value))}
									className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
								>
									<option value={0.5}>0.5x</option>
									<option value={1}>1x</option>
									<option value={1.5}>1.5x</option>
									<option value={2}>2x</option>
								</select>
							</label>
						</div>
						<div className="mt-3">
							<div className="flex items-center justify-between gap-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
								<span>Step {stepIndex + 1} / {totalSteps}</span>
								<span>{animationMode === 'failure' ? 'Failure mode' : animationMode === 'slow' ? 'Slow motion' : animationMode === 'stepping' ? 'Step mode' : 'Normal flow'}</span>
							</div>
							<div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
								<div className="h-2 rounded-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
							</div>
						</div>
					</div>

					<div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-950">
						<PedagogyCanvas
							scenario={scenario}
							highlightedNodeIds={highlightedNodeIds}
							highlightedEdgeIds={highlightedEdgeIds}
							playing={playing}
							speed={effectiveSpeed}
							selectedNodeId={selectedNodeId}
							activeFailureNodeId={activeFailure?.nodeId}
							activeFailureEdgeId={activeFailure?.edgeId}
							onSelectNode={setSelectedNodeId}
							onHoverNode={setHoveredNodeId}
							messages={activeStep.messages ?? []}
						/>
					</div>
				</div>

				<aside className="space-y-3">
					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							What changes
						</p>
						<p className="mt-1 text-sm font-bold text-neutral-950 dark:text-neutral-50">{activeStep.title}</p>
						<p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{activeStep.description}</p>
					</div>

					{activeFailure ? (
						<div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900 dark:bg-rose-950/20">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
										Replay Failure
									</p>
									<p className="mt-1 text-sm font-bold text-neutral-950 dark:text-neutral-50">{activeFailure.title}</p>
								</div>
								<button type="button" onClick={clearFailure} className="text-xs font-semibold text-rose-700 dark:text-rose-300">
									Clear
								</button>
							</div>
							<p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">{activeFailure.description}</p>
							<p className="mt-2 text-xs leading-relaxed text-rose-800 dark:text-rose-200">Blast radius: {activeFailure.blastRadius}</p>
							<p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">Recovery: {activeFailure.recovery}</p>
						</div>
					) : null}

					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Node
						</p>
						{activeNode && activeNodeSemantics ? (
							<div className="mt-2">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-bold text-neutral-950 dark:text-neutral-50">{activeNode.label}</p>
									<span className={`text-[11px] font-semibold ${getHealthSemantics(activeNode.health).toneClass}`}>
										{getHealthSemantics(activeNode.health).label}
									</span>
								</div>
								<p className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300">{activeNodeSemantics.label}</p>
								<p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
									{activeNode.semantics?.responsibility ?? activeNodeSemantics.description}
								</p>
							</div>
						) : (
							<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
								Select a node to inspect responsibility, health, and failure behavior.
							</p>
						)}
					</div>

					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-800">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Reasoning
						</p>
						<div className="mt-2 flex flex-wrap gap-2">
							{(['overview', 'deepDive', 'tradeoffs'] as const).map((item) => (
								<button
									key={item}
									type="button"
									onClick={() => setLayer(item)}
									className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
										layer === item
											? 'bg-blue-600 text-white'
											: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
									}`}
								>
									{item}
								</button>
							))}
						</div>
						<p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{activeStep.layers[layer]}</p>
					</div>
				</aside>
			</div>
		</section>
	);
};
