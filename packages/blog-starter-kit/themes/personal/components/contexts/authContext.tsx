'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
	User,
	onAuthStateChanged,
	signOut,
	setPersistence,
	browserLocalPersistence,
	getAdditionalUserInfo,
	signInWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider,
	FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { initializeUserCollections } from '../../lib/initializeFirestore';

type AuthContextType = {
	user: User | null;
	loading: boolean;
	loginWithGoogle: () => Promise<void>;
	loginWithGitHub: () => Promise<void>;
	loginWithFacebook: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Enable persistence
		setPersistence(auth, browserLocalPersistence).catch(console.error);

		// Listen to auth state changes
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const loginWithGoogle = async () => {
		setLoading(true);
		try {
			const provider = new GoogleAuthProvider();
			provider.setCustomParameters({ prompt: 'select_account' });
			const userCredential = await signInWithPopup(auth, provider);
			const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
			if (isNewUser) {
				void initializeUserCollections(
					userCredential.user.uid,
					userCredential.user.email ?? '',
					userCredential.user.displayName ?? undefined,
				).catch((error) => console.warn('Unable to initialize social user profile:', error));
			}
		} finally {
			setLoading(false);
		}
	};

	const loginWithGitHub = async () => {
		setLoading(true);
		try {
			const provider = new GithubAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
			if (isNewUser) {
				void initializeUserCollections(
					userCredential.user.uid,
					userCredential.user.email ?? '',
					userCredential.user.displayName ?? undefined,
				).catch((error) => console.warn('Unable to initialize social user profile:', error));
			}
		} finally {
			setLoading(false);
		}
	};

	const loginWithFacebook = async () => {
		setLoading(true);
		try {
			const provider = new FacebookAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
			if (isNewUser) {
				void initializeUserCollections(
					userCredential.user.uid,
					userCredential.user.email ?? '',
					userCredential.user.displayName ?? undefined,
				).catch((error) => console.warn('Unable to initialize social user profile:', error));
			}
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
			});
			
			await signOut(auth);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithGitHub, loginWithFacebook, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
