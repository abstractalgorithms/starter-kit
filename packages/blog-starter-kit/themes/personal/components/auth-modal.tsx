'use client';

import React, { useState } from 'react';
import { useAuth } from './contexts/authContext';

type AuthModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
	const { loginWithGoogle, loginWithGitHub, loginWithFacebook, loading } = useAuth();
	const [error, setError] = useState('');

	if (!isOpen) return null;

	const getFriendlyAuthError = (err: unknown) => {
		let message = err instanceof Error ? err.message : 'Authentication failed';
		message = message.replace(/^Firebase:\s*/i, '').replace(/Firebase Authentication/i, 'Authentication');
		if (/auth\/popup-closed-by-user/i.test(message)) return 'Sign-in was cancelled before it completed.';
		if (/auth\/popup-blocked/i.test(message)) return 'Your browser blocked the sign-in popup. Allow popups and try again.';
		if (/auth\/operation-not-allowed/i.test(message)) return 'This social provider is not enabled for this site.';
		if (/auth\/unauthorized-domain/i.test(message)) return 'This domain is not authorized for login.';
		if (/auth\/account-exists-with-different-credential/i.test(message)) return 'An account already exists with the same email using a different sign-in method.';
		return message;
	};

	const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook') => {
		setError('');
		try {
			if (provider === 'google') {
				await loginWithGoogle();
			} else if (provider === 'github') {
				await loginWithGitHub();
			} else if (provider === 'facebook') {
				await loginWithFacebook();
			}
			onClose();
		} catch (err) {
			setError(getFriendlyAuthError(err));
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Sign in to Abstract Algorithms</h2>
						<p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
							Use a social account to save progress and continue learning.
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
						aria-label="Close sign-in dialog"
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

				<div className="space-y-3">
					<button
						type="button"
						onClick={() => handleSocialLogin('google')}
						disabled={loading}
						className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
						title="Sign in with Google"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
						</svg>
						<span>{loading ? 'Opening Google...' : 'Continue with Google'}</span>
					</button>

					<div className="grid grid-cols-2 gap-3">
						<button
							type="button"
							onClick={() => handleSocialLogin('github')}
							disabled={loading}
							className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
							title="Sign in with GitHub"
						>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.544 2.914 1.186.092-.923.35-1.544.636-1.9-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.192 20 14.437 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
							</svg>
							<span className="text-xs">GitHub</span>
						</button>

						<button
							type="button"
							onClick={() => handleSocialLogin('facebook')}
							disabled={loading}
							className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-3 py-2 font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
							title="Sign in with Facebook"
						>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10 0C4.477 0 0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.128 20 14.991 20 10c0-5.523-4.477-10-10-10z"/>
							</svg>
							<span className="text-xs">Facebook</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
