'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { CTAButton } from '../cta-system';
import { EmbeddedAIMentor } from '../embedded-ai-mentor';
import { getHoverLift, getRevealVariants, getTapScale } from '../motion-system';
import { useLearningMemoryStore } from '../../lib/learning-memory';
import { DiagramAffordanceBar, PedagogyCanvas } from './pedagogy-canvas';
import { getHealthSemantics, getNodeSemantics } from './semantics';
import { VIS_SCENARIOS } from './scenarios';
import { useVisualizationEngine } from './use-visualization-engine';
import { VizScenario } from './types';

const scoreScenarioMatch = (scenario: VizScenario, query: string) => {
	const normalized = query.toLowerCase();
	const haystack = [scenario.id, scenario.title, scenario.category, scenario.summary].join(' ').toLowerCase();
	return normalized
		.split(/[\s:,-]+/)
		.filter((token) => token.length > 2)
		.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
};

export const VisualizationStudio = ({
	initialTopic,
	initialSection,
}: {
	initialTopic?: string;
	initialSection?: string;
}) => {
	const initialScenario = useMemo(() => {
		if (!initialTopic) return VIS_SCENARIOS[0];
		return [...VIS_SCENARIOS].sort(
			(a, b) => scoreScenarioMatch(b, initialTopic) - scoreScenarioMatch(a, initialTopic),
		)[0] ?? VIS_SCENARIOS[0];
	}, [initialTopic]);
	const [scenarioId, setScenarioId] = useState(initialScenario?.id ?? '');
	const reduceMotion = useReducedMotion();
	const recordSimulationAttempt = useLearningMemoryStore((state) => state.recordSimulationAttempt);
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

	useEffect(() => {
		if (initialScenario?.id) setScenarioId(initialScenario.id);
	}, [initialScenario?.id]);

	useEffect(() => {
		if (!initialSection || !scenario) return;
		const normalized = initialSection.toLowerCase();
		const matchingStep = scenario.steps.findIndex((step) =>
			[step.title, step.description, step.layers.overview, step.layers.deepDive, step.layers.tradeoffs]
				.join(' ')
				.toLowerCase()
				.includes(normalized.split(/\s+/)[0] ?? ''),
		);
		if (matchingStep >= 0) setStepIndex(matchingStep);
	}, [initialSection, scenario, setStepIndex]);

	const highlightedNodeIds = new Set(activeStep.highlightNodeIds ?? []);
	const highlightedEdgeIds = new Set(activeStep.highlightEdgeIds ?? []);
	const hoveredNode = scenario.nodes.find((node) => node.id === hoveredNodeId) ?? null;
	const activeNode = selectedNode ?? hoveredNode;
	const activeNodeSemantics = activeNode ? getNodeSemantics(activeNode.kind) : null;
	const replayAndRemember = () => {
		recordSimulationAttempt({ topic: scenario.title, scenarioId: scenario.id, completed: true });
		replayFlow();
	};
	const triggerFailureAndRemember = () => {
		recordSimulationAttempt({ topic: scenario.title, scenarioId: scenario.id, failed: true });
		triggerFailure();
	};

	return (
		<div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
				<aside className="space-y-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							System scenarios
						</p>
						<div className="mt-2 max-h-[480px] space-y-2 overflow-y-auto pr-1">
							{VIS_SCENARIOS.map((item) => (
								<motion.button
									key={item.id}
									onClick={() => setScenarioId(item.id)}
									whileHover={getHoverLift(reduceMotion)}
									whileTap={getTapScale(reduceMotion)}
									className={`w-full rounded-2xl border p-3 text-left transition-colors ${
										item.id === scenario.id
											? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
											: 'border-neutral-200 hover:border-blue-300 dark:border-neutral-700 dark:hover:border-blue-500'
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
					{initialTopic ? (
						<div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-800 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
							<p className="font-semibold">Contextual simulation state</p>
							<p className="mt-1 text-violet-700 dark:text-violet-300">
								{initialSection ? `${initialTopic} -> ${initialSection}` : initialTopic}
							</p>
						</div>
					) : null}

					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700">
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
							<CTAButton
								type="button"
								level={3}
								size="sm"
								className="ml-auto"
								onClick={() => setPlaying((prev) => !prev)}
								aria-label={playing ? 'Pause simulation' : 'Play simulation'}
							>
								{playing ? 'Pause' : 'Play'}
							</CTAButton>
							<label className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
								Speed
								<select
									value={speed}
									onChange={(e) => setSpeed(Number(e.target.value))}
									className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200"
								>
									<option value={0.5}>0.5x</option>
									<option value={0.75}>0.75x</option>
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
						className="overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-950"
					>
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
					</motion.div>
				</div>

				<aside className="space-y-4">
					<motion.div
						key={`${scenario.id}-${stepIndex}`}
						variants={reveal}
						initial="hidden"
						animate="show"
						className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700"
					>
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Flow semantics
						</p>
						<p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">{activeStep.title}</p>
						<p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{activeStep.description}</p>
					</motion.div>

					{activeFailure ? (
						<div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 dark:border-rose-900 dark:bg-rose-950/20">
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
										Failure state
									</p>
									<p className="mt-1 text-sm font-bold text-neutral-950 dark:text-neutral-50">{activeFailure.title}</p>
								</div>
								<button type="button" onClick={clearFailure} className="text-xs font-semibold text-rose-700 dark:text-rose-300">
									Clear
								</button>
							</div>
							<p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">{activeFailure.description}</p>
							<p className="mt-2 text-xs leading-relaxed text-rose-800 dark:text-rose-200">
								Blast radius: {activeFailure.blastRadius}
							</p>
							<p className="mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
								Recovery: {activeFailure.recovery}
							</p>
						</div>
					) : null}

					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700">
						<p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
							Explain this node
						</p>
						{activeNode && activeNodeSemantics ? (
							<div className="mt-2">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-bold text-neutral-950 dark:text-neutral-50">{activeNode.label}</p>
									<span className={`text-[11px] font-semibold ${getHealthSemantics(activeNode.health).toneClass}`}>
										{getHealthSemantics(activeNode.health).label}
									</span>
								</div>
								<p className="mt-1 text-xs font-semibold text-violet-700 dark:text-violet-300">{activeNodeSemantics.label}</p>
								<p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
									{activeNode.semantics?.responsibility ?? activeNodeSemantics.description}
								</p>
								<p className="mt-2 rounded-xl bg-violet-50 p-2 text-xs leading-relaxed text-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
									{activeNode.semantics?.interviewPrompt ?? `Explain why ${activeNode.label} belongs in this topology.`}
								</p>
							</div>
						) : (
							<p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
								Hover or select a node to reveal responsibility, interview framing, and failure hints.
							</p>
						)}
					</div>

					<EmbeddedAIMentor
						contextTitle={scenario.title}
						concept={activeNode?.label ?? activeStep.title}
						section={activeFailure?.title ?? activeStep.title}
						compact
					/>

					<div className="rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700">
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
				</aside>
			</div>
		</div>
	);
};
