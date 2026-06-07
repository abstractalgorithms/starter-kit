import Link from 'next/link';
import { useAppContext } from './contexts/appContext';

const footerGroups = [
	{
		title: 'Learn',
		links: [
			{ label: 'System Design', href: '/topic/system-design' },
			{ label: 'Software Architecture', href: '/topic/software-architecture' },
			{ label: 'LLD', href: '/topic/low-level-design' },
			{ label: 'DSA', href: '/topic/data-structures' },
			{ label: 'AI Engineering', href: '/topic/ai-systems' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ label: 'Series', href: '/series' },
			{ label: 'Blog', href: '/posts' },
			{ label: 'Topics', href: '/learn' },
		],
	},
	{
		title: 'Company',
		links: [
			{ label: 'About Us', href: '/about' },
			{ label: 'Contribute', href: '/posts' },
			{ label: 'Privacy Policy', href: '/posts' },
		],
	},
] as const;

const SocialDot = ({ label, href }: { label: string; href: string }) => (
	<a
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		aria-label={label}
		className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-xs font-black text-slate-500 transition hover:border-blue-300 hover:text-blue-700"
	>
		{label.charAt(0)}
	</a>
);

export const Footer = () => {
	const { publication } = useAppContext();
	const authorUrl = `https://hashnode.com/@${publication.author.username}`;

	return (
		<footer className="w-full bg-white text-slate-950">
			<div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 md:hidden">
				<Link href="/" className="text-sm font-black tracking-tight text-slate-950">
					{publication.title}
				</Link>
				<nav className="flex items-center gap-3 text-xs font-bold text-slate-600">
					<Link href="/learn" className="hover:text-blue-700">Learn</Link>
					<Link href="/series" className="hover:text-blue-700">Series</Link>
					<Link href="/posts" className="hover:text-blue-700">Blog</Link>
				</nav>
			</div>
			<div className="mx-auto hidden max-w-[1440px] gap-10 border-t border-slate-200 px-5 py-8 md:grid md:grid-cols-[minmax(240px,1.2fr)_repeat(4,minmax(0,1fr))] md:px-8">
				<div>
					<Link href="/" className="flex items-center gap-3">
						<span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-xl font-black text-white shadow-lg shadow-blue-500/30">
							A
						</span>
						<div className="leading-none">
							<p className="text-sm font-black uppercase tracking-[0.08em]">Abstract</p>
							<p className="text-xs font-black uppercase tracking-[0.18em] text-slate-700">Algorithms</p>
						</div>
					</Link>
					<p className="mt-5 max-w-xs text-sm leading-6 text-slate-600">
						High quality content to help engineers learn, build and grow.
					</p>
					<div className="mt-5 flex gap-2">
						<SocialDot label="Twitter" href={publication.links?.twitter ?? authorUrl} />
						<SocialDot label="GitHub" href={publication.links?.github ?? authorUrl} />
						<SocialDot label="LinkedIn" href={publication.links?.linkedin ?? authorUrl} />
						<SocialDot label="Hashnode" href={publication.links?.hashnode ?? authorUrl} />
					</div>
				</div>
				{footerGroups.map((group) => (
					<div key={group.title}>
						<h2 className="text-sm font-black text-slate-950">{group.title}</h2>
						<div className="mt-4 grid gap-2">
							{group.links.map((link) => (
								<Link key={link.label} href={link.href} className="text-sm text-slate-600 transition hover:text-blue-700">
									{link.label}
								</Link>
							))}
						</div>
					</div>
				))}
			</div>
			<div className="border-t border-slate-200 px-5 py-3 text-center text-[11px] text-slate-500 md:py-4 md:text-xs">
				© {new Date().getFullYear()} {publication.title}. All rights reserved.
			</div>
		</footer>
	);
};
