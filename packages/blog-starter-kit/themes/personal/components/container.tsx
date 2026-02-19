type Props = {
	children?: React.ReactNode;
	className?: string;
};

export const Container = ({ children, className }: Props) => {
	return (
		<div className="w-full bg-white dark:bg-neutral-950 py-4">
			<div className={className || ''}>
				{children}
			</div>
		</div>
	);
};
