import { useEffect, useRef, useState } from 'react';

type TocItem = {
	id: string;
	slug: string;
	title: string;
	level: number;
	parentId?: string | null;
};

type Props = {
	items: TocItem[];
};

export const TableOfContents = ({ items }: Props) => {
	const [activeId, setActiveId] = useState<string>('');
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (items.length === 0) return;

		const slugs = items.map((i) => i.slug);

		observerRef.current = new IntersectionObserver(
			(entries) => {
				// Find the topmost visible heading
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{ rootMargin: '0px 0px -70% 0px', threshold: 0 },
		);

		slugs.forEach((slug) => {
			const el = document.getElementById(slug);
			if (el) observerRef.current!.observe(el);
		});

		return () => observerRef.current?.disconnect();
	}, [items]);

	if (items.length === 0) return null;

	return (
		<aside className="hidden xl:block sticky top-24 self-start w-56 flex-shrink-0">
			<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
				On this page
			</p>
			<nav aria-label="Table of contents">
				<ol className="flex flex-col gap-0.5 list-none m-0 p-0 border-l border-neutral-200 dark:border-neutral-800">
					{items.map((item) => {
						const isActive = activeId === item.slug;
						return (
							<li
								key={item.id}
								style={{ paddingLeft: `${(item.level - 1) * 0.75 + 0.75}rem` }}
								className="m-0 -ml-px"
							>
								<a
									href={`#${item.slug}`}
									className={`block py-1 pr-2 text-xs leading-snug no-underline transition-colors border-l-2 pl-3 ${
										isActive
											? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
											: 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-600'
									}`}
								>
									{item.title}
								</a>
							</li>
						);
					})}
				</ol>
			</nav>
		</aside>
	);
};
