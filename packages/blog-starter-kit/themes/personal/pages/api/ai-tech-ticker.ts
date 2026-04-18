import type { NextApiRequest, NextApiResponse } from 'next';

export type TickerCategory = 'LLM' | 'Vision' | 'NLP' | 'Robotics' | 'Generative AI' | 'ML/Research' | 'Hardware' | 'Multimodal';

export type TickerItem = {
	title: string;
	description: string;
	category: TickerCategory;
	timestamp: string;
};

type ErrorResponse = { error: string };

const ITEMS: Omit<TickerItem, 'timestamp'>[] = [
	{
		title: 'GPT-5 Demonstrates Near-Human Reasoning Across All Benchmarks',
		description:
			"OpenAI's latest flagship model achieves state-of-the-art results on MMLU, HumanEval, and MATH, pushing the frontier of general-purpose reasoning.",
		category: 'LLM',
	},
	{
		title: 'Google DeepMind Releases Gemini Ultra 2 with Extended Context Window',
		description:
			'New 2M-token context window enables entire codebases and long-form documents to be processed in a single pass with improved retrieval accuracy.',
		category: 'Multimodal',
	},
	{
		title: 'Diffusion Models Achieve Real-Time Video Generation at 4K Resolution',
		description:
			'A new architecture combining latent diffusion with hardware-aware attention enables sub-second generation of high-resolution video clips.',
		category: 'Generative AI',
	},
	{
		title: 'Humanoid Robot Learns Complex Assembly Tasks from 10 Minutes of Demos',
		description:
			'Reinforcement learning fine-tuned on minimal human demonstrations allows the robot to generalize to unseen object configurations with 92% success rate.',
		category: 'Robotics',
	},
	{
		title: 'Mixture-of-Experts Architecture Cuts Inference Cost by 60% on LLM Workloads',
		description:
			'Sparse routing with 128 experts per layer reduces active parameter count at inference while maintaining full-model accuracy across language tasks.',
		category: 'ML/Research',
	},
	{
		title: 'NVIDIA Blackwell B200 GPU Sets New Records in Transformer Training Throughput',
		description:
			'The B200 delivers 4× the FP8 throughput of its predecessor, enabling trillion-parameter model training at previously unprecedented speeds.',
		category: 'Hardware',
	},
	{
		title: 'Segment Anything Model 3 Extends Zero-Shot Segmentation to Video Streams',
		description:
			'SAM 3 adds temporal consistency and achieves 8× faster inference, making real-time video segmentation viable on consumer-grade GPUs.',
		category: 'Vision',
	},
	{
		title: 'New Retrieval-Augmented Generation Framework Halves Hallucination Rates',
		description:
			'Semantic chunking combined with cross-encoder re-ranking reduces factual errors in open-domain QA by 47% compared to naive RAG pipelines.',
		category: 'NLP',
	},
];

// Rotate item every 60 seconds so successive calls return fresh content
function getCurrentItem(): TickerItem {
	const index = Math.floor(Date.now() / 60_000) % ITEMS.length;
	const offsetMs = (index * 7 + 3) * 60_000; // stagger timestamps so they look organic
	return {
		...ITEMS[index],
		timestamp: new Date(Date.now() - offsetMs).toISOString(),
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<TickerItem | ErrorResponse>,
) {
	if (req.method !== 'GET') {
		res.setHeader('Allow', 'GET');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	res.setHeader('Cache-Control', 'no-store');
	return res.status(200).json(getCurrentItem());
}
