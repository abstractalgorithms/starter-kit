import { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { userId, token, postId, timeSpent } = req.body;

	if (!userId || !token || !postId || !timeSpent) {
		return res.status(400).json({ error: 'User ID, token, Post ID, and time spent are required' });
	}

	try {
		const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/progressedPosts/${postId}`;
		// First, get the current document to retrieve existing timeSpent
		const getResponse = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		let currentTimeSpent = 0;
		if (getResponse.ok) {
			const doc = await getResponse.json();
			currentTimeSpent = parseInt(doc.fields?.timeSpent?.integerValue || '0');
		}

		// Update with new time spent value
		const updateResponse = await fetch(`${url}?updateMask.fieldPaths=timeSpent`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				fields: {
					timeSpent: { integerValue: (currentTimeSpent + timeSpent).toString() },
				},
			}),
		});

		if (!updateResponse.ok) {
			const error = await updateResponse.json();
			throw new Error(`Firestore API error: ${error.error?.message || updateResponse.statusText}`);
		}

		return res.status(200).json({ success: true, postId });
	} catch (error: any) {
		console.error('Error tracking time:', error);
		return res.status(500).json({ error: error.message || 'Failed to track time' });
	}
}
