import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	// This endpoint is deprecated. Authentication is now handled directly by the Firebase client SDK.
	// The login function in authContext.tsx uses signInWithEmailAndPassword() directly.
	return res.status(200).json({ 
		message: 'Login is now handled by Firebase client SDK. This endpoint is deprecated.',
		deprecated: true 
	});
}
