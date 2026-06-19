type Props = {
	children?: React.ReactNode;
	className?: string;
};

export const Container = ({ children, className }: Props) => {
	return (
		<div className="w-full bg-white lg:px-4 dark:bg-neutral-950">
			<div className="mx-auto min-h-screen w-full max-w-[1440px] bg-white dark:bg-neutral-950">
				<div className={className || ''}>
					{children}
				</div>
			</div>
		</div>
	);
};
