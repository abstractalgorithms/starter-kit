import { useState } from 'react';
import { isNewsletterSubscribeEnabled } from '../lib/features';
import { useSafeAppContext } from '../hooks/useSafeAppContext';

export const NewsletterSection = () => {
	const appContext = useSafeAppContext();
	const publication = appContext?.publication;

	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	if (!appContext || !publication || !isNewsletterSubscribeEnabled) {
		return null;
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim() || isSubmitting) {
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			// Hashnode's newsletter mutation availability differs by publication plan.
			// Keep UI responsive by deferring signup to the publication newsletter endpoint.
			const target = publication?.url ? `${publication.url.replace(/\/$/, '')}/newsletter` : null;
			if (target && typeof window !== 'undefined') {
				window.open(target, '_blank', 'noopener,noreferrer');
			}
			setSubmitted(true);
			setEmail('');
		} catch (error) {
			setErrorMessage('Unable to subscribe right now. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section id="newsletter-subscribe" className="w-full py-12">
			<div className="bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 rounded-2xl p-8 md:p-12 text-white overflow-hidden relative">
				{/* Background decoration */}
				<div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
				<div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-teal-500/20 pointer-events-none" />

				<div className="relative flex flex-col md:flex-row md:items-start gap-8 md:gap-12">
					{/* Left copy */}
					<div className="flex-1">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wide mb-4">
							<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
								<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
							</svg>
							Free Weekly Newsletter
						</div>
						<h2 className="text-2xl md:text-3xl font-bold mb-3 leading-snug">
							Get the System Design<br />Cheat Sheet — Free
						</h2>
						<p className="text-blue-100 mb-4 leading-relaxed">
							Subscribe and instantly receive our <strong className="text-white">System Design Interview Cheat Sheet PDF</strong>. Then get weekly deep-dives on distributed systems, algorithms, and AI engineering.
						</p>
						<ul className="text-sm text-blue-200 space-y-1.5 mb-6">
							<li className="flex items-center gap-2">
								<svg className="w-4 h-4 text-teal-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								Weekly system design &amp; algorithm deep-dives
							</li>
							<li className="flex items-center gap-2">
								<svg className="w-4 h-4 text-teal-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								AI &amp; LLM engineering insights you won&apos;t find elsewhere
							</li>
							<li className="flex items-center gap-2">
								<svg className="w-4 h-4 text-teal-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
								</svg>
								Interview prep cheat sheets &amp; curated reading lists
							</li>
						</ul>
					</div>

					{/* Right: form card */}
					<div className="md:w-80 flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
						{submitted ? (
							<div className="text-center py-4">
								<div className="w-12 h-12 rounded-full bg-teal-400/20 flex items-center justify-center mx-auto mb-3">
									<svg className="w-6 h-6 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<p className="font-semibold text-lg mb-1">You&apos;re in! 🎉</p>
								<p className="text-blue-100 text-sm">Check your inbox for the cheat sheet and confirmation link.</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex flex-col gap-3">
								<p className="text-sm font-semibold text-white/90 mb-1">Enter your email to get started:</p>
								<input
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={isSubmitting}
									required
									className="w-full px-4 py-3 rounded-lg text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
								/>
								<button
									type="submit"
									disabled={isSubmitting}
									className="w-full px-5 py-3 bg-teal-400 hover:bg-teal-300 text-neutral-900 font-bold rounded-lg transition-colors text-sm"
								>
									{isSubmitting ? 'Subscribing...' : '📥 Get the Cheat Sheet'}
								</button>
								{errorMessage && <p className="text-red-200 text-xs">{errorMessage}</p>}
								<p className="text-[11px] text-blue-200 text-center">No spam. Unsubscribe anytime.</p>
							</form>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};
