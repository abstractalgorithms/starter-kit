import request from 'graphql-request';
import { useState } from 'react';
import {
	NewsletterSubscribeStatus,
	SubscribeToNewsletterDocument,
	SubscribeToNewsletterMutation,
	SubscribeToNewsletterMutationVariables,
} from '../generated/graphql';
import { useAppContext } from './contexts/appContext';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT;

export const NewsletterSection = () => {
	const { publication } = useAppContext();
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const data = await request<
				SubscribeToNewsletterMutation,
				SubscribeToNewsletterMutationVariables
			>(GQL_ENDPOINT, SubscribeToNewsletterDocument, {
				input: {
					email: email.trim(),
					publicationId: publication.id,
				},
			});

			const status = data.subscribeToNewsletter?.status;
			if (
				status === NewsletterSubscribeStatus.Confirmed ||
				status === NewsletterSubscribeStatus.Pending
			) {
				setSubmitted(true);
				setEmail('');
				return;
			}

			setErrorMessage('Unable to subscribe right now. Please try again.');
		} catch (error) {
			setErrorMessage('Unable to subscribe right now. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section id="newsletter-subscribe" className="w-full py-12">
			<div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-8 md:p-12 text-white">
				<p className="text-sm font-semibold uppercase tracking-wide text-blue-200 mb-3">
					Free newsletter
				</p>
				<h2 className="text-2xl md:text-3xl font-bold mb-4">
					Level Up Your Engineering Skills
				</h2>
				<p className="text-blue-100 mb-2">
					Join engineers who get exclusive deep-dives on system design, algorithm breakdowns, and AI engineering tips — every week, straight to your inbox.
				</p>
				<ul className="text-sm text-blue-200 mb-6 space-y-1">
					<li>✓ Weekly system design &amp; algorithm deep-dives</li>
					<li>✓ AI &amp; LLM engineering insights</li>
					<li>✓ Interview prep cheat sheets</li>
				</ul>
				<form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
					<input
						type="email"
						placeholder="Enter your email..."
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={isSubmitting}
						required
						className="flex-1 px-4 py-3 rounded text-neutral-900 placeholder-neutral-500"
					/>
					<button
						type="submit"
						disabled={isSubmitting}
						className="px-6 py-3 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition-colors whitespace-nowrap"
					>
						{isSubmitting ? 'Subscribing...' : 'Get weekly insights'}
					</button>
				</form>
				{submitted && (
					<p className="text-blue-100 mt-4 text-sm">
						✓ Thanks for subscribing! Check your email for confirmation.
					</p>
				)}
				{errorMessage && <p className="text-red-100 mt-4 text-sm">{errorMessage}</p>}
			</div>
		</section>
	);
};
