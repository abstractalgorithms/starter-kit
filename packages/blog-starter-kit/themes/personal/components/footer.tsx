import Link from 'next/link';
import { useAppContext } from './contexts/appContext';

const linkClass =
	'text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm';

export const Footer = () => {
	const { publication, posts } = useAppContext();

	// ── Derive unique tags from whatever posts are in context ──────────────────
	const tagMap = new Map<string, { name: string; slug: string; count: number }>();
	for (const post of posts ?? []) {
		for (const tag of post.tags ?? []) {
			const entry = tagMap.get(tag.slug);
			tagMap.set(tag.slug, { name: tag.name, slug: tag.slug, count: (entry?.count ?? 0) + 1 });
		}
	}
	const topTags = [...tagMap.values()]
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	// ── Social links — only render when the URL is actually set ───────────────
	const { twitter, github, linkedin, hashnode: hashnodeLink } = publication.links ?? {};

	const hasAnySocial = twitter || github || linkedin || hashnodeLink;

	// ── Nav items from publication settings ───────────────────────────────────
	const navItems = publication.preferences?.navbarItems ?? [];

	return (
		<footer className="w-full bg-white dark:bg-neutral-950">
			<div className="max-w-6xl mx-auto px-5 pt-16 pb-6 border-t border-neutral-200 dark:border-neutral-800">
				<div className={`grid grid-cols-1 gap-12 mb-12 ${topTags.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>

					{/* ── Brand ─────────────────────────────────────────────── */}
					<div className="md:col-span-1">
						<h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-2">
							{publication.title}
						</h3>
						{publication.descriptionSEO && (
							<p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
								{publication.descriptionSEO}
							</p>
						)}

						{hasAnySocial && (
							<div className="flex gap-3 mt-5">
								{github && (
									<a href={github} target="_blank" rel="noopener noreferrer"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
										aria-label="GitHub">
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
									</a>
								)}
								{twitter && (
									<a href={twitter} target="_blank" rel="noopener noreferrer"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
										aria-label="Twitter / X">
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</a>
								)}
								{linkedin && (
									<a href={linkedin} target="_blank" rel="noopener noreferrer"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
										aria-label="LinkedIn">
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
											<circle cx="4" cy="4" r="2" />
										</svg>
									</a>
								)}
								{hashnodeLink && (
									<a href={hashnodeLink} target="_blank" rel="noopener noreferrer"
										className="text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
										aria-label="Hashnode">
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 337 337">
											<path fillRule="evenodd" clipRule="evenodd" d="M168.5 0C75.48 0 0 75.48 0 168.5S75.48 337 168.5 337 337 261.52 337 168.5 261.52 0 168.5 0zm.36 115.48c29.3 0 53.02 23.72 53.02 53.02s-23.72 53.02-53.02 53.02-53.02-23.72-53.02-53.02 23.72-53.02 53.02-53.02z" />
										</svg>
									</a>
								)}
							</div>
						)}
					</div>

					{/* ── Navigation ────────────────────────────────────────── */}
					<div>
						<h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
							Navigation
						</h4>
						<ul className="space-y-2.5">
							<li><Link href="/" className={linkClass}>Home</Link></li>
							<li><Link href="/posts" className={linkClass}>All Posts</Link></li>
							{navItems
								.filter((item): item is typeof item & { url: string } =>
									!!item.url && item.url.length > 0
								)
								.map((item) => (
									<li key={item.id}>
										<a href={item.url} className={linkClass}
											target={item.url.startsWith('http') ? '_blank' : undefined}
											rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}>
											{item.label}
										</a>
									</li>
								))}
							<li><Link href="/about" className={linkClass}>About</Link></li>
						</ul>
					</div>

					{/* ── Popular Topics (only when posts in context) ───────── */}
					{topTags.length > 0 && (
						<div>
							<h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
								Popular Topics
							</h4>
							<ul className="space-y-2.5">
								{topTags.map((tag) => (
									<li key={tag.slug}>
										<Link href={`/tag/${tag.slug}`} className={`${linkClass} capitalize`}>
											{tag.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* ── Author ────────────────────────────────────────────── */}
					<div>
						<h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-4">
							Author
						</h4>
						<div className="flex items-center gap-3 mb-3">
							{publication.author.profilePicture && (
								<img
									src={publication.author.profilePicture}
									alt={publication.author.name}
									className="w-9 h-9 rounded-full ring-2 ring-neutral-100 dark:ring-neutral-800"
								/>
							)}
							<div>
								<p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
									{publication.author.name}
								</p>
								<p className="text-xs text-neutral-400 font-mono">
									@{publication.author.username}
								</p>
							</div>
						</div>
						{publication.author.followersCount > 0 && (
							<p className="text-xs text-neutral-400 dark:text-neutral-500">
								{publication.author.followersCount.toLocaleString()} followers on Hashnode
							</p>
						)}
					</div>

				</div>

				{/* ── Bottom bar ──────────────────────────────────────────── */}
				<div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-neutral-400 dark:text-neutral-500 text-xs">
					<p>© {new Date().getFullYear()} {publication.title}. All rights reserved.</p>
					<a
						href="https://hashnode.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
					>
						Powered by Hashnode
					</a>
				</div>
			</div>
		</footer>
	);
};
