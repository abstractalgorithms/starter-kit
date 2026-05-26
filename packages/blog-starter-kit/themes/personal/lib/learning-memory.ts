import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DifficultyPreference = 'adaptive' | 'beginner' | 'intermediate' | 'advanced';

export type ConceptMemory = {
	id: string;
	label: string;
	domain?: string;
	completedCount: number;
	revisitCount: number;
	weakScore: number;
	confidence: number;
	lastSeenAt: number;
	lastCompletedAt?: number;
	sourceSlugs: string[];
};

export type ReadingVelocity = {
	articlesCompleted: number;
	totalMinutesRead: number;
	averageMinutesPerArticle: number;
	lastReadAt?: number;
};

export type SimulationMemory = {
	topic: string;
	scenarioId?: string;
	failures: number;
	replays: number;
	lastFailedAt?: number;
	lastCompletedAt?: number;
};

export type InterviewMemory = {
	readinessScore: number;
	communicationScore: number;
	mockInterviews: number;
	weaknesses: Record<string, number>;
	lastPracticedAt?: number;
};

export type TradeoffMistake = {
	id: string;
	topic: string;
	mistake: string;
	count: number;
	lastSeenAt: number;
};

export type LearningMemorySnapshot = {
	concepts: Record<string, ConceptMemory>;
	readingVelocity: ReadingVelocity;
	simulations: Record<string, SimulationMemory>;
	tradeoffMistakes: Record<string, TradeoffMistake>;
	interview: InterviewMemory;
	preferredDifficulty: DifficultyPreference;
	preferredDomains: Record<string, number>;
	updatedAt: number;
};

type MemoryPost = {
	title: string;
	slug: string;
	brief?: string;
	readTimeInMinutes?: number;
	tags?: Array<{ name: string; slug: string }> | null;
};

export type AdaptiveRecommendation = {
	id: string;
	title: string;
	description: string;
	href: string;
	priority: number;
	type: 'continue' | 'next' | 'review' | 'practice' | 'interview';
	concept?: string;
};

export type MentorNudge = {
	id: string;
	message: string;
	href: string;
	intent: 'continue' | 'next-concept' | 'weak-area' | 'simulation' | 'interview' | 'tradeoff';
	cta: string;
};

type LearningMemoryState = LearningMemorySnapshot & {
	recordConceptSeen: (input: { label: string; domain?: string; slug?: string }) => void;
	recordConceptCompleted: (input: { label: string; domain?: string; slug?: string; minutes?: number }) => void;
	recordWeakArea: (input: { label: string; domain?: string; amount?: number; slug?: string }) => void;
	recordSimulationAttempt: (input: { topic: string; scenarioId?: string; failed?: boolean; completed?: boolean }) => void;
	recordTradeoffMistake: (input: { topic: string; mistake: string }) => void;
	recordInterviewPractice: (input: { topic: string; weakness?: string; communicationDelta?: number; completed?: boolean }) => void;
	setPreferredDifficulty: (difficulty: DifficultyPreference) => void;
	resetLearningMemory: () => void;
};

const now = () => Date.now();

const normalizeKey = (value: string) =>
	value
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '') || 'concept';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const DEFAULT_MEMORY: LearningMemorySnapshot = {
	concepts: {},
	readingVelocity: {
		articlesCompleted: 0,
		totalMinutesRead: 0,
		averageMinutesPerArticle: 0,
	},
	simulations: {},
	tradeoffMistakes: {},
	interview: {
		readinessScore: 42,
		communicationScore: 62,
		mockInterviews: 0,
		weaknesses: {},
	},
	preferredDifficulty: 'adaptive',
	preferredDomains: {},
	updatedAt: 0,
};

const mergeConcept = (
	concepts: Record<string, ConceptMemory>,
	label: string,
	patch: Partial<ConceptMemory>,
): Record<string, ConceptMemory> => {
	const id = normalizeKey(label);
	const current = concepts[id] ?? {
		id,
		label,
		completedCount: 0,
		revisitCount: 0,
		weakScore: 0,
		confidence: 20,
		lastSeenAt: 0,
		sourceSlugs: [],
	};
	const sourceSlugs = patch.sourceSlugs
		? [...new Set([...current.sourceSlugs, ...patch.sourceSlugs])]
		: current.sourceSlugs;
	return {
		...concepts,
		[id]: {
			...current,
			...patch,
			sourceSlugs,
			weakScore: clamp(patch.weakScore ?? current.weakScore, 0, 100),
			confidence: clamp(patch.confidence ?? current.confidence, 0, 100),
			lastSeenAt: patch.lastSeenAt ?? now(),
		},
	};
};

const bumpDomain = (domains: Record<string, number>, domain?: string) => {
	if (!domain) return domains;
	return {
		...domains,
		[domain]: (domains[domain] ?? 0) + 1,
	};
};

const DEFAULT_PARTIALIZE = (state: LearningMemoryState): LearningMemorySnapshot => ({
	concepts: state.concepts,
	readingVelocity: state.readingVelocity,
	simulations: state.simulations,
	tradeoffMistakes: state.tradeoffMistakes,
	interview: state.interview,
	preferredDifficulty: state.preferredDifficulty,
	preferredDomains: state.preferredDomains,
	updatedAt: state.updatedAt,
});

export const useLearningMemoryStore = create<LearningMemoryState>()(
	persist(
		(set) => ({
			...DEFAULT_MEMORY,
			recordConceptSeen: ({ label, domain, slug }) =>
				set((state) => ({
					concepts: mergeConcept(state.concepts, label, {
						domain,
						revisitCount: (state.concepts[normalizeKey(label)]?.revisitCount ?? 0) + 1,
						confidence: (state.concepts[normalizeKey(label)]?.confidence ?? 20) + 2,
						sourceSlugs: slug ? [slug] : [],
						lastSeenAt: now(),
					}),
					preferredDomains: bumpDomain(state.preferredDomains, domain),
					updatedAt: now(),
				})),
			recordConceptCompleted: ({ label, domain, slug, minutes }) =>
				set((state) => {
					const current = state.concepts[normalizeKey(label)];
					const articlesCompleted = state.readingVelocity.articlesCompleted + (slug ? 1 : 0);
					const totalMinutesRead = state.readingVelocity.totalMinutesRead + (minutes ?? 0);
					return {
						concepts: mergeConcept(state.concepts, label, {
							domain,
							completedCount: (current?.completedCount ?? 0) + 1,
							weakScore: Math.max(0, (current?.weakScore ?? 0) - 18),
							confidence: (current?.confidence ?? 28) + 22,
							sourceSlugs: slug ? [slug] : [],
							lastCompletedAt: now(),
							lastSeenAt: now(),
						}),
						readingVelocity: {
							articlesCompleted,
							totalMinutesRead,
							averageMinutesPerArticle: articlesCompleted > 0 ? Math.round(totalMinutesRead / articlesCompleted) : 0,
							lastReadAt: now(),
						},
						preferredDomains: bumpDomain(state.preferredDomains, domain),
						updatedAt: now(),
					};
				}),
			recordWeakArea: ({ label, domain, amount = 18, slug }) =>
				set((state) => {
					const current = state.concepts[normalizeKey(label)];
					return {
						concepts: mergeConcept(state.concepts, label, {
							domain,
							weakScore: (current?.weakScore ?? 0) + amount,
							confidence: (current?.confidence ?? 35) - Math.round(amount / 2),
							sourceSlugs: slug ? [slug] : [],
							lastSeenAt: now(),
						}),
						preferredDomains: bumpDomain(state.preferredDomains, domain),
						updatedAt: now(),
					};
				}),
			recordSimulationAttempt: ({ topic, scenarioId, failed, completed }) =>
				set((state) => {
					const id = normalizeKey(scenarioId ?? topic);
					const current = state.simulations[id] ?? {
						topic,
						scenarioId,
						failures: 0,
						replays: 0,
					};
					return {
						simulations: {
							...state.simulations,
							[id]: {
								...current,
								failures: current.failures + (failed ? 1 : 0),
								replays: current.replays + 1,
								lastFailedAt: failed ? now() : current.lastFailedAt,
								lastCompletedAt: completed ? now() : current.lastCompletedAt,
							},
						},
						concepts: failed
							? mergeConcept(state.concepts, topic, {
									weakScore: (state.concepts[normalizeKey(topic)]?.weakScore ?? 0) + 12,
									confidence: (state.concepts[normalizeKey(topic)]?.confidence ?? 35) - 6,
									lastSeenAt: now(),
							  })
							: state.concepts,
						updatedAt: now(),
					};
				}),
			recordTradeoffMistake: ({ topic, mistake }) =>
				set((state) => {
					const id = normalizeKey(`${topic}-${mistake}`);
					const current = state.tradeoffMistakes[id] ?? { id, topic, mistake, count: 0, lastSeenAt: 0 };
					return {
						tradeoffMistakes: {
							...state.tradeoffMistakes,
							[id]: {
								...current,
								count: current.count + 1,
								lastSeenAt: now(),
							},
						},
						concepts: mergeConcept(state.concepts, topic, {
							weakScore: (state.concepts[normalizeKey(topic)]?.weakScore ?? 0) + 10,
							lastSeenAt: now(),
						}),
						updatedAt: now(),
					};
				}),
			recordInterviewPractice: ({ topic, weakness, communicationDelta = 0, completed }) =>
				set((state) => {
					const weaknessKey = weakness ? normalizeKey(weakness) : '';
					const weaknesses = weakness
						? {
								...state.interview.weaknesses,
								[weaknessKey]: (state.interview.weaknesses[weaknessKey] ?? 0) + 1,
						  }
						: state.interview.weaknesses;
					return {
						interview: {
							...state.interview,
							mockInterviews: state.interview.mockInterviews + (completed ? 1 : 0),
							communicationScore: clamp(state.interview.communicationScore + communicationDelta, 0, 100),
							readinessScore: clamp(state.interview.readinessScore + (completed ? 6 : 2) + communicationDelta, 0, 100),
							weaknesses,
							lastPracticedAt: now(),
						},
						concepts: weakness
							? mergeConcept(state.concepts, topic, {
									weakScore: (state.concepts[normalizeKey(topic)]?.weakScore ?? 0) + 8,
									lastSeenAt: now(),
							  })
							: state.concepts,
						updatedAt: now(),
					};
				}),
			setPreferredDifficulty: (preferredDifficulty) => set({ preferredDifficulty, updatedAt: now() }),
			resetLearningMemory: () => set({ ...DEFAULT_MEMORY, updatedAt: now() }),
		}),
		{
			name: 'aa:adaptive-learning-memory:v1',
			version: 1,
			partialize: DEFAULT_PARTIALIZE,
		},
	),
);

const postConcepts = (post: MemoryPost) =>
	(post.tags ?? []).slice(0, 4).map((tag) => tag.name).filter(Boolean);

const scorePostForMemory = (post: MemoryPost, memory: LearningMemorySnapshot) => {
	const concepts = postConcepts(post);
	const domainScore = concepts.reduce((score, concept) => score + (memory.preferredDomains[concept] ?? 0), 0);
	const weakScore = concepts.reduce((score, concept) => score + (memory.concepts[normalizeKey(concept)]?.weakScore ?? 0), 0);
	const completedPenalty = memory.concepts[normalizeKey(post.title)]?.completedCount ? -80 : 0;
	return domainScore * 4 + weakScore * 2 + (post.readTimeInMinutes ?? 0) + completedPenalty;
};

export const buildAdaptiveRecommendations = (
	memory: LearningMemorySnapshot,
	posts: MemoryPost[] = [],
): AdaptiveRecommendation[] => {
	const weakConcepts = Object.values(memory.concepts)
		.filter((concept) => concept.weakScore >= 20)
		.sort((a, b) => b.weakScore - a.weakScore)
		.slice(0, 3);
	const simulationWeakness = Object.values(memory.simulations)
		.filter((item) => item.failures > 0)
		.sort((a, b) => b.failures - a.failures)[0];
	const interviewWeakness = Object.entries(memory.interview.weaknesses).sort((a, b) => b[1] - a[1])[0];
	const nextPost = posts
		.slice()
		.sort((a, b) => scorePostForMemory(b, memory) - scorePostForMemory(a, memory))[0];

	const recommendations: AdaptiveRecommendation[] = [];

	if (nextPost) {
		recommendations.push({
			id: `next-${nextPost.slug}`,
			title: nextPost.title,
			description: 'Recommended from your preferred domains, weak areas, and reading velocity.',
			href: `/${nextPost.slug}`,
			priority: 90,
			type: 'next',
			concept: postConcepts(nextPost)[0] ?? nextPost.title,
		});
	}

	weakConcepts.forEach((concept, index) => {
		recommendations.push({
			id: `review-${concept.id}`,
			title: `Review ${concept.label}`,
			description: `${concept.weakScore}% weak-area signal from recent learning activity.`,
			href: `/assistant?q=${encodeURIComponent(`Explain ${concept.label} and quiz me on weak points`)}`,
			priority: 82 - index * 4,
			type: 'review',
			concept: concept.label,
		});
	});

	if (simulationWeakness) {
		recommendations.push({
			id: `sim-${normalizeKey(simulationWeakness.topic)}`,
			title: `Replay ${simulationWeakness.topic}`,
			description: `${simulationWeakness.failures} failure ${simulationWeakness.failures === 1 ? 'state' : 'states'} observed in simulation.`,
			href: `/visualizations?q=${encodeURIComponent(simulationWeakness.topic)}`,
			priority: 78,
			type: 'practice',
			concept: simulationWeakness.topic,
		});
	}

	if (interviewWeakness) {
		const weaknessLabel = interviewWeakness[0].replace(/-/g, ' ');
		recommendations.push({
			id: `interview-${interviewWeakness[0]}`,
			title: `Practice ${weaknessLabel}`,
			description: 'Interview memory shows this communication pattern needs reinforcement.',
			href: `/interview-prep`,
			priority: 74,
			type: 'interview',
			concept: weaknessLabel,
		});
	}

	return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 6);
};

export const buildMemoryPromptContext = (memory: LearningMemorySnapshot) => {
	const completed = Object.values(memory.concepts)
		.filter((concept) => concept.completedCount > 0)
		.sort((a, b) => (b.lastCompletedAt ?? 0) - (a.lastCompletedAt ?? 0))
		.slice(0, 6)
		.map((concept) => concept.label);
	const weak = Object.values(memory.concepts)
		.filter((concept) => concept.weakScore >= 20)
		.sort((a, b) => b.weakScore - a.weakScore)
		.slice(0, 6)
		.map((concept) => concept.label);
	const domains = Object.entries(memory.preferredDomains)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([domain]) => domain);
	const interviewWeaknesses = Object.entries(memory.interview.weaknesses)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.map(([weakness]) => weakness.replace(/-/g, ' '));

	return [
		'Adaptive learning memory:',
		completed.length ? `- Completed concepts: ${completed.join(', ')}` : '',
		weak.length ? `- Weak areas: ${weak.join(', ')}` : '',
		domains.length ? `- Preferred domains: ${domains.join(', ')}` : '',
		`- Reading velocity: ${memory.readingVelocity.averageMinutesPerArticle || 'unknown'} min/article`,
		`- Preferred difficulty: ${memory.preferredDifficulty}`,
		`- Interview readiness: ${memory.interview.readinessScore}/100`,
		interviewWeaknesses.length ? `- Interview weaknesses: ${interviewWeaknesses.join(', ')}` : '',
	]
		.filter(Boolean)
		.join('\n');
};

export const buildContextualMentorPrompt = ({
	intent,
	title,
	concept,
	section,
	memory,
}: {
	intent: 'explain' | 'continue' | 'tradeoff' | 'simulation' | 'interview' | 'review';
	title?: string;
	concept?: string;
	section?: string;
	memory: LearningMemorySnapshot;
}) => {
	const target = concept || section || title || 'this learning context';
	const intentLine =
		intent === 'continue'
			? `Continue my prior learning session from ${target}.`
			: intent === 'tradeoff'
			? `Pressure-test my tradeoff reasoning for ${target}.`
			: intent === 'simulation'
			? `Recommend a simulation or failure scenario for ${target}.`
			: intent === 'interview'
			? `Coach me through interview follow-ups for ${target}.`
			: intent === 'review'
			? `Diagnose weak understanding and review ${target}.`
			: `Explain ${target} using my learning history.`;

	return [intentLine, section ? `Current section: ${section}` : '', buildMemoryPromptContext(memory)]
		.filter(Boolean)
		.join('\n\n');
};

export const mentorHref = (prompt: string) => `/assistant?q=${encodeURIComponent(prompt)}`;

export const buildProactiveMentorNudges = (
	memory: LearningMemorySnapshot,
	recommendations: AdaptiveRecommendation[] = [],
): MentorNudge[] => {
	const recentCompleted = Object.values(memory.concepts)
		.filter((concept) => concept.completedCount > 0)
		.sort((a, b) => (b.lastCompletedAt ?? 0) - (a.lastCompletedAt ?? 0))[0];
	const weakest = Object.values(memory.concepts)
		.filter((concept) => concept.weakScore >= 20)
		.sort((a, b) => b.weakScore - a.weakScore)[0];
	const failedSimulation = Object.values(memory.simulations)
		.filter((item) => item.failures > 0)
		.sort((a, b) => (b.lastFailedAt ?? 0) - (a.lastFailedAt ?? 0))[0];
	const next = recommendations.find((item) => item.type === 'next');
	const interviewWeakness = Object.entries(memory.interview.weaknesses).sort((a, b) => b[1] - a[1])[0];

	const nudges: MentorNudge[] = [];
	if (recentCompleted && next) {
		nudges.push({
			id: `next-after-${recentCompleted.id}`,
			message: `You recently studied ${recentCompleted.label}. You may now be ready for ${next.concept ?? next.title}.`,
			href: next.href,
			intent: 'next-concept',
			cta: 'Continue Learning',
		});
	}
	if (weakest) {
		const prompt = buildContextualMentorPrompt({
			intent: 'review',
			concept: weakest.label,
			memory,
		});
		nudges.push({
			id: `weak-${weakest.id}`,
			message: `You struggled with ${weakest.label} previously. Want a quick diagnostic before moving on?`,
			href: mentorHref(prompt),
			intent: 'weak-area',
			cta: 'Review Weak Area',
		});
	}
	if (failedSimulation) {
		nudges.push({
			id: `sim-${normalizeKey(failedSimulation.topic)}`,
			message: `Want to pressure-test ${failedSimulation.topic} failure modes again?`,
			href: `/visualizations?q=${encodeURIComponent(failedSimulation.topic)}`,
			intent: 'simulation',
			cta: 'Open Simulation',
		});
	}
	if (interviewWeakness) {
		const weakness = interviewWeakness[0].replace(/-/g, ' ');
		nudges.push({
			id: `interview-${interviewWeakness[0]}`,
			message: `Your interview memory shows ${weakness} needs practice.`,
			href: '/interview-prep',
			intent: 'interview',
			cta: 'Practice Drill',
		});
	}
	if (nudges.length === 0) {
		const prompt = buildContextualMentorPrompt({ intent: 'continue', memory });
		nudges.push({
			id: 'continue-learning',
			message: 'I can continue your learning session from the exact context you left off.',
			href: mentorHref(prompt),
			intent: 'continue',
			cta: 'Resume Context',
		});
	}
	return nudges.slice(0, 4);
};

export const useLearningMemorySnapshot = () =>
	useLearningMemoryStore((state) => DEFAULT_PARTIALIZE(state));
