import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { resizeImage } from '@starter-kit/utils/image';
import Link from 'next/link';
import { PublicationNavbarItem } from '../generated/graphql';
import { useAppContext } from './contexts/appContext';
import { ToggleTheme } from './toggle-theme';

function hasUrl(
	navbarItem: PublicationNavbarItem,
): navbarItem is PublicationNavbarItem & { url: string } {
	return !!navbarItem.url && navbarItem.url.length > 0;
}

export const PersonalHeader = () => {
	const { publication } = useAppContext();

	const navList = (
		<ul className="flex list-none flex-row items-center gap-6 text-sm font-semibold tracking-tight text-neutral-600 dark:text-neutral-300">
			<li>
				<Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					Home
				</Link>
			</li>
			<li>
				<Link href="/discover" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					Discover
				</Link>
			</li>
			<li>
				<Link href="/discover" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					All Posts
				</Link>
			</li>
			<li>
				<Link href="/series" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					All Series
				</Link>
			</li>
			<li>
				<Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
					About
				</Link>
			</li>
		</ul>
	);

	return (
		<header className="w-full border-b border-neutral-200 dark:border-neutral-800 py-4 mb-8">
			<div className="flex items-center justify-between">
				<h1>
					<Link
						className="flex flex-row items-center gap-3 text-lg font-bold leading-tight tracking-tight text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						href="/"
						aria-label={`${publication.author.name}'s blog home page`}
					>
						{publication.author.profilePicture && (
							<img
								className="block h-10 w-10 rounded-full fill-current"
								alt={publication.author.name}
								src={resizeImage(publication.author.profilePicture, {
									w: 400,
									h: 400,
									c: 'face',
								})}
							/>
						)}
						<span>{publication.title}</span>
					</Link>
				</h1>
				<div className="flex items-center gap-8">
					<nav className="hidden md:flex">{navList}</nav>
					<ToggleTheme />
				</div>
			</div>
		</header>
	);
};
