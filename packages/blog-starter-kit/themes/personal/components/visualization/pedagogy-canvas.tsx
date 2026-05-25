'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CTAButton } from '../cta-system';
import { getTapScale } from '../motion-system';
import { getEdgeSemantics, getHealthSemantics, getNodeSemantics } from './semantics';
import { VizEdge, VizNode, VizScenario } from './types';

const getNode = (scenario: VizScenario, id: string) => scenario.nodes.find((node) => node.id === id);

const EdgeLine = ({
	edge,
	scenario,
	highlighted,
	failed,
}: {
	edge: VizEdge;
	scenario: VizScenario;
	highlighted: boolean;
	failed: boolean;
}) => {
	const from = getNode(scenario, edge.from);
	const to = getNode(scenario, edge.to);
	if (!from || !to) return null;
	const semantics = getEdgeSemantics(failed ? 'fallback' : edge.semantic);

	return (
		<g>
			<line
				x1={from.x}
				y1={from.y}
				x2={to.x}
				y2={to.y}
				className={failed ? 'stroke-rose-500 dark:stroke-rose-400' : highlighted ? semantics.stroke : 'stroke-neutral-300 dark:stroke-neutral-600'}
				strokeWidth={failed ? 4 : highlighted ? 3 : 2}
				strokeDasharray={failed ? '8 5' : semantics.dash}
				strokeLinecap="round"
			/>
			<text
				x={(from.x + to.x) / 2}
				y={(from.y + to.y) / 2 - 8}
				className="fill-neutral-500 text-[10px] font-semibold dark:fill-neutral-400"
				textAnchor="middle"
			>
				{edge.label ?? semantics.label}
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
	failure,
}: {
	scenario: VizScenario;
	edgeId: string;
	label: string;
	color?: string;
	playing: boolean;
	speed: number;
	reduceMotion: boolean | null;
	failure: boolean;
}) => {
	const edge = scenario.edges.find((item) => item.id === edgeId);
	if (!edge) return null;
	const from = getNode(scenario, edge.from);
	const to = getNode(scenario, edge.to);
	if (!from || !to) return null;
	const semantics = getEdgeSemantics(edge.semantic);
	const dotColor = failure ? '#e11d48' : color ?? semantics.messageColor;

	return (
		<g>
			<motion.circle
				cx={from.x}
				cy={from.y}
				r={failure ? 7 : 5}
				fill={dotColor}
				animate={
					playing && !reduceMotion
						? { cx: [from.x, to.x], cy: [from.y, to.y], opacity: failure ? [1, 0.2, 1] : [1, 1, 1] }
						: { cx: from.x, cy: from.y, opacity: 1 }
				}
				transition={{
					duration: Math.max(1.4, 2.4 / speed),
					repeat: playing && !reduceMotion ? Infinity : 0,
					ease: 'linear',
					repeatType: 'loop',
				}}
			/>
			<text x={from.x + 10} y={from.y - 10} className="fill-neutral-500 text-[10px] dark:fill-neutral-400">
				{failure ? 'fault' : label}
			</text>
		</g>
	);
};

const NodeGlyph = ({
	node,
	highlighted,
	selected,
	failed,
	onSelect,
	onHover,
}: {
	node: VizNode;
	highlighted: boolean;
	selected: boolean;
	failed: boolean;
	onSelect: () => void;
	onHover: (nodeId: string | null) => void;
}) => {
	const reduceMotion = useReducedMotion();
	const semantics = getNodeSemantics(node.kind);
	const health = getHealthSemantics(failed ? 'failed' : node.health);

	return (
		<g
			role="button"
			tabIndex={0}
			aria-label={`Explain ${node.label}`}
			onClick={onSelect}
			onKeyDown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') onSelect();
			}}
			onMouseEnter={() => onHover(node.id)}
			onMouseLeave={() => onHover(null)}
			className="cursor-pointer focus:outline-none"
		>
			<motion.rect
				x={node.x - 60}
				y={node.y - 30}
				width={120}
				height={60}
				rx={16}
				className={`${semantics.className} ${highlighted || selected ? 'stroke-[3]' : 'stroke-2'}`}
				animate={
					(highlighted || failed) && !reduceMotion
						? { scale: failed ? [1, 1.04, 0.99, 1.03] : [1, 1.03, 1], opacity: failed ? [1, 0.72, 1] : [0.94, 1, 0.94] }
						: { scale: 1, opacity: 1 }
				}
				transition={{ duration: failed ? 0.8 : 1.6, repeat: highlighted || failed ? Infinity : 0 }}
			/>
			<rect
				x={node.x - 66}
				y={node.y - 36}
				width={132}
				height={72}
				rx={20}
				className={`${health.ringClass} fill-transparent`}
				strokeWidth={selected ? 3 : failed ? 4 : 2}
				strokeDasharray={failed ? '5 4' : undefined}
			/>
			<circle cx={node.x - 38} cy={node.y} r={14} className="fill-white/80 dark:fill-neutral-950/80" />
			<text x={node.x - 38} y={node.y + 4} textAnchor="middle" className="fill-neutral-700 text-[9px] font-black dark:fill-neutral-200">
				{semantics.glyph}
			</text>
			<text x={node.x + 10} y={node.y - 3} textAnchor="middle" className="fill-neutral-800 text-[11px] font-bold dark:fill-neutral-100">
				{node.label}
			</text>
			<text x={node.x + 10} y={node.y + 13} textAnchor="middle" className="fill-neutral-500 text-[9px] font-semibold dark:fill-neutral-400">
				{semantics.label}
			</text>
		</g>
	);
};

export const PedagogyCanvas = ({
	scenario,
	highlightedNodeIds,
	highlightedEdgeIds,
	playing,
	speed,
	selectedNodeId,
	activeFailureNodeId,
	activeFailureEdgeId,
	onSelectNode,
	onHoverNode,
	messages,
}: {
	scenario: VizScenario;
	highlightedNodeIds: Set<string>;
	highlightedEdgeIds: Set<string>;
	playing: boolean;
	speed: number;
	selectedNodeId: string | null;
	activeFailureNodeId?: string;
	activeFailureEdgeId?: string;
	onSelectNode: (nodeId: string) => void;
	onHoverNode: (nodeId: string | null) => void;
	messages: Array<{ id: string; edgeId: string; label: string; color?: string }>;
}) => {
	const reduceMotion = useReducedMotion();

	return (
		<div className="rounded-2xl border border-neutral-200 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:28px_28px] p-2 dark:border-neutral-700 dark:bg-neutral-950">
			<svg viewBox="0 0 760 340" className="h-auto w-full min-w-[640px]" role="img" aria-label={`${scenario.title} engineering topology`}>
				{scenario.edges.map((edge) => (
					<EdgeLine
						key={edge.id}
						edge={edge}
						scenario={scenario}
						highlighted={highlightedEdgeIds.has(edge.id)}
						failed={activeFailureEdgeId === edge.id}
					/>
				))}

				{messages.map((message) => (
					<MessageFlow
						key={message.id}
						scenario={scenario}
						edgeId={message.edgeId}
						label={message.label}
						color={message.color}
						playing={playing}
						speed={speed}
						reduceMotion={reduceMotion}
						failure={activeFailureEdgeId === message.edgeId}
					/>
				))}

				{scenario.nodes.map((node) => (
					<NodeGlyph
						key={node.id}
						node={node}
						highlighted={highlightedNodeIds.has(node.id)}
						selected={selectedNodeId === node.id}
						failed={activeFailureNodeId === node.id}
						onSelect={() => onSelectNode(node.id)}
						onHover={onHoverNode}
					/>
				))}
			</svg>
		</div>
	);
};

export const DiagramAffordanceBar = ({
	playing,
	hasFailure,
	slow,
	onReplay,
	onTriggerFailure,
	onStep,
	onSlowMotion,
}: {
	playing: boolean;
	hasFailure: boolean;
	slow: boolean;
	onReplay: () => void;
	onTriggerFailure: () => void;
	onStep: () => void;
	onSlowMotion: () => void;
}) => {
	const reduceMotion = useReducedMotion();

	return (
		<div className="flex flex-wrap items-center gap-2">
			<CTAButton type="button" level={1} size="sm" onClick={onReplay}>
				{playing ? 'Replay Flow' : 'Replay Flow'}
			</CTAButton>
			<CTAButton type="button" level={2} size="sm" onClick={onTriggerFailure} disabled={!hasFailure}>
				Trigger Failure
			</CTAButton>
			<motion.button
				type="button"
				whileTap={getTapScale(reduceMotion)}
				onClick={onStep}
				className="rounded-xl px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30"
			>
				Step Through
			</motion.button>
			<motion.button
				type="button"
				whileTap={getTapScale(reduceMotion)}
				onClick={onSlowMotion}
				className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
					slow
						? 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
						: 'text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30'
				}`}
			>
				Slow Motion Mode
			</motion.button>
		</div>
	);
};
