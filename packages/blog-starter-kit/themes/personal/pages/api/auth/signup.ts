import { NextApiRequest, NextApiResponse } from 'next';
import { initializeUserCollections } from '../../../lib/initializeFirestore';

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password are required' });
	}

	try {
		// Create user via Firebase REST API
		const signupResponse = await fetch(`${FIREBASE_AUTH_URL}?key=${FIREBASE_API_KEY}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email,
				password,
				returnSecureToken: true,
			}),
		});

		if (!signupResponse.ok) {
			const errorData = await signupResponse.json();
			return res.status(400).json({ error: errorData.error?.message || 'Signup failed' });
		}

		const authData = await signupResponse.json();
		const { localId: uid, idToken } = authData;

		// Initialize Firestore collections for new user
		await initializeUserCollections(uid, email);

		return res.status(200).json({
			uid,
			email,
			idToken,
		});
	} catch (error: any) {
		console.error('Signup error:', error);
		return res.status(500).json({ error: error.message });
	}
}
