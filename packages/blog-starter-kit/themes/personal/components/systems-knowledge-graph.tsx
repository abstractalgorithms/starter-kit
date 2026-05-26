'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PostFragment } from '../generated/graphql';
import {
	ConceptCluster,
	ConceptGraphNode,
	ConceptRelationship,
	buildConceptGraph,
	getConceptHref,
	getRelationshipSummary,
} from '../lib/concept-graph';
import { useLearningMemoryStore } from '../lib/learning-memory';
import { CTAButton, CTALink } from './cta-system';
import { useLearningContext } from './learning-context-provider';

type Props = {
	posts?: PostFragment[];
	initialConcept?: string;
	focusConcepts?: string[];
	focusSlug?: string;
	focusPostSlug?: string;
	mode?: 'global' | 'article';
	compact?: boolean;
	className?: string;
};

const CLUSTER_STYLE: Record<ConceptCluster, { node: string; text: string; rail: string }> = {
	foundations: {
		node: 'border-neutral-300 bg-white text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50',
		text: 'text-neutral-700 dark:text-neutral-300',
		rail: 'bg-neutral-500',
	},
	'data-flow': {
		node: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
		text: 'text-emerald-700 dark:text-emerald-300',
		rail: 'bg-emerald-500',
	},
	coordination: {
		node: 'border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100',
		text: 'text-violet-700 dark:text-violet-300',
		rail: 'bg-violet-500',
	},
	reliability: {
		node: 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100',
		text: 'text-blue-700 dark:text-blue-300',
		rail: 'bg-blue-500',
	},
	'ai-systems': {
		node: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
		text: 'text-amber-700 dark:text-amber-300',
		rail: 'bg-amber-500',
	},
	operations: {
		node: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100',
		text: 'text-rose-700 dark:text-rose-300',
		rail: 'bg-rose-500',
	},
};

const relationshipClass: Record<ConceptRelationship['type'], string> = {
	prerequisite: 'stroke-violet-500',
	'depends-on': 'stroke-blue-500',
	extends: 'stroke-emerald-500',
	tradeoff: 'stroke-amber-500',
	adjacent: 'stroke-neutral-400 dark:stroke-neutral-600',
};

const relationshipLabel: Record<ConceptRelationship['type'], string> = {
	prerequisite: 'Learn before',
	'depends-on': 'Needs',
	extends: 'Builds toward',
	tradeoff: 'Tradeoff',
	adjacent: 'Related idea',
};

const normalize = (value?: string) =>
	(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const relationPath = (from: ConceptGraphNode, to: ConceptGraphNode) => {
	const startX = from.x + 76;
	const startY = from.y + 24;
	const endX = to.x + 76;
	const endY = to.y + 24;
	const midX = (startX + endX) / 2;
	return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
};

export const SystemsKnowledgeGraph = ({
	posts = [],
	initialConcept,
	focusConcepts,
	focusSlug,
	focusPostSlug,
	mode = 'global',
	compact = false,
	className = '',
}: Props) => {
	const reduceMotion = useReducedMotion();
	const { setContext } = useLearningContext();
	const recordConceptSeen = useLearningMemoryStore((state) => state.recordConceptSeen);
	const graph = useMemo(
		() => buildConceptGraph(posts, { mode, focusConcepts, focusSlug, focusPostSlug }),
		[focusConcepts, focusPostSlug, focusSlug, mode, posts],
	);
	const initialNodeId = useMemo(() => {
		const target = normalize(initialConcept);
		return graph.nodes.find((node) => node.id === target || normalize(node.label) === target)?.id ?? graph.nodes[0]?.id ?? 'replication';
	}, [graph.nodes, initialConcept]);
	const [activeNodeId, setActiveNodeId] = useState(initialNodeId);
	const [expandedIds, setExpandedIds] = useState<string[]>([initialNodeId]);
	const [hoveredRelationshipId, setHoveredRelationshipId] = useState('');
	const [clusterFilter, setClusterFilter] = useState<ConceptCluster | 'all'>('all');

	const activeNode = graph.nodes.find((node) => node.id === activeNodeId) ?? graph.nodes[0];
	const activeRelationships = graph.relationships.filter(
		(relationship) => relationship.from === activeNode?.id || relationship.to === activeNode?.id,
	);
	const hoveredRelationship = graph.relationships.find((relationship) => relationship.id === hoveredRelationshipId);

	const visibleIds = useMemo(() => {
		const ids = new Set<string>();
		graph.nodes.forEach((node) => {
			if (!compact && node.y <= 455) ids.add(node.id);
			if (compact && node.y <= 305) ids.add(node.id);
			if (clusterFilter !== 'all' && node.cluster === clusterFilter) ids.add(node.id);
		});
		expandedIds.forEach((id) => {
			ids.add(id);
			const node = graph.nodes.find((item) => item.id === id);
			node?.relatedIds.forEach((relatedId) => ids.add(relatedId));
			node?.prerequisiteIds.forEach((prereqId) => ids.add(prereqId));
		});
		if (activeNode) {
			ids.add(activeNode.id);
			activeNode.relatedIds.forEach((relatedId) => ids.add(relatedId));
		}
		return ids;
	}, [activeNode, clusterFilter, compact, expandedIds, graph.nodes]);

	const visibleNodes = graph.nodes.filter((node) => visibleIds.has(node.id));
	const visibleRelationships = graph.relationships.filter(
		(relationship) => visibleIds.has(relationship.from) && visibleIds.has(relationship.to),
	);

	const selectNode = (node: ConceptGraphNode) => {
		setActiveNodeId(node.id);
		recordConceptSeen({
			label: node.label,
			domain: graph.clusters.find((cluster) => cluster.id === node.cluster)?.label,
			slug: node.slug,
		});
		setContext({
			source: 'discover',
			pathname: '/guided-topics',
			title: 'Systems Knowledge Graph',
			domain: 'Engineering',
			topic: graph.clusters.find((cluster) => cluster.id === node.cluster)?.label,
			concept: node.label,
			roadmapNode: node.label,
			roadmapHref: `/guided-topics?node=${encodeURIComponent(node.label)}`,
			simulationTopic: node.label,
		});
	};

	const toggleExpand = (node: ConceptGraphNode) => {
		setExpandedIds((prev) =>
			prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id],
		);
		selectNode(node);
	};

	if (!activeNode) return null;

	const detailRelationships = activeRelationships
		.map((relationship) => ({
			relationship,
			other: graph.nodes.find((node) => node.id === (relationship.from === activeNode.id ? relationship.to : relationship.from)),
		}))
		.filter((item): item is { relationship: ConceptRelationship; other: ConceptGraphNode } => Boolean(item.other));

	return (
		<section className={`rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-5 ${className}`}>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p className="text-[10px] font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
						Relationships
					</p>
					<h2 className="mt-2 text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-neutral-50 md:text-3xl">
						Follow the shape of the system
					</h2>
					<p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
						Move through prerequisites, dependencies, tradeoffs, and adjacent concepts without losing the thread.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{graph.clusters.map((cluster) => (
						<button
							key={cluster.id}
							type="button"
							onClick={() => setClusterFilter(clusterFilter === cluster.id ? 'all' : cluster.id)}
							className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
								clusterFilter === cluster.id
									? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
									: 'border-neutral-200 text-neutral-600 hover:border-blue-300 hover:text-blue-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-blue-600 dark:hover:text-blue-300'
							}`}
						>
							{cluster.label}
						</button>
					))}
				</div>
			</div>

			<div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
					<div className={`relative ${compact ? 'h-[380px] min-w-[1040px]' : 'h-[760px] min-w-[1120px]'}`}>
						<svg
							className="absolute inset-0 h-full w-full"
							viewBox={`0 0 1120 ${compact ? 380 : 760}`}
							role="img"
							aria-label="Concept dependency graph"
						>
							<defs>
								<marker id="concept-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
									<path d="M 0 0 L 10 5 L 0 10 z" className="fill-neutral-400 dark:fill-neutral-600" />
								</marker>
							</defs>
							{visibleRelationships.map((relationship) => {
								const from = graph.nodes.find((node) => node.id === relationship.from);
								const to = graph.nodes.find((node) => node.id === relationship.to);
								if (!from || !to) return null;
								const isActive =
									relationship.id === hoveredRelationshipId ||
									relationship.from === activeNode.id ||
									relationship.to === activeNode.id;
								return (
									<path
										key={relationship.id}
										d={relationPath(from, to)}
										fill="none"
										strokeWidth={isActive ? 3 : 1.6}
										strokeLinecap="round"
										markerEnd="url(#concept-arrow)"
										className={`${relationshipClass[relationship.type]} transition-opacity ${isActive ? 'opacity-95' : 'opacity-35'}`}
										onMouseEnter={() => setHoveredRelationshipId(relationship.id)}
										onMouseLeave={() => setHoveredRelationshipId('')}
									/>
								);
							})}
						</svg>

						{visibleNodes.map((node) => {
							const selected = node.id === activeNode.id;
							const expanded = expandedIds.includes(node.id);
							return (
								<motion.button
									key={node.id}
									type="button"
									onClick={() => selectNode(node)}
									onDoubleClick={() => toggleExpand(node)}
									whileHover={reduceMotion ? undefined : { y: -2 }}
									className={`absolute h-[74px] w-[152px] rounded-2xl border px-3 py-2 text-left shadow-sm transition ${
										selected
											? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-neutral-950'
											: ''
									} ${CLUSTER_STYLE[node.cluster].node}`}
									style={{ left: node.x, top: node.y }}
								>
									<span className={`mb-1 block h-1 w-10 rounded-full ${CLUSTER_STYLE[node.cluster].rail}`} />
									<span className="block truncate text-sm font-black leading-5">{node.label}</span>
									<span className="mt-0.5 block truncate text-[11px] font-semibold opacity-70">
										{relationshipLabel[node.prerequisiteIds.length ? 'prerequisite' : 'adjacent']} · {node.articleCount || 'mentor'} refs
									</span>
									<span className="absolute right-2 top-2 text-[10px] font-black opacity-60">
										{expanded ? '-' : '+'}
									</span>
								</motion.button>
							);
						})}
					</div>
				</div>

				<aside className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className={`text-[11px] font-black uppercase tracking-wide ${CLUSTER_STYLE[activeNode.cluster].text}`}>
								{graph.clusters.find((cluster) => cluster.id === activeNode.cluster)?.label}
							</p>
							<h3 className="mt-1 text-xl font-extrabold text-neutral-950 dark:text-neutral-50">
								{activeNode.label}
							</h3>
						</div>
						<span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
							{activeNode.level}
						</span>
					</div>
					<p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
						{activeNode.summary}
					</p>

					<div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
						<div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900">
							<p className="text-neutral-500 dark:text-neutral-400">Before</p>
							<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{activeNode.prerequisiteIds.length}</p>
						</div>
						<div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900">
							<p className="text-neutral-500 dark:text-neutral-400">Related</p>
							<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{activeRelationships.length}</p>
						</div>
						<div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900">
							<p className="text-neutral-500 dark:text-neutral-400">Reads</p>
							<p className="mt-1 font-black text-neutral-950 dark:text-neutral-50">{activeNode.articleCount}</p>
						</div>
					</div>

					<div className="mt-4 rounded-xl border border-dashed border-neutral-200 p-3 dark:border-neutral-800">
						<p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Why it connects</p>
						<p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
							{hoveredRelationship
								? getRelationshipSummary(hoveredRelationship, graph.nodes)
								: detailRelationships[0]
									? getRelationshipSummary(detailRelationships[0].relationship, graph.nodes)
									: 'Choose a nearby idea to see how it changes the way you should reason about this one.'}
						</p>
					</div>

					<div className="mt-4 space-y-2">
						{detailRelationships.slice(0, 4).map(({ relationship, other }) => (
							<button
								key={relationship.id}
								type="button"
								onMouseEnter={() => setHoveredRelationshipId(relationship.id)}
								onMouseLeave={() => setHoveredRelationshipId('')}
								onClick={() => selectNode(other)}
								className="w-full rounded-xl border border-neutral-200 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-neutral-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
							>
								<span className="text-[10px] font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
									{relationshipLabel[relationship.type]}
								</span>
								<span className="mt-1 block text-sm font-bold text-neutral-950 dark:text-neutral-50">
									{other.label}
								</span>
								<span className="mt-1 block text-xs text-neutral-500 dark:text-neutral-400">
									{relationship.label}
								</span>
							</button>
						))}
					</div>

					<div className="mt-5 grid gap-2">
						<CTALink href={getConceptHref(activeNode)} level={1} size="md" className="w-full">
							Open Reading
						</CTALink>
						<CTAButton type="button" level={2} size="md" className="w-full" onClick={() => toggleExpand(activeNode)}>
							{expandedIds.includes(activeNode.id) ? 'Show Less' : 'Show What Comes Before'}
						</CTAButton>
						<CTALink
							href={`/assistant?q=${encodeURIComponent(`Explain how ${activeNode.label} connects to the nearby concepts in this topic`)}`}
							level={3}
							size="md"
							className="w-full"
						>
							Explain This
						</CTALink>
						<CTALink
							href={`/assistant?q=${encodeURIComponent(`Give me a tradeoff reasoning question about ${activeNode.label} and the concepts around it`)}`}
							level={3}
							size="md"
							className="w-full"
						>
							Tradeoff Question
						</CTALink>
					</div>
				</aside>
			</div>

			<div className="mt-4 grid gap-2 md:hidden">
				{visibleNodes.slice(0, 8).map((node) => (
					<Link
						key={`mobile-${node.id}`}
						href={getConceptHref(node)}
						className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold text-neutral-800 dark:border-neutral-800 dark:text-neutral-100"
					>
						{node.label}
					</Link>
				))}
			</div>
		</section>
	);
};
