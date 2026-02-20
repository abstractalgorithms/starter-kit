import Link from 'next/link';
import { User } from '../generated/graphql';
import { DateFormatter } from './date-formatter';

type Author = Pick<User, 'name'>;

type Props = {
	title: string;
	subtitle?: string | null;
	brief: string;
	date: string;
	author: Author;
	slug: string;
	commentCount: number;
	coverImage?: string;
	readTimeInMinutes?: number;
};

export const MinimalPostPreview = ({ title, subtitle, brief, date, slug, commentCount, coverImage, readTimeInMinutes }: Props) => {
	const postURL = `/${slug}`;

	return (
		<Link href={postURL} className="group block h-full">
			<div className="flex flex-col h-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 overflow-hidden">
				{coverImage && (
					<div className="relative w-full h-48 overflow-hidden">
						<img
							src={coverImage}
							alt={title}
							className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
						/>
					</div>
				)}
				<section className="flex flex-col items-start gap-3 flex-grow p-5">
					<h2 className="text-lg font-bold leading-tight tracking-tight text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
						{title}
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 line-clamp-2 text-sm flex-grow">
						{brief}
					</p>
					<div className="flex flex-row items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-auto pt-3 border-t border-neutral-200 dark:border-neutral-800 w-full">
						<DateFormatter dateString={date} />
						<span>•</span>
						<span>{readTimeInMinutes ?? 5} min read</span>
						{commentCount > 2 && (
							<>
								<span>•</span>
								<span>
									{commentCount} comments
								</span>
							</>
						)}
					</div>
				</section>
			</div>
		</Link>
	);
};
