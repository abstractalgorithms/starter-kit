import Link from 'next/link';
import { PostFragment } from '../generated/graphql';
import { DateFormatter } from './date-formatter';
import { formatTagName } from '../utils/format';

type Props = {
	posts: PostFragment[];
};

const MainFeaturedCard = ({ post }: { post: PostFragment }) => {
	const postURL = `/${post.slug}`;
	const coverImage = post.coverImage?.url;

	return (
		<Link href={postURL} className="group block">
			<div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-200">
				<div className="flex flex-col md:flex-row">
					{/* Cover image */}
					{coverImage && (
						<div className="w-full md:w-1/2 h-56 md:h-auto overflow-hidden">
							<img
								src={coverImage}
								alt={post.title}
								className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
							/>
						</div>
					)}

					{/* Content */}
					<div className={`${coverImage ? 'md:w-1/2' : 'w-full'} bg-white dark:bg-neutral-950 p-6 md:p-8 flex flex-col justify-between`}>
						<div>
							{/* Tags */}
							{post.tags && post.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5 mb-4">
									{post.tags.slice(0, 3).map((tag) => (
										<span
											key={tag.id}
											className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
										>
											{formatTagName(tag.name)}
										</span>
									))}
								</div>
							)}

							<h3 className="text-2xl md:text-3xlfont-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-[1.2]">
								{post.title}
							</h3>
							<p className="text-neutral-500 dark:text-neutral-400 line-clamp-3 text-sm leading-relaxed">
								{post.subtitle || post.brief}
							</p>
						</div>

						{/* Footer: meta + CTA */}
						<div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
							{/* Author + meta */}
							<div className="flex items-center gap-2.5">
								{post.author.profilePicture && (
									<img
										src={post.author.profilePicture}
										alt={post.author.name}
										className="w-7 h-7 rounded-full ring-2 ring-neutral-100 dark:ring-neutral-800 flex-shrink-0"
									/>
								)}
								<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
									<span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
										{post.author.name}
									</span>
									<span className="text-neutral-300 dark:text-neutral-600 select-none">·</span>
									<time className="text-xs text-neutral-400 dark:text-neutral-500">
										<DateFormatter dateString={post.publishedAt} />
									</time>
									<span className="text-neutral-300 dark:text-neutral-600 select-none">·</span>
									<span className="text-xs text-neutral-400 dark:text-neutral-500">
										{post.readTimeInMinutes} min read
									</span>
								</div>
							</div>

							{/* CTA */}
							<span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
								Read article
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
									<path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
								</svg>
							</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
};

const SecondaryFeaturedCard = ({ post }: { post: PostFragment }) => {
	const postURL = `/${post.slug}`;
	const coverImage = post.coverImage?.url;

	return (
		<Link href={postURL} className="group block h-full">
			<div className="h-full rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-200 bg-white dark:bg-neutral-950 flex flex-col">
				{coverImage && (
					<div className="h-40 overflow-hidden flex-shrink-0">
						<img
							src={coverImage}
							alt={post.title}
							className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
						/>
					</div>
				)}
				<div className="p-5 flex flex-col flex-1">
					{post.tags && post.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mb-2">
							{post.tags.slice(0, 2).map((tag) => (
								<span
									key={tag.id}
									className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
								>
									{formatTagName(tag.name)}
								</span>
							))}
						</div>
					)}

					<h3 className="text-base font-boldtracking-tight text-neutral-900 dark:text-neutral-50 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
						{post.title}
					</h3>
					<p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed flex-1">
						{post.subtitle || post.brief}
					</p>

					<div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 flex-wrap">
						<time className="text-xs text-neutral-400 dark:text-neutral-500">
							<DateFormatter dateString={post.publishedAt} />
						</time>
						<span className="text-neutral-300 dark:text-neutral-600 select-none">·</span>
						<span className="text-xs text-neutral-400 dark:text-neutral-500">
							{post.readTimeInMinutes} min read
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
};

export const FeaturedArticle = ({ posts }: Props) => {
	if (!posts || posts.length === 0) return null;

	const [mainPost, ...secondaryPosts] = posts;

	return (
		<section className="w-full py-12">
			{/* Section heading */}
			<div className="flex items-center gap-3 mb-6">
				<h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Featured Articles</h2>
				<div className="flex-1 h-px bg-neutral-100 dark:bg-neutral-800" />
			</div>

			<div className="flex flex-col gap-4">
				<MainFeaturedCard post={mainPost} />
				{secondaryPosts.length > 0 && (
					<div className={`grid gap-4 ${secondaryPosts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
						{secondaryPosts.map((post) => (
							<SecondaryFeaturedCard key={post.id} post={post} />
						))}
					</div>
				)}
			</div>
		</section>
	);
};
