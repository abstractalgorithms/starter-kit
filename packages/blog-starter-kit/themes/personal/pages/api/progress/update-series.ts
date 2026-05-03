import { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { userId, token, seriesId, seriesName, totalPosts, completedPosts } = req.body;

	if (!userId || !token || !seriesId) {
		return res.status(400).json({ error: 'User ID, token, and Series ID are required' });
	}

	try {
		const percentage = totalPosts ? Math.round((completedPosts / totalPosts) * 100) : 0;
		const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/seriesProgress/${seriesId}`;
		const response = await fetch(url, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				fields: {
					seriesId: { stringValue: seriesId },
					seriesName: { stringValue: seriesName || '' },
					totalPosts: { integerValue: totalPosts.toString() },
					completedPosts: { integerValue: completedPosts.toString() },
					percentage: { integerValue: percentage.toString() },
					lastUpdated: { integerValue: Date.now().toString() },
				},
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(`Firestore API error: ${error.error?.message || response.statusText}`);
		}

		return res.status(200).json({ 
			success: true, 
			series: {
				seriesId,
				seriesName,
				totalPosts,
				completedPosts,
				percentage,
				lastUpdated: Date.now(),
			}
		});
	} catch (error: any) {
		console.error('Error updating series progress:', error);
		return res.status(500).json({ error: error.message || 'Failed to update series progress' });
	}
}
