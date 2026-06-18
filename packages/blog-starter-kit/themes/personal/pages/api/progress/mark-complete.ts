import { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { userId, token, postId, postTitle } = req.body;

	if (!userId || !token || !postId) {
		return res.status(400).json({ error: 'User ID, token, and Post ID are required' });
	}

	try {
		const fieldMask = ['postId', 'postTitle', 'completedAt', 'status']
			.map((field) => `updateMask.fieldPaths=${field}`)
			.join('&');
		const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/progressedPosts/${postId}?${fieldMask}`;
		const response = await fetch(url, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				fields: {
					postId: { stringValue: postId },
					postTitle: { stringValue: postTitle || '' },
					completedAt: { integerValue: Date.now().toString() },
					status: { stringValue: 'completed' },
				},
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`Firestore API error: ${error.error?.message || response.statusText}`);
		}

		return res.status(200).json({ success: true, postId });
	} catch (error: any) {
		console.error('Error marking post complete:', error);
		return res.status(500).json({ error: error.message || 'Failed to mark post complete' });
	}
}
