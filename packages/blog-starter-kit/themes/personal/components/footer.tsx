import { useAppContext } from './contexts/appContext';

export const Footer = () => {
	const { publication } = useAppContext();

	return (
		<footer className="w-full bg-white dark:bg-neutral-950">
			<div className="mx-auto max-w-[1440px] border-t border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-5">
				<p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
					{publication.title} · © {new Date().getFullYear()} · Engineering learning lab
				</p>
			</div>
		</footer>
	);
};
