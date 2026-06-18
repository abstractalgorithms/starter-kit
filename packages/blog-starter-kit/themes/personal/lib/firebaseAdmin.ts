import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const serviceAccountJson =
	process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
	process.env.NEXT_PUBLIC_FIREBASE_SERVICE_ACCOUNT_KEY;

const serviceAccount = (() => {
	if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };
	if (!serviceAccountJson) return null;
	try {
		const parsed = JSON.parse(serviceAccountJson) as Record<string, string>;
		return {
			projectId: parsed.project_id ?? parsed.projectId,
			clientEmail: parsed.client_email ?? parsed.clientEmail,
			privateKey: (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, '\n'),
		};
	} catch {
		throw new Error('Firebase Admin service-account JSON is invalid');
	}
})();

const adminApp = getApps()[0] ?? initializeApp(
	serviceAccount
		? { credential: cert(serviceAccount) }
		: undefined,
);

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

export const requireAdmin = async (authorization?: string) => {
	const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
	if (!token) throw new Error('UNAUTHENTICATED');
	const decoded = await adminAuth.verifyIdToken(token);
	if (decoded.admin !== true) throw new Error('FORBIDDEN');
	return decoded;
};
