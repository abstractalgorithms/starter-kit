import { useMemo } from 'react';

type Tag = {
	id: string;
	name: string;
	slug: string;
};

type ReadingLevel = 'fundamentals' | 'intermediate' | 'advanced' | 'expert';

type ReadingLevelConfig = {
	level: ReadingLevel;
	label: string;
	description: string;
	icon: string;
	badge: string;
	text: string;
};

const READING_LEVELS: Record<ReadingLevel, ReadingLevelConfig> = {
	fundamentals: {
		level: 'fundamentals',
		label: 'Fundamentals',
		description: 'Perfect for beginners. Covers core concepts and basics.',
		icon: '🌱',
		badge: 'bg-emerald-100 dark:bg-emerald-900/30',
		text: 'text-emerald-700 dark:text-emerald-300',
	},
	intermediate: {
		level: 'intermediate',
		label: 'Intermediate',
		description: 'For developers with some experience. Builds on fundamentals.',
		icon: '📚',
		badge: 'bg-blue-100 dark:bg-blue-900/30',
		text: 'text-blue-700 dark:text-blue-300',
	},
	advanced: {
		level: 'advanced',
		label: 'Advanced',
		description: 'Deep-dive content for experienced professionals.',
		icon: '🚀',
		badge: 'bg-purple-100 dark:bg-purple-900/30',
		text: 'text-purple-700 dark:text-purple-300',
	},
	expert: {
		level: 'expert',
		label: 'Expert',
		description: 'Cutting-edge topics for seasoned architects.',
		icon: '⚡',
		badge: 'bg-orange-100 dark:bg-orange-900/30',
		text: 'text-orange-700 dark:text-orange-300',
	},
};

const TAG_TO_LEVEL: Record<string, ReadingLevel> = {
	fundamentals: 'fundamentals',
	'ml-fundamentals': 'fundamentals',
	basics: 'fundamentals',
	'getting-started': 'fundamentals',

	intermediate: 'intermediate',
	'ml-intermediate': 'intermediate',
	'system-design': 'intermediate',
	architecture: 'intermediate',

	advanced: 'advanced',
	'ml-advanced': 'advanced',
	'deep-dive': 'advanced',
	'architecture-deep-dive': 'advanced',

	expert: 'expert',
	'research': 'expert',
	'cutting-edge': 'expert',
	'generative-ai': 'expert',
	'llm-engineering': 'expert',
	'consensus-algorithms': 'expert',
	'quantization-techniques': 'expert',
};

function detectReadingLevel(tags: Tag[]): ReadingLevel {
	for (const tag of tags) {
		const detected = TAG_TO_LEVEL[tag.slug.toLowerCase()];
		if (detected) return detected;
		const nameDetected = TAG_TO_LEVEL[tag.name.toLowerCase()];
		if (nameDetected) return nameDetected;
	}
	return 'intermediate';
}

type Props = {
	tags?: Tag[];
	readTimeInMinutes?: number;
	showDescription?: boolean;
	variant?: 'compact' | 'full';
};

export const ReadingLevelIndicator = ({
	tags = [],
	readTimeInMinutes = 5,
	showDescription = false,
	variant = 'compact',
}: Props) => {
	const level = useMemo(() => detectReadingLevel(tags), [tags]);
	const config = READING_LEVELS[level];

	if (variant === 'full') {
		return (
			<div className={`flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-800 ${config.badge} p-4`}>
				<div className="text-2xl flex-shrink-0 mt-0.5">{config.icon}</div>
				<div className="flex-1">
					<h3 className={`text-sm font-bold ${config.text}`}>{config.label}</h3>
					{showDescription && (
						<p className={`text-xs ${config.text} opacity-75 mt-1`}>{config.description}</p>
					)}
					{readTimeInMinutes && (
						<p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
							Estimated read time: <span className="font-semibold">{readTimeInMinutes} min</span>
						</p>
					)}
				</div>
			</div>
		);
	}

	// Compact variant
	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${config.badge} border border-neutral-200 dark:border-neutral-800`}
			title={config.description}
		>
			<span className="text-xs">{config.icon}</span>
			<span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
		</div>
	);
};
