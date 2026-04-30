type Props = {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

export const Pagination = ({ currentPage, totalPages, onPageChange }: Props) => {
	if (totalPages <= 1) return null;

	// Build the page number window: always show first, last, and up to 3 around current
	const pages: (number | '…')[] = [];
	const delta = 1;
	const rangeStart = Math.max(2, currentPage - delta);
	const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

	pages.push(1);
	if (rangeStart > 2) pages.push('…');
	for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
	if (rangeEnd < totalPages - 1) pages.push('…');
	if (totalPages > 1) pages.push(totalPages);

	const btnBase =
		'inline-flex items-center justify-center h-8 min-w-[2rem] rounded-lg text-sm font-medium transition-colors px-2';
	const active = `${btnBase} bg-blue-600 text-white`;
	const inactive = `${btnBase} text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800`;
	const arrow = `${btnBase} text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed`;

	return (
		<div className="flex items-center justify-center gap-1 pt-6">
			{/* ← Previous */}
			<button
				className={arrow}
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				aria-label="Previous page"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
				</svg>
			</button>

			{pages.map((p, i) =>
				p === '…' ? (
					<span key={`ellipsis-${i}`} className="px-1 text-neutral-400 dark:text-neutral-500 select-none text-sm">
						…
					</span>
				) : (
					<button
						key={p}
						className={p === currentPage ? active : inactive}
						onClick={() => onPageChange(p as number)}
						aria-current={p === currentPage ? 'page' : undefined}
					>
						{p}
					</button>
				),
			)}

			{/* Next → */}
			<button
				className={arrow}
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				aria-label="Next page"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	);
};
