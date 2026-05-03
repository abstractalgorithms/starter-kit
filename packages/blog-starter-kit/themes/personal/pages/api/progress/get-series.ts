import { NextApiRequest, NextApiResponse } from 'next';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { userId, seriesId, token } = req.query;

	if (!userId || !seriesId || !token || typeof userId !== 'string' || typeof seriesId !== 'string' || typeof token !== 'string') {
		return res.status(400).json({ error: 'User ID, Series ID, and token are required' });
	}

	try {
		const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/seriesProgress/${seriesId}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			// If document not found, return null instead of error
			if (error.error?.code === 404) {
				return res.status(200).json({ success: true, series: null });
			}
			throw new Error(`Firestore API error: ${error.error?.message || response.statusText}`);
		}

		const doc = await response.json();
		const fields = doc.fields;
		const series = {
			seriesId: fields.seriesId?.stringValue || seriesId,
			seriesName: fields.seriesName?.stringValue || '',
			totalPosts: parseInt(fields.totalPosts?.integerValue || '0'),
			completedPosts: parseInt(fields.completedPosts?.integerValue || '0'),
			percentage: parseInt(fields.percentage?.integerValue || '0'),
			lastUpdated: parseInt(fields.lastUpdated?.integerValue || '0'),
		};

		return res.status(200).json({ success: true, series });
	} catch (error: any) {
		console.error('Error fetching series progress:', error);
		return res.status(500).json({ error: error.message || 'Failed to fetch series progress' });
	}
}
