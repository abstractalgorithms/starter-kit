import { useState } from 'react';

export const NewsletterSection = () => {
	const [email, setEmail] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Integrate with actual newsletter service
		setSubmitted(true);
		setEmail('');
		setTimeout(() => setSubmitted(false), 3000);
	};

	return (
		<section className="w-full py-12">
			<div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-8 md:p-12 text-white">
				<h2 className="text-2xl md:text-3xl font-bold mb-4">
					Stay Updated with Algorithm Insights
				</h2>
				<p className="text-blue-100 mb-6">
					Get the latest articles, tutorials, and algorithm insights delivered directly to your inbox.
				</p>
				<form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
					<input
						type="email"
						placeholder="Enter your email..."
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="flex-1 px-4 py-3 rounded text-neutral-900 placeholder-neutral-500"
					/>
					<button
						type="submit"
						className="px-6 py-3 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition-colors"
					>
						Subscribe
					</button>
				</form>
				{submitted && (
					<p className="text-blue-100 mt-4 text-sm">
						✓ Thanks for subscribing! Check your email for confirmation.
					</p>
				)}
			</div>
		</section>
	);
};
