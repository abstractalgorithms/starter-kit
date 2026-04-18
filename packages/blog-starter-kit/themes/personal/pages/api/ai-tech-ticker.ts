import type { NextApiRequest, NextApiResponse } from 'next';

export type TickerCategory = 'LLM' | 'Vision' | 'NLP' | 'Robotics' | 'Generative AI' | 'ML/Research' | 'Hardware' | 'Multimodal';

export type TickerSource = {
	name: string;
	url: string;
	siteUrl: string;
	feedUrl: string;
};

export type TickerItem = {
	title: string;
	description: string;
	summary: string;
	context: string;
	category: TickerCategory;
	timestamp: string;
	publishedAt: string;
	sourceName: string;
	sourceUrl: string;
	source: TickerSource;
};

type ErrorResponse = { error: string };

const ITEMS: Omit<TickerItem, 'timestamp' | 'publishedAt'>[] = [
	{
		title: 'OpenAI Launches New Reasoning Model with Stronger Tool Use',
		description: 'OpenAI releases a frontier reasoning model optimised for multi-step tasks.',
		summary: 'New OpenAI model shows major gains in tool use and reliable multi-step reasoning across coding, math, and agent benchmarks.',
		context: 'OpenAI News published this update on Apr 18, 2026. The release focuses on stronger tool use and more reliable multi-step reasoning, with the model outperforming its predecessor on agentic tasks by a significant margin.',
		category: 'LLM',
		sourceName: 'OpenAI News',
		sourceUrl: 'https://openai.com/news/example-article',
		source: { name: 'OpenAI News', url: 'https://openai.com/news/example-article', siteUrl: 'https://openai.com/news', feedUrl: 'https://openai.com/news/rss.xml' },
	},
	{
		title: 'Google DeepMind Releases Gemini Ultra 2 with 2M-Token Context',
		description: 'Gemini Ultra 2 sets a new bar for long-context understanding across modalities.',
		summary: 'A 2M-token context window lets the model process entire codebases or document libraries in a single pass with improved retrieval accuracy.',
		context: 'Google DeepMind Blog announced this on Apr 17, 2026. The extended context is paired with a new retrieval mechanism that prevents attention dilution at extreme lengths, a known weakness of earlier long-context models.',
		category: 'Multimodal',
		sourceName: 'Google DeepMind Blog',
		sourceUrl: 'https://deepmind.google/discover/blog/',
		source: { name: 'Google DeepMind Blog', url: 'https://deepmind.google/discover/blog/', siteUrl: 'https://deepmind.google', feedUrl: 'https://deepmind.google/blog/rss.xml' },
	},
	{
		title: 'Diffusion Models Achieve Real-Time 4K Video Generation',
		description: 'A new latent diffusion architecture enables sub-second 4K video clip synthesis.',
		summary: 'Hardware-aware attention in a new diffusion architecture brings real-time 4K video generation to consumer-grade hardware for the first time.',
		context: 'Reported by The Verge on Apr 16, 2026. The breakthrough combines temporal latent compression with a custom CUDA kernel that reduces memory bandwidth by 3×, making the approach practical outside data-centre environments.',
		category: 'Generative AI',
		sourceName: 'The Verge',
		sourceUrl: 'https://www.theverge.com/ai-artificial-intelligence',
		source: { name: 'The Verge', url: 'https://www.theverge.com/ai-artificial-intelligence', siteUrl: 'https://www.theverge.com', feedUrl: 'https://www.theverge.com/rss/index.xml' },
	},
	{
		title: 'Humanoid Robot Masters Assembly Tasks from 10-Minute Demos',
		description: 'Minimal-demonstration RL enables robots to generalise assembly skills to unseen objects.',
		summary: 'A humanoid robot trained on just 10 minutes of human demonstrations achieves 92% success on unseen assembly configurations using a new RL fine-tuning method.',
		context: 'IEEE Spectrum covered this research on Apr 15, 2026. The system uses a contact-aware reward signal that dramatically reduces the number of demonstrations needed versus prior sim-to-real transfer approaches.',
		category: 'Robotics',
		sourceName: 'IEEE Spectrum',
		sourceUrl: 'https://spectrum.ieee.org/robotics',
		source: { name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/robotics', siteUrl: 'https://spectrum.ieee.org', feedUrl: 'https://spectrum.ieee.org/feeds/feed.rss' },
	},
	{
		title: 'Mixture-of-Experts Cuts LLM Inference Cost by 60%',
		description: 'Sparse MoE routing with 128 experts slashes compute without sacrificing accuracy.',
		summary: 'A new 128-expert sparse routing architecture reduces active parameter count at inference by 60% while matching dense model accuracy across all standard language benchmarks.',
		context: 'ArXiv Sanity reported this paper on Apr 14, 2026. The authors introduce a load-balancing auxiliary loss that prevents expert collapse, a common failure mode in earlier MoE implementations at this scale.',
		category: 'ML/Research',
		sourceName: 'ArXiv Sanity',
		sourceUrl: 'https://arxiv-sanity-lite.com',
		source: { name: 'ArXiv Sanity', url: 'https://arxiv-sanity-lite.com', siteUrl: 'https://arxiv-sanity-lite.com', feedUrl: 'https://arxiv-sanity-lite.com/feed' },
	},
	{
		title: 'NVIDIA B200 GPU Sets Transformer Training Throughput Records',
		description: 'Blackwell B200 delivers 4× FP8 throughput, enabling trillion-parameter training.',
		summary: 'NVIDIA\'s Blackwell B200 achieves 4× the FP8 tensor throughput of its predecessor, making trillion-parameter model training feasible at dramatically lower cost per token.',
		context: 'AnandTech published this analysis on Apr 13, 2026. The gains stem from a new NVLink fabric topology and second-generation Transformer Engine that keeps FP8 precision stable across the full forward-backward pass.',
		category: 'Hardware',
		sourceName: 'AnandTech',
		sourceUrl: 'https://www.anandtech.com/tag/nvidia',
		source: { name: 'AnandTech', url: 'https://www.anandtech.com/tag/nvidia', siteUrl: 'https://www.anandtech.com', feedUrl: 'https://www.anandtech.com/rss/' },
	},
	{
		title: 'SAM 3 Brings Zero-Shot Segmentation to Real-Time Video',
		description: 'Segment Anything Model 3 adds temporal consistency and 8× faster inference.',
		summary: 'SAM 3 extends Meta\'s zero-shot segmentation to video streams with temporal consistency and 8× inference speedup, running in real-time on a single consumer GPU.',
		context: 'Meta AI Research announced this on Apr 12, 2026. A new memory module tracks object identity across frames, solving the mask flickering problem that affected SAM 2 in high-motion sequences.',
		category: 'Vision',
		sourceName: 'Meta AI Research',
		sourceUrl: 'https://ai.meta.com/research/',
		source: { name: 'Meta AI Research', url: 'https://ai.meta.com/research/', siteUrl: 'https://ai.meta.com', feedUrl: 'https://ai.meta.com/blog/rss/' },
	},
	{
		title: 'New RAG Framework Halves LLM Hallucination Rates',
		description: 'Semantic chunking + cross-encoder re-ranking cuts open-domain QA errors by 47%.',
		summary: 'A retrieval-augmented generation framework combining semantic chunking with cross-encoder re-ranking reduces factual errors by 47% compared to naive RAG pipelines on standard benchmarks.',
		context: 'Towards Data Science covered this on Apr 11, 2026. The cross-encoder re-ranking step adds roughly 12ms of latency but filters out low-relevance chunks that are the primary driver of hallucinated citations.',
		category: 'NLP',
		sourceName: 'Towards Data Science',
		sourceUrl: 'https://towardsdatascience.com',
		source: { name: 'Towards Data Science', url: 'https://towardsdatascience.com', siteUrl: 'https://towardsdatascience.com', feedUrl: 'https://towardsdatascience.com/feed' },
	},
];

function buildItems(): TickerItem[] {
	return ITEMS.map((item, i) => {
		const ts = new Date(Date.now() - (i * 7 + 3) * 60_000).toISOString();
		return { ...item, timestamp: ts, publishedAt: ts };
	});
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<TickerItem[] | ErrorResponse>,
) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json(buildItems());
}
