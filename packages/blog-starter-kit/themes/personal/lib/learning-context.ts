import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LearningContextSource =
	| 'homepage'
	| 'article'
	| 'assistant'
	| 'simulation'
	| 'roadmap'
	| 'discover'
	| 'interview-prep'
	| 'library'
	| 'unknown';

export type LearningCrumb = {
	label: string;
	href?: string;
};

export type LearningContextSnapshot = {
	source: LearningContextSource;
	pathname: string;
	title?: string;
	slug?: string;
	domain?: string;
	topic?: string;
	subtopic?: string;
	concept?: string;
	sectionId?: string;
	sectionTitle?: string;
	roadmapNode?: string;
	roadmapHref?: string;
	simulationTopic?: string;
	updatedAt: number;
};

export type LearningPosition = {
	pathname: string;
	scrollY: number;
	sectionId?: string;
	sectionTitle?: string;
	updatedAt: number;
};

type LearningContextState = {
	current: LearningContextSnapshot;
	positions: Record<string, LearningPosition>;
	history: LearningContextSnapshot[];
	setContext: (context: Partial<LearningContextSnapshot>) => void;
	setSection: (section: Pick<LearningContextSnapshot, 'sectionId' | 'sectionTitle'>) => void;
	rememberPosition: (position: LearningPosition) => void;
	clearContext: () => void;
};

export const DEFAULT_LEARNING_CONTEXT: LearningContextSnapshot = {
	source: 'unknown',
	pathname: '/',
	title: 'Abstract Algorithms',
	domain: 'Engineering',
	updatedAt: 0,
};

const compactHistory = (
	next: LearningContextSnapshot,
	history: LearningContextSnapshot[],
): LearningContextSnapshot[] => {
	const withoutDuplicate = history.filter(
		(item) =>
			item.pathname !== next.pathname ||
			item.slug !== next.slug ||
			item.sectionId !== next.sectionId,
	);
	return [next, ...withoutDuplicate].slice(0, 8);
};

export const useLearningContextStore = create<LearningContextState>()(
	persist(
		(set, get) => ({
			current: DEFAULT_LEARNING_CONTEXT,
			positions: {},
			history: [],
			setContext: (context) =>
				set((state) => {
					const next = {
						...state.current,
						...context,
						updatedAt: Date.now(),
					};
					return {
						current: next,
						history: compactHistory(next, state.history),
					};
				}),
			setSection: ({ sectionId, sectionTitle }) => {
				const current = get().current;
				get().setContext({
					sectionId,
					sectionTitle,
					roadmapNode: sectionTitle ?? current.roadmapNode,
				});
			},
			rememberPosition: (position) =>
				set((state) => ({
					positions: {
						...state.positions,
						[position.pathname]: position,
					},
				})),
			clearContext: () =>
				set({
					current: DEFAULT_LEARNING_CONTEXT,
					positions: {},
					history: [],
				}),
		}),
		{
			name: 'aa:learning-context:v1',
			partialize: (state) => ({
				current: state.current,
				positions: state.positions,
				history: state.history,
			}),
		},
	),
);

export const buildLearningCrumbs = (context: LearningContextSnapshot): LearningCrumb[] => {
	const crumbs: LearningCrumb[] = [];
	if (context.domain) crumbs.push({ label: context.domain, href: '/posts' });
	if (context.topic) crumbs.push({ label: context.topic, href: context.roadmapHref ?? '/guided-topics' });
	if (context.subtopic) crumbs.push({ label: context.subtopic, href: context.slug ? `/${context.slug}` : undefined });
	if (context.concept) crumbs.push({ label: context.concept });
	if (context.sectionTitle && context.sectionTitle !== context.concept) {
		crumbs.push({
			label: context.sectionTitle,
			href: context.sectionId ? `${context.pathname}#${context.sectionId}` : undefined,
		});
	}
	return crumbs.length > 0 ? crumbs : [{ label: context.title ?? 'Learning context', href: context.pathname }];
};

export const learningContextLabel = (context: LearningContextSnapshot) =>
	[context.domain, context.topic, context.subtopic, context.concept ?? context.sectionTitle]
		.filter(Boolean)
		.join(' -> ') || context.title || 'Current learning context';

export const buildContextPrompt = (
	intent: string,
	context: LearningContextSnapshot,
	extra?: string,
) => {
	const lines = [
		intent,
		'',
		'Use this learning context:',
		`- Path: ${learningContextLabel(context)}`,
		context.title ? `- Page: ${context.title}` : '',
		context.sectionTitle ? `- Current section: ${context.sectionTitle}` : '',
		context.roadmapNode ? `- Learning graph node: ${context.roadmapNode}` : '',
		context.simulationTopic ? `- Simulation topic: ${context.simulationTopic}` : '',
		extra ? `- Extra instruction: ${extra}` : '',
	].filter(Boolean);
	return lines.join('\n');
};

export const contextAwareHref = (
	action: 'assistant' | 'simulation' | 'roadmap' | 'continue',
	context: LearningContextSnapshot,
	positions: Record<string, LearningPosition>,
) => {
	if (action === 'assistant') {
		return `/assistant?q=${encodeURIComponent(buildContextPrompt('Help me continue learning from here.', context))}`;
	}
	if (action === 'simulation') {
		const topic = context.simulationTopic ?? context.concept ?? context.subtopic ?? context.topic ?? context.title ?? '';
		const params = new URLSearchParams({
			q: topic,
			from: context.pathname,
		});
		if (context.sectionId) params.set('sectionId', context.sectionId);
		if (context.sectionTitle) params.set('section', context.sectionTitle);
		if (context.roadmapNode) params.set('node', context.roadmapNode);
		return `/visualizations?${params.toString()}`;
	}
	if (action === 'roadmap') {
		const node = context.roadmapNode ?? context.sectionTitle ?? context.concept ?? context.topic ?? '';
		return `/guided-topics?node=${encodeURIComponent(node)}`;
	}
	const position = positions[context.pathname];
	if (position?.sectionId) return `${position.pathname}#${position.sectionId}`;
	return context.pathname || '/posts';
};
