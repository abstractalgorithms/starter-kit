import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostComplexity = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type LearnPost = {
id: string;
title: string;
slug: string;
brief: string;
readTimeInMinutes: number;
views: number;
coverImage?: { url: string } | null;
tags?: Array<{ id: string; name: string; slug: string }> | null;
series?: { name: string; slug: string } | null;
publishedAt: string;
/** AI-assigned complexity level (present when AI path succeeded) */
complexity?: PostComplexity;
/** AI-suggested reading sequence position (1 = read first within the phase) */
readingOrder?: number;
};

export type LearningPhase = {
number: number;
label: string;
emoji: string;
description: string;
color: 'emerald' | 'blue' | 'purple' | 'rose';
posts: LearnPost[];
totalMinutes: number;
};

export type LearningPath = {
query: string;
headline: string;
summary: string;
totalPosts: number;
totalMinutes: number;
phases: LearningPhase[];
/** true when phases were built using the AI server's complexity ranking */
aiPowered: boolean;
};

type RequestBody = {
query: string;
posts: LearnPost[];
};

type AiRankEntry = {
id: string;
complexity: PostComplexity;
relevance: number;
reading_order: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
'a','an','the','and','or','but','in','on','at','to','for','of','with',
'by','from','how','what','when','where','why','is','are','was','were',
'be','been','have','has','do','does','can','could','should','would',
'i','me','my','we','you','your','it','its','this','that','these','those',
'learn','about','understand','want','need','know','get','make','use',
]);

const SYNONYMS: Record<string, string[]> = {
'distributed': ['replication', 'partition', 'consensus', 'raft', 'paxos', 'shard', 'consistency', 'availability'],
'system design': ['scalability', 'architecture', 'microservice', 'load balancer', 'cdn', 'api gateway', 'database', 'caching', 'queue', 'storage'],
'system': ['architecture', 'scalability', 'design', 'service', 'component', 'infrastructure'],
'design': ['architecture', 'pattern', 'scalability', 'service', 'system', 'structure'],
'interview': ['prep', 'design', 'system', 'problem', 'solution', 'approach', 'scalability', 'architecture'],
'prep': ['design', 'system', 'architecture', 'interview', 'scalability', 'problem', 'approach'],
'database': ['sql', 'nosql', 'postgres', 'mysql', 'mongodb', 'cassandra', 'redis', 'storage', 'replication', 'sharding'],
'algorithm': ['data structure', 'complexity', 'sorting', 'graph', 'tree', 'dynamic programming'],
'llm': ['large language model', 'gpt', 'transformer', 'fine-tuning', 'rag', 'embedding'],
'ml': ['machine learning', 'neural network', 'model', 'training', 'inference'],
'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'llm', 'neural'],
'python': ['asyncio', 'fastapi', 'django', 'pydantic', 'pytest', 'gil', 'cpython', 'decorator', 'generator', 'coroutine'],
'kubernetes': ['k8s', 'container', 'docker', 'pod', 'deployment', 'orchestration'],
'kafka': ['streaming', 'event', 'message queue', 'pub sub', 'consumer'],
'caching': ['redis', 'memcached', 'cdn', 'cache invalidation', 'ttl'],
};

function tokenize(text: string): string[] {
return text
.toLowerCase()
.replace(/[^\w\s]/g, ' ')
.split(/\s+/)
.filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function expandKeywords(keywords: string[]): string[] {
const expanded = new Set(keywords);
for (const kw of keywords) {
const syns = SYNONYMS[kw];
if (syns) syns.forEach((s) => expanded.add(s));
for (const [key, vals] of Object.entries(SYNONYMS)) {
if (key.includes(kw) || kw.includes(key)) {
vals.forEach((s) => expanded.add(s));
}
}
}
return [...expanded];
}

function scorePost(post: LearnPost, keywords: string[]): number {
if (keywords.length === 0) return 0;

const titleLower = post.title.toLowerCase();
const briefLower = post.brief.toLowerCase();
const tagTexts = (post.tags ?? []).map((t) => `${t.name} ${t.slug}`).join(' ').toLowerCase();
const seriesText = (post.series?.name ?? '').toLowerCase();

let score = 0;
for (const kw of keywords) {
const titleCount = (titleLower.match(new RegExp(kw, 'g')) || []).length;
const briefCount = (briefLower.match(new RegExp(kw, 'g')) || []).length;
const tagCount = (tagTexts.match(new RegExp(kw, 'g')) || []).length;
const seriesCount = (seriesText.match(new RegExp(kw, 'g')) || []).length;

score += titleCount * 4;
score += tagCount * 3;
score += seriesCount * 2.5;
score += Math.min(briefCount, 3) * 1;
}

if (post.views > 10000) score *= 1.15;
else if (post.views > 3000) score *= 1.07;

return score;
}

/** Fallback: infer difficulty from read time when AI is unavailable */
function getDifficulty(readTime: number): 'foundation' | 'core' | 'deep' | 'advanced' {
if (readTime <= 7) return 'foundation';
if (readTime <= 18) return 'core';
if (readTime <= 35) return 'deep';
return 'advanced';
}

function extractTopic(query: string): string {
return query
.trim()
.split(/\s+/)
.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
.join(' ');
}

function buildHeadline(topic: string, phases: LearningPhase[]): string {
const totalPosts = phases.reduce((s, p) => s + p.posts.length, 0);
if (phases.length >= 3) return `Your structured path to mastering ${topic}`;
if (totalPosts <= 3) return `A focused intro to ${topic}`;
return `Your learning path: ${topic}`;
}

function buildSummary(topic: string, phases: LearningPhase[], totalMinutes: number, aiPowered: boolean): string {
const hrs = Math.round((totalMinutes / 60) * 10) / 10;
const timeStr = hrs >= 1 ? `~${hrs} hrs` : `~${totalMinutes} min`;
const phaseNames = phases.map((p) => p.label).join(' → ');
const rankedBy = aiPowered ? 'AI-ranked by complexity' : 'organised by depth';
return `Curated from this blog's content — ${rankedBy}. ${timeStr} of reading across ${phases.length} phases: ${phaseNames}.`;
}

const PHASE_META: Record<string, { label: string; emoji: string; description: string; color: LearningPhase['color'] }> = {
foundation: {
label: 'Foundation',
emoji: '🌱',
description: 'Start here — quick reads that build the core mental model you need before going deeper.',
color: 'emerald',
},
core: {
label: 'Core Concepts',
emoji: '🔧',
description: 'The essential mechanics. Read these to develop real understanding of how things work.',
color: 'blue',
},
deep: {
label: 'Deep Dives',
emoji: '🔬',
description: 'Longer, detailed explorations. Take your time — these reward careful study.',
color: 'purple',
},
advanced: {
label: 'Advanced Topics',
emoji: '⚡',
description: "Expert-level content for when you're ready to push to the cutting edge.",
color: 'rose',
},
};

const COMPLEXITY_TO_PHASE: Record<PostComplexity, 'foundation' | 'core' | 'deep' | 'advanced'> = {
Beginner: 'foundation',
Intermediate: 'core',
Advanced: 'deep',
Expert: 'advanced',
};

type PhaseKey = 'foundation' | 'core' | 'deep' | 'advanced';

function buildPhasesFromGroups(groups: Record<PhaseKey, LearnPost[]>): LearningPhase[] {
const phaseOrder: PhaseKey[] = ['foundation', 'core', 'deep', 'advanced'];
const phases: LearningPhase[] = [];
let phaseNum = 1;

for (const key of phaseOrder) {
const pPosts = groups[key].slice(0, 8);
if (pPosts.length === 0) continue;
const totalMinutes = pPosts.reduce((s, p) => s + p.readTimeInMinutes, 0);
const meta = PHASE_META[key];
phases.push({
number: phaseNum++,
label: meta.label,
emoji: meta.emoji,
description: meta.description,
color: meta.color,
posts: pPosts,
totalMinutes,
});
}
return phases;
}

// ─── AI ranking ───────────────────────────────────────────────────────────────

async function tryAiRanking(query: string, posts: LearnPost[]): Promise<AiRankEntry[] | null> {
const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '');
if (!serverUrl || posts.length === 0) return null;

const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 12000);

try {
const res = await fetch(`${serverUrl}/.netlify/functions/ai-learning-path`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'User-Agent': 'abstractalgorithms-personal-theme/1.0',
},
body: JSON.stringify({ query, posts }),
signal: controller.signal,
});
clearTimeout(timeoutId);

if (!res.ok) {
console.warn(`[learning-path] AI server responded ${res.status}`);
return null;
}

const body = await res.json() as { success: boolean; data: { ranked: AiRankEntry[] } };
if (!body.success || !Array.isArray(body.data?.ranked) || body.data.ranked.length === 0) {
return null;
}
return body.data.ranked;
} catch {
clearTimeout(timeoutId);
return null;
}
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
req: NextApiRequest,
res: NextApiResponse<LearningPath | { error: string }>,
) {
if (req.method !== 'POST') {
return res.status(405).json({ error: 'Method not allowed' });
}

const { query, posts } = req.body as RequestBody;

if (!query?.trim() || !Array.isArray(posts)) {
return res.status(400).json({ error: 'query and posts are required' });
}

const rawKeywords = tokenize(query);
const keywords = expandKeywords(rawKeywords);

// Step 1: Local keyword pre-filter — fast, no network call
const scored = posts
.map((post) => ({ post, score: scorePost(post, keywords) }))
.filter(({ score }) => score > 0)
.sort((a, b) => b.score - a.score);

const candidates = scored.slice(0, 25).map(({ post }) => post);

// Step 2: Try AI-powered complexity ranking (12 s timeout, graceful fallback)
const aiRanked = candidates.length > 0 ? await tryAiRanking(query, candidates) : null;

// Step 3: Build phase groups
const groups: Record<PhaseKey, LearnPost[]> = { foundation: [], core: [], deep: [], advanced: [] };
let aiPowered = false;

if (aiRanked && aiRanked.length > 0) {
aiPowered = true;
const rankMap = new Map(aiRanked.map((r) => [r.id, r]));

for (const post of candidates) {
const rank = rankMap.get(post.id);
if (!rank) continue; // filtered out by AI (relevance < 4)

const phaseKey = COMPLEXITY_TO_PHASE[rank.complexity] ?? 'core';
groups[phaseKey].push({
...post,
complexity: rank.complexity,
readingOrder: rank.reading_order,
});
}

// Within each phase, sort by AI-suggested reading order
for (const key of Object.keys(groups) as PhaseKey[]) {
groups[key].sort((a, b) => (a.readingOrder ?? 999) - (b.readingOrder ?? 999));
}
} else {
// Fallback: bucket by read time
const topScored = scored.slice(0, 30);
for (const { post } of topScored) {
const diff = getDifficulty(post.readTimeInMinutes);
groups[diff].push(post);
}
// Within fallback, sort easier-first within each bucket
for (const key of Object.keys(groups) as PhaseKey[]) {
groups[key].sort((a, b) => a.readTimeInMinutes - b.readTimeInMinutes);
}
}

// Step 4: Assemble phases
const phases = buildPhasesFromGroups(groups);

if (phases.length === 0) {
return res.status(200).json({
query,
headline: `No results found for "${extractTopic(query)}"`,
summary: 'Try a different topic — e.g. "system design", "distributed systems", or "python".',
totalPosts: 0,
totalMinutes: 0,
phases: [],
aiPowered: false,
});
}

const totalPosts = phases.reduce((s, p) => s + p.posts.length, 0);
const totalMinutes = phases.reduce((s, p) => s + p.totalMinutes, 0);
const topic = extractTopic(query);

return res.status(200).json({
query,
headline: buildHeadline(topic, phases),
summary: buildSummary(topic, phases, totalMinutes, aiPowered),
totalPosts,
totalMinutes,
phases,
aiPowered,
});
}
