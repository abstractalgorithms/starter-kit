import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	return res.status(410).json({
		error: 'Manual login has been removed. Please use social sign-in.',
		deprecated: true,
	});
}
