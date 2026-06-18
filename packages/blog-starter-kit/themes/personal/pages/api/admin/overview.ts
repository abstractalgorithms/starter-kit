import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb, requireAdmin } from '../../../lib/firebaseAdmin';

const defaultFeatures = {
	interviewPrep: process.env.NEXT_PUBLIC_ENABLE_INTERVIEW_PREP === 'true',
	assistant: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === 'true',
};

const countUsers = async () => {
	let count = 0;
	let pageToken: string | undefined;
	do {
		const page = await adminAuth.listUsers(1000, pageToken);
		count += page.users.length;
		pageToken = page.pageToken;
	} while (pageToken);
	return count;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	res.setHeader('Allow', 'GET, PATCH');
	if (req.method !== 'GET' && req.method !== 'PATCH') return res.status(405).json({ error: 'Method Not Allowed' });
	try {
		await requireAdmin(req.headers.authorization);
		const configRef = adminDb.doc('appConfig/features');
		if (req.method === 'PATCH') {
			const incoming = req.body ?? {};
			const features = {
				interviewPrep: incoming.interviewPrep === true,
				assistant: incoming.assistant === true,
			};
			await configRef.set({ ...features, updatedAt: Date.now() }, { merge: true });
			return res.status(200).json({ features });
		}
		const [totalUsers, config] = await Promise.all([countUsers(), configRef.get()]);
		const data = config.data();
		return res.status(200).json({
			totalUsers,
			features: {
				interviewPrep: typeof data?.interviewPrep === 'boolean' ? data.interviewPrep : defaultFeatures.interviewPrep,
				assistant: typeof data?.assistant === 'boolean' ? data.assistant : defaultFeatures.assistant,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : '';
		if (message === 'UNAUTHENTICATED') return res.status(401).json({ error: 'Authentication required' });
		if (message === 'FORBIDDEN') return res.status(403).json({ error: 'Admin access required' });
		console.error('[admin/overview]', error);
		return res.status(500).json({ error: 'Unable to load admin overview' });
	}
}
