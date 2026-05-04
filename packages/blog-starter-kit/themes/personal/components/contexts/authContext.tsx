'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
	User,
	onAuthStateChanged,
	signOut,
	setPersistence,
	browserLocalPersistence,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider,
	FacebookAuthProvider,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

type AuthContextType = {
	user: User | null;
	loading: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	login: (email: string, password: string) => Promise<void>;
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

	const signUp = async (email: string, password: string) => {
		setLoading(true);
		try {
			// Use Firebase client SDK directly for signup
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			// Initialize Firestore collections for new user
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, uid: userCredential.user.uid }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Signup failed');
			}
		} finally {
			setLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		setLoading(true);
		try {
			// Use Firebase client SDK directly for login
			await signInWithEmailAndPassword(auth, email, password);
		} finally {
			setLoading(false);
		}
	};

	const loginWithGoogle = async () => {
		setLoading(true);
		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
		} finally {
			setLoading(false);
		}
	};

	const loginWithGitHub = async () => {
		setLoading(true);
		try {
			const provider = new GithubAuthProvider();
			await signInWithPopup(auth, provider);
		} finally {
			setLoading(false);
		}
	};

	const loginWithFacebook = async () => {
		setLoading(true);
		try {
			const provider = new FacebookAuthProvider();
			await signInWithPopup(auth, provider);
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
		<AuthContext.Provider value={{ user, loading, signUp, login, loginWithGoogle, loginWithGitHub, loginWithFacebook, logout }}>
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
