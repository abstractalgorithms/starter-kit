'use client';

import React, { useState } from 'react';
import { useAuth } from './contexts/authContext';

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
	const { login, signUp, loading } = useAuth();
	const [isSignup, setIsSignup] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			if (isSignup) {
				await signUp(email, password);
			} else {
				await login(email, password);
			}
			onClose();
		} catch (err) {
			setError((err as Error).message);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
				<div className="mb-6 flex items-center justify-between">
					<h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
						{isSignup ? 'Sign Up' : 'Login'}
					</h2>
					<button
						onClick={onClose}
						className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
					>
						<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{error && (
					<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						{loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Login'}
					</button>
				</form>

				<div className="mt-4 text-center">
					<button
						onClick={() => {
							setIsSignup(!isSignup);
							setError('');
						}}
						className="text-sm text-blue-600 hover:underline dark:text-blue-400"
					>
						{isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
					</button>
				</div>
			</div>
		</div>
	);
};
