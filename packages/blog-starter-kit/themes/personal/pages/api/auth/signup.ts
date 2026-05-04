import { NextApiRequest, NextApiResponse } from 'next';
import { initializeUserCollections } from '../../../lib/initializeFirestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { email, uid } = req.body;

	if (!email || !uid) {
		return res.status(400).json({ error: 'Email and UID are required' });
	}

	try {
		// Initialize Firestore collections for new user
		await initializeUserCollections(uid, email);

		return res.status(200).json({
			uid,
			email,
			message: 'User collections initialized successfully',
		});
	} catch (error: any) {
		console.error('Signup initialization error:', error);
		return res.status(500).json({ error: error.message });
	}
}
