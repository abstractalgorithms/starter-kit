type Props = {
	children?: React.ReactNode;
	className?: string;
};

export const Container = ({ children, className }: Props) => {
	return <div className={'w-full bg-blue-50 dark:bg-slate-950 ' + (className || '')}>{children}</div>;
};
