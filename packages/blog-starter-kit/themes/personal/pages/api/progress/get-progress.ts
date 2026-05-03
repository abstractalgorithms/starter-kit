import { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { userId, token } = req.query;

	if (!userId || !token || typeof userId !== 'string' || typeof token !== 'string') {
		return res.status(400).json({ error: 'User ID and auth token are required' });
	}

	try {
		const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/progressedPosts`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`Firestore API error: ${error.error?.message || response.statusText}`);
		}

		const data = await response.json();
		const posts = data.documents?.map((doc: any) => {
			const fields = doc.fields;
			return {
				postId: doc.name.split('/').pop(),
				postTitle: fields.postTitle?.stringValue || '',
				completedAt: parseInt(fields.completedAt?.integerValue || '0'),
				timeSpent: parseInt(fields.timeSpent?.integerValue || '0'),
				status: fields.status?.stringValue || 'in-progress',
			};
		}) || [];

		return res.status(200).json({ success: true, posts });
	} catch (error: any) {
		console.error('Error fetching progress:', error);
		return res.status(500).json({ error: error.message || 'Failed to fetch progress' });
	}
}
