import { NextApiRequest, NextApiResponse } from 'next';
import { signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	try {
		await signOut(auth);

		return res.status(200).json({ message: 'Logged out successfully' });
	} catch (error: any) {
		console.error('Logout error:', error);
		return res.status(400).json({ error: error.message });
	}
}
