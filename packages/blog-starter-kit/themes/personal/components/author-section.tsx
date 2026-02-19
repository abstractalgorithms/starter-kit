import Image from 'next/image';
import Link from 'next/link';
import { useAppContext } from './contexts/appContext';

export const AuthorSection = () => {
	const { publication } = useAppContext();
	const { author, links } = publication;
	const { twitter, github, linkedin, hashnode: hashnodeLink } = links ?? {};

	return (
		<section className="w-full py-12">
			<div className="bg-gradient-to-br from-neutral-50 to-blue-50 dark:from-neutral-900 dark:to-blue-950/30 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 md:p-10">
				<div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
					{author.profilePicture ? (
						<Image
							src={author.profilePicture}
							alt={author.name}
							width={80}
							height={80}
							className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/30 flex-shrink-0"
						/>
					) : (
						<div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
							<span className="text-white text-2xl font-bold">{author.name.charAt(0)}</span>
						</div>
					)}

					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-1">
							Written by
						</p>
						<h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">
							{author.name}
						</h2>
						<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
							@{author.username}
							{author.followersCount > 0 && (
								<> · {author.followersCount.toLocaleString()} followers</>
							)}
						</p>
						<p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed max-w-xl">
							{publication.descriptionSEO ||
								'Writing about algorithms, system design, and AI engineering. Passionate about turning complex ideas into clear, actionable guides.'}
						</p>

						{(twitter || github || linkedin || hashnodeLink) && (
							<div className="flex gap-3 mt-4">
								{github && (
									<a
										href={github}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="GitHub"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									>
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
									</a>
								)}
								{twitter && (
									<a
										href={twitter}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Twitter / X"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									>
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</a>
								)}
								{linkedin && (
									<a
										href={linkedin}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="LinkedIn"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									>
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
											<circle cx="4" cy="4" r="2" />
										</svg>
									</a>
								)}
								{hashnodeLink && (
									<a
										href={hashnodeLink}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Hashnode"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									>
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 337 337">
											<path fillRule="evenodd" clipRule="evenodd" d="M168.5 0C75.48 0 0 75.48 0 168.5S75.48 337 168.5 337 337 261.52 337 168.5 261.52 0 168.5 0zm.36 115.48c29.3 0 53.02 23.72 53.02 53.02s-23.72 53.02-53.02 53.02-53.02-23.72-53.02-53.02 23.72-53.02 53.02-53.02z" />
										</svg>
									</a>
								)}
							</div>
						)}
					</div>

					<div className="sm:self-center flex-shrink-0">
						<Link
							href="/about"
							className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
						>
							Full bio
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};
