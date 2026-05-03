import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password are required' });
	}

	try {
		// Use Firebase REST API for authentication
		const response = await fetch(
			`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					returnSecureToken: true,
				}),
			}
		);

		const data = await response.json();

		if (!response.ok) {
			return res.status(401).json({ error: data.error?.message || 'Login failed' });
		}

		return res.status(200).json({
			uid: data.localId,
			email: data.email,
			token: data.idToken,
		});
	} catch (error: any) {
		console.error('Login error:', error);
		return res.status(500).json({ error: error.message });
	}
}
